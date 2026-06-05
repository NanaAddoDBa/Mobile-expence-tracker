import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AppProviders } from "../app/providers/AppProviders";

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper">;

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AppProviders>{children}</AppProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
