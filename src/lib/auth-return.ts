export function getAuthReturnPath(search: string) {
  const next = new URLSearchParams(search).get("next");
  return next === "/carrito/confirmar" || next === "/pedido/confirmar" || next === "/carrito" ? next : null;
}
