import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyAlbumDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
  }
  redirect(`/povestea-magica/livrare${query.size ? `?${query.toString()}` : ""}`);
}
