import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "px-4 bg-ink text-sheet hover:bg-ink/85",
  secondary: "px-4 bg-sheet text-ink border border-ink hover:bg-wall",
  ghost: "text-ink underline hover:text-ink-soft",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 font-display text-base font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:border disabled:border-ink/30 disabled:bg-sheet disabled:text-ink/40 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
