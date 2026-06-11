import { encrypt, decrypt } from "@/lib/crypto";

const ORIGINAL_ENV = process.env.ENCRYPTION_KEY;

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
});

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_ENV;
});

describe("encrypt / decrypt", () => {
  it("should encrypt and decrypt a string", () => {
    const original = "Hello, World!";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should handle empty string", () => {
    const original = "";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should handle UTF-8 characters (кириллица)", () => {
    const original = "Привет, мир! Тест ЭП";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should handle long strings", () => {
    const original = "A".repeat(10000);
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should produce different ciphertexts for same plaintext (different IV)", () => {
    const original = "same text";
    const encrypted1 = encrypt(original);
    const encrypted2 = encrypt(original);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should throw on invalid format", () => {
    expect(() => decrypt("invalid")).toThrow("Invalid encrypted text format");
    expect(() => decrypt("a:b")).toThrow("Invalid encrypted text format");
    expect(() => decrypt("")).toThrow("Invalid encrypted text format");
  });

  it("should throw on tampered ciphertext", () => {
    const original = "secret data";
    const encrypted = encrypt(original);
    const parts = encrypted.split(":");
    const tampered = `${parts[0]}:${parts[1]}:deadbeef`;
    expect(() => decrypt(tampered)).toThrow();
  });
});

describe("encrypt output format", () => {
  it("should return format iv:authTag:ciphertext", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/); // 16 bytes IV = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/); // 16 bytes authTag = 32 hex chars
  });
});
