import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="emptyState">
      <h2 className="emptyStateTitle">{title}</h2>
      {description ? <p className="emptyStateDesc">{description}</p> : null}
      {action ? <div className="emptyStateAction">{action}</div> : null}
    </div>
  );
}
