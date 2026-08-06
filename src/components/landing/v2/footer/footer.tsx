export function Footer() {
  return (
    <footer className="border-t border-white/10 py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div>
          <h2 className="text-3xl font-black text-lime-400">
            TCB-3
          </h2>

          <p className="mt-2 text-gray-500">
            Human Led Coaching Platform
          </p>
        </div>

        <div className="flex gap-8 text-gray-400">
          <a href="#">Home</a>
          <a href="#">Trainers</a>
          <a href="#">Pricing</a>
          <a href="#">Contact</a>
        </div>

        <p className="text-gray-500">
          © 2026 TCB-3
        </p>
      </div>
    </footer>
  );
}