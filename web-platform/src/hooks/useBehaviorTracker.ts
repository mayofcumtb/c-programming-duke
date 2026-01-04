"use client";

import { useEffect, useRef, useCallback } from "react";

// 行为事件类型
export type BehaviorEventType =
  | "tab_hidden"
  | "tab_visible"
  | "focus_lost"
  | "focus_gained"
  | "idle_start"
  | "idle_end"
  | "submit"
  | "code_edit"
  | "hint_view"
  | "copy_attempt"
  | "paste_attempt"
  | "page_enter"
  | "page_leave"
  | "scroll"
  | "click"
  | "keypress";

// 行为事件
interface BehaviorEvent {
  type: BehaviorEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// 会话统计
interface SessionStats {
  sessionId: string;
  startTime: number;
  totalDuration: number;
  activeDuration: number;
  idleDuration: number;
  tabSwitches: number;
  focusLostCount: number;
  mouseClicks: number;
  keyPresses: number;
  scrollCount: number;
  lastActivityTime: number;
  isIdle: boolean;
  isVisible: boolean;
  isFocused: boolean;
}

// 页面统计
interface PageStats {
  pagePath: string;
  problemId?: string;
  enteredAt: number;
  duration: number;
  activeDuration: number;
  tabSwitches: number;
  focusLostCount: number;
  scrollDepth: number;
}

// 配置
interface TrackerConfig {
  idleTimeout?: number;           // 无操作多久算空闲（毫秒）
  reportInterval?: number;        // 上报间隔（毫秒）
  batchSize?: number;             // 事件批量上报大小
  pagePath?: string;              // 当前页面路径
  problemId?: string;             // 当前题目 ID
  onReport?: (data: ReportData) => void;  // 自定义上报处理
}

// 上报数据
export interface ReportData {
  sessionId: string;
  sessionStats: Partial<SessionStats>;
  pageStats: Partial<PageStats>;
  events: BehaviorEvent[];
}

// 生成会话 ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 获取或创建会话 ID
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  
  const storageKey = "c_judge_session_id";
  const expiryKey = "c_judge_session_expiry";
  
  const existing = sessionStorage.getItem(storageKey);
  const expiry = sessionStorage.getItem(expiryKey);
  
  // 检查是否过期（30分钟无活动算新会话）
  if (existing && expiry && Date.now() < parseInt(expiry)) {
    // 延长过期时间
    sessionStorage.setItem(expiryKey, String(Date.now() + 30 * 60 * 1000));
    return existing;
  }
  
  // 创建新会话
  const newId = generateSessionId();
  sessionStorage.setItem(storageKey, newId);
  sessionStorage.setItem(expiryKey, String(Date.now() + 30 * 60 * 1000));
  return newId;
}

// 默认配置
const DEFAULT_CONFIG: Required<Omit<TrackerConfig, "onReport" | "pagePath" | "problemId">> = {
  idleTimeout: 60000,        // 1分钟无操作算空闲
  reportInterval: 30000,     // 每30秒上报一次
  batchSize: 50,             // 最多积累50个事件
};

/**
 * 行为追踪 Hook
 * 追踪用户的各种行为：切屏、空闲、活动等
 */
