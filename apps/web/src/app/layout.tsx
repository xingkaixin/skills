import type { ReactNode } from "react";
import { NavDirectionProvider } from "./nav-direction";
import { ScrollRestoration } from "./scroll-restoration";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="font-sans min-h-screen">
      <NavDirectionProvider>
        <ScrollRestoration />
        {children}
      </NavDirectionProvider>
    </div>
  );
}
