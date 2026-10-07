import { expect, it } from "vitest";
import { clearLoginFailures, loginRetryAfter, recordLoginFailure, requestIp } from "./login-rate-limit";

it("bloquea una cuenta tras varios fallos desde la misma IP y libera al vencer la ventana", () => {
  const now = 1_000_000;
  for (let attempt = 0; attempt < 8; attempt++) recordLoginFailure("1.1.1.1", "Ana", now);
  expect(loginRetryAfter("1.1.1.1", "ana", now)).toBe(900);
  expect(loginRetryAfter("2.2.2.2", "ana", now)).toBe(0);
  expect(loginRetryAfter("1.1.1.1", "ana", now + 15 * 60 * 1000)).toBe(0);
});

it("un ingreso correcto limpia los fallos de la cuenta", () => {
  for (let attempt = 0; attempt < 8; attempt++) recordLoginFailure("3.3.3.3", "luis");
  clearLoginFailures("3.3.3.3", "luis");
  expect(loginRetryAfter("3.3.3.3", "luis")).toBe(0);
});

it("limita una IP que prueba muchas cuentas", () => {
  for (let attempt = 0; attempt < 40; attempt++) recordLoginFailure("4.4.4.4", `cuenta-${attempt}`);
  expect(loginRetryAfter("4.4.4.4", "otra")).toBeGreaterThan(0);
});

it("toma la IP del primer salto del proxy", () => {
  expect(requestIp(new Request("http://x", { headers: { "X-Forwarded-For": "5.5.5.5, 10.0.0.1" } }))).toBe("5.5.5.5");
});
