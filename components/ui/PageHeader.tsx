import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: Props) {
  return (
    <header className="pageHeader">
      <div className="pageHeaderText">
        <h1>{title}</h1>
        {description ? <p className="pageHeaderDesc">{description}</p> : null}
      </div>
      {children ? <div className="pageHeaderActions">{children}</div> : null}
    </header>
  );
}
