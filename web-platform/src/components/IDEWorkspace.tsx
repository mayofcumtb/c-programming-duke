"use client";

import CodeEditor from "@/components/CodeEditor";
import ConsolePanel from "@/components/ConsolePanel";
import { ChevronLeft, ChevronRight, Play, Save, BookOpen, FileCode, Lightbulb, Eye, CloudOff, Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ProblemKind, QuizProblem, DisplayType } from "@/lib/problems";

interface IDEWorkspaceProps {
  problemId: string;
  title: string;
  description: string;
  initialCode: string;
  kind: ProblemKind;
  displayType?: DisplayType;
  initialFiles: Record<string, string>;
  editableFilenames: string[];
  readonlyFiles?: Record<string, string>;
  readonlyFilenames?: string[];
  learningGoals?: string[];
  hints?: string[];
  quiz?: QuizProblem;
}

export default function IDEWorkspace({
  problemId,
  title,
  description,
  initialCode,
  kind,
  displayType = "standard",
  initialFiles,
  editableFilenames,
  readonlyFiles = {},
  readonlyFilenames = [],
  learningGoals = [],
  hints = [],
  quiz,
}: IDEWorkspaceProps) {
  // 文件状态
  const [files, setFiles] = useState<Record<string, string>>(() => {
    if (initialFiles && Object.keys(initialFiles).length > 0) return initialFiles;
    if (editableFilenames && editableFilenames.length > 0) {
      return { [editableFilenames[0]]: initialCode };
    }
    return { "student.c": initialCode };
  });

  // 当前活动文件
  const [activeFilename, setActiveFilename] = useState(() => {
    // 对于阅读理解题，默认显示只读文件
    if (displayType === "reading" && readonlyFilenames.length > 0) {
      return readonlyFilenames[0];
    }
    if (editableFilenames && editableFilenames.length > 0) return editableFilenames[0];
    const keys = Object.keys(initialFiles || {});
    if (keys.length > 0) return keys[0];
    return "student.c";
  });

  // 判题状态
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  // Quiz 答案
  const [quizAnswer, setQuizAnswer] = useState<{ kind: string; value: unknown } | null>(null);

  // 是否展开提示
  const [showHints, setShowHints] = useState(false);

  // 自动保存状态
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadedRef = useRef(false);

  // 加载保存的代码
  useEffect(() => {
    const loadDraft = async () => {
      if (kind === "quiz" || kind === "intro") return;
      
      try {
        const res = await fetch(`/api/code/load?problemId=${problemId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.files && Object.keys(data.files).length > 0) {
            setFiles(data.files);
            setLastSaved(data.lastSavedAt ? new Date(data.lastSavedAt) : null);
            isLoadedRef.current = true;
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    };

    loadDraft();
  }, [problemId, kind]);

  // 自动保存函数
  const saveDraft = useCallback(async (filesToSave: Record<string, string>) => {
    if (kind === "quiz" || kind === "intro") return;
    
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/code/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, files: filesToSave }),
      });
      
      if (res.ok) {
        setSaveStatus("saved");
        setLastSaved(new Date());
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      setSaveStatus("error");
    }
  }, [problemId, kind]);

  // 文件变更时触发自动保存（防抖）
  const handleFileChange = useCallback((filename: string, content: string) => {
    setFiles((prev) => {
      const updated = { ...prev, [filename]: content };
      
      // 取消之前的保存计划
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // 设置新的保存计划（2秒后自动保存）
      setSaveStatus("unsaved");
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft(updated);
      }, 2000);
      
      return updated;
    });
  }, [saveDraft]);

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 判断当前文件是否只读
  const isCurrentFileReadonly = readonlyFilenames.includes(activeFilename);

  // 获取当前文件内容
  const getCurrentFileContent = () => {
    if (isCurrentFileReadonly) {
      return readonlyFiles[activeFilename] || "";
    }
    return files[activeFilename] || "";
  };

  // 所有文件列表
  const allFilenames = [
    ...readonlyFilenames,
    ...editableFilenames.filter((f) => !readonlyFilenames.includes(f)),
  ];

  const handleRun = async () => {
    if (status === "running") return;

    setStatus("running");
    setLogs([kind === "quiz" ? "正在提交答案..." : "正在准备环境...", kind === "quiz" ? "正在检查..." : "正在编译代码..."]);
    setScore(0);

    try {
      let body: unknown;
      if (kind === "quiz") {
        body = { problemId, answer: quizAnswer };
      } else {
        body = { problemId, files };
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // 检查响应类型
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error("服务器返回了非预期的响应格式");
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setLogs(data.logs || []);
      setScore(data.score || 0);

      if (data.status === "accepted") {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      setLogs((prev) => [...prev, kind === "quiz" ? "系统错误：答案提交失败" : "系统错误：代码提交失败"]);
      setStatus("error");
    }
  };

  const isQuizReady = kind !== "quiz" || (quizAnswer && quizAnswer.kind);
  
  // 导读课完成状态
  const [introCompleted, setIntroCompleted] = useState(false);
  const [introSubmitting, setIntroSubmitting] = useState(false);

  // 处理导读/阅读完成
  const handleCompleteIntro = async () => {
    setIntroSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          answer: { kind: "reading", value: true },
        }),
      });
      if (res.ok) {
        setIntroCompleted(true);
        setScore(100);
        setStatus("success");
        setLogs(["✓ 阅读完成！"]);
      }
    } catch (e) {
      console.error("Failed to submit intro completion:", e);
    } finally {
      setIntroSubmitting(false);
    }
  };

  // ============================================================
  // 导读课专用布局
  // ============================================================
  if (kind === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              返回课程
            </Link>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              📖 导读课
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">{title}</h1>
          
          <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
            <ReactMarkdown>{description}</ReactMarkdown>
          </article>

          {/* Learning Goals */}
          {learningGoals.length > 0 && (
            <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                <BookOpen className="h-4 w-4" />
                本节学习目标
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                {learningGoals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 完成阅读按钮 */}
          <div className="mt-8 flex flex-col items-center gap-4 py-8 border-t">
            {introCompleted ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700 mb-4">
                  <span className="text-lg">✓</span>
                  <span className="font-medium">已完成阅读</span>
                </div>
                <p className="text-slate-600 mb-4">你可以继续下一节课了</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  返回课程列表
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleCompleteIntro}
                disabled={introSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {introSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <BookOpen className="h-5 w-5" />
                )}
                {introSubmitting ? "提交中..." : "完成阅读"}
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // 代码/测验/阅读理解 布局
  // ============================================================
  return (
    <div className="flex h-screen flex-col bg-slate-900">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            返回课程
          </Link>
          <div className="h-4 w-px bg-slate-600" />
          <h1 className="text-sm font-bold text-white">{title}</h1>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {kind === "quiz" ? "测验" : displayType === "reading" ? "阅读理解" : displayType === "testgen" ? "测试生成" : displayType === "multi_file" ? "多文件" : "代码编写"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {kind !== "quiz" && kind !== "intro" && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  <span>保存中...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已保存</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-400">未保存</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-red-400">保存失败</span>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleRun}
            disabled={status === "running" || !isQuizReady}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            {status === "running" ? (kind === "quiz" ? "提交中..." : "运行中...") : kind === "quiz" ? "提交答案" : "运行测试"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-[380px] min-w-[320px] overflow-y-auto border-r border-slate-700 bg-slate-800">
          {/* Description Tab */}
          <div className="border-b border-slate-700">
            <div className="flex items-center gap-2 px-4 py-3">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">题目描述</span>
            </div>
          </div>

          <div className="p-4">
            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-emerald-400 prose-code:text-amber-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700">
            <ReactMarkdown>{description}</ReactMarkdown>
          </article>

            {/* Learning Goals */}
            {learningGoals.length > 0 && (
              <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                  学习目标
                </div>
                <ul className="space-y-1 text-sm text-slate-300">
                  {learningGoals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hints */}
            {hints.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showHints ? "隐藏提示" : "显示提示"}
                </button>
                {showHints && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <ul className="space-y-1 text-sm text-slate-300">
                      {hints.map((hint, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">💡</span>
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor & Console */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-900">
          {/* Editor Area (60% height) */}
          <div className="h-[60%] min-h-[300px] flex flex-col">
            {kind === "quiz" ? (
              /* Quiz 答题界面 */
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                  <h3 className="mb-4 text-lg font-medium text-white">请选择你的答案</h3>
                  
                {quiz?.kind === "single" && (
                  <div className="space-y-3">
                    {quiz.options.map((opt) => (
                      <label
                        key={opt.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                            quizAnswer?.kind === "single" && quizAnswer.value === opt.id
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="quiz-single"
                            className="h-4 w-4 text-emerald-500"
                          checked={quizAnswer?.kind === "single" && quizAnswer.value === opt.id}
                          onChange={() => setQuizAnswer({ kind: "single", value: opt.id })}
                        />
                          <span className="text-sm text-slate-200">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {quiz?.kind === "true_false" && (
                  <div className="space-y-3">
                    {[
                        { id: "true", label: "正确 ✓", value: true },
                        { id: "false", label: "错误 ✗", value: false },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                            quizAnswer?.kind === "true_false" && quizAnswer.value === opt.value
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="quiz-tf"
                            className="h-4 w-4 text-emerald-500"
                          checked={quizAnswer?.kind === "true_false" && quizAnswer.value === opt.value}
                          onChange={() => setQuizAnswer({ kind: "true_false", value: opt.value })}
                        />
                          <span className="text-sm text-slate-200">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {quiz?.kind === "fill" && (
                  <div className="space-y-3">
                    <input
                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        placeholder="请输入你的答案..."
                      value={typeof quizAnswer?.value === "string" ? (quizAnswer.value as string) : ""}
                      onChange={(e) => setQuizAnswer({ kind: "fill", value: e.target.value })}
                    />
                      <p className="text-xs text-slate-500">大小写敏感，空格会被忽略</p>
                  </div>
                )}
                </div>
              </div>
            ) : (
              /* 代码编辑界面 */
              <>
                {/* 文件标签栏 */}
                {allFilenames.length > 0 && (
                  <div className="flex shrink-0 gap-1 border-b border-slate-700 bg-slate-800 px-2 py-2">
                    {allFilenames.map((name) => {
                      const isReadonly = readonlyFilenames.includes(name);
                      const isActive = activeFilename === name;
                      return (
                      <button
                        key={name}
                        onClick={() => setActiveFilename(name)}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        }`}
                      >
                          {isReadonly ? (
                            <Eye className="h-3 w-3 text-amber-400" />
                          ) : (
                            <FileCode className="h-3 w-3 text-emerald-400" />
                          )}
                          <span>{name}</span>
                          {isReadonly && (
                            <span className="ml-1 rounded bg-amber-500/20 px-1 py-0.5 text-[10px] text-amber-400">
                              只读
                            </span>
                          )}
                      </button>
                      );
                    })}
                  </div>
                )}

                {/* 编辑器 */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    key={activeFilename}
                    value={getCurrentFileContent()}
                    onChange={(val) => {
                      if (!isCurrentFileReadonly) {
                        handleFileChange(activeFilename, val || "");
                      }
                    }}
                    readOnly={isCurrentFileReadonly}
                  />
                </div>
              </>
            )}
          </div>

          {/* Console Area (40% height) */}
          <div className="h-[40%] min-h-[200px] overflow-hidden border-t border-slate-700">
            <ConsolePanel logs={logs} status={status} score={score} />
          </div>
        </div>
      </div>
    </div>
  );
}
