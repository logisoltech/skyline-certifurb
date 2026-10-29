import CustomerReviews from "./components/CustomerReviews";
import FeaturedLaptops from "./components/FeaturedLaptops";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import PriceRangeLaptops from "./components/PriceRangeLaptops";
import RenewedMeans from "./components/RenewedMeans";
import ShopByBrand from "./components/ShopByBrand";
import ShopByUse from "./components/ShopByUse";
import WhyBuy from "./components/WhyBuy";
import WhyRenewed from "./components/WhyRenewed";

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
        <CustomerReviews />
        <WhyBuy />
        <RenewedMeans />
        <WhyRenewed />
      </main>
      <Footer />
    </>
  );
}
