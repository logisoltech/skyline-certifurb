import Link from "next/link";
import { ChatIcon, MapPinIcon, PhoneIcon } from "./Icons";
import NewsletterForm from "./NewsletterForm";

const PHONE = "+971 6 533 3033";
const WHATSAPP = "+971 56 689 5605";

const BRAND_LINKS = [
  { label: "HP", href: "/laptops?brand=hp" },
  { label: "Dell", href: "/laptops?brand=dell" },
  { label: "Lenovo", href: "/laptops?brand=lenovo" },
  { label: "Microsoft Surface", href: "/laptops?brand=microsoft" },
  { label: "MacBook", href: "/laptops?brand=apple" },
];

const BUDGET_LINKS = [
  { label: "AED 899–999", href: "/laptops?price=899-999" },
  { label: "AED 1,000–1,499", href: "/laptops?price=1000-1499" },
  { label: "AED 1,500–2,499", href: "/laptops?price=1500-2499" },
  { label: "AED 2,500+", href: "/laptops?price=2500-plus" },
  { label: "View all laptops", href: "/laptops" },
];

const SUPPORT_LINKS = [
  { label: "Contact us", href: "/contact" },
  { label: "Visit our store", href: "/store" },
  { label: "Delivery, payments & FAQs", href: "/faqs" },
  { label: "Warranty & returns", href: "/warranty-returns" },
  { label: "Delivery information", href: "/delivery" },
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms of service", href: "/terms" },
];

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-bold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link
              href={href}
              className="text-[13px] text-white/65 transition hover:text-brand-300"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#04180d] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Help CTA */}
        <div className="flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
              We&apos;re here to help
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Need help choosing a laptop?
            </h2>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/65">
              Tell us your budget and usage. Our team will suggest the right
              renewed laptop.
            </p>
          </div>
          <a
            href={`tel:${PHONE.replace(/\s/g, "")}`}
            className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/20 px-6 text-xs font-bold text-white transition hover:border-brand-400 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          >
            <PhoneIcon width={15} height={15} className="text-brand-400" />
            Call {PHONE}
          </a>
        </div>

        <hr className="border-white/10" />

        {/* Newsletter */}
        <div className="flex flex-col items-start justify-between gap-6 py-9 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
              Fresh stock, useful deals
            </p>
            <h2 className="mt-2 text-lg font-extrabold tracking-tight">
              Get new arrivals by email.
            </h2>
            <p className="mt-1.5 text-xs text-white/65">
              No noise—just noteworthy laptops and offers.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <hr className="border-white/10" />

        {/* Link columns */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Certifurb
            </h2>
            <p className="mt-5 max-w-[14rem] text-[13px] leading-relaxed text-white/65">
              Premium renewed laptops, professionally checked and supported in
              the UAE.
            </p>

            <ul className="mt-5 space-y-3 text-[13px]">
              <li className="flex items-start gap-2.5 text-white/80">
                <MapPinIcon
                  width={15}
                  height={15}
                  className="mt-0.5 shrink-0 text-brand-400"
                />
                Second Industrial Street, Industrial Area 6, Sharjah
              </li>
              <li>
                <a
                  href={`tel:${PHONE.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-white/80 transition hover:text-brand-300"
                >
                  <PhoneIcon
                    width={15}
                    height={15}
                    className="shrink-0 text-brand-400"
                  />
                  {PHONE}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 font-bold text-brand-400 transition hover:text-brand-300"
                >
                  <ChatIcon width={15} height={15} className="shrink-0" />
                  WhatsApp {WHATSAPP}
                </a>
              </li>
            </ul>
          </div>

          <LinkColumn title="Shop by Brand" links={BRAND_LINKS} />
          <LinkColumn title="Shop by Budget" links={BUDGET_LINKS} />
          <LinkColumn title="Support" links={SUPPORT_LINKS} />
        </div>
      </div>
    </footer>
  );
}
