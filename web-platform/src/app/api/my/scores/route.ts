import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { courseStages } from "@/lib/courses";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;

    // 获取学习行为统计
    let behaviorStats = {
      totalDuration: 0,      // 总学习时长（秒）
      activeDuration: 0,     // 活跃时长（秒）
      tabSwitches: 0,        // 切屏次数
      focusLostCount: 0,     // 失焦次数
      pagesVisited: 0,       // 访问页面数
      sessionsCount: 0,      // 会话数
    };

    try {
      if (prisma.learningSession) {
        // 查找该用户关联的所有学习会话
        const learningSessions = await prisma.learningSession.findMany({
          where: { userId },
        });

        for (const ls of learningSessions) {
          behaviorStats.totalDuration += ls.totalDurationSec || 0;
          behaviorStats.activeDuration += ls.activeDurationSec || 0;
          behaviorStats.tabSwitches += ls.tabSwitches || 0;
          behaviorStats.focusLostCount += ls.focusLostCount || 0;
          behaviorStats.sessionsCount += 1;
        }

        // 统计页面访问数
        if (learningSessions.length > 0) {
          const sessionIds = learningSessions.map(s => s.id);
          const pageVisitCount = await prisma.pageVisit.count({
            where: { sessionId: { in: sessionIds } },
          });
          behaviorStats.pagesVisited = pageVisitCount;
        }
      }
    } catch (e) {
      console.warn("[My] Failed to get behavior stats:", e);
    }

    // 获取用户的所有提交记录
    let submissions: Array<{
      problemId: string;
      score: number;
      status: string;
      submittedAt: Date;
    }> = [];
    
    try {
      if (prisma.submission) {
        submissions = await prisma.submission.findMany({
          where: { userId },
          orderBy: { submittedAt: "desc" },
          select: {
            problemId: true,
            score: true,
            status: true,
            submittedAt: true,
          },
        });
      }
    } catch (e) {
      console.warn("[My] Failed to get submissions:", e);
    }

    // 按题目分组，获取最高分
    const bestScores = new Map<string, { score: number; attempts: number; lastAttemptAt: Date; isCompleted: boolean }>();
    
    for (const sub of submissions) {
      const existing = bestScores.get(sub.problemId);
      if (!existing) {
        bestScores.set(sub.problemId, {
          score: sub.score,
          attempts: 1,
          lastAttemptAt: sub.submittedAt,
          isCompleted: sub.status === "accepted",
        });
      } else {
        existing.attempts += 1;
        if (sub.score > existing.score) {
          existing.score = sub.score;
        }
        if (sub.status === "accepted") {
          existing.isCompleted = true;
        }
      }
    }

    // 使用 courses.ts 中的课程结构（这是真正的数据源）
    let totalPoints = 0;
    let earnedPoints = 0;
    let completedProblems = 0;
    let totalProblems = 0;

    const stageResults = courseStages.map((stage) => {
      let stageTotal = 0;
      let stageEarned = 0;
      let stageCompleted = 0;

      const problems = stage.modules.flatMap((m) => m.exercises).map((exercise) => {
        const scoreData = bestScores.get(exercise.id);
        const maxPoints = exercise.points;
        // 对于 intro 和 reading 类型，如果有提交记录就算满分
        const isIntroOrReading = exercise.kind === 'intro' || exercise.kind === 'reading';
        let bestScore = 0;
        let isCompleted = false;
        
        if (scoreData) {
          // scoreData.score 是百分制 (0-100)，需要转换为实际分数
          const percentScore = scoreData.score; // 0-100
          
          if (isIntroOrReading) {
            // 导读和阅读：有提交记录就算满分
            bestScore = maxPoints;
            isCompleted = true;
          } else {
            // 其他题目：按比例计算实际分数
            bestScore = Math.round((percentScore / 100) * maxPoints);
            isCompleted = scoreData.isCompleted || percentScore === 100;
          }
        }

        stageTotal += maxPoints;
        stageEarned += bestScore;
        if (isCompleted) stageCompleted++;
        totalProblems++;

        // 难度映射
        const difficultyMap: Record<string, string> = {
          '入门': 'beginner',
          '基础': 'basic',
          '进阶': 'intermediate',
          '挑战': 'advanced',
          '有趣': 'fun',
        };

        return {
          problemId: exercise.id,
          title: exercise.title,
          difficulty: difficultyMap[exercise.difficulty] || exercise.difficulty,
          kind: exercise.kind || 'code',
          maxPoints,
          bestScore,
          attempts: scoreData?.attempts || 0,
          lastAttemptAt: scoreData?.lastAttemptAt?.toISOString() || null,
          isCompleted,
        };
      });

      totalPoints += stageTotal;
      earnedPoints += stageEarned;
      completedProblems += stageCompleted;

      return {
        stageId: stage.id,
        stageTitle: stage.title,
        problems,
        totalPoints: stageTotal,
        earnedPoints: stageEarned,
        completedCount: stageCompleted,
      };
    });

    // 最近提交 - 需要获取题目标题
    const exerciseMap = new Map<string, string>();
    for (const stage of courseStages) {
      for (const mod of stage.modules) {
        for (const ex of mod.exercises) {
          exerciseMap.set(ex.id, ex.title);
        }
      }
    }

    const recentSubmissions = submissions.slice(0, 10).map((sub) => ({
      problemId: sub.problemId,
      problemTitle: exerciseMap.get(sub.problemId) || sub.problemId,
      score: sub.score,
      status: sub.status,
      submittedAt: sub.submittedAt.toISOString(),
    }));

    return NextResponse.json({
      user: session.user,
      stages: stageResults,
      totalPoints,
      earnedPoints,
      completedProblems,
      totalProblems,
      recentSubmissions,
      behaviorStats,
    });
  } catch (error) {
    console.error("[My] Get scores error:", error);
    return NextResponse.json({ error: "获取成绩失败" }, { status: 500 });
  }
}
