"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  Users,
  Eye,
  MousePointer,
  Monitor,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface DashboardData {
  summary: {
    totalSessions: number;
    totalDurationHours: number;
    totalActiveHours: number;
    avgSessionMinutes: number;
    avgActivePercent: number;
    totalTabSwitches: number;
    totalFocusLost: number;
  };
  eventCounts: { type: string; count: number }[];
  pageVisitStats: {
    problemId: string;
    visits: number;
    totalDurationMin: number;
    totalActiveMin: number;
    avgTabSwitches: number;
  }[];
  dailyData: {
    date: string;
    sessions: number;
    duration: number;
    active: number;
  }[];
  recentSessions: {
    id: string;
    sessionToken: string;
    user: { username: string; displayName: string | null; studentId: string | null } | null;
    startedAt: string;
    duration: number;
    activeDuration: number;
    idleDuration: number;
    tabSwitches: number;
    focusLostCount: number;
    pagesVisited: number;
    problemsAttempted: number;
  }[];
}

// 格式化时间
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${mins}分`;
}

// 事件类型中文名
const eventTypeNames: Record<string, string> = {
  tab_hidden: "切换标签页",
  tab_visible: "返回标签页",
  focus_lost: "离开窗口",
  focus_gained: "返回窗口",
  idle_start: "开始空闲",
  idle_end: "结束空闲",
  submit: "提交代码",
  code_edit: "编辑代码",
  hint_view: "查看提示",
  copy_attempt: "尝试复制",
  paste_attempt: "尝试粘贴",
  page_enter: "进入页面",
  page_leave: "离开页面",
  scroll: "滚动页面",
  click: "点击",
  keypress: "按键",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!res.ok) throw new Error("加载失败");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-emerald-400" />
            数据概览
          </h1>
          <p className="mt-1 text-slate-400">学习行为分析和统计数据</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value={1}>今天</option>
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      <div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <AlertTriangle className="inline h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<Users className="h-5 w-5" />}
                title="学习会话"
                value={data.summary.totalSessions}
                subtitle="次访问"
                color="emerald"
              />
              <SummaryCard
                icon={<Clock className="h-5 w-5" />}
                title="总学习时长"
                value={data.summary.totalDurationHours}
                subtitle="小时"
                color="blue"
              />
              <SummaryCard
                icon={<TrendingUp className="h-5 w-5" />}
                title="活跃时长"
                value={data.summary.totalActiveHours}
                subtitle={`小时 (${data.summary.avgActivePercent}%)`}
                color="purple"
              />
              <SummaryCard
                icon={<Eye className="h-5 w-5" />}
                title="平均会话"
                value={data.summary.avgSessionMinutes}
                subtitle="分钟/次"
                color="amber"
              />
            </div>

            {/* Behavior Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-orange-500/20 p-2">
                    <Monitor className="h-5 w-5 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white">切屏行为</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">切换标签页次数</span>
                    <span className="font-semibold text-orange-400">{data.summary.totalTabSwitches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">离开窗口次数</span>
                    <span className="font-semibold text-orange-400">{data.summary.totalFocusLost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">平均每会话切屏</span>
                    <span className="font-semibold text-white">
                      {data.summary.totalSessions > 0
                        ? Math.round(data.summary.totalTabSwitches / data.summary.totalSessions * 10) / 10
                        : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-red-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white">异常行为</h3>
                </div>
                <div className="space-y-3">
                  {data.eventCounts
                    .filter(e => ["copy_attempt", "paste_attempt"].includes(e.type))
                    .map(e => (
                      <div key={e.type} className="flex justify-between">
                        <span className="text-slate-400">{eventTypeNames[e.type] || e.type}</span>
                        <span className="font-semibold text-red-400">{e.count}</span>
                      </div>
                    ))}
                  {data.eventCounts.filter(e => ["copy_attempt", "paste_attempt"].includes(e.type)).length === 0 && (
                    <p className="text-slate-500 text-sm">暂无异常行为记录</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <MousePointer className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">交互统计</h3>
                </div>
                <div className="space-y-3">
                  {data.eventCounts
                    .filter(e => ["submit", "hint_view", "code_edit"].includes(e.type))
                    .map(e => (
                      <div key={e.type} className="flex justify-between">
                        <span className="text-slate-400">{eventTypeNames[e.type] || e.type}</span>
                        <span className="font-semibold text-blue-400">{e.count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Daily Chart */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="mb-6 font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                每日趋势
              </h3>
              <div className="flex items-end gap-2 h-48">
                {data.dailyData.map((day, i) => {
                  const maxDuration = Math.max(...data.dailyData.map(d => d.duration));
                  const height = maxDuration > 0 ? (day.duration / maxDuration) * 100 : 0;
                  const activeRatio = day.duration > 0 ? day.active / day.duration : 0;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                        style={{ height: `${height}%`, minHeight: day.duration > 0 ? "4px" : "0" }}
                        title={`${formatDuration(day.duration)} (活跃: ${Math.round(activeRatio * 100)}%)`}
                      />
                      <span className="text-xs text-slate-500">
                        {new Date(day.date).getDate()}日
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Problem Stats */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="mb-6 font-semibold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-400" />
                题目访问排行
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left">
                      <th className="py-3 px-4 font-medium text-slate-400">题目 ID</th>
                      <th className="py-3 px-4 font-medium text-slate-400">访问次数</th>
                      <th className="py-3 px-4 font-medium text-slate-400">总时长(分)</th>
                      <th className="py-3 px-4 font-medium text-slate-400">活跃时长(分)</th>
                      <th className="py-3 px-4 font-medium text-slate-400">平均切屏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pageVisitStats.map((p) => (
                      <tr key={p.problemId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">
                          <Link href={`/ide/${p.problemId}`} className="text-emerald-400 hover:underline">
                            {p.problemId}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-white">{p.visits}</td>
                        <td className="py-3 px-4 text-slate-300">{p.totalDurationMin}</td>
                        <td className="py-3 px-4 text-slate-300">{p.totalActiveMin}</td>
                        <td className="py-3 px-4">
                          <span className={p.avgTabSwitches > 5 ? "text-orange-400" : "text-slate-300"}>
                            {p.avgTabSwitches}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.pageVisitStats.length === 0 && (
                  <p className="py-8 text-center text-slate-500">暂无数据</p>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="mb-6 font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                最近会话
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-left">
                      <th className="py-3 px-4 font-medium text-slate-400">会话</th>
                      <th className="py-3 px-4 font-medium text-slate-400">用户</th>
                      <th className="py-3 px-4 font-medium text-slate-400">开始时间</th>
                      <th className="py-3 px-4 font-medium text-slate-400">时长</th>
                      <th className="py-3 px-4 font-medium text-slate-400">活跃</th>
                      <th className="py-3 px-4 font-medium text-slate-400">切屏</th>
                      <th className="py-3 px-4 font-medium text-slate-400">失焦</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSessions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">{s.sessionToken}</td>
                        <td className="py-3 px-4">
                          {s.user ? (
                            <span className="text-white">{s.user.displayName || s.user.username}</span>
                          ) : (
                            <span className="text-slate-500">匿名</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {new Date(s.startedAt).toLocaleString("zh-CN", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-white">{formatDuration(s.duration)}</td>
                        <td className="py-3 px-4">
                          <span className={s.activeDuration / s.duration > 0.7 ? "text-emerald-400" : "text-orange-400"}>
                            {formatDuration(s.activeDuration)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={s.tabSwitches > 10 ? "text-orange-400 font-semibold" : "text-slate-300"}>
                            {s.tabSwitches}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={s.focusLostCount > 5 ? "text-red-400 font-semibold" : "text-slate-300"}>
                            {s.focusLostCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.recentSessions.length === 0 && (
                  <p className="py-8 text-center text-slate-500">暂无会话记录</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-6 ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg bg-${color}-500/20 p-2`}>
          {icon}
        </div>
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-sm text-slate-400">{subtitle}</span>
      </div>
    </div>
  );
}

