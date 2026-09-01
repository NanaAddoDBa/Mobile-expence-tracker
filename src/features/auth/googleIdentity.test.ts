/** @vitest-environment jsdom */

import { beforeEach, describe, expect, test, vi } from "vitest";

describe("Google Identity Services client", () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.google;
  });

  test("initializes once and forwards the signed credential", async () => {
    let credentialCallback:
      | ((response: GoogleCredentialResponse) => void)
      | undefined;
    const initialize = vi.fn((config: GoogleIdConfiguration) => {
      credentialCallback = config.callback;
    });
    const renderButton = vi.fn();
    window.google = {
      accounts: {
        id: {
          initialize,
          renderButton,
          disableAutoSelect: vi.fn(),
        },
      },
    };
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      width: 360,
      height: 44,
      top: 0,
      right: 360,
      bottom: 44,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const onCredential = vi.fn();
    const { renderGoogleSignInButton } = await import("./googleIdentity");

    const dispose = await renderGoogleSignInButton({
      container,
      clientId: "web-client-id.apps.googleusercontent.com",
      text: "signin_with",
      onCredential,
    });

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "web-client-id.apps.googleusercontent.com",
        ux_mode: "popup",
      }),
    );
    expect(renderButton).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        text: "signin_with",
        width: 360,
      }),
    );

    credentialCallback?.({ credential: "signed-google-id-token" });
    expect(onCredential).toHaveBeenCalledWith("signed-google-id-token");

    dispose();
    credentialCallback?.({ credential: "another-token" });
    expect(onCredential).toHaveBeenCalledTimes(1);
  });
});
