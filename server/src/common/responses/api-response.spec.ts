import { createApiSuccess } from "./api-response";

describe("createApiSuccess", () => {
  it("wraps data without adding empty metadata", () => {
    expect(createApiSuccess({ status: "ok" })).toEqual({
      data: { status: "ok" },
    });
  });

  it("includes metadata when provided", () => {
    expect(createApiSuccess(["expense"], { source: "test" })).toEqual({
      data: ["expense"],
      meta: { source: "test" },
    });
  });
});
