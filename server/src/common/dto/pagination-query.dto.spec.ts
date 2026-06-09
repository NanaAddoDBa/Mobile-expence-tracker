import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PaginationQueryDto } from "./pagination-query.dto";

describe("PaginationQueryDto", () => {
  it("uses the standard pagination defaults", async () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    expect(dto).toEqual({
      page: 1,
      pageSize: 20,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("converts valid query strings through explicit transforms", async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: "2",
      pageSize: "50",
    });

    expect(dto).toEqual({
      page: 2,
      pageSize: 50,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects invalid page and page-size values", async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: "0",
      pageSize: "101",
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["page", "pageSize"]),
    );
  });
});
