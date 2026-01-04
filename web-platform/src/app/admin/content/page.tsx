"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Code2,
  HelpCircle,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { courseStages } from "@/lib/courses";

export default function ContentManagementPage() {
  const [expandedStage, setExpandedStage] = useState<string | null>("stage-1");

  const getKindIcon = (kind?: string) => {
    switch (kind) {
      case "intro":
        return <FileText className="h-4 w-4 text-blue-400" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4 text-purple-400" />;
      case "reading":
        return <BookOpen className="h-4 w-4 text-teal-400" />;
      default:
        return <Code2 className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getKindLabel = (kind?: string) => {
    switch (kind) {
      case "intro":
        return "导读";
      case "quiz":
        return "测验";
      case "reading":
        return "阅读";
      default:
        return "代码";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "入门":
        return "bg-green-500/20 text-green-400";
      case "基础":
        return "bg-blue-500/20 text-blue-400";
      case "进阶":
        return "bg-amber-500/20 text-amber-400";
      case "挑战":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  // 统计
  const totalExercises = courseStages.reduce(
    (sum, stage) => sum + stage.modules.reduce((mSum, m) => mSum + m.exercises.length, 0),
    0
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/courses"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回课程
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-white">题目内容管理</h1>
            <p className="text-slate-400 text-sm mt-1">
              查看和管理课程中的所有题目内容（共 {totalExercises} 道题目）
            </p>
          </div>
        </div>
      </div>

      {/* 课程结构 */}
      <div className="space-y-4">
        {courseStages.map((stage) => (
          <div
            key={stage.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            {/* 阶段标题 */}
            <button
              onClick={() =>
                setExpandedStage(expandedStage === stage.id ? null : stage.id)
              }
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedStage === stage.id ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
                <div className="text-left">
                  <h2 className="font-semibold text-white">{stage.title}</h2>
                  <p className="text-sm text-slate-400">{stage.description}</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {stage.modules.reduce((sum, m) => sum + m.exercises.length, 0)} 道题目
              </div>
            </button>

            {/* 模块列表 */}
            {expandedStage === stage.id && (
              <div className="border-t border-slate-700 p-4 space-y-4 bg-slate-900/30">
                {stage.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-medium text-slate-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-400" />
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 ml-6">{module.description}</p>

                    {/* 题目列表 */}
                    <div className="ml-6 space-y-1">
                      {module.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2.5 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getKindIcon(exercise.kind)}
                            <div>
                              <span className="text-sm text-white">{exercise.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500">{exercise.id}</span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(
                                    exercise.difficulty
                                  )}`}
                                >
                                  {exercise.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">
                              {getKindLabel(exercise.kind)} · {exercise.points}分
                            </span>
                            <Link
                              href={`/ide/${exercise.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                              title="预览题目"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 rounded-lg bg-slate-800/30 border border-slate-700 p-4">
        <p className="text-sm text-slate-400">
          💡 提示：题目内容定义在 <code className="text-blue-400">src/lib/courses.ts</code> 文件中。
          修改后需要运行 <code className="text-blue-400">npx tsx scripts/sync-problems.ts</code> 同步到数据库。
        </p>
      </div>
    </div>
  );
}

