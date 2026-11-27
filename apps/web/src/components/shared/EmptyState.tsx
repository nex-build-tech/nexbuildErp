import React from "react";
import { FolderOpenIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";

interface EmptyStateProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpenIcon,
  title,
  description,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-900/30 flex flex-col items-center justify-center ${className}`}>
      <div className="size-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-[#c5a04e] mb-3">
        <Icon className="size-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-dark-100 mb-1">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-dark-400 max-w-sm mb-4">
        {description}
      </p>
      {actionText && onAction && (
        <Button
          color="primary"
          onClick={onAction}
          className="px-4 py-2 text-xs font-bold rounded-xl shadow-md shadow-primary-500/20"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
