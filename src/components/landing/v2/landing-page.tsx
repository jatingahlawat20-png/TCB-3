import { Navbar } from "./navbar/navbar";
import { Hero } from "./hero/hero";
import { FeaturedTrainers } from "./featured-trainers/featured-trainers";
import { Categories } from "./categories/categories";
import { Features } from "./features/features";
import { Stats } from "./stats/stats";
import { Testimonials } from "./testimonials/testimonials";
import { Footer } from "./footer/footer";

export function LandingPageV2() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedTrainers />
      <Categories />
      <Features />
      <Stats />
      <Testimonials />
      <Footer />
    </>
  );
}