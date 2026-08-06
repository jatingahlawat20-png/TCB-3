import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-xl px-6 py-3 font-semibold transition-all duration-300",
        variant === "primary"
          ? "bg-[var(--primary)] text-black hover:scale-105"
          : "bg-[var(--bg-card)] text-white border border-[var(--border)] hover:bg-[var(--bg-card-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}