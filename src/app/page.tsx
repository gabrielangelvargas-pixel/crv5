import { BenefitsBar } from "@/components/home/benefits-bar";
import { HowToBuy } from "@/components/home/how-to-buy";
import { HeroSlider } from "@/components/home/hero-slider";
import { LatestProducts } from "@/components/home/latest-products";
import { VisitedCategories } from "@/components/home/visited-categories";
import { WhatsappCta } from "@/components/home/whatsapp-cta";
import { WholesalePacks } from "@/components/home/wholesale-packs";
import { getMostVisitedCategories } from "@/lib/categories-repository";

export default async function Home() {
  const categories = await getMostVisitedCategories();

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background text-foreground">
      <HeroSlider />
      <BenefitsBar />
      <VisitedCategories categories={categories} />
      <LatestProducts />
      <WholesalePacks />
      <HowToBuy />
      <WhatsappCta />
    </main>
  );
}
