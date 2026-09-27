import { FaArrowRight, FaBoxesPacking } from "react-icons/fa6";

const packs = [
  {
    name: "Pack Bijou",
    detail: "Seleccion inicial para reventa.",
  },
  {
    name: "Pack Piercing",
    detail: "Modelos surtidos de alta rotacion.",
  },
  {
    name: "Pack Accesorios",
    detail: "Mix variado para completar stock.",
  },
];

export function WholesalePacks() {
  return (
    <section aria-labelledby="wholesale-packs-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/45">
            Para revender
          </p>
          <h2
            id="wholesale-packs-title"
            className="mt-1.5 text-xl font-black uppercase tracking-[0.04em] text-foreground sm:text-2xl"
          >
            Packs mayoristas
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {packs.map((pack) => (
            <article
              key={pack.name}
              className="flex items-center justify-between gap-4 border border-black/10 bg-white p-4 text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50">
                  <FaBoxesPacking aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.08em]">
                    {pack.name}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-zinc-700 dark:text-zinc-300">
                    {pack.detail}
                  </p>
                </div>
              </div>
              <FaArrowRight aria-hidden="true" className="size-4 shrink-0 opacity-45" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
