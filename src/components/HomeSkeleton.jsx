export default function HomeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-32">
      {/* Título */}
      <div className="text-center my-8 space-y-3">
        <div className="h-9 w-72 bg-muted rounded-md animate-pulse mx-auto" />
        <div className="h-5 w-44 bg-muted rounded-md animate-pulse mx-auto" />
      </div>

      {/* Card skeleton */}
      <div className="my-8 md:my-16 border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header azul */}
        <div className="h-12 bg-blue-200 animate-pulse mx-3 mt-3 rounded-md" />
        {/* Pill fecha */}
        <div className="mx-4 mt-3 h-8 bg-muted rounded-md animate-pulse" />
        {/* Filas en 2 columnas desktop */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 md:gap-x-6 mt-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div
                className="h-4 bg-muted rounded animate-pulse"
                style={{ width: `${100 + (i % 4) * 25}px` }}
              />
              <div className="h-7 w-12 bg-muted rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
