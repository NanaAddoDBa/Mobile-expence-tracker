import { createPaginatedResponse } from "./pagination-response";

describe("createPaginatedResponse", () => {
  it("wraps items with calculated pagination metadata", () => {
    expect(
      createPaginatedResponse(["one", "two"], {
        page: 2,
        pageSize: 2,
        total: 5,
      }),
    ).toEqual({
      data: ["one", "two"],
      meta: {
        pagination: {
          page: 2,
          pageSize: 2,
          total: 5,
          totalPages: 3,
        },
      },
    });
  });

  it("returns zero pages for an empty collection", () => {
    expect(
      createPaginatedResponse([], {
        page: 1,
        pageSize: 20,
        total: 0,
      }),
    ).toMatchObject({
      meta: {
        pagination: {
          totalPages: 0,
        },
      },
    });
  });
});
