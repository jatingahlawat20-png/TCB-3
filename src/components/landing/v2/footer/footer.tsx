import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-16 bg-[#080B0F]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:px-8">
        <div>
          <Link href="/" className="text-3xl font-black text-white">
            <span className="text-[#7CFF3B]">TCB</span>-3
          </Link>

          <p className="mt-2 text-sm text-gray-400 max-w-md">
            Human-Led Fitness Coaching Platform. Real certified trainers, structured programs, and direct accountability.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 text-sm font-medium text-gray-300">
          <Link href="/" className="transition hover:text-[#7CFF3B]">
            Home
          </Link>
          <Link href="/trainers" className="transition hover:text-[#7CFF3B]">
            Trainers
          </Link>
          <Link href="/features" className="transition hover:text-[#7CFF3B]">
            Features
          </Link>
          <Link href="/pricing" className="transition hover:text-[#7CFF3B]">
            Pricing
          </Link>
          <Link href="/get-started" className="transition hover:text-[#7CFF3B]">
            Get Started
          </Link>
        </div>

        <p className="text-xs text-gray-500">
          © 2026 TCB-3. All rights reserved.
        </p>
      </div>
    </footer>
  );
}