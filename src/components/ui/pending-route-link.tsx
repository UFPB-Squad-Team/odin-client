"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";

type PendingRouteLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  id?: string;
  replace?: boolean;
  loadingVariant?: "inline" | "corner" | "none";
};

export function PendingRouteLink({
  href,
  children,
  className,
  ariaLabel,
  id,
  replace = false,
  loadingVariant = "inline",
}: PendingRouteLinkProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (isPending) return;

    setIsPending(true);
    window.requestAnimationFrame(() => {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  };

  return (
    <Link
      id={id}
      href={href}
      aria-label={ariaLabel}
      aria-busy={isPending}
      onClick={handleClick}
      className={`relative ${className ?? ""}`}
    >
      {loadingVariant === "inline" ? (
        <span className="inline-flex items-center gap-2">
          {isPending && (
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
          <span>{children}</span>
        </span>
      ) : loadingVariant === "corner" ? (
        <>
          {children}
          {isPending && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
        </>
      ) : (
        <>{children}</>
      )}
    </Link>
  );
}