import type { ReactNode } from "react";

type Variant = "error" | "success" | "warning" | "info";

const roleByVariant: Record<Variant, "alert" | "status"> = {
  error: "alert",
  success: "status",
  warning: "alert",
  info: "status",
};

export function Alert({ variant, children, title }: { variant: Variant; children: ReactNode; title?: string }) {
  return (
    <div className={`alert alert-${variant}`} role={roleByVariant[variant]} aria-live={variant === "error" ? "assertive" : "polite"}>
      {title ? <strong className="alertTitle">{title}</strong> : null}
      <div className="alertBody">{children}</div>
    </div>
  );
}
