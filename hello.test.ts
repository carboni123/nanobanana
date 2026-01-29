/**
 * Tests for hello.ts
 */

import { greet } from "./hello";

describe("greet", () => {
  test("greets with default name", () => {
    expect(greet()).toBe("Hello, World!");
  });

  test("greets with custom name", () => {
    expect(greet("NanoBanana")).toBe("Hello, NanoBanana!");
  });

  test("greets with empty string", () => {
    expect(greet("")).toBe("Hello, !");
  });
});
