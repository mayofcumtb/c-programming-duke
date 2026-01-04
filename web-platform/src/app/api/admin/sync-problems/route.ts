import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import { courseStages } from "@/lib/courses";

// 同步静态课程结构到数据库
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let stageOrder = 0;

    for (const stage of courseStages) {
      stageOrder++;
      let moduleOrder = 0;

      // 创建或更新 Stage
      const existingStage = await prisma.stage.findUnique({
        where: { id: stage.id },
      });

      if (!existingStage) {
        await prisma.stage.create({
          data: {
            id: stage.id,
            title: stage.title,
            description: stage.description || null,
            sortOrder: stageOrder,
            isActive: true,
          },
        });
      }

      for (const mod of stage.modules) {
        moduleOrder++;

        // 创建或更新 Module
        const existingModule = await prisma.module.findUnique({
          where: { id: mod.id },
        });

        if (!existingModule) {
          await prisma.module.create({
            data: {
              id: mod.id,
              stageId: stage.id,
              title: mod.title,
              sortOrder: moduleOrder,
              isActive: true,
            },
          });
        }

        let exerciseOrder = 0;
        for (const exercise of mod.exercises) {
          exerciseOrder++;

          // 确定题目类型
          let problemType: "code" | "quiz" | "reading" = "code";
          let displayType: "code" | "reading" | "quiz" = "code";
          
          if (exercise.kind === "intro" || exercise.kind === "reading") {
            problemType = "reading";
            displayType = "reading";
          } else if (exercise.kind === "quiz") {
            problemType = "quiz";
            displayType = "quiz";
          }

          // 检查题目是否存在
          const existingProblem = await prisma.problem.findUnique({
            where: { id: exercise.id },
          });

          const difficultyMap: Record<string, string> = {
            '入门': 'beginner',
            '基础': 'basic',
            '进阶': 'intermediate',
            '挑战': 'advanced',
            '有趣': 'fun',
          };

          if (!existingProblem) {
            // 创建题目
            await prisma.problem.create({
              data: {
                id: exercise.id,
                moduleId: mod.id,
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || "basic",
                points: exercise.points,
                problemType,
                displayType,
                editableFiles: [],
                readonlyFiles: [],
                learningGoals: [],
                hints: [],
                sortOrder: exerciseOrder,
                isActive: true,
              },
            });
            createdCount++;
          } else {
            // 更新现有题目
            await prisma.problem.update({
              where: { id: exercise.id },
              data: {
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || existingProblem.difficulty,
                points: exercise.points,
                problemType,
                displayType,
                sortOrder: exerciseOrder,
              },
            });
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `同步完成：创建 ${createdCount} 个题目，更新 ${updatedCount} 个题目`,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error("[Admin] Sync problems error:", error);
    return NextResponse.json({ error: "同步失败: " + String(error) }, { status: 500 });
  }
}

// 获取同步状态
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const dbProblemCount = await prisma.problem.count();
    
    // 统计静态配置中的题目数
    let staticProblemCount = 0;
    for (const stage of courseStages) {
      for (const mod of stage.modules) {
        staticProblemCount += mod.exercises.length;
      }
    }

    return NextResponse.json({
      dbProblemCount,
      staticProblemCount,
      needsSync: dbProblemCount < staticProblemCount,
    });
  } catch (error) {
    console.error("[Admin] Get sync status error:", error);
    return NextResponse.json({ error: "获取状态失败" }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import { courseStages } from "@/lib/courses";

// 同步静态课程结构到数据库
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let stageOrder = 0;

    for (const stage of courseStages) {
      stageOrder++;
      let moduleOrder = 0;

      // 创建或更新 Stage
      const existingStage = await prisma.stage.findUnique({
        where: { id: stage.id },
      });

      if (!existingStage) {
        await prisma.stage.create({
          data: {
            id: stage.id,
            title: stage.title,
            description: stage.description || null,
            sortOrder: stageOrder,
            isActive: true,
          },
        });
      }

      for (const mod of stage.modules) {
        moduleOrder++;

        // 创建或更新 Module
        const existingModule = await prisma.module.findUnique({
          where: { id: mod.id },
        });

        if (!existingModule) {
          await prisma.module.create({
            data: {
              id: mod.id,
              stageId: stage.id,
              title: mod.title,
              sortOrder: moduleOrder,
              isActive: true,
            },
          });
        }

        let exerciseOrder = 0;
        for (const exercise of mod.exercises) {
          exerciseOrder++;

          // 确定题目类型
          let problemType: "code" | "quiz" | "reading" = "code";
          let displayType: "code" | "reading" | "quiz" = "code";
          
          if (exercise.kind === "intro" || exercise.kind === "reading") {
            problemType = "reading";
            displayType = "reading";
          } else if (exercise.kind === "quiz") {
            problemType = "quiz";
            displayType = "quiz";
          }

          // 检查题目是否存在
          const existingProblem = await prisma.problem.findUnique({
            where: { id: exercise.id },
          });

          const difficultyMap: Record<string, string> = {
            '入门': 'beginner',
            '基础': 'basic',
            '进阶': 'intermediate',
            '挑战': 'advanced',
            '有趣': 'fun',
          };

          if (!existingProblem) {
            // 创建题目
            await prisma.problem.create({
              data: {
                id: exercise.id,
                moduleId: mod.id,
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || "basic",
                points: exercise.points,
                problemType,
                displayType,
                editableFiles: [],
                readonlyFiles: [],
                learningGoals: [],
                hints: [],
                sortOrder: exerciseOrder,
                isActive: true,
              },
            });
            createdCount++;
          } else {
            // 更新现有题目
            await prisma.problem.update({
              where: { id: exercise.id },
              data: {
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || existingProblem.difficulty,
                points: exercise.points,
                problemType,
                displayType,
                sortOrder: exerciseOrder,
              },
            });
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `同步完成：创建 ${createdCount} 个题目，更新 ${updatedCount} 个题目`,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error("[Admin] Sync problems error:", error);
    return NextResponse.json({ error: "同步失败: " + String(error) }, { status: 500 });
  }
}

// 获取同步状态
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const dbProblemCount = await prisma.problem.count();
    
    // 统计静态配置中的题目数
    let staticProblemCount = 0;
    for (const stage of courseStages) {
      for (const mod of stage.modules) {
        staticProblemCount += mod.exercises.length;
      }
    }

    return NextResponse.json({
      dbProblemCount,
      staticProblemCount,
      needsSync: dbProblemCount < staticProblemCount,
    });
  } catch (error) {
    console.error("[Admin] Get sync status error:", error);
    return NextResponse.json({ error: "获取状态失败" }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import { courseStages } from "@/lib/courses";

// 同步静态课程结构到数据库
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let stageOrder = 0;

    for (const stage of courseStages) {
      stageOrder++;
      let moduleOrder = 0;

      // 创建或更新 Stage
      const existingStage = await prisma.stage.findUnique({
        where: { id: stage.id },
      });

      if (!existingStage) {
        await prisma.stage.create({
          data: {
            id: stage.id,
            title: stage.title,
            description: stage.description || null,
            sortOrder: stageOrder,
            isActive: true,
          },
        });
      }

      for (const mod of stage.modules) {
        moduleOrder++;

        // 创建或更新 Module
        const existingModule = await prisma.module.findUnique({
          where: { id: mod.id },
        });

        if (!existingModule) {
          await prisma.module.create({
            data: {
              id: mod.id,
              stageId: stage.id,
              title: mod.title,
              sortOrder: moduleOrder,
              isActive: true,
            },
          });
        }

        let exerciseOrder = 0;
        for (const exercise of mod.exercises) {
          exerciseOrder++;

          // 确定题目类型
          let problemType: "code" | "quiz" | "reading" = "code";
          let displayType: "code" | "reading" | "quiz" = "code";
          
          if (exercise.kind === "intro" || exercise.kind === "reading") {
            problemType = "reading";
            displayType = "reading";
          } else if (exercise.kind === "quiz") {
            problemType = "quiz";
            displayType = "quiz";
          }

          // 检查题目是否存在
          const existingProblem = await prisma.problem.findUnique({
            where: { id: exercise.id },
          });

          const difficultyMap: Record<string, string> = {
            '入门': 'beginner',
            '基础': 'basic',
            '进阶': 'intermediate',
            '挑战': 'advanced',
            '有趣': 'fun',
          };

          if (!existingProblem) {
            // 创建题目
            await prisma.problem.create({
              data: {
                id: exercise.id,
                moduleId: mod.id,
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || "basic",
                points: exercise.points,
                problemType,
                displayType,
                editableFiles: [],
                readonlyFiles: [],
                learningGoals: [],
                hints: [],
                sortOrder: exerciseOrder,
                isActive: true,
              },
            });
            createdCount++;
          } else {
            // 更新现有题目
            await prisma.problem.update({
              where: { id: exercise.id },
              data: {
                title: exercise.title,
                titleZh: exercise.title,
                difficulty: difficultyMap[exercise.difficulty] || existingProblem.difficulty,
                points: exercise.points,
                problemType,
                displayType,
                sortOrder: exerciseOrder,
              },
            });
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `同步完成：创建 ${createdCount} 个题目，更新 ${updatedCount} 个题目`,
      createdCount,
      updatedCount,
    });
  } catch (error) {
    console.error("[Admin] Sync problems error:", error);
    return NextResponse.json({ error: "同步失败: " + String(error) }, { status: 500 });
  }
}

// 获取同步状态
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const dbProblemCount = await prisma.problem.count();
    
    // 统计静态配置中的题目数
    let staticProblemCount = 0;
    for (const stage of courseStages) {
      for (const mod of stage.modules) {
        staticProblemCount += mod.exercises.length;
      }
    }

    return NextResponse.json({
      dbProblemCount,
      staticProblemCount,
      needsSync: dbProblemCount < staticProblemCount,
    });
  } catch (error) {
    console.error("[Admin] Get sync status error:", error);
    return NextResponse.json({ error: "获取状态失败" }, { status: 500 });
  }
}


