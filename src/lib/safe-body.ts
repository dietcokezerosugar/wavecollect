import { NextRequest } from "next/server";

/**
 * Safely parse incoming request bodies with a strict byte-limit constraint.
 * Prevents memory exhaustion attacks (DoS/OOM) at the application layer.
 */
export async function parseSafeJson<T = any>(req: NextRequest, maxBytes: number = 1024 * 1024): Promise<T> {
  // 1. Inspect Content-Length header for fast rejection
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const bytes = parseInt(contentLength, 10);
    if (!isNaN(bytes) && bytes > maxBytes) {
      throw new Error(`PAYLOAD_TOO_LARGE: Payload size exceeds the maximum limit of ${maxBytes} bytes.`);
    }
  }

  // 2. Safe Stream Reading Chunk-by-Chunk
  // Protects against chunked transfer encoding tricks where Content-Length is omitted or forged
  if (!req.body) {
    return {} as T;
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        totalBytes += value.length;
        if (totalBytes > maxBytes) {
          throw new Error(`PAYLOAD_TOO_LARGE: Payload limit of ${maxBytes} bytes exceeded during streaming.`);
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Combine chunks into single buffer
  const concatArray = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    concatArray.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  const text = decoder.decode(concatArray);
  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error("INVALID_JSON: Request body must be valid JSON.");
  }
}
