import type { Env } from "./main.tsx";
import { hexToBytes } from "./lib/hex";

export async function hashPassword(
  password: string,
  hexPepper: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  // TLDR: Run PBKDF2 using subtle crypto api
  // 1. Normalize for unicode purposes
  // 2. Import as a pbkdf key
  // 3. Import pepper as a key
  // 4. Derive bits using salt & pbkdf key as inputs
  // 5. Use pepper key to sign HMAC of derived bits
  // REQUIRES PAID CF WORKERS PLAN

  const pepper = hexToBytes(hexPepper);

  // unicode shenanigans ig
  const normalizedPassword = new TextEncoder().encode(
    password.normalize("NFC"),
  );

  const pbkdfKey = await crypto.subtle.importKey(
    "raw",
    normalizedPassword,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const pepperKey = await crypto.subtle.importKey(
    "raw",
    pepper,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const material = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 200000,
    },
    pbkdfKey,
    256,
  );

  const hmac = await crypto.subtle.sign("HMAC", pepperKey, material);
  return new Uint8Array(hmac);
}
