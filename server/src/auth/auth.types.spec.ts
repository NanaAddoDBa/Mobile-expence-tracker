import { User, UserStatus } from "@prisma/client";
import { toSafeUser } from "./auth.types";

describe("toSafeUser", () => {
  it("returns only public account fields", () => {
    const now = new Date();
    const user: User = {
      id: "user-1",
      email: "user@example.com",
      name: "Sample User",
      passwordHash: "secret-hash",
      emailVerifiedAt: null,
      lastLoginAt: null,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    const safeUser = toSafeUser(user);

    expect(safeUser).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "Sample User",
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    expect(safeUser).not.toHaveProperty("passwordHash");
    expect(safeUser).not.toHaveProperty("emailVerifiedAt");
    expect(safeUser).not.toHaveProperty("lastLoginAt");
  });
});
