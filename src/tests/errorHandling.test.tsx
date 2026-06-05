/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ErrorBoundary } from "../components/feedback/ErrorBoundary";
import { createAppError, getUserFriendlyErrorMessage } from "../lib/error/appError";
import { logger } from "../lib/logger";
import { expenseRepository } from "../services/repositories/expenseRepository.mock";

const BrokenView = () => {
  throw new Error("render failed");
};

describe("centralized error handling", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test("logger methods do not crash when called", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => logger.info("Loaded", { area: "test" })).not.toThrow();
    expect(() => logger.warn("Careful", { area: "test" })).not.toThrow();
    expect(() => logger.error("Failed", { area: "test" })).not.toThrow();

    expect(infoSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  test("getUserFriendlyErrorMessage returns simple user-facing messages", () => {
    expect(getUserFriendlyErrorMessage(createAppError("STORAGE_ERROR", "raw parse failure"))).toBe(
      "We could not load your saved data."
    );
    expect(getUserFriendlyErrorMessage(createAppError("IMPORT_ERROR", "provider failed"))).toBe(
      "Import failed. Please try again."
    );
    expect(getUserFriendlyErrorMessage(new Error("technical details"))).toBe(
      "Something went wrong. Please try again."
    );
  });

  test("repository storage parse errors are logged and fall back to empty product data", () => {
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    localStorage.setItem("exp_ledger", "{bad json");

    const expenses = expenseRepository.getAll();

    expect(expenses).toEqual([]);
    expect(loggerSpy).toHaveBeenCalledWith(
      "Failed to parse expenses from storage. Falling back to an empty expense list.",
      expect.objectContaining({
        storageKey: "exp_ledger",
      })
    );
  });

  test("ErrorBoundary renders fallback UI when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("We could not show this part of the app. Try again to reload the view.")).toBeTruthy();
  });

  test("ErrorBoundary reset action retries rendering", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    let shouldThrow = true;

    const RecoveringView = () => {
      if (shouldThrow) {
        throw new Error("first render failed");
      }
      return <p>Recovered</p>;
    };

    render(
      <ErrorBoundary>
        <RecoveringView />
      </ErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered")).toBeTruthy();
  });
});
