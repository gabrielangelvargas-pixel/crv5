export function getAuthReturnPath(search: string) {
  const next = new URLSearchParams(search).get("next");
  return next === "/pedido/confirmar" || next === "/carrito" ? next : null;
}
