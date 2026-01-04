"use client";

import { CheckCircle, Terminal, XCircle, AlertCircle, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ConsolePanelProps {
  logs: string[];
  status: "idle" | "running" | "success" | "error";
  score?: number;
}

export default function ConsolePanel({ logs, status, score }: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<"terminal" | "result">("terminal");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-switch to result tab on finish
  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => setActiveTab("result"), 0);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // 根据日志内容添加颜色
  const getLogColor = (log: string) => {
    if (log.startsWith("✓") || log.includes("通过") || log.includes("Correct") || log.includes("成功")) {
      return "text-emerald-400";
    }
    if (log.startsWith("✗") || log.includes("失败") || log.includes("错误") || log.includes("Error") || log.includes("Incorrect")) {
      return "text-red-400";
    }
    if (log.startsWith("---") || log.includes("---")) {
      return "text-slate-500";
    }
    if (log.includes("编译") || log.includes("Compil")) {
      return "text-cyan-400";
    }
    if (log.includes("运行") || log.includes("Run") || log.includes("Execut")) {
      return "text-blue-400";
    }
    if (log.includes("💡") || log.includes("提示") || log.includes("Hint")) {
      return "text-amber-400";
    }
    return "text-slate-300";
  };

  return (
    <div className="flex h-full flex-col bg-slate-800">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-slate-700 bg-slate-800">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "terminal"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="h-4 w-4" />
          终端输出
        </button>
        <button
          onClick={() => setActiveTab("result")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "result"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          {status === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
          {status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
          {status === "running" && <Clock className="h-4 w-4 text-blue-400 animate-pulse" />}
          {status === "idle" && <AlertCircle className="h-4 w-4 text-slate-500" />}
          评测结果
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "terminal" && (
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto bg-slate-900 p-4 font-mono text-sm"
          >
            {logs.length === 0 ? (
              <span className="text-slate-500">$ 等待运行...</span>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`whitespace-pre-wrap break-all ${getLogColor(log)}`}
                  >
                  {log}
                </div>
                ))}
              </div>
            )}
            {status === "running" && (
              <div className="mt-2 flex items-center gap-2">
                <span className="animate-pulse text-emerald-400">▊</span>
                <span className="text-slate-500 text-xs">执行中...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "result" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center">
            {status === "idle" && (
              <div className="text-slate-500">
                <Terminal className="mx-auto mb-3 h-16 w-16 opacity-20" />
                <p className="text-sm">点击上方「运行测试」开始评测</p>
              </div>
            )}

            {status === "running" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Terminal className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                <div>
                  <p className="text-slate-300 font-medium">正在沙箱中编译运行...</p>
                  <p className="text-slate-500 text-sm mt-1">请稍候</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">🎉 恭喜通过！</h3>
                <p className="mt-2 text-slate-400">所有测试用例均已通过</p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-8 py-4 ring-1 ring-emerald-500/30">
                  <span className="text-sm font-medium text-emerald-400">本题得分</span>
                  <div className="text-4xl font-bold text-emerald-400">{score}</div>
                  <span className="text-sm text-emerald-400/70">分</span>
                </div>
                <a
                  href="/my"
                  className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline transition-colors"
                >
                  查看我的总成绩 →
                </a>
              </div>
            )}

            {status === "error" && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 ring-4 ring-red-500/30">
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">测试未通过</h3>
                <p className="mt-2 text-slate-400">请查看终端输出了解详情</p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-8 py-4 ring-1 ring-red-500/30">
                  <span className="text-sm font-medium text-red-400">得分</span>
                  <div className="text-4xl font-bold text-red-400">{score || 0}</div>
                </div>
                <button
                  onClick={() => setActiveTab("terminal")}
                  className="mt-4 text-sm text-slate-400 hover:text-white underline-offset-2 hover:underline transition-colors"
                >
                  查看错误详情 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
