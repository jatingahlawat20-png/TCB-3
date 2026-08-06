import type { Metadata } from "next";
import { LandingPageV2 } from "@/components/landing/v2/landing-page";

export const metadata: Metadata = {
  title: "TCB-3",
  description: "Human-led coaching platform",
};

export default function HomePage() {
  return <LandingPageV2 />;
}