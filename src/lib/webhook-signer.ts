import crypto from "crypto";

export class WebhookSigner {
  /**
   * Signs a payload with a secret using HMAC-SHA256.
   * Standard fintech security practice.
   */
  static sign(payload: string, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
  }

  /**
   * Generates a random secure secret for a merchant.
   */
  static generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
