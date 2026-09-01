import {
  Controller,
  Get,
  INestApplication,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import request from "supertest";
import { CsrfService } from "../src/common/security/csrf.service";
import { SecurityModule } from "../src/common/security/security.module";

@Controller("security-test")
class SecurityTestController {
  constructor(private readonly csrf: CsrfService) {}

  @Get("csrf")
  getCsrfToken(
    @Req() incomingRequest: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return {
      csrfToken: this.csrf.generateToken(incomingRequest, response),
    };
  }

  @Post("mutation")
  mutate() {
    return { success: true };
  }
}

describe("HTTP security controls (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-32-characters";
    process.env.COOKIE_SECURE = "false";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SecurityModule,
      ],
      controllers: [SecurityTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects a mutation without a CSRF token", async () => {
    await request(app.getHttpServer()).post("/security-test/mutation").expect(403);
  });

  it("rejects a tampered CSRF token", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get("/security-test/csrf").expect(200);

    await agent
      .post("/security-test/mutation")
      .set("x-csrf-token", "tampered-token")
      .expect(403);
  });

  it("accepts a signed token paired with its HttpOnly cookie", async () => {
    const agent = request.agent(app.getHttpServer());
    const tokenResponse = await agent.get("/security-test/csrf").expect(200);
    const csrfToken = tokenResponse.body.csrfToken as string;

    expect(csrfToken).toEqual(expect.any(String));
    const setCookie = tokenResponse.headers["set-cookie"];
    expect(Array.isArray(setCookie) ? setCookie.join(";") : setCookie).toContain(
      "HttpOnly",
    );
    await agent
      .post("/security-test/mutation")
      .set("x-csrf-token", csrfToken)
      .expect(201, { success: true });
  });
});
