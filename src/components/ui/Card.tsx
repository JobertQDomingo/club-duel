import type { ReactNode } from "react";

/** A sheet panel on the wall. Never nest cards. */
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
    <section className={`bg-sheet p-4 ${className}`}>
      {title && (
        <header className="mb-3 flex items-baseline justify-between gap-3 border-b border-ink pb-2">
          <h2 className="font-display text-2xl font-bold uppercase leading-none">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
