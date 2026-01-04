"use client";

import { ReactNode } from "react";
import { BehaviorTrackerProvider } from "./BehaviorTrackerProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <BehaviorTrackerProvider>
      {children}
    </BehaviorTrackerProvider>
  );
}

