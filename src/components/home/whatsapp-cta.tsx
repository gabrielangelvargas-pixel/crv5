import { FaWhatsapp } from "react-icons/fa6";

export function WhatsappCta() {
  return (
    <section aria-labelledby="whatsapp-cta-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <div className="border border-black/10 bg-zinc-950 px-5 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
              Asesoramiento
            </p>
            <h2
              id="whatsapp-cta-title"
              className="mt-2 text-xl font-black uppercase tracking-[0.04em] sm:text-2xl"
            >
              Necesitas ayuda para armar tu pedido?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Escribinos y te orientamos con productos, packs y condiciones mayoristas.
            </p>
          </div>

          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-emerald-500 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-zinc-950 transition-colors hover:bg-emerald-400 sm:mt-0 sm:w-auto"
          >
            <FaWhatsapp aria-hidden="true" className="size-5" />
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
