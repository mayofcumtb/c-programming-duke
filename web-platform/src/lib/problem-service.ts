import prisma from "./db";
import fs from "fs/promises";
import path from "path";
import type { Problem, JudgeConfig, QuizConfig, Module, Stage } from "@prisma/client";

// ============================================================
// 类型定义
// ============================================================

export type ProblemWithRelations = Problem & {
  judgeConfig: JudgeConfig | null;
  quizConfig: QuizConfig | null;
  module: (Module & { stage: Stage }) | null;
};

export type CourseStructure = (Stage & {
  modules: (Module & {
    problems: Problem[];
  })[];
})[];

// ============================================================
// 题目查询
// ============================================================

/**
 * 获取单个题目及其配置
 */
export async function getProblemById(id: string): Promise<ProblemWithRelations | null> {
  return prisma.problem.findUnique({
    where: { id },
    include: {
      judgeConfig: true,
      quizConfig: true,
      module: {
        include: {
          stage: true,
        },
      },
    },
  });
}

/**
 * 获取完整课程结构
 */
export async function getCourseStructure(): Promise<CourseStructure> {
  return prisma.stage.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          problems: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

/**
 * 获取所有活动题目
 */
export async function getAllActiveProblems() {
  return prisma.problem.findMany({
    where: { isActive: true },
    orderBy: [{ moduleId: "asc" }, { sortOrder: "asc" }],
  });
}

// ============================================================
// 题目内容加载
// ============================================================

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
// 学生版资源目录（无答案）
const STUDENT_RESOURCES = path.resolve(PROJECT_ROOT, "student_resources");

/**
 * 获取题目完整内容（包括文件）
 */
export async function getProblemContent(problemId: string) {
  const problem = await getProblemById(problemId);

  if (!problem) {
    return null;
  }

  // Quiz 题目
  if (problem.problemType === "quiz" && problem.quizConfig) {
    return {
      kind: "quiz" as const,
      problem,
      description: problem.quizConfig.prompt,
      initialCode: "",
      initialFiles: {},
      editableFilenames: [],
      readonlyFiles: {},
      readonlyFilenames: [],
      quiz: {
        kind: problem.quizConfig.quizType as "single" | "true_false" | "fill",
        prompt: problem.quizConfig.prompt,
        options: problem.quizConfig.options as { id: string; text: string }[] | undefined,
        correctOptionId: problem.quizConfig.correctAnswer,
        correct: problem.quizConfig.correctAnswer === "true",
        acceptableAnswers: problem.quizConfig.correctAnswer.split("|"),
        explanation: problem.quizConfig.explanation || undefined,
      },
    };
  }

  // 代码题目
  const editableFilenames = (problem.editableFiles as string[]) || [];
  const readonlyFilenames = (problem.readonlyFiles as string[]) || [];
  
  // 数据库中存储的初始代码模板（优先级最高）
  const dbInitialCode = (problem as { initialCode?: Record<string, string> }).initialCode;
  
  // 学生版资源路径（无答案）
  const studentDirPath = problem.resourcePath ? path.join(STUDENT_RESOURCES, problem.resourcePath) : null;
  // 原始资源路径（用于只读文件，如 README）
  const originalDirPath = problem.resourcePath ? path.join(PROJECT_ROOT, problem.resourcePath) : null;

  // 读取可编辑文件
  // 优先级：1. 数据库 initialCode  2. student_resources  3. 原始目录  4. 默认模板
  const initialFiles: Record<string, string> = {};
  for (const filename of editableFilenames) {
    let content = getDefaultContent(filename);
    
    // 1. 优先使用数据库中存储的初始代码
    if (dbInitialCode && dbInitialCode[filename]) {
      content = dbInitialCode[filename];
    }
    // 2. 尝试从学生资源目录读取（无答案）
    else if (studentDirPath) {
      try {
        content = await fs.readFile(path.join(studentDirPath, filename), "utf-8");
      } catch {
        // 3. 如果学生版不存在，回退到原始目录
        if (originalDirPath) {
          try {
            content = await fs.readFile(path.join(originalDirPath, filename), "utf-8");
          } catch {
            // 保持默认内容
          }
        }
      }
    }
    
    initialFiles[filename] = content;
  }

  // 读取只读文件（从原始资源读取，如 README, test.c 等）
  const readonlyFiles: Record<string, string> = {};
  for (const filename of readonlyFilenames) {
    if (originalDirPath) {
      try {
        readonlyFiles[filename] = await fs.readFile(path.join(originalDirPath, filename), "utf-8");
      } catch {
        // 只读文件读取失败不填充
      }
    }
  }

  const displayType = problem.displayType;
  const kind = displayType === "reading" ? ("reading" as const) : ("code" as const);

  return {
    kind,
    problem,
    displayType,
    description: problem.descriptionZh || "暂无题目描述",
    initialCode: editableFilenames.length > 0 ? initialFiles[editableFilenames[0]] || "" : "",
    initialFiles,
    editableFilenames,
    readonlyFiles,
    readonlyFilenames,
    learningGoals: (problem.learningGoals as string[]) || [],
    hints: (problem.hints as string[]) || [],
    judgeConfig: problem.judgeConfig,
  };
}

function getDefaultContent(filename: string): string {
  if (filename.endsWith(".c")) {
    return `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // 在这里编写你的代码
    
    return EXIT_SUCCESS;
}
`;
  }
  if (filename.endsWith(".h")) {
    const guard = filename.replace(".h", "_H").toUpperCase();
    return `#ifndef ${guard}
#define ${guard}

// 在这里添加声明

#endif
`;
  }
  if (filename === "Makefile") {
    return `# Makefile

all: main

main: main.c
\tgcc -o main -Wall -Werror main.c

clean:
\trm -f main
`;
  }
  if (filename.endsWith(".txt")) {
    return "";
  }
  return "// 请编写你的代码\n";
}

// ============================================================
// 提交记录
// ============================================================

/**
 * 创建提交记录
 */
export async function createSubmission(data: {
  problemId: string;
  files: Record<string, string>;
  sessionId?: string;
  userId: string;
}) {
  return prisma.submission.create({
    data: {
      problemId: data.problemId,
      files: data.files,
      userId: data.userId,
      status: "pending",
    },
  });
}

/**
 * 更新提交结果
 */
export async function updateSubmissionResult(
  id: string,
  result: {
    status: "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit_exceeded" | "system_error";
    score: number;
    logs: string[];
    compileTimeMs?: number;
    runTimeMs?: number;
    memoryKb?: number;
  }
) {
  return prisma.submission.update({
    where: { id },
    data: {
      status: result.status,
      score: result.score,
      logs: result.logs,
      judgedAt: new Date(),
      compileTimeMs: result.compileTimeMs,
      runTimeMs: result.runTimeMs,
      memoryKb: result.memoryKb,
    },
  });
}

/**
 * 获取题目提交历史
 */
export async function getSubmissionHistory(problemId: string, limit = 10) {
  return prisma.submission.findMany({
    where: { problemId },
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
}

/**
 * 获取用户提交历史
 */
export async function getUserSubmissions(userId: string, limit = 50) {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { submittedAt: "desc" },
    take: limit,
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          points: true,
        },
      },
    },
  });
}

