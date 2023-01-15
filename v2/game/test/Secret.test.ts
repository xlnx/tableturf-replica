import { expect, test } from "vitest";
import { genSecret } from "../src/Secret";

test("test_simple", () => {
  const key = genSecret(8);
  expect(key.length).toBe(8);
  console.log(key);
});
