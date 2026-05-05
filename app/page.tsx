"use client";

import dynamic from "next/dynamic";
import { APPLE_DEVELOPER_TOKEN } from "@/utils/constants/api";

// Skip SSR/SSG: Ipod uses MusicKit JS which touches `window` during render.
const Ipod = dynamic(
  () => import("@/components/Ipod").then((m) => m.Ipod),
  { ssr: false }
);

export default function Page() {
  const appleAccessToken = APPLE_DEVELOPER_TOKEN ?? "";

  return <Ipod appleAccessToken={appleAccessToken} />;
}
