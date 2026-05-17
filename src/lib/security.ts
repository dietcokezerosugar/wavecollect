import crypto from "crypto";
import { prisma } from "./prisma";

/**
 * Checks if an IP address is whitelisted for a given merchant.
 * If ipWhitelist is null or empty, access is unrestricted.
 */
export async function validateIpWhitelist(merchantId: string, ip: string): Promise<boolean> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { ipWhitelist: true },
  });

  // No whitelist configured = unrestricted access
  if (!merchant || !merchant.ipWhitelist || merchant.ipWhitelist.trim() === "") return true;

  const allowedIps = merchant.ipWhitelist.split(",").map((i) => i.trim());
  
  // Basic exact match check
  // In production, you might want to support CIDR ranges
  return allowedIps.includes(ip);
}

/**
 * Generates a cryptographically strong random alphanumeric string of a fixed length.
 * Contains only uppercase, lowercase, and numbers (no dashes, spaces, or symbols).
 */
export function generateAlphanumericId(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}
