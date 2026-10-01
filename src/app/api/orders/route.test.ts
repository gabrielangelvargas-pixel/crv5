import { expect, it } from "vitest";
import { POST } from "./route";
it("deshabilita la creación de pedidos en el flujo de carritos confirmados", async () => {
  expect((await POST()).status).toBe(410);
});
