import { BuildingOfficeIcon } from "@heroicons/react/24/outline";

interface Props {
  title: string;
  description?: string;
  comingSoon?: boolean;
}

export default function RealtyPlaceholder({ title, description, comingSoon }: Props) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <div className="bg-primary-50 dark:bg-primary-900/20 flex size-20 items-center justify-center rounded-full">
        <BuildingOfficeIcon className="text-primary-600 dark:text-primary-400 size-10" />
      </div>
      <div className="text-center">
        <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-semibold">{title}</h2>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{description}</p>
        )}
        {comingSoon && (
          <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
            Coming Soon — Q1 2027
          </span>
        )}
      </div>
      <p className="border-primary-200 dark:border-primary-800 rounded-lg border border-dashed p-4 text-center text-xs text-gray-400">
        This module is under active development (Phase R{comingSoon ? "8" : "2–7"}).
      </p>
    </div>
  );
}
