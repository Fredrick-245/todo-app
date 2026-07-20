export function AppShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-slate-50">
      <div
        className={`flex h-full w-full max-w-lg flex-col overflow-hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
