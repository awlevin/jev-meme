import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-black hover:brightness-105 disabled:bg-surface-2 disabled:text-muted disabled:opacity-100",
  secondary: "bg-surface-2 text-text hover:bg-line",
  ghost: "text-muted hover:text-text",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-13 px-6 text-base",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type Common = { variant?: Variant; size?: Size; children: ReactNode };

export function Button({ variant, size, className = "", ...props }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ variant, size, className = "", ...props }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={buttonClass(variant, size, className)} {...props} />;
}
