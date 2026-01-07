"use client";

import { useEffect, useState } from "react";

/**
 * NoScript 检测组件
 * 通过在页面加载时设置一个标记来检测 JavaScript 是否被禁用
 * 如果 JavaScript 被禁用后又启用，可以检测到这个变化
 */
export function NoScriptDetector() {
  return (
    <noscript>
      {/* 如果 JavaScript 被禁用，显示警告 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "24px", marginBottom: "16px", color: "#ef4444" }}>
          ⚠️ JavaScript 已被禁用
        </h1>
        <p style={{ fontSize: "16px", marginBottom: "24px", maxWidth: "400px" }}>
          本平台需要 JavaScript 才能正常运行。
          请在浏览器设置中启用 JavaScript，然后刷新页面。
        </p>
        <p style={{ fontSize: "14px", color: "#9ca3af" }}>
          禁用 JavaScript 可能被视为作弊行为，会被记录并可能影响您的成绩。
        </p>
      </div>
    </noscript>
  );
}

/**
 * JavaScript 状态监控 Hook
 * 检测 JavaScript 是否被临时禁用（比如通过开发者工具）
 */
export function useJSStatusMonitor() {
  const [jsWasDisabled, setJsWasDisabled] = useState(false);

  useEffect(() => {
    // 设置心跳标记
    const heartbeatKey = `js_heartbeat_${Date.now()}`;
    sessionStorage.setItem("js_active", "true");
    sessionStorage.setItem("js_last_heartbeat", Date.now().toString());

    // 定期更新心跳
    const heartbeatInterval = setInterval(() => {
      sessionStorage.setItem("js_last_heartbeat", Date.now().toString());
    }, 1000);

    // 页面可见性变化时检查
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastHeartbeat = parseInt(
          sessionStorage.getItem("js_last_heartbeat") || "0"
        );
        const now = Date.now();

        // 如果距离上次心跳超过3秒，说明 JS 可能被禁用过
        if (now - lastHeartbeat > 3000) {
          setJsWasDisabled(true);
          console.warn("[AntiCheat] 检测到 JavaScript 可能被临时禁用");
          
          // 发送警告到服务器
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventType: "js_disabled_detected",
              data: { gap: now - lastHeartbeat, timestamp: now },
            }),
          }).catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { jsWasDisabled };
}

