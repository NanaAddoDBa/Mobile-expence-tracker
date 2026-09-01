import { validateEnvironment } from "./environment";

describe("validateEnvironment", () => {
  it("provides bounded development defaults", () => {
    expect(validateEnvironment({ NODE_ENV: "test" })).toMatchObject({
      NODE_ENV: "test",
      PORT: "4000",
      BCRYPT_ROUNDS: "12",
      BANK_SYNC_INTERVAL_MINUTES: "360",
    });
  });

  it("rejects production defaults that would weaken account security", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:password@database/app",
        FRONTEND_ORIGIN: "http://example.com",
        APP_PUBLIC_URL: "https://example.com",
        PUBLIC_API_URL: "https://api.example.com",
        COOKIE_SECURE: "false",
        CSRF_SECRET: "replace-with-at-least-32-random-characters",
        SMTP_HOST: "smtp.example.com",
        EMAIL_FROM: "accounts@example.com",
        TRUST_PROXY: "false",
      }),
    ).toThrow(/FRONTEND_ORIGIN must use HTTPS/);
  });

  it("accepts a complete production configuration", () => {
    expect(
      validateEnvironment({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:password@database/app",
        FRONTEND_ORIGIN: "https://app.example.com",
        APP_PUBLIC_URL: "https://app.example.com",
        PUBLIC_API_URL: "https://api.example.com",
        COOKIE_SECURE: "true",
        CSRF_SECRET: "a-unique-production-secret-that-is-long-enough",
        SMTP_HOST: "smtp.example.com",
        EMAIL_FROM: "accounts@example.com",
        TRUST_PROXY: "1",
        BANK_CONNECTIONS_ENABLED: "true",
        GOCARDLESS_SECRET_ID: "bank-secret-id",
        GOCARDLESS_SECRET_KEY: "bank-secret-key",
      }),
    ).toMatchObject({ NODE_ENV: "production" });
  });
});
