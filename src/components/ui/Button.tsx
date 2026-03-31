import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  danger:    "bg-red-50 text-red-600 hover:bg-red-100",
  ghost:     "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
