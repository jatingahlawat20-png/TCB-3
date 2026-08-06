export function PublicShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080B0F]">
      {children}
    </div>
  );
}