export function useBehaviorTracker(config: TrackerConfig = {}) {
  const {
    idleTimeout = DEFAULT_CONFIG.idleTimeout,
    reportInterval = DEFAULT_CONFIG.reportInterval,
    batchSize = DEFAULT_CONFIG.batchSize,
    pagePath,
    problemId,
    onReport,
  } = config;

  // 会话统计
  const statsRef = useRef<SessionStats>({
    sessionId: "",
    startTime: Date.now(),
    totalDuration: 0,
    activeDuration: 0,
    idleDuration: 0,
    tabSwitches: 0,
    focusLostCount: 0,
    mouseClicks: 0,
    keyPresses: 0,
    scrollCount: 0,
    lastActivityTime: Date.now(),
    isIdle: false,
    isVisible: true,
    isFocused: true,
  });

  // 页面统计
  const pageStatsRef = useRef<PageStats>({
    pagePath: pagePath || "",
    problemId,
    enteredAt: Date.now(),
    duration: 0,
    activeDuration: 0,
    tabSwitches: 0,
    focusLostCount: 0,
    scrollDepth: 0,
  });

  // 事件缓冲
  const eventsRef = useRef<BehaviorEvent[]>([]);
  
  // 空闲检测定时器
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 上报定时器
  const reportTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 活跃时间追踪
  const activeStartRef = useRef<number>(Date.now());

  // 添加事件
  const addEvent = useCallback((type: BehaviorEventType, data?: Record<string, unknown>) => {
    const event: BehaviorEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    eventsRef.current.push(event);
    
    // 达到批量大小时触发上报
    if (eventsRef.current.length >= batchSize) {
      reportData();
    }
  }, [batchSize]);

  // 更新活跃时间
  const updateActiveTime = useCallback(() => {
    const now = Date.now();
    const stats = statsRef.current;
    const pageStats = pageStatsRef.current;
    
    if (!stats.isIdle && stats.isVisible && stats.isFocused) {
      const elapsed = now - activeStartRef.current;
      stats.activeDuration += elapsed;
      pageStats.activeDuration += elapsed;
    }
    
    activeStartRef.current = now;
  }, []);

  // 重置空闲计时器
  const resetIdleTimer = useCallback(() => {
    const stats = statsRef.current;
    
    // 如果之前是空闲状态，记录空闲结束
    if (stats.isIdle) {
      stats.isIdle = false;
      addEvent("idle_end");
      activeStartRef.current = Date.now();
    }
    
    stats.lastActivityTime = Date.now();
    
    // 清除旧的计时器
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // 设置新的空闲检测计时器
    idleTimerRef.current = setTimeout(() => {
      updateActiveTime();
      stats.isIdle = true;
      addEvent("idle_start");
    }, idleTimeout);
  }, [idleTimeout, addEvent, updateActiveTime]);

  // 上报数据
  const reportData = useCallback(async () => {
    const stats = statsRef.current;
    const pageStats = pageStatsRef.current;
    
    // 更新时长
    const now = Date.now();
    stats.totalDuration = now - stats.startTime;
    pageStats.duration = now - pageStats.enteredAt;
    
    // 计算空闲时长
    stats.idleDuration = stats.totalDuration - stats.activeDuration;
    
    const reportPayload: ReportData = {
      sessionId: stats.sessionId,
      sessionStats: {
        totalDuration: stats.totalDuration,
        activeDuration: stats.activeDuration,
        idleDuration: stats.idleDuration,
        tabSwitches: stats.tabSwitches,
        focusLostCount: stats.focusLostCount,
        mouseClicks: stats.mouseClicks,
        keyPresses: stats.keyPresses,
        scrollCount: stats.scrollCount,
      },
      pageStats: {
        pagePath: pageStats.pagePath,
        problemId: pageStats.problemId,
        duration: pageStats.duration,
        activeDuration: pageStats.activeDuration,
        tabSwitches: pageStats.tabSwitches,
        focusLostCount: pageStats.focusLostCount,
        scrollDepth: pageStats.scrollDepth,
      },
      events: [...eventsRef.current],
    };
    
    // 清空事件缓冲
    eventsRef.current = [];
    
    // 调用自定义上报或默认 API
    if (onReport) {
      onReport(reportPayload);
    } else {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportPayload),
        });
      } catch (error) {
        console.error("[BehaviorTracker] Report failed:", error);
      }
    }
  }, [onReport]);

  // 初始化
  useEffect(() => {
    // 获取或创建会话 ID
    statsRef.current.sessionId = getOrCreateSessionId();
    
    // 更新页面路径
    if (pagePath) {
      pageStatsRef.current.pagePath = pagePath;
    }
    if (problemId) {
      pageStatsRef.current.problemId = problemId;
    }
    
    // 记录页面进入
    addEvent("page_enter", { path: pagePath, problemId });
    
    // 可见性变化处理
    const handleVisibilityChange = () => {
      const stats = statsRef.current;
      const pageStats = pageStatsRef.current;
      
      updateActiveTime();
      
      if (document.hidden) {
        stats.isVisible = false;
        stats.tabSwitches++;
        pageStats.tabSwitches++;
        addEvent("tab_hidden");
      } else {
        stats.isVisible = true;
        addEvent("tab_visible");
        activeStartRef.current = Date.now();
      }
    };
    
    // 焦点变化处理
    const handleFocus = () => {
      statsRef.current.isFocused = true;
      addEvent("focus_gained");
      activeStartRef.current = Date.now();
    };
    
    const handleBlur = () => {
      const stats = statsRef.current;
      const pageStats = pageStatsRef.current;
      
      updateActiveTime();
      stats.isFocused = false;
      stats.focusLostCount++;
      pageStats.focusLostCount++;
      addEvent("focus_lost");
    };
    
    // 用户活动处理
    const handleActivity = (type: "click" | "keypress" | "scroll") => {
      resetIdleTimer();
      
      const stats = statsRef.current;
      switch (type) {
        case "click":
          stats.mouseClicks++;
          break;
        case "keypress":
          stats.keyPresses++;
          break;
        case "scroll":
          stats.scrollCount++;
          // 更新滚动深度
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight > 0) {
            const depth = Math.round((window.scrollY / scrollHeight) * 100);
            pageStatsRef.current.scrollDepth = Math.max(pageStatsRef.current.scrollDepth, depth);
          }
          break;
      }
    };
    
    // 复制粘贴拦截
    const handleCopy = (e: ClipboardEvent) => {
      addEvent("copy_attempt", { 
        target: (e.target as HTMLElement)?.tagName,
        prevented: false 
      });
    };
    
    const handlePaste = (e: ClipboardEvent) => {
      addEvent("paste_attempt", { 
        target: (e.target as HTMLElement)?.tagName,
        prevented: false 
      });
    };
    
    // 防抖处理
    let scrollTimeout: NodeJS.Timeout | null = null;
    const debouncedScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => handleActivity("scroll"), 100);
    };
    
    // 注册事件监听
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("click", () => handleActivity("click"));
    document.addEventListener("keypress", () => handleActivity("keypress"));
    document.addEventListener("scroll", debouncedScroll, { passive: true });
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    
    // 初始化空闲计时器
    resetIdleTimer();
    
    // 定期上报
    reportTimerRef.current = setInterval(() => {
      updateActiveTime();
      reportData();
    }, reportInterval);
    
    // 清理
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("click", () => handleActivity("click"));
      document.removeEventListener("keypress", () => handleActivity("keypress"));
      document.removeEventListener("scroll", debouncedScroll);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (reportTimerRef.current) clearInterval(reportTimerRef.current);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // 上报页面离开
      addEvent("page_leave", { path: pagePath, problemId });
      updateActiveTime();
      reportData();
    };
  }, [pagePath, problemId, idleTimeout, reportInterval, addEvent, resetIdleTimer, updateActiveTime, reportData]);

  // 公开方法
  return {
    // 手动触发事件
    trackEvent: addEvent,
    
    // 获取当前统计
    getStats: () => ({
      session: { ...statsRef.current },
      page: { ...pageStatsRef.current },
    }),
    
    // 手动上报
    flush: reportData,
  };
}

export default useBehaviorTracker;

