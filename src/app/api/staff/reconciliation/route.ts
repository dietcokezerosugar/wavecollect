import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApi } from "@/lib/log";
import { MatchingEngine } from "@/services/matching/MatchingEngine";

export const dynamic = "force-dynamic";

// ── CSV Parser ─────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect headers — normalize them
  const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const headers = rawHeaders.map((h) => h.toLowerCase());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

// ── Field Mapping ──────────────────────────────────────────
// GPay CSV exports use different column names. We normalize them.
function extractTxnFromRow(row: Record<string, string>) {
  // Try common column names for each field
  const amount =
    row["amount"] || row["transaction amount"] || row["txn amount"] || row["amt"] || row["value"] || "";
  const note =
    row["note"] || row["description"] || row["remarks"] || row["notes"] || row["transaction note"] || "";
  const utr =
    row["utr"] || row["reference number"] || row["ref no"] || row["reference id"] || row["transaction id"] || "";
  const externalId =
    row["transaction id"] || row["id"] || row["txn id"] || row["merchant transaction id"] || utr || "";
  const payerName =
    row["payer name"] || row["sender name"] || row["from"] || row["name"] || "";
  const payerUpiId =
    row["payer upi id"] || row["sender vpa"] || row["upi id"] || row["from upi"] || "";
  const timestamp =
    row["date"] || row["timestamp"] || row["transaction date"] || row["created at"] || row["time"] || "";
  const status =
    row["status"] || row["transaction status"] || row["txn status"] || "";

  return {
    amount: parseFloat(amount.replace(/[₹,\s]/g, "")) || 0,
    note: note.trim(),
    utr: utr.trim(),
    externalId: externalId.trim(),
    payerName: payerName.trim(),
    payerUpiId: payerUpiId.trim(),
    timestamp: timestamp.trim(),
    status: status.trim().toUpperCase(),
  };
}

// ── POST: Upload + Parse + Reconcile ───────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    for (let i = 0; i < rows.length; i++) {
      const txn = extractTxnFromRow(rows[i]);

      // Skip rows with no amount or no ID
      if (!txn.amount || (!txn.externalId && !txn.utr)) {
        results.push({
          row: i + 1,
          externalId: txn.externalId || "N/A",
          amount: txn.amount,
          status: "SKIPPED",
          detail: "Missing amount or transaction ID",
        });
        skippedCount++;
        continue;
      }

      // Skip non-successful transactions (only reconcile completed payments)
      if (txn.status && !["SUCCESS", "COMPLETED", "PAID", "CREDIT", "RECEIVED", ""].includes(txn.status)) {
        results.push({
          row: i + 1,
          externalId: txn.externalId,
          amount: txn.amount,
          status: "SKIPPED",
          detail: `Skipped: status is ${txn.status}`,
        });
        skippedCount++;
        continue;
      }

      // Generate a unique externalId if missing
      const finalExternalId = txn.externalId || `CSV_${Date.now()}_${i}`;

      try {
        // Check if transaction already exists in the DB
        const existing = await prisma.transaction.findFirst({
          where: {
            OR: [
              { externalId: finalExternalId },
              ...(txn.utr ? [{ utr: txn.utr }] : []),
            ],
          },
          include: { paymentIntent: { select: { id: true, status: true, referenceId: true } } },
        });

        if (existing) {
          const alreadyMatched = existing.paymentIntent ? `Linked to intent ${existing.paymentIntent.referenceId}` : "Exists but unmatched";
          results.push({
            row: i + 1,
            externalId: finalExternalId,
            amount: txn.amount,
            status: "ALREADY_EXISTS",
            detail: alreadyMatched,
          });
          existsCount++;

          // If it exists but has no matched intent, try matching again
          if (!existing.paymentIntent) {
            const matched = await MatchingEngine.onTransactionDetected({
              externalId: `CSV_RETRY_${finalExternalId}_${Date.now()}`,
              utr: txn.utr || existing.utr || undefined,
              amount: txn.amount,
              payerName: txn.payerName || existing.payerName || undefined,
              payerUpiId: txn.payerUpiId || existing.payerUpiId || undefined,
              note: txn.note || existing.note || undefined,
              timestamp: txn.timestamp || undefined,
            });
            if (matched) {
              results[results.length - 1].status = "MATCHED";
              results[results.length - 1].detail = "Re-matched from existing transaction";
              matchedCount++;
              existsCount--;
            }
          }
          continue;
        }

        // Feed into MatchingEngine for fresh reconciliation
        const matched = await MatchingEngine.onTransactionDetected({
          externalId: finalExternalId,
          utr: txn.utr || undefined,
          amount: txn.amount,
          payerName: txn.payerName || undefined,
          payerUpiId: txn.payerUpiId || undefined,
          note: txn.note || undefined,
          timestamp: txn.timestamp || undefined,
        });

        if (matched) {
          results.push({
            row: i + 1,
            externalId: finalExternalId,
            amount: txn.amount,
            status: "MATCHED",
            detail: "Successfully matched to a pending payment intent",
          });
          matchedCount++;
        } else {
          results.push({
            row: i + 1,
            externalId: finalExternalId,
            amount: txn.amount,
            status: "UNMATCHED",
            detail: "No matching payment intent found",
          });
          unmatchedCount++;
        }
      } catch (err: any) {
        results.push({
          row: i + 1,
          externalId: finalExternalId,
          amount: txn.amount,
          status: "ERROR",
          detail: err.message?.substring(0, 100) || "Unknown error",
        });
        errorCount++;
      }
    }

    await logApi(
      "SUCCESS",
      `[Reconciliation] Complete: ${matchedCount} matched, ${existsCount} existing, ${unmatchedCount} unmatched, ${skippedCount} skipped, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        matched: matchedCount,
        alreadyExists: existsCount,
        unmatched: unmatchedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
    });
  } catch (err: any) {
    console.error("[Reconciliation API] Error:", err);
    await logApi("ERROR", `[Reconciliation] Failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
