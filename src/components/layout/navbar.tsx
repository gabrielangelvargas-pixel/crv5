"use client";
import { useCart } from "@/components/cart/cart-provider";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CategoryNode } from "@/data/categories";
import type { ProductSearchResult } from "@/lib/products-repository";
import { getCategoryIcon } from "@/lib/category-icons";
import { AuthMenu } from "@/components/auth/auth-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  FaBars,
  FaFire,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaPercent,
  FaStar,
  FaTags,
  FaWhatsapp,
  FaXmark,
} from "react-icons/fa6";

const quickLinks = [
  {
    href: "#latest-products-title",
    icon: FaFire,
    label: "Novedades",
  },
  {
    href: "#visited-categories-title",
    icon: FaStar,
    label: "Mas visitados",
  },
  {
    href: "#wholesale-packs-title",
    icon: FaTags,
    label: "Packs",
  },
  {
    href: "#",
    icon: FaPercent,
    label: "Ofertas",
  },
];

function getCategoryHref(categorySlug: string) {
  return `/catalogo/${categorySlug}`;
}

function getSubcategoryHref(categorySlug: string, subcategorySlug: string) {
  return `${getCategoryHref(categorySlug)}/${subcategorySlug}`;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

type NavbarProps = {
  categories: CategoryNode[];
};

export function Navbar({ categories }: NavbarProps) {
  const { items } = useCart();
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const isSearching = normalizedSearchQuery.length >= 2;

  const categoryResults = categories.filter((category) =>
    normalizeSearchValue(category.name).includes(normalizedSearchQuery),
  );

  const subcategoryResults = categories.flatMap((category) =>
    category.subcategories
      .filter((subcategory) =>
        normalizeSearchValue(subcategory.name).includes(normalizedSearchQuery),
      )
      .map((subcategory) => ({
        categoryName: category.name,
        categorySlug: category.slug,
        name: subcategory.name,
        slug: subcategory.slug,
      })),
  );

  const [productSearch, setProductSearch] = useState<{ query: string; products: ProductSearchResult[] }>({ query: "", products: [] });
  const productResults = productSearch.query === normalizedSearchQuery ? productSearch.products : [];

  // The catalog is not shipped to the browser; products are searched on the server after a short pause.
  useEffect(() => {
    if (!isSearching) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(normalizedSearchQuery)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { products: [] }))
        .then((data: { products?: ProductSearchResult[] }) => setProductSearch({ query: normalizedSearchQuery, products: data.products ?? [] }))
        .catch(() => {});
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [isSearching, normalizedSearchQuery]);

  const hasSearchResults =
    categoryResults.length > 0 ||
    subcategoryResults.length > 0 ||
    productResults.length > 0;
  const closeMenu = () => {
    setIsMenuOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-background/90 backdrop-blur-md dark:border-white/10">
        <nav
          aria-label="Principal"
          className="mx-auto flex h-20 w-full max-w-6xl items-center px-3 sm:px-5"
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Abrir menu lateral"
              aria-expanded={isMenuOpen}
              aria-controls="main-sidebar"
              onClick={() => setIsMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
            >
              <FaBars aria-hidden="true" className="size-5" />
            </button>

            <Link href="/" className="flex items-center gap-2" aria-label="CRV4 inicio">
              <Image
                src="/icons/crv4-logo-final-192.png"
                alt="Logo CRV4"
                width={48}
                height={48}
                priority
                className="size-12"
              />
              <span className="hidden text-base font-semibold tracking-wide text-foreground/55 min-[420px]:inline">
                Mayorista
              </span>
            </Link>
          </div>
          <AuthMenu />
          <NotificationBell />
          <Link href="/carrito" aria-label={`Carrito, ${cartCount} unidades`} className="ml-2 flex items-center gap-1 text-sm font-bold">Carrito <span className="rounded-full bg-emerald-500 px-2 py-1 text-zinc-950">{cartCount}</span></Link>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-black/35 transition-opacity ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <aside
        id="main-sidebar"
        aria-label="Menu lateral"
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[86vw] flex-col border-r border-black/10 bg-background shadow-xl transition-transform duration-200 dark:border-white/10 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-black/10 px-5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/crv4-logo-final-192.png"
              alt="Logo CRV4"
              width={40}
              height={40}
              className="size-10"
            />
            <span className="font-semibold text-foreground/55">Mayorista</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar menu lateral"
            onClick={closeMenu}
            className="flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-white/10"
          >
            <FaXmark aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <label
            htmlFor="sidebar-search"
            className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-foreground/45"
          >
            Buscar
          </label>
          <div className="flex items-center gap-2 border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950">
            <FaMagnifyingGlass aria-hidden="true" className="size-4 text-foreground/45" />
            <input
              id="sidebar-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Productos o categorias"
              className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
            />
          </div>

          {isSearching ? (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">
                Resultados
              </p>

              {hasSearchResults ? (
                <div className="space-y-5">
                  {categoryResults.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-foreground/45">
                        Categorias
                      </p>
                      <div className="space-y-2">
                        {categoryResults.map((category) => {
                          const Icon = getCategoryIcon(category.iconKey);

                          return (
                            <Link
                              key={category.name}
                              href={getCategoryHref(category.slug)}
                              onClick={closeMenu}
                              className="flex items-center gap-3 border border-black/10 bg-white px-3 py-3 text-sm font-black uppercase tracking-[0.08em] transition-colors hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25"
                            >
                              <Icon aria-hidden="true" className="size-4" />
                              Ver todo {category.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {subcategoryResults.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-foreground/45">
                        Subcategorias
                      </p>
                      <div className="space-y-2">
                        {subcategoryResults.map((subcategory) => (
                          <Link
                            key={`${subcategory.categorySlug}-${subcategory.slug}`}
                            href={getSubcategoryHref(subcategory.categorySlug, subcategory.slug)}
                            onClick={closeMenu}
                            className="block border border-black/10 bg-white px-3 py-3 transition-colors hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25"
                          >
                            <span className="block text-sm font-black uppercase tracking-[0.08em]">
                              {subcategory.name}
                            </span>
                            <span className="mt-1 block text-xs text-foreground/50">
                              {subcategory.categoryName}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {productResults.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-foreground/45">
                        Productos
                      </p>
                      <div className="space-y-2">
                        {productResults.map((product) => (
                          <Link
                            key={product.id}
                            href={product.subcategorySlug
                              ? getSubcategoryHref(product.categorySlug, product.subcategorySlug)
                              : getCategoryHref(product.categorySlug)}
                            onClick={closeMenu}
                            className="block border border-black/10 bg-white px-3 py-3 transition-colors hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25"
                          >
                            <span className="block text-sm font-black uppercase tracking-[0.08em]">
                              {product.name}
                            </span>
                            <span className="mt-1 block text-xs text-foreground/50">
                              {product.subcategory
                                ? `${product.category} / ${product.subcategory}`
                                : product.category}
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-foreground/70">
                              ${(product.offerPrice ?? product.salePrice).toLocaleString("es-AR")}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="border border-black/10 bg-white px-3 py-4 text-sm text-foreground/60 dark:border-white/10 dark:bg-zinc-950">
                  {productSearch.query === normalizedSearchQuery ? "No encontramos resultados." : "Buscando…"}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">
                  Accesos rapidos
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeMenu}
                        className="flex items-center gap-2 border border-black/10 bg-white px-3 py-3 text-xs font-black uppercase tracking-[0.08em] text-foreground transition-colors hover:border-black/25 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/25"
                      >
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-foreground/45">
                  <FaLayerGroup aria-hidden="true" className="size-3.5" />
                  Categorias
                </div>

                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category.iconKey);

                    return (
                      <Link
                        key={category.name}
                        href={getCategoryHref(category.slug)}
                        onClick={closeMenu}
                        className="border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950"
                      >
                        <span className="flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-[0.08em]">
                          <Icon aria-hidden="true" className="size-4" />
                          {category.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-black/10 p-5 dark:border-white/10">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <FaWhatsapp aria-hidden="true" className="size-5" />
            Consultar por WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}
