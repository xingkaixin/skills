"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Direction = "forward" | "back";

const NavDirectionContext = createContext<Direction>("forward");

export function useNavDirection(): Direction {
  return useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ direction: Direction; prev: string }>({
    direction: "forward",
    prev: pathname,
  });

  if (state.prev !== pathname) {
    const prevDepth = state.prev.split("/").filter(Boolean).length;
    const currDepth = pathname.split("/").filter(Boolean).length;
    setState({
      direction: currDepth >= prevDepth ? "forward" : "back",
      prev: pathname,
    });
  }

  return (
    <NavDirectionContext.Provider value={state.direction}>
      {children}
    </NavDirectionContext.Provider>
  );
}
