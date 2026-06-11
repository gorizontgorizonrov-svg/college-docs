import { computeDocumentHash, signHash, verifyHash } from "@/actions/signature";
import { encrypt, decrypt } from "@/lib/crypto";

jest.mock("@/lib/crypto", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

describe("computeDocumentHash", () => {
  it("should return a SHA-256 hash as hex string", async () => {
    const hash = await computeDocumentHash("test content");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return consistent hash for same content", async () => {
    const hash1 = await computeDocumentHash("hello");
    const hash2 = await computeDocumentHash("hello");
    expect(hash1).toBe(hash2);
  });

  it("should return different hash for different content", async () => {
    const hash1 = await computeDocumentHash("hello");
    const hash2 = await computeDocumentHash("world");
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty content", async () => {
    const hash = await computeDocumentHash("");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // SHA-256 of empty string: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});

describe("signHash / verifyHash", () => {
  const mockEncrypted = "mock-encrypted-data";

  beforeEach(() => {
    jest.clearAllMocks();
    (encrypt as jest.Mock).mockReturnValue(mockEncrypted);
  });

  it("should call encrypt with the hash", async () => {
    const hash = await computeDocumentHash("test");
    const result = await signHash(hash);
    expect(encrypt).toHaveBeenCalledWith(hash);
    expect(result).toBe(mockEncrypted);
  });

  it("should verify correct signature", async () => {
    const hash = "abc123";
    (decrypt as jest.Mock).mockReturnValue(hash);

    const result = await verifyHash(mockEncrypted, hash);
    expect(decrypt).toHaveBeenCalledWith(mockEncrypted);
    expect(result).toBe(true);
  });

  it("should reject incorrect signature", async () => {
    (decrypt as jest.Mock).mockReturnValue("wrong-hash");

    const result = await verifyHash(mockEncrypted, "original-hash");
    expect(result).toBe(false);
  });

  it("should handle decryption errors gracefully", async () => {
    (decrypt as jest.Mock).mockImplementation(() => {
      throw new Error("Decryption failed");
    });

    const result = await verifyHash("bad-data", "hash");
    expect(result).toBe(false);
  });
});
