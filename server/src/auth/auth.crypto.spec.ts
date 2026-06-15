import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "./auth.crypto";

describe("auth cryptography", () => {
  it("hashes and verifies passwords without retaining the raw password", async () => {
    const password = "password123";
    const passwordHash = await hashPassword(password, 4);

    expect(passwordHash).not.toBe(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect", passwordHash)).resolves.toBe(
      false,
    );
  });

  it("creates opaque session tokens and deterministic token hashes", () => {
    const firstToken = generateSessionToken();
    const secondToken = generateSessionToken();

    expect(firstToken).not.toBe(secondToken);
    expect(firstToken.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(firstToken)).toHaveLength(64);
    expect(hashSessionToken(firstToken)).toBe(hashSessionToken(firstToken));
    expect(hashSessionToken(firstToken)).not.toBe(firstToken);
  });
});
