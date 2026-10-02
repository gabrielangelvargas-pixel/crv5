import { expect, it } from "vitest";
import { cartPayableCents, parseAdjustmentAmount } from "./cart-adjustments";
it("acepta centavos con coma o punto y descuentos negativos", () => {
 expect(parseAdjustmentAmount("-5.10")).toBe(-510);
 expect(parseAdjustmentAmount("-5,10")).toBe(-510);
 expect(parseAdjustmentAmount("+1120")).toBe(112000);
 expect(parseAdjustmentAmount("1120")).toBe(112000);
 expect(cartPayableCents(24485.1, [{ description: "Redondeo", amountCents: -510 }, { description: "Envío", amountCents: 112000 }])).toBe(2560000);
});
it("rechaza importes vacíos, no finitos y más de dos decimales", () => {
 for (const value of ["", "NaN", "Infinity", "1.001", "1,2,3", "1e3"]) expect(parseAdjustmentAmount(value)).toBeNull();
});
