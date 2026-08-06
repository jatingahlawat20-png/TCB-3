import { AudienceSection } from "@/components/landing/audience-section";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TrustSection } from "@/components/landing/trust-section";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AudienceSection />
      <TrustSection />
      <CtaSection />
    </>
  );
}