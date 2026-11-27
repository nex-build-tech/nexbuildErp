interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full animate-pulse p-4 space-y-3">
      {/* Table Header placeholder */}
      <div className="h-9 bg-slate-100 dark:bg-dark-750 rounded-lg flex items-center gap-4 px-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-slate-200 dark:bg-dark-700 rounded-sm"
            style={{ width: `${Math.floor(100 / columns)}%` }}
          />
        ))}
      </div>

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="h-12 bg-white dark:bg-dark-800 rounded-lg border border-slate-100 dark:border-dark-750 flex items-center gap-4 px-4 shadow-2xs"
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-3 bg-slate-100 dark:bg-dark-700 rounded-sm"
              style={{
                width: cIdx === 0 ? "70%" : cIdx === 1 ? "90%" : "60%",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
