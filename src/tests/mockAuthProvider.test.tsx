/** @vitest-environment jsdom */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { MockAuthProvider, useMockAuth } from "../app/providers/MockAuthProvider";

const AuthProbe = () => {
  const {
    currentUser,
    isAuthenticated,
    login,
  } = useMockAuth();

  return (
    <div>
      <output aria-label="auth-state">
        {isAuthenticated ? "authenticated" : "signed-out"}
      </output>
      <output aria-label="profile-state">
        {currentUser ? currentUser.email : "no-profile"}
      </output>
      <button
        type="button"
        onClick={() => {
          void login("demo@example.com", "password123", "Demo User");
        }}
      >
        Login
      </button>
    </div>
  );
};

describe("MockAuthProvider", () => {
  test("does not create a fake profile before login", () => {
    render(
      <MockAuthProvider>
        <AuthProbe />
      </MockAuthProvider>
    );

    expect(screen.getByLabelText("auth-state")).toHaveTextContent("signed-out");
    expect(screen.getByLabelText("profile-state")).toHaveTextContent("no-profile");
    expect(localStorage.getItem("exp_user_profile")).toBeNull();
  });

  test("creates and persists the mock profile after login", async () => {
    const user = userEvent.setup();

    render(
      <MockAuthProvider>
        <AuthProbe />
      </MockAuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByLabelText("auth-state")).toHaveTextContent("authenticated");
      expect(screen.getByLabelText("profile-state")).toHaveTextContent("demo@example.com");
      expect(JSON.parse(localStorage.getItem("exp_user_profile") || "{}")).toMatchObject({
        email: "demo@example.com",
        name: "Demo User",
      });
    });
  });
});
