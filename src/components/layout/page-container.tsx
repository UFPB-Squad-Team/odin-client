import type { PropsWithChildren } from "react";

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({
  className = "",
  children,
}: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
