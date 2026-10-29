import FeaturedLaptops from "./components/FeaturedLaptops";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import PriceRangeLaptops from "./components/PriceRangeLaptops";
import ShopByBrand from "./components/ShopByBrand";
import ShopByUse from "./components/ShopByUse";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ShopByBrand />
        <FeaturedLaptops />
        <ShopByUse />
        <PriceRangeLaptops />
      </main>
    </>
  );
}
