import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getProblemById, createSubmission, updateSubmissionResult } from "@/lib/problem-service";
import { getEditableFilenames, getProblemKind, getQuizProblem } from "@/lib/problems";
import { getSession } from "@/lib/auth";

// 判题服务地址（docker-compose 服务）
const JUDGE_SERVICE_URL = process.env.JUDGE_SERVICE_URL || "http://localhost:9090";

// 是否使用 Docker 服务（开发模式可以关闭）
const USE_DOCKER_SERVICE = process.env.USE_DOCKER_SERVICE !== "false";

// 是否使用数据库（如果数据库未就绪可以临时关闭）
const USE_DATABASE = process.env.USE_DATABASE !== "false";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemId, code, files, answer, sessionId } = body;

    if (!problemId) {
      return NextResponse.json({ error: "Missing problemId" }, { status: 400 });
    }

    // 获取当前登录用户
    let userId: string | undefined;
    try {
      const session = await getSession();
      userId = session?.user?.id;
    } catch (e) {
      console.warn("[API] Failed to get session:", e);
    }

    console.log(`[API] Received submission for ${problemId} from user ${userId || "anonymous"}`);

    // 获取题目信息
    let problem;
    if (USE_DATABASE) {
      try {
        problem = await getProblemById(problemId);
        if (!problem) {
          console.warn(`[API] Problem not found in DB: ${problemId}, falling back to static config`);
        }
      } catch (dbError) {
        console.warn(`[API] Database error, falling back to static config:`, dbError);
        // 数据库连接失败时继续，使用静态配置
      }
    }

    // ===== 导读/阅读题目处理 =====
    const staticKind = getProblemKind(problemId);
    
    if (staticKind === "intro" || staticKind === "reading") {
      // 导读和阅读类型，直接标记为完成
      const logs = ["✓ 阅读完成！"];
      
      // 保存到数据库
      if (USE_DATABASE && userId) {
        try {
          const { createSubmission, updateSubmissionResult } = await import("@/lib/problem-service");
          const submission = await createSubmission({
            problemId,
            files: {},
            sessionId: body.sessionId || undefined,
            userId,
          });
          await updateSubmissionResult(submission.id, {
            status: "accepted",
            score: 100,
            logs,
          });
        } catch (e) {
          console.warn("[API] Failed to save reading completion:", e);
        }
      }
      
      return NextResponse.json({ status: "accepted", score: 100, logs });
    }

    // ===== Quiz 题目处理 =====
    if (problem?.problemType === "quiz" && problem.quizConfig) {
      return handleQuizSubmission(problem, answer);
    }
    
    // 静态 Quiz fallback
    if (staticKind === "quiz") {
      const quiz = getQuizProblem(problemId);
      if (quiz) {
        const result = handleStaticQuizSubmissionInternal(quiz, answer);
        
        // 保存 Quiz 结果到数据库
        if (USE_DATABASE && userId) {
          try {
            const { createSubmission, updateSubmissionResult } = await import("@/lib/problem-service");
            const submission = await createSubmission({
              problemId,
              files: { answer: JSON.stringify(answer) },
              sessionId: body.sessionId || undefined,
              userId,
            });
            await updateSubmissionResult(submission.id, {
              status: result.status as "accepted" | "wrong_answer",
              score: result.score,
              logs: result.logs,
            });
          } catch (e) {
            console.warn("[API] Failed to save quiz result:", e);
          }
        }
        
        return NextResponse.json(result);
      }
    }

    // ===== 代码题目处理 =====

    // 1. 解析文件（优先数据库，其次静态配置）
    let editableFiles = (problem?.editableFiles as string[]) || [];
    if (editableFiles.length === 0) {
      editableFiles = getEditableFilenames(problemId);
    }
    const single = editableFiles[0] || "student.c";
    const allowedSet = new Set(editableFiles.map((f) => path.basename(f)));
    if (allowedSet.size === 0) allowedSet.add(single);

    let toWrite: Record<string, string> = {};
    if (files && typeof files === "object") {
      toWrite = files as Record<string, string>;
    } else if (typeof code === "string") {
      toWrite = { [single]: code };
    } else {
      return NextResponse.json({ error: "Missing code or files" }, { status: 400 });
    }

    // 验证文件名
    for (const [name, content] of Object.entries(toWrite)) {
      const base = path.basename(name);
      if (base !== name) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
      }
      if (!allowedSet.has(base)) {
        return NextResponse.json({ error: `Filename not allowed: ${base}` }, { status: 400 });
      }
      if (typeof content !== "string") {
        return NextResponse.json({ error: "Invalid file content" }, { status: 400 });
      }
    }

    // 2. 创建提交记录
    let submissionId = Date.now().toString();
    if (USE_DATABASE && userId) {
      try {
        const submission = await createSubmission({
          problemId,
          files: toWrite,
          sessionId: sessionId || undefined,
          userId,
        });
        submissionId = submission.id;
      } catch (e) {
        console.warn("[API] Failed to create submission record:", e);
        // 继续处理，不阻塞判题
      }
    }

    // 3. 写入临时目录
    const tmpDir = path.join(process.cwd(), "tmp", "submissions", submissionId);
    await fs.mkdir(tmpDir, { recursive: true });
    await Promise.all(
      Object.entries(toWrite).map(([name, content]) => 
        fs.writeFile(path.join(tmpDir, path.basename(name)), content)
      )
    );

    console.log(`[API] Files written to ${tmpDir}`);

    // 4. 调用判题服务
    let result;
    if (USE_DOCKER_SERVICE) {
      result = await callJudgeService(problemId, submissionId);
    } else {
      result = await localJudge(problemId, tmpDir);
    }

    // 5. 更新提交记录
    if (USE_DATABASE && submissionId.length > 20) {
      // UUID 格式的 submissionId
      try {
        await updateSubmissionResult(submissionId, {
          status: result.status as "accepted" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit_exceeded" | "system_error",
          score: result.score || 0,
          logs: result.logs || [],
        });
      } catch (e) {
        console.warn("[API] Failed to update submission record:", e);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * 处理静态 Quiz 提交的内部逻辑 (返回结果对象)
 */
function handleStaticQuizSubmissionInternal(quiz: ReturnType<typeof getQuizProblem>, answer: unknown): { status: string; score: number; logs: string[] } {
  if (!quiz) {
    return { status: "error", score: 0, logs: ["Quiz not found"] };
  }

  if (!answer || typeof answer !== "object") {
    return { status: "error", score: 0, logs: ["Missing answer"] };
  }

  const answerKind = (answer as { kind?: unknown }).kind;
  const value = (answer as { value?: unknown }).value;
  let correct = false;

  if (quiz.kind === "single") {
    correct = answerKind === "single" && typeof value === "string" && value === quiz.correctOptionId;
  } else if (quiz.kind === "true_false") {
    correct = answerKind === "true_false" && typeof value === "boolean" && value === quiz.correct;
  } else if (quiz.kind === "fill") {
    if (answerKind === "fill" && typeof value === "string") {
      const normalized = value.replace(/\s+/g, "");
      correct = quiz.acceptableAnswers.some((a) => a.replace(/\s+/g, "") === normalized);
    }
  }

  const logs: string[] = [];
  if (correct) {
    logs.push("✓ 回答正确！");
    if (quiz.explanation) logs.push("💡 解析：" + quiz.explanation);
    return { status: "accepted", score: 100, logs };
  }

  logs.push("✗ 回答错误。");
  if (quiz.explanation) logs.push("💡 解析：" + quiz.explanation);
  return { status: "wrong_answer", score: 0, logs };
}

/**
 * 处理静态 Quiz 提交 (fallback) - 返回 NextResponse
 */
function handleStaticQuizSubmission(quiz: ReturnType<typeof getQuizProblem>, answer: unknown) {
  const result = handleStaticQuizSubmissionInternal(quiz, answer);
  if (result.status === "error") {
    return NextResponse.json({ error: result.logs[0] }, { status: 400 });
  }
  return NextResponse.json(result);
}

/**
 * 处理 Quiz 题目提交 (from database)
 */
function handleQuizSubmission(problem: Awaited<ReturnType<typeof getProblemById>>, answer: unknown) {
  const quiz = problem?.quizConfig;
  if (!quiz) {
    return NextResponse.json({ error: "Quiz config not found" }, { status: 404 });
  }

  if (!answer || typeof answer !== "object") {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }

  const answerKind = (answer as { kind?: unknown }).kind;
  const value = (answer as { value?: unknown }).value;
  let correct = false;

  if (quiz.quizType === "single") {
    correct = answerKind === "single" && typeof value === "string" && value === quiz.correctAnswer;
  } else if (quiz.quizType === "true_false") {
    correct = answerKind === "true_false" && typeof value === "boolean" && String(value) === quiz.correctAnswer;
  } else if (quiz.quizType === "fill") {
    if (answerKind === "fill" && typeof value === "string") {
      const normalized = value.replace(/\s+/g, "");
      const acceptableAnswers = quiz.correctAnswer.split("|");
      correct = acceptableAnswers.some((a) => a.replace(/\s+/g, "") === normalized);
    }
  }

  const logs: string[] = [];
  if (correct) {
    logs.push("✓ 回答正确！");
    if (quiz.explanation) logs.push("💡 解析：" + quiz.explanation);
    return NextResponse.json({ status: "accepted", score: 100, logs });
  }

  logs.push("✗ 回答错误。");
  if (quiz.explanation) logs.push("💡 解析：" + quiz.explanation);
  return NextResponse.json({ status: "wrong_answer", score: 0, logs });
}

/**
 * 调用 Docker 判题服务
 */
async function callJudgeService(problemId: string, submissionId: string) {
  try {
    console.log(`[API] Calling judge service: ${JUDGE_SERVICE_URL}/judge`);

    const response = await fetch(`${JUDGE_SERVICE_URL}/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_id: problemId,
        submission_id: submissionId,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Judge service error: ${response.status} - ${text}`);
      return {
        status: "system_error",
        score: 0,
        logs: ["判题服务返回错误", `状态码: ${response.status}`, text],
      };
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Judge service call failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
        return {
          status: "system_error",
          score: 0,
          logs: [
            "❌ 判题服务未启动",
            "请运行以下命令启动判题服务：",
            "cd web-platform && docker-compose up -d",
          ],
        };
      }
      if (error.name === "TimeoutError") {
        return {
          status: "time_limit_exceeded",
          score: 0,
          logs: ["判题超时（超过 60 秒）"],
        };
      }
    }

    return {
      status: "system_error",
      score: 0,
      logs: ["判题服务调用失败", String(error)],
    };
  }
}

