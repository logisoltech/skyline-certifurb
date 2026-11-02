// The CMS is always request-time (session cookie), so skip instant-nav checks.
export const instant = false;

export const metadata = {
  title: { default: "Certifurb CMS", template: "%s | Certifurb CMS" },
  // The admin area must never appear in search results.
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }) {
  return children;
}
