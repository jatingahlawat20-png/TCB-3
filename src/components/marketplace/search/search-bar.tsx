export function SearchBar() {
  return (
    <div className="mx-auto mt-10 max-w-4xl px-6">
      <input
        placeholder="Search trainers..."
        className="w-full rounded-2xl border border-white/10 bg-[#11161d] p-5 text-white outline-none focus:border-lime-400"
      />
    </div>
  );
}