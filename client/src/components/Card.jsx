import { cn } from "../lib/cn.js";

export function Card({ className, children }) {
  return (
    <div className={cn("glass rounded-2xl", className)}>{children}</div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("border-b border-white/5 px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
