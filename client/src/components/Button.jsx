import { cn } from "../lib/cn.js";

const variants = {
  primary:
    "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-inset ring-white/10",
  ghost:
    "bg-white/5 hover:bg-white/10 text-slate-200 ring-1 ring-inset ring-white/10",
  subtle: "bg-transparent hover:bg-white/5 text-slate-300",
  danger:
    "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
