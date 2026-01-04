"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Trophy,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  ChevronRight,
  Monitor,
  Eye,
  EyeOff,
  AlertTriangle,
  Code2,
  HelpCircle,
  FileText,
} from "lucide-react";

interface UserInfo {
  id: string;
  username: string;
  displayName: string | null;
  studentId: string | null;
  role: string;
}

interface ProblemScore {
  problemId: string;
  title: string;
  difficulty: string;
  kind: 'code' | 'quiz' | 'reading' | 'intro';
  maxPoints: number;
  bestScore: number;
  attempts: number;
  lastAttemptAt: string | null;
  isCompleted: boolean;
}

interface StageProgress {
  stageId: string;
  stageTitle: string;
  problems: ProblemScore[];
  totalPoints: number;
  earnedPoints: number;
  completedCount: number;
}

interface BehaviorStats {
  totalDuration: number;
  activeDuration: number;
  tabSwitches: number;
  focusLostCount: number;
  pagesVisited: number;
  sessionsCount: number;
}

interface ScoreData {
  user: UserInfo;
  stages: StageProgress[];
  totalPoints: number;
  earnedPoints: number;
  completedProblems: number;
  totalProblems: number;
  recentSubmissions: {
    problemId: string;
    problemTitle: string;
    score: number;
    status: string;
    submittedAt: string;
  }[];
  behaviorStats: BehaviorStats;
}

// 格式化时长
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${mins > 0 ? `${mins}分` : ""}`;
}

export default function MyScorePage() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/my/scores");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          setError("获取成绩失败");
        }
      } catch (err) {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "加载失败"}</p>
          <Link href="/courses" className="text-blue-400 hover:underline">
            返回课程
          </Link>
        </div>
      </div>
    );
  }

  const scorePercent = data.totalPoints > 0 ? Math.round((data.earnedPoints / data.totalPoints) * 100) : 0;
  const progressPercent = data.totalProblems > 0 ? Math.round((data.completedProblems / data.totalProblems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/courses"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回课程
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            我的成绩
          </h1>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              退出登录
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* User Info & Summary */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {/* User Card */}
          <div className="md:col-span-1 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {data.user.displayName || data.user.username}
                </div>
                {data.user.studentId && (
                  <div className="text-sm text-slate-400">{data.user.studentId}</div>
                )}
              </div>
            </div>
          </div>

          {/* Total Score */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-6">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Trophy className="h-5 w-5" />
              <span className="text-sm">总得分</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data.earnedPoints} <span className="text-lg text-slate-400">/ {data.totalPoints}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="mt-1 text-right text-sm text-amber-400">{scorePercent}%</div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-6">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Target className="h-5 w-5" />
              <span className="text-sm">完成进度</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data.completedProblems} <span className="text-lg text-slate-400">/ {data.totalProblems} 题</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 text-right text-sm text-emerald-400">{progressPercent}%</div>
          </div>

          {/* Rank Placeholder */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-6">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Award className="h-5 w-5" />
              <span className="text-sm">成就</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {data.completedProblems >= 10 ? "🏆" : data.completedProblems >= 5 ? "🥈" : "🥉"}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {data.completedProblems >= 10 ? "编程达人" : data.completedProblems >= 5 ? "进步之星" : "初学者"}
            </div>
          </div>
        </div>

        {/* Behavior Stats */}
        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-400" />
            学习行为统计
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Clock className="h-4 w-4" />
                总学习时长
              </div>
              <div className="text-2xl font-bold text-white">
                {formatDuration(data.behaviorStats.totalDuration)}
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Eye className="h-4 w-4" />
                活跃时长
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatDuration(data.behaviorStats.activeDuration)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                活跃率: {data.behaviorStats.totalDuration > 0 
                  ? Math.round((data.behaviorStats.activeDuration / data.behaviorStats.totalDuration) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <EyeOff className="h-4 w-4" />
                切屏次数
              </div>
              <div className={`text-2xl font-bold ${data.behaviorStats.tabSwitches > 50 ? "text-red-400" : data.behaviorStats.tabSwitches > 20 ? "text-amber-400" : "text-white"}`}>
                {data.behaviorStats.tabSwitches}
              </div>
              {data.behaviorStats.tabSwitches > 50 && (
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  切屏过于频繁
                </div>
              )}
            </div>
            <div className="rounded-lg bg-slate-900/50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Target className="h-4 w-4" />
                失焦次数
              </div>
              <div className={`text-2xl font-bold ${data.behaviorStats.focusLostCount > 30 ? "text-amber-400" : "text-white"}`}>
                {data.behaviorStats.focusLostCount}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">学习会话数</span>
              <span className="text-white font-medium">{data.behaviorStats.sessionsCount} 次</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">访问页面数</span>
              <span className="text-white font-medium">{data.behaviorStats.pagesVisited} 页</span>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        {data.recentSubmissions.length > 0 && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              最近提交
            </h2>
            <div className="space-y-3">
              {data.recentSubmissions.slice(0, 5).map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {sub.status === "accepted" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <div className="text-white font-medium">{sub.problemTitle}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(sub.submittedAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${sub.score === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                      {sub.score} 分
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Scores by Stage */}
        <div className="space-y-6">
          {data.stages.map((stage) => (
            <div key={stage.stageId} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
              <div className="border-b border-slate-700 bg-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{stage.stageTitle}</h3>
                  <p className="text-sm text-slate-400">
                    完成 {stage.completedCount}/{stage.problems.length} 题 · 得分 {stage.earnedPoints}/{stage.totalPoints}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${stage.totalPoints > 0 ? (stage.earnedPoints / stage.totalPoints) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-blue-400">
                    {stage.totalPoints > 0 ? Math.round((stage.earnedPoints / stage.totalPoints) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-700/50">
                {stage.problems.map((problem) => {
                  // 题目类型图标和颜色
                  const kindConfig = {
                    intro: { icon: <FileText className="h-4 w-4" />, label: "导读", color: "text-teal-400" },
                    reading: { icon: <BookOpen className="h-4 w-4" />, label: "阅读", color: "text-cyan-400" },
                    quiz: { icon: <HelpCircle className="h-4 w-4" />, label: "测验", color: "text-purple-400" },
                    code: { icon: <Code2 className="h-4 w-4" />, label: "代码", color: "text-blue-400" },
                  };
                  const kind = kindConfig[problem.kind || 'code'];

                  return (
                    <div
                      key={problem.problemId}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {problem.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : problem.attempts > 0 ? (
                          <Clock className="h-5 w-5 text-amber-400" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{problem.title}</span>
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${kind.color} bg-slate-700/50`}>
                              {kind.icon}
                              {kind.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {problem.attempts > 0 ? `${problem.attempts} 次尝试` : "未尝试"}
                            {problem.lastAttemptAt && ` · ${new Date(problem.lastAttemptAt).toLocaleDateString("zh-CN")}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${problem.bestScore === problem.maxPoints ? "text-emerald-400" : problem.bestScore > 0 ? "text-amber-400" : "text-slate-500"}`}>
                            {problem.bestScore} / {problem.maxPoints}
                          </div>
                          <div className="text-xs text-slate-500">
                            {problem.difficulty === "beginner" ? "入门" : 
                             problem.difficulty === "basic" ? "基础" :
                             problem.difficulty === "intermediate" ? "进阶" : 
                             problem.difficulty === "fun" ? "有趣" : "挑战"}
                          </div>
                        </div>
                        <Link
                          href={`/ide/${problem.problemId}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

