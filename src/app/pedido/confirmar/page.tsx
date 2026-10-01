import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderContact } from "@/lib/orders-repository";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const dynamic = "force-dynamic";
export default async function ConfirmOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/pedido/confirmar");
  const contact = await getOrderContact(user.id);
  return <main className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-2xl font-black uppercase">Confirmar pedido</h1><CheckoutForm contact={contact} /></main>;
}
