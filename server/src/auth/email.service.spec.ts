import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { EmailService } from "./email.service";

describe("EmailService", () => {
  const config = new ConfigService({
    SMTP_HOST: "smtp.example.com",
    EMAIL_FROM: "no-reply@example.com",
    APP_PUBLIC_URL: "https://budget.example.com/",
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    [
      "sendEmailVerification",
      "emailVerificationToken",
      "Verify your Expense Tracker email",
    ],
    [
      "sendPasswordReset",
      "passwordResetToken",
      "Reset your Expense Tracker password",
    ],
  ] as const)("composes %s with the installed mail transport", async (
    method,
    parameter,
    subject,
  ) => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const sendMail = jest.spyOn(transport, "sendMail");
    jest.spyOn(nodemailer, "createTransport").mockReturnValue(transport);
    const service = new EmailService(config);
    const token = "test+token/&";

    await expect(service[method]("user@example.com", token)).resolves.toBe(true);

    const result = await sendMail.mock.results[0].value;
    const message = JSON.parse(result.message);
    const expectedUrl = new URL("https://budget.example.com/");
    expectedUrl.searchParams.set(parameter, token);

    expect(message.from.address).toBe("no-reply@example.com");
    expect(
      message.to.map((recipient: { address: string }) => recipient.address),
    ).toEqual(["user@example.com"]);
    expect(message.subject).toBe(subject);
    expect(message.text).toContain(expectedUrl.toString());
    expect(message.html).toContain(expectedUrl.toString());
  });

  it("reports unsuccessful delivery when the transport rejects a message", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    jest.spyOn(transport, "sendMail").mockImplementation(async () => {
      throw new Error("SMTP unavailable");
    });
    jest.spyOn(nodemailer, "createTransport").mockReturnValue(transport);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const service = new EmailService(config);

    await expect(
      service.sendPasswordReset("user@example.com", "reset-token"),
    ).resolves.toBe(false);
  });

  it("reports unsuccessful delivery when email is not configured", async () => {
    const createTransport = jest.spyOn(nodemailer, "createTransport");
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const service = new EmailService(
      new ConfigService({ SMTP_HOST: "", EMAIL_FROM: "" }),
    );

    await expect(
      service.sendEmailVerification("user@example.com", "verification-token"),
    ).resolves.toBe(false);
    expect(createTransport).not.toHaveBeenCalled();
  });
});
