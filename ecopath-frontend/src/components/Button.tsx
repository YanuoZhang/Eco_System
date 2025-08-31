import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "outline";
  }
>;

export function Button({ children, className = "", variant = "primary", ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const shape = "rounded-md px-4 py-2";

  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <button className={`${base} ${shape} ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
