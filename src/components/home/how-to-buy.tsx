const steps = [
  {
    number: "01",
    title: "Elegi productos",
  },
  {
    number: "02",
    title: "Arma tu pedido",
  },
  {
    number: "03",
    title: "Coordinamos pago y envio",
  },
];

export function HowToBuy() {
  return (
    <section aria-labelledby="how-to-buy-title" className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Compra simple
          </p>
          <h2
            id="how-to-buy-title"
            className="mt-1.5 text-xl font-black uppercase tracking-[0.04em] text-zinc-950 sm:text-2xl"
          >
            Como comprar
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="border border-black/10 p-4">
              <p className="text-sm font-black text-emerald-700">{step.number}</p>
              <h3 className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-zinc-950">
                {step.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
