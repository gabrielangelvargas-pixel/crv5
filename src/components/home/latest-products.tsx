import Image from "next/image";
import { FaBoxOpen } from "react-icons/fa6";
import { getLatestProducts } from "@/lib/products-repository";

export async function LatestProducts() {
  const products = await getLatestProducts();

  return (
    <section aria-labelledby="latest-products-title" className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Novedades
          </p>
          <h2
            id="latest-products-title"
            className="mt-1.5 text-xl font-black uppercase tracking-[0.04em] text-zinc-950 sm:text-2xl"
          >
            Ultimos ingresos
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((product) => (
            (() => {
              const hasOffer =
                product.offerPrice !== null && product.offerPrice < product.salePrice;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden border border-black/10 bg-background text-zinc-950"
                >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-100 text-zinc-950">
                {hasOffer ? (
                  <span className="absolute left-2 top-2 z-10 bg-red-600 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-white">
                    OFF
                  </span>
                ) : null}
                {product.imageSrc ? (
                  <Image
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <FaBoxOpen aria-hidden="true" className="size-7" />
                )}
              </div>
              <div className="px-3 py-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {product.subcategory
                    ? `${product.category} / ${product.subcategory}`
                    : product.category}
                </p>
                <h3 className="mt-1 text-sm font-black uppercase tracking-[0.06em]">
                  {product.name}
                </h3>
                {product.description ? (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {product.description}
                  </p>
                ) : null}
                {hasOffer ? (
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xs text-zinc-400 line-through">
                      ${product.salePrice.toLocaleString("es-AR")}
                    </span>
                    <span className="text-sm font-black text-red-600">
                      ${product.offerPrice?.toLocaleString("es-AR")}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-zinc-700">
                    ${product.salePrice.toLocaleString("es-AR")}
                  </p>
                )}
              </div>
                </article>
              );
            })()
          ))}
        </div>
      </div>
    </section>
  );
}
