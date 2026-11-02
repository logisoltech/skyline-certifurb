"use client";

import { createContext, useContext } from "react";

const CatalogContext = createContext([]);

// Holds the published catalogue for client components (collection filters,
// cart, wishlist, price tabs). Server components call getCatalog() directly.
export default function CatalogProvider({ products, children }) {
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
