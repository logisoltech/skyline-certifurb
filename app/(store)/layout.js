import CatalogProvider from "../components/CatalogProvider";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getCatalog } from "../lib/catalog";

// The storefront chrome. The live catalogue (edited in the CMS) is read once
// here on the server and shared with client components through context.
export default async function StoreLayout({ children }) {
  const products = await getCatalog();

  return (
    <CatalogProvider products={products}>
      <Navbar />
      {children}
      <Footer />
    </CatalogProvider>
  );
}
