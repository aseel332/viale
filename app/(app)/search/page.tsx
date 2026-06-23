import { getStorefrontProducts } from "@/lib/catalog";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const products = await getStorefrontProducts();
  return <SearchClient products={products} />;
}
