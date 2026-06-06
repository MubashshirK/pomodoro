"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

const MIN_LOADER_MS = 250;

export function PageContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showLoader, setShowLoader] = useState(true);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowLoader(true);
    const timer = setTimeout(() => setShowLoader(false), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="relative h-full">
      <div
        className={`flex h-full flex-col transition-opacity duration-200 ${
          showLoader ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
      <div
        aria-hidden={!showLoader}
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background transition-opacity duration-200 ${
          showLoader ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
