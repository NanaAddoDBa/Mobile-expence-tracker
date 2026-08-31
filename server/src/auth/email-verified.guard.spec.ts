import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { EmailVerifiedGuard } from "./email-verified.guard";

function createContext(emailVerified: boolean): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          id: "user-1",
          email: "user@example.com",
          emailVerified,
        },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe("EmailVerifiedGuard", () => {
  const guard = new EmailVerifiedGuard();

  it("allows a verified account", () => {
    expect(guard.canActivate(createContext(true))).toBe(true);
  });

  it("blocks an unverified account from bank data operations", () => {
    expect(() => guard.canActivate(createContext(false))).toThrow(
      ForbiddenException,
    );
  });
});