/**
 * 本地判题（开发模式）
 */
async function localJudge(problemId: string, workDir: string) {
  const { exec } = await import("child_process");
  const util = await import("util");
  const execPromise = util.promisify(exec);

  try {
    const files = await fs.readdir(workDir);
    const cFiles = files.filter((f) => f.endsWith(".c"));

    if (cFiles.length === 0) {
      const txtFiles = files.filter((f) => f.endsWith(".txt"));
      if (txtFiles.length > 0) {
        return {
          status: "accepted",
          score: 100,
          logs: ["✓ 文件已提交（本地开发模式）"],
        };
      }
      return {
        status: "runtime_error",
        score: 0,
        logs: ["未找到可编译的文件"],
      };
    }

    const srcFile = cFiles[0];
    try {
      await execPromise(`gcc -o main ${srcFile}`, { cwd: workDir });
    } catch (e) {
      return {
        status: "compile_error",
        score: 0,
        logs: ["编译失败", String(e)],
      };
    }

    try {
      const { stdout } = await execPromise("./main", { cwd: workDir, timeout: 5000 });
      return {
        status: "accepted",
        score: 100,
        logs: ["✓ 程序运行成功（本地开发模式）", "--- 输出 ---", stdout],
      };
    } catch (e) {
      return {
        status: "runtime_error",
        score: 0,
        logs: ["运行失败", String(e)],
      };
    }
  } catch (error) {
    return {
      status: "system_error",
      score: 0,
      logs: ["本地判题错误", String(error)],
    };
  }
}
