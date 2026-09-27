import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("combina clases condicionales", () => {
    expect(cn("base", false && "hidden", "active")).toBe("base active");
  });
});
