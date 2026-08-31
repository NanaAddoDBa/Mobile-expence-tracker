/** @vitest-environment jsdom */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./apiMode", () => ({
  API_BASE_URL: "",
  USES_HTTP_API: true,
}));

describe("HTTP auth API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("exchanges a Google credential for the local user session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { csrfToken: "signed-csrf-token" } }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user: {
                id: "user-google",
                email: "google.user@example.com",
                name: "Google User",
              },
              isNewUser: true,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              profile: {
                id: "user-google",
                email: "google.user@example.com",
                name: "Google User",
                settings: {
                  theme: "system",
                  currency: "EUR",
                  language: "en-IE",
                  accessibility: {
                    largerText: false,
                    reduceMotion: false,
                    highContrast: false,
                    comfortableLayout: false,
                  },
                },
                notifications: {
                  enableAlerts: true,
                  budgetThreshold: 80,
                  recurringReminders: true,
                  weeklySummaries: false,
                },
              },
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);
    const { authApi } = await import("./authApi");

    await expect(
      authApi.authenticateWithGoogle("signed-google-id-token"),
    ).resolves.toMatchObject({
      isNewUser: true,
      user: {
        id: "user-google",
        email: "google.user@example.com",
        name: "Google User",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/auth/csrf", {
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/google",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          credential: "signed-google-id-token",
        }),
        headers: expect.objectContaining({}),
      }),
    );
    const requestHeaders = fetchMock.mock.calls[1][1]?.headers as Headers;
    expect(requestHeaders.get("X-CSRF-Token")).toBe("signed-csrf-token");
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/profile",
      expect.objectContaining({ credentials: "include" })
    );
  });
});
