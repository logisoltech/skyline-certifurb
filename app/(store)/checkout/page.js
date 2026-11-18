import CheckoutView from "../../components/cart/CheckoutView";

export const metadata = {
  title: "Checkout | Certifurb",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <main className="flex-1 bg-brand-50/40">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-extrabold text-brand-950 sm:text-3xl">Checkout</h1>
        <CheckoutView />
      </div>
    </main>
  );
}
