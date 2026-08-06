export function HeroVisuals() {
  return (
    <div className="relative z-10 flex items-center justify-center">
      <div className="relative w-full max-w-lg">

        {/* Main Card */}
        <div className="rounded-[32px] border border-white/10 bg-[#11161d]/80 p-8 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.55)]">

          <div className="mb-6 flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7CFF3B] text-2xl font-bold text-black">
              TC
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Thomas Carter
              </h3>

              <p className="text-sm text-gray-400">
                Strength & Transformation Coach
              </p>
            </div>

          </div>

          <div className="space-y-4">

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-gray-400">
                Active Clients
              </p>

              <p className="mt-1 text-3xl font-black text-[#7CFF3B]">
                248
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-gray-400">
                Monthly Success Rate
              </p>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-[#7CFF3B]" />
              </div>

              <p className="mt-2 text-right text-sm text-white">
                92%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-gray-400">
                  Experience
                </p>

                <p className="mt-2 text-xl font-bold text-white">
                  8 Years
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-gray-400">
                  Rating
                </p>

                <p className="mt-2 text-xl font-bold text-[#7CFF3B]">
                  ★ 4.9
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Floating Badge */}

        <div className="absolute -left-8 top-10 rounded-2xl border border-white/10 bg-[#11161d]/90 px-5 py-3 backdrop-blur-xl shadow-xl">

          <p className="text-sm text-gray-400">
            Verified Trainer
          </p>

          <p className="font-bold text-[#7CFF3B]">
            ✓ Approved
          </p>

        </div>

        {/* Floating Badge */}

        <div className="absolute -right-6 bottom-10 rounded-2xl border border-white/10 bg-[#11161d]/90 px-5 py-3 backdrop-blur-xl shadow-xl">

          <p className="text-sm text-gray-400">
            Clients Online
          </p>

          <p className="font-bold text-white">
            31
          </p>

        </div>

      </div>
    </div>
  );
}