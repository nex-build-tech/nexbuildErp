/**
 * FormModal – A standardised, enterprise-grade modal shell and form inputs for all Realty forms.
 */
import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface FormModalProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const widths = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

export function FormModal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  maxWidth = "md",
}: FormModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${widths[maxWidth]} max-h-[92vh] flex flex-col rounded-2xl shadow-2xl bg-white dark:bg-dark-750 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-dark-100 overflow-hidden my-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-800/50 shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/40 shrink-0">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-dark-300 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * FormSection – Groups related fields with an optional divider label.
 */
export function FormSection({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center gap-2 pt-1 pb-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
            {label}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * FormField – Wrapper providing consistent label, required asterisk, and optional hint.
 */
export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = "",
}: {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 dark:text-dark-200 mb-1.5 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-400 dark:text-dark-300 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * FormInput – Crisp enterprise input field.
 */
export const FormInput = React.forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean; error?: string }
>(({ label, required, error, className = "", ...props }, ref) => {
  const inputEl = (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-800 px-3.5 py-2 text-sm text-gray-900 dark:text-dark-100 placeholder:text-gray-400 dark:placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all disabled:bg-gray-100 dark:disabled:bg-dark-700 disabled:opacity-60 ${
        error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
      } ${className}`}
      {...props}
    />
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        {inputEl}
      </FormField>
    );
  }
  return inputEl;
});
FormInput.displayName = "FormInput";

/**
 * FormSelect – Crisp enterprise select dropdown with styled chevron.
 */
export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    required?: boolean;
    error?: string;
    options?: Array<{ label: string; value: string | number }>;
  }
>(({ label, required, error, options, children, className = "", ...props }, ref) => {
  const selectEl = (
    <div className="relative">
      <select
        ref={ref}
        className={`w-full appearance-none rounded-xl border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-800 px-3.5 py-2 pr-9 text-sm text-gray-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all cursor-pointer disabled:bg-gray-100 dark:disabled:bg-dark-700 disabled:opacity-60 ${
          error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
        } ${className}`}
        {...props}
      >
        {options ? (
          options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100">
              {opt.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-dark-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        {selectEl}
      </FormField>
    );
  }
  return selectEl;
});
FormSelect.displayName = "FormSelect";

/**
 * FormTextarea – Crisp enterprise textarea.
 */
export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; required?: boolean; error?: string }
>(({ label, required, error, className = "", ...props }, ref) => {
  const textareaEl = (
    <textarea
      ref={ref}
      className={`w-full rounded-xl border border-gray-300 dark:border-dark-500 bg-white dark:bg-dark-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-dark-100 placeholder:text-gray-400 dark:placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 transition-all resize-y ${
        error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
      } ${className}`}
      {...props}
    />
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error}>
        {textareaEl}
      </FormField>
    );
  }
  return textareaEl;
});
FormTextarea.displayName = "FormTextarea";

/**
 * FormActions – Standard footer row with cancel + submit.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-gray-200 dark:border-dark-600">
      {children}
    </div>
  );
}

/**
 * InfoRow – Read-only display inside a form.
 */
export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-gray-500 dark:text-dark-300 font-medium">{label}:</span>
      <span className="font-semibold text-gray-900 dark:text-dark-100">{value}</span>
    </div>
  );
}
