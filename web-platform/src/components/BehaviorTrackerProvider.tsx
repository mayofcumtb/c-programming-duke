"use client";

import { usePathname } from "next/navigation";
import { useBehaviorTracker, BehaviorEventType } from "@/hooks/useBehaviorTracker";
import { createContext, useContext, ReactNode } from "react";

// 追踪器上下文
interface TrackerContextValue {
  trackEvent: (type: BehaviorEventType, data?: Record<string, unknown>) => void;
  getStats: () => { session: Record<string, unknown>; page: Record<string, unknown> };
  flush: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

// 使用追踪器的 Hook
export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) {
    // 返回空操作，避免在服务端渲染时出错
    return {
      trackEvent: () => {},
      getStats: () => ({ session: {}, page: {} }),
      flush: async () => {},
    };
  }
  return context;
}

// 追踪器提供者
export function BehaviorTrackerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // 从路径提取题目 ID
  const problemId = pathname?.startsWith("/ide/") 
    ? pathname.split("/")[2] 
    : undefined;

  const tracker = useBehaviorTracker({
    pagePath: pathname || "/",
    problemId,
    idleTimeout: 60000,     // 1分钟无操作算空闲
    reportInterval: 30000,  // 每30秒上报
  });

  return (
    <TrackerContext.Provider value={tracker}>
      {children}
    </TrackerContext.Provider>
  );
}

export default BehaviorTrackerProvider;

