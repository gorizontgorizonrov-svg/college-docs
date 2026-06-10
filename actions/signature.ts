"use server";

import { encrypt, decrypt } from "@/lib/crypto";
import { createHash } from "crypto";

export async function computeDocumentHash(content: string): Promise<string> {
  return createHash("sha256").update(content).digest("hex");
}

export async function signHash(hash: string): Promise<string> {
  return encrypt(hash);
}

export async function verifyHash(signatureData: string, originalHash: string): Promise<boolean> {
  try {
    const decrypted = decrypt(signatureData);
    return decrypted === originalHash;
  } catch {
    return false;
  }
}
