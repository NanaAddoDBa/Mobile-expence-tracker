import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleIdentityService } from "./google-identity.service";

function createConfig(clientId?: string): ConfigService {
  return {
    get: jest.fn((key: string) =>
      key === "GOOGLE_CLIENT_ID" ? clientId : undefined,
    ),
  } as unknown as ConfigService;
}

describe("GoogleIdentityService", () => {
  it("verifies a Google ID token for the configured audience", async () => {
    const service = new GoogleIdentityService(
      createConfig("web-client-id.apps.googleusercontent.com"),
    );
    const verifyIdToken = replaceVerifier(
      service,
      jest.fn(async (options: { idToken: string; audience: string }) => {
        void options;
        return {
          getPayload: () => ({
            sub: "google-subject-1",
            email: " USER@Example.com ",
            email_verified: true,
            name: " Sample User ",
          }),
        };
      }),
    );

    await expect(service.verifyCredential("signed-token")).resolves.toEqual({
      subject: "google-subject-1",
      email: "user@example.com",
      name: "Sample User",
    });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: "signed-token",
      audience: "web-client-id.apps.googleusercontent.com",
    });
  });

  it("rejects tokens without a verified email", async () => {
    const service = new GoogleIdentityService(
      createConfig("web-client-id.apps.googleusercontent.com"),
    );
    replaceVerifier(
      service,
      jest.fn(async (options: { idToken: string; audience: string }) => {
        void options;
        return {
          getPayload: () => ({
            sub: "google-subject-1",
            email: "user@example.com",
            email_verified: false,
          }),
        };
      }),
    );

    await expect(service.verifyCredential("signed-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects invalid tokens without exposing verifier details", async () => {
    const service = new GoogleIdentityService(
      createConfig("web-client-id.apps.googleusercontent.com"),
    );
    replaceVerifier(
      service,
      jest.fn(async (options: { idToken: string; audience: string }) => {
        void options;
        throw new Error("signature mismatch");
      }),
    );

    await expect(service.verifyCredential("invalid-token")).rejects.toMatchObject({
      message: "Google sign-in could not be verified",
    });
  });

  it("reports unavailable when Google sign-in is not configured", async () => {
    const service = new GoogleIdentityService(createConfig());
    const verifyIdToken = replaceVerifier(
      service,
      jest.fn(async (options: { idToken: string; audience: string }) => {
        void options;
        return { getPayload: () => undefined };
      }),
    );

    await expect(service.verifyCredential("signed-token")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});

type VerifyIdTokenMock = jest.Mock<
  Promise<{ getPayload: () => unknown }>,
  [options: { idToken: string; audience: string }]
>;

function replaceVerifier(
  service: GoogleIdentityService,
  verifyIdToken: VerifyIdTokenMock,
): VerifyIdTokenMock {
  (
    service as unknown as {
      client: { verifyIdToken: VerifyIdTokenMock };
    }
  ).client = { verifyIdToken };

  return verifyIdToken;
}
