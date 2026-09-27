import { expect, test } from "@playwright/test";

test("muestra el slider principal de inicio", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Imagenes destacadas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Imagen siguiente" })).toBeVisible();
  await expect(page.getByText("Compra mayorista")).toBeVisible();
  await expect(page.getByText("Minimo de inversion $70.000.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Asesoramiento" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Categorias mas visitadas" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bijouterie" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ultimos ingresos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Packs mayoristas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como comprar" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Necesitas ayuda para armar tu pedido?" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu lateral" }).click();
  await expect(page.getByRole("complementary", { name: "Menu lateral" })).toBeVisible();
  await expect(page.getByPlaceholder("Productos o categorias")).toBeVisible();
  await expect(page.getByText("Accesos rapidos")).toBeVisible();
  await expect(page.getByRole("link", { name: /Bijouterie/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aros" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Consultar por WhatsApp" })).toBeVisible();

  await page.getByPlaceholder("Productos o categorias").fill("aro");
  await expect(page.getByText("Resultados")).toBeVisible();
  await expect(page.getByText("Subcategorias")).toBeVisible();
  await expect(page.getByText("Productos", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Aros argolla dorados/ })).toBeVisible();
  await page.getByRole("link", { name: /Aros argolla dorados/ }).click();
  await expect(page).toHaveURL(/\/catalogo\/bijouterie\/aros/);
  await expect(page.getByRole("heading", { name: "Aros", exact: true })).toBeVisible();
  await expect(page.getByText("Aros argolla dorados")).toBeVisible();

  await page.getByRole("button", { name: "Abrir menu lateral" }).click();
  await expect(page.getByPlaceholder("Productos o categorias")).toHaveValue("");
  await expect(page.getByText("Accesos rapidos")).toBeVisible();

  await page.getByPlaceholder("Productos o categorias").fill("zzzz");
  await expect(page.getByText("No encontramos resultados.")).toBeVisible();
});

test("permite navegar a subcategorias nietas del catalogo", async ({ page }) => {
  await page.goto("/catalogo/marroquineria/billeteras");

  await expect(
    page.getByRole("heading", { name: "Billeteras", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Dama" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hombre" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Juveniles" })).toBeVisible();

  await page.getByRole("link", { name: "Juveniles" }).click();

  await expect(page).toHaveURL(/\/catalogo\/marroquineria\/billeteras\/juveniles/);
  await expect(
    page.getByRole("heading", { name: "Billeteras", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Billetera juvenil color")).toBeVisible();
  await expect(page.getByText("1 productos encontrados")).toBeVisible();
});
