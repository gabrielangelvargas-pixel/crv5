import { getLatestProducts } from "@/lib/products-repository";
import { ProductGroupCard } from "@/components/products/product-group-card";
import { groupProducts } from "@/lib/product-groups";

export async function LatestProducts() {
  const products = await getLatestProducts();
  const productGroups = groupProducts(products);

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
          {productGroups.map((productGroup) => (
            <ProductGroupCard key={productGroup.id} productGroup={productGroup} />
          ))}
        </div>
      </div>
    </section>
  );
}
