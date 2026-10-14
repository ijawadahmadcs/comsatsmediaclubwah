import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Unknown URLs render outside the (site) route group, so include the public navbar and footer here.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] items-center justify-center bg-[#08090b] px-5 pt-28 text-white">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Page not found.</h1>
          <p className="mt-4 text-sm text-white/45">The page you are looking for does not exist or has moved.</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
