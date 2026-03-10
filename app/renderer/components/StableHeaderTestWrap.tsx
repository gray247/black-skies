import type { ReactNode } from "react";

export function StableHeaderTestWrap({ children }: { children: ReactNode }) {
  return <div data-test-stable-header>{children}</div>;
}
