import type { ReactNode } from "react";

/** A white panel on the page ground. Never nest cards. */
export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-card p-4 sm:p-5 ${className}`}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold leading-tight tracking-tight">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
