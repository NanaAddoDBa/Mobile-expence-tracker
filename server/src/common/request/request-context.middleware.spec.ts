import { Response } from "express";
import {
  RequestContextMiddleware,
  RequestWithContext,
} from "./request-context.middleware";

describe("RequestContextMiddleware", () => {
  it("preserves a safe incoming request ID and returns it in the response", () => {
    const middleware = new RequestContextMiddleware();
    const request = {
      get: jest.fn().mockReturnValue("request-123"),
    };
    const response = { setHeader: jest.fn() };
    const next = jest.fn();

    middleware.use(
      request as unknown as RequestWithContext,
      response as unknown as Response,
      next,
    );

    expect(request).toMatchObject({ requestId: "request-123" });
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-Request-ID",
      "request-123",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("replaces unsafe request IDs", () => {
    const middleware = new RequestContextMiddleware();
    const request = {
      get: jest.fn().mockReturnValue("unsafe\nheader"),
    };
    const response = { setHeader: jest.fn() };

    middleware.use(
      request as unknown as RequestWithContext,
      response as unknown as Response,
      jest.fn(),
    );

    expect((request as unknown as { requestId: string }).requestId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });
});
