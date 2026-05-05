import { Ipod } from "@/components/Ipod";
import { APPLE_DEVELOPER_TOKEN } from "@/utils/constants/api";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Awaiting searchParams keeps this route dynamic (avoids static prerender that would touch `window`).
  // P1-C will switch to `output: 'export'` and move client-only init into useEffect.
  await searchParams;

  const appleAccessToken = APPLE_DEVELOPER_TOKEN ?? "";

  return <Ipod appleAccessToken={appleAccessToken} />;
}
