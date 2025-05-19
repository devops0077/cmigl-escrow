import { HeroSection } from "@/components/landing/hero-section";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";
import { SiteHeader } from "@/components/site-header";
import { AdvertisementDisplay } from "@/components/advertisements/advertisement-display";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <div className="container mx-auto my-8">
          {/* <motion.div
            className="container mx-auto my-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          > */}
          <AdvertisementDisplay placement="HOMEPAGE" />
          {/* </motion.div> */}
        </div>
        <Features />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
      {/* Popup ads are rendered here but will appear based on their own timing */}
      <AdvertisementDisplay placement="HOMEPAGE" />
    </div>
  );
}
