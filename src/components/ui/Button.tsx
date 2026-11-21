import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "px-4 bg-ink text-white hover:bg-ink/85",
  secondary: "px-4 bg-card text-ink border border-line hover:border-ink/25 hover:bg-page",
  ghost: "px-3 text-ink-soft hover:bg-ink/5 hover:text-ink",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-[0.9375rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
