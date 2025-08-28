import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost";
  }
>;

export function Button({ children, className = "", variant = "primary", ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center text-sm font-medium transition-colors";
  const shape = "rounded-[var(--radius-md)] px-4 py-2";
  const primary =
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90";
  const ghost =
    "border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10";
  const variantClass = variant === "primary" ? primary : ghost;
  return (
    <button className={`${base} ${shape} ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
