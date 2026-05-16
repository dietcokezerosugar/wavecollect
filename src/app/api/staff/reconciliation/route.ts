import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApi } from "@/lib/log";
import { MatchingEngine } from "@/services/matching/MatchingEngine";

export const dynamic = "force-dynamic";

// ── RFC 4180 CSV Parser (handles quoted fields with commas) ──
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue; // skip empty/malformed lines
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// ── Field Mapping ──────────────────────────────────────────
// GPay Business CSV headers:
//   Payer, Paid via, Type (UPI / UPI CC), Creation time, Transaction ID,
//   Amount, Processing Fee, Net Amount, Status, Update time, Notes
//
// Also supports generic CSV formats from PhonePe/Paytm exports.
function extractTxnFromRow(row: Record<string, string>) {
  // Amount (GPay uses "amount" directly)
  const amountRaw =
    row["amount"] || row["net amount"] || row["transaction amount"] || row["txn amount"] || row["amt"] || row["value"] || "";

  // Notes = our referenceId (critical for matching!)
  const note =
    row["notes"] || row["note"] || row["description"] || row["remarks"] || row["transaction note"] || "";

  // Transaction ID = externalId
  const externalId =
    row["transaction id"] || row["id"] || row["txn id"] || row["merchant transaction id"] || "";

  // UTR (GPay doesn't provide UTR separately — Transaction ID is the closest)
  const utr =
    row["utr"] || row["reference number"] || row["ref no"] || row["reference id"] || "";

  // Payer info
  const payerName =
    row["payer"] || row["payer name"] || row["sender name"] || row["from"] || row["name"] || "";

  const payerUpiId =
    row["payer upi id"] || row["sender vpa"] || row["upi id"] || row["from upi"] || row["paid via"] || "";

  // Timestamp
  const timestamp =
    row["creation time"] || row["date"] || row["timestamp"] || row["transaction date"] || row["created at"] || row["time"] || "";

  // Status (GPay uses "Settled", not "SUCCESS")
  const statusRaw =
    row["status"] || row["transaction status"] || row["txn status"] || "";

  // Parse amount (strip currency symbols, commas)
  const amount = parseFloat(amountRaw.replace(/[₹,\s]/g, "")) || 0;

  return {
    amount,
    note: note.trim(),
    utr: utr.trim(),
    externalId: externalId.trim(),
    payerName: payerName.trim(),
    payerUpiId: payerUpiId.trim(),
    timestamp: timestamp.trim(),
    status: statusRaw.trim().toUpperCase(),
  };
}

// ── POST: Upload + Parse + Reconcile ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["STAFF", "ADMIN"].includes(session.user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or malformed" }, { status: 400 });
    }

    await logApi("INFO", `[Reconciliation] Staff ${session.user.email} uploaded CSV with ${rows.length} rows`);

    const results: {
      row: number;
      externalId: string;
      amount: number;
      status: "ALREADY_EXISTS" | "MATCHED" | "UNMATCHED" | "SKIPPED" | "ERROR";
      detail: string;
    }[] = [];

    let matchedCount = 0;
    let existsCount = 0;
    let unmatchedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 1. First pass: extract all valid transactions and collect IDs for batch fetching
    const validTxns = [];
    const externalIds = new Set<string>();
    const utrs = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const txn = extractTxnFromRow(rows[i]);
      const finalExternalId = txn.externalId || `CSV_${Date.now()}_${i}`;
      txn.externalId = finalExternalId;

      if (!txn.amount || (!txn.externalId && !txn.utr)) {
        results.push({ row: i + 1, externalId: finalExternalId, amount: txn.amount, status: "SKIPPED", detail: "Missing amount or ID" });
        skippedCount++;
        continue;
      }
      if (txn.status && !["SUCCESS", "COMPLETED", "PAID", "CREDIT", "RECEIVED", "SETTLED", ""].includes(txn.status)) {
        results.push({ row: i + 1, externalId: finalExternalId, amount: txn.amount, status: "SKIPPED", detail: `Skipped: status ${txn.status}` });
        skippedCount++;
        continue;
      }

      validTxns.push({ row: i + 1, txn });
      externalIds.add(finalExternalId);
      if (txn.utr) utrs.add(txn.utr);
    }

    // 2. Batch Fetch Existing Transactions (Huge performance boost)
    const existingTxns = await prisma.transaction.findMany({
      where: {
        OR: [
          { externalId: { in: Array.from(externalIds) } },
          ...(utrs.size > 0 ? [{ utr: { in: Array.from(utrs) } }] : [])
        ]
      },
      include: { paymentIntent: { select: { id: true, status: true, referenceId: true } } }
    });

    const existingByExternalId = new Map(existingTxns.map(t => [t.externalId, t]));
    const existingByUtr = new Map(existingTxns.filter(t => t.utr).map(t => [t.utr!, t]));

    // 3. Process each valid transaction concurrently in chunks of 20
    const CHUNK_SIZE = 20;
    for (let i = 0; i < validTxns.length; i += CHUNK_SIZE) {
      const chunk = validTxns.slice(i, i + CHUNK_SIZE);

      await Promise.all(chunk.map(async ({ row, txn }) => {
        try {
          const existing = existingByExternalId.get(txn.externalId) || (txn.utr ? existingByUtr.get(txn.utr) : undefined);

          if (existing) {
            const alreadyMatched = existing.paymentIntent ? `Linked to intent ${existing.paymentIntent.referenceId}` : "Exists but unmatched";
            results.push({ row, externalId: txn.externalId, amount: txn.amount, status: "ALREADY_EXISTS", detail: alreadyMatched });
            existsCount++;
            return;
          }

          // Fresh Match
          const matched = await MatchingEngine.onTransactionDetected({
            externalId: txn.externalId,
            utr: txn.utr || undefined,
            amount: txn.amount,
            payerName: txn.payerName || undefined,
            payerUpiId: txn.payerUpiId || undefined,
            note: txn.note || undefined,
            timestamp: txn.timestamp || undefined,
          });

          if (matched) {
            results.push({ row, externalId: txn.externalId, amount: txn.amount, status: "MATCHED", detail: "Successfully matched to intent" });
            matchedCount++;
          } else {
            results.push({ row, externalId: txn.externalId, amount: txn.amount, status: "UNMATCHED", detail: "No matching intent found" });
            unmatchedCount++;
          }
        } catch (err: any) {
          results.push({ row, externalId: txn.externalId, amount: txn.amount, status: "ERROR", detail: err.message?.substring(0, 100) });
          errorCount++;
        }
      }));
    }

    // 4. Save Reconciliation History
    await prisma.reconciliationUpload.create({
      data: {
        staffEmail: session.user?.email || "unknown@staff.com",
        fileName: file.name || "unknown.csv",
        totalRows: rows.length,
        matched: matchedCount,
        alreadyExists: existsCount,
        unmatched: unmatchedCount,
        skipped: skippedCount,
        errors: errorCount,
        results: JSON.stringify(results) // Save detailed results for later review
      }
    });

    await logApi("SUCCESS", `[Reconciliation] Complete: ${matchedCount} matched, ${existsCount} existing, ${unmatchedCount} unmatched, ${skippedCount} skipped, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      summary: { totalRows: rows.length, matched: matchedCount, alreadyExists: existsCount, unmatched: unmatchedCount, skipped: skippedCount, errors: errorCount },
      results,
    });
  } catch (err: any) {
    console.error("[Reconciliation API] Error:", err);
    await logApi("ERROR", `[Reconciliation] Failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
