import { encrypt, decrypt } from "../lib/crypto";

describe("Crypto", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = "0".repeat(64);
  });

  it("должен шифровать и расшифровывать текст", () => {
    const text = "+996550123456";
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("должен генерировать разный ciphertext каждый раз", () => {
    const text = "secret";
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
  });

  it("должен выбрасывать ошибку при неправильном формате", () => {
    expect(() => decrypt("invalid-format")).toThrow();
  });
});