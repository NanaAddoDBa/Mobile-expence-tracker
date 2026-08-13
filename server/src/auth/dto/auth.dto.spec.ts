import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { LoginDto } from "./login.dto";
import { RegisterDto } from "./register.dto";

describe("auth DTOs", () => {
  it("accepts and normalizes valid registration values", async () => {
    const dto = plainToInstance(RegisterDto, {
      email: "  USER@Example.com ",
      password: "password123",
      name: "  Sample User ",
    });

    expect(dto.email).toBe("user@example.com");
    expect(dto.name).toBe("Sample User");
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects invalid registration values", async () => {
    const dto = plainToInstance(RegisterDto, {
      email: "not-an-email",
      password: "short",
      name: "",
    });
    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["email", "password", "name"]),
    );
  });

  it("validates login email and password fields", async () => {
    const validDto = plainToInstance(LoginDto, {
      email: " USER@example.com ",
      password: "password123",
    });
    const invalidDto = plainToInstance(LoginDto, {
      email: "invalid",
      password: 123,
    });

    expect(validDto.email).toBe("user@example.com");
    await expect(validate(validDto)).resolves.toHaveLength(0);

    const errors = await validate(invalidDto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["email", "password"]),
    );
  });
});
