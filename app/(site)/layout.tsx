import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Public site chrome. The admin and Team Lead portals sit outside this route group,
// so they do not render the public navbar and footer.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
