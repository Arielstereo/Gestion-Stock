export default function HomeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl mb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start md:mt-10">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
            <div className="h-5 w-36 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-14 bg-muted rounded-lg animate-pulse" />
          <div className="hidden md:flex flex-col gap-3">
            <div className="h-14 bg-muted rounded-lg animate-pulse" />
            <div className="h-14 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Columna derecha — card */}
        <div className="border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="h-12 bg-blue-200 animate-pulse mx-3 mt-3 rounded-md" />
          <div className="mx-4 mt-3 h-8 bg-muted rounded-md animate-pulse" />
          <div className="p-4 grid grid-cols-2 gap-x-6 mt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div
                  className="h-4 bg-muted rounded animate-pulse"
                  style={{ width: `${80 + (i % 3) * 25}px` }}
                />
                <div className="h-4 w-8 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
