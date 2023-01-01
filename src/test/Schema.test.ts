import { expect, test } from "vitest";
import { validateSchema } from "../Schema";

test("test_IBotSessionQueryResponse_1", () => {
  const e = {
    action: "discard",
    hand: 0,
    params: {},
  };
  expect(() => validateSchema("IBotSessionQueryResponse", e)).toThrow();
});

test("test_IBotSessionQueryResponse_2", () => {
  const e = {
    action: "discard",
    hand: 0,
  };
  expect(validateSchema("IBotSessionQueryResponse", e)).toBe(e);
});
