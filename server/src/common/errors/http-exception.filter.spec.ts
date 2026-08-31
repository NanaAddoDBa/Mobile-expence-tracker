import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { ApiErrorCode } from "./api-error-code";
import { HttpExceptionFilter } from "./http-exception.filter";

@Controller("filter-test")
class FilterTestController {
  @Get()
  failValidation(): never {
    throw new BadRequestException({
      message: ["page must not be less than 1"],
    });
  }

  @Get("unexpected")
  failUnexpectedly(): never {
    throw new Error("sensitive internal failure");
  }
}

describe("HttpExceptionFilter", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilterTestController],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the standard validation error response", async () => {
    const response = await request(app.getHttpServer())
      .get("/filter-test")
      .set("x-request-id", "request-123")
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        details: ["page must not be less than 1"],
        requestId: "request-123",
        timestamp: expect.any(String),
      },
    });
    expect(new Date(response.body.error.timestamp as string).toString()).not.toBe(
      "Invalid Date",
    );
    expect(response.body.error).not.toHaveProperty("stack");
  });

  it("returns a generic request-correlated response for unexpected errors", async () => {
    const response = await request(app.getHttpServer())
      .get("/filter-test/unexpected")
      .set("x-request-id", "request-500")
      .expect(500);

    expect(response.body).toEqual({
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: "Internal server error",
        requestId: "request-500",
        timestamp: expect.any(String),
      },
    });
    expect(JSON.stringify(response.body)).not.toContain(
      "sensitive internal failure",
    );
  });
});
