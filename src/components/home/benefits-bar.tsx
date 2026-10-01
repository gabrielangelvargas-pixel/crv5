import { FaBoxesStacked, FaTruckFast, FaUserCheck, FaWallet } from "react-icons/fa6";

const benefits = [
  {
    icon: FaBoxesStacked,
    title: "Compra mayorista",
    description: "Inversión de $70.000 acumulable en varios pedidos.",
  },
  {
    icon: FaUserCheck,
    title: "Asesoramiento",
    description: "Te guiamos en cada pedido.",
  },
  {
    icon: FaWallet,
    title: "Medios de pago",
    description: "Tarjetas, transferencia y efectivo.",
  },
  {
    icon: FaTruckFast,
    title: "Envios al pais",
    description: "Despachos rapidos y seguros.",
  },
];

export function BenefitsBar() {
  return (
    <section
      aria-label="Beneficios de compra"
      className="border-b border-black/15 bg-white text-zinc-950"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-6 py-6 lg:grid-cols-4 lg:gap-6 lg:py-7">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <article key={benefit.title} className="flex items-start gap-3 lg:gap-4">
              <Icon
                aria-hidden="true"
                className="mt-1 size-7 shrink-0 text-zinc-950 lg:size-9"
              />
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.08em] sm:text-sm lg:tracking-[0.12em]">
                  {benefit.title}
                </h2>
                <p className="mt-1 max-w-[14rem] text-xs leading-5 text-zinc-700 sm:text-sm">
                  {benefit.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
