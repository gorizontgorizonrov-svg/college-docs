import { checkRateLimit, resetRateLimit } from "../actions/rate-limit";

describe("Rate Limit", () => {
  beforeEach(async () => {
    await resetRateLimit("test:user");
  });

  it("должен разрешать первые 4 попытки", async () => {
    for (let i = 0; i < 4; i++) {
      const result = await checkRateLimit("test:user");
      expect(result.allowed).toBe(true);
    }
  });

  it("должен блокировать на 5-й попытке", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test:user");
    }
    const result = await checkRateLimit("test:user");
    expect(result.allowed).toBe(false);
  });

  it("должен сбрасывать лимит", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test:user");
    }
    await resetRateLimit("test:user");
    const result = await checkRateLimit("test:user");
    expect(result.allowed).toBe(true);
  });
});