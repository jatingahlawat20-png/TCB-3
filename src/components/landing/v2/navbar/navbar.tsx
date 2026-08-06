import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B0F]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="text-3xl font-black text-white">
          <span className="text-[#7CFF3B]">TCB</span>-3
        </Link>

        <nav className="hidden md:flex gap-8">
          <Link href="/">Home</Link>
          <Link href="/">Trainers</Link>
          <Link href="/">Features</Link>
          <Link href="/">Pricing</Link>
        </nav>

        <button className="rounded-xl bg-[#7CFF3B] px-5 py-2 font-semibold text-black">
          Get Started
        </button>
      </div>
    </header>
  );
}