import { HeroSection } from "@/components/landing/hero-section";
import { Partners } from "@/components/landing/partners";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { SiteHeader } from "@/components/site-header";
import { AdvertisementDisplay } from "@/components/advertisements/advertisement-display";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://escrow.cmigl.org/#organization",
      name: "CMIGL Escrow Services",
      url: "https://escrow.cmigl.org",
      email: "info@cmigl.org",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Suite 017 Apple Court Plaza, Nyanya",
        addressLocality: "Abuja",
        addressRegion: "FCT",
        addressCountry: "NG",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://escrow.cmigl.org/#website",
      url: "https://escrow.cmigl.org",
      name: "CMIGL Escrow Services",
      publisher: {
        "@id": "https://escrow.cmigl.org/#organization",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <Partners />
        <div className="container mx-auto px-5 empty:hidden">
          <AdvertisementDisplay placement="HOMEPAGE" />
        </div>
        <HowItWorks />
        <Features />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
      {/* Popup ads are rendered here but will appear based on their own timing */}
      <AdvertisementDisplay placement="HOMEPAGE" />
    </div>
  );
}
