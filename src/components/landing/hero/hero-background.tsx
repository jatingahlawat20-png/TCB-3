export function HeroBackground() {
  return (
    <>
      {/* Main background */}
      <div className="absolute inset-0 -z-30 overflow-hidden bg-[#080b0f]" />

      {/* Orange glow */}
      <div className="hero-glow" />

      {/* Secondary glow */}
      <div className="absolute left-[-250px] bottom-[-250px] h-[650px] w-[650px] rounded-full bg-[#C96A1A]/10 blur-[140px] -z-20" />

      {/* Grid overlay */}
      <div className="hero-grid absolute inset-0 -z-10 opacity-60" />

      {/* Radial vignette */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
    </>
  );
}