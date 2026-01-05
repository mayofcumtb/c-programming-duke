import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取所有题目列表（用于管理）
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const problems = await prisma.problem.findMany({
      orderBy: [{ moduleId: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        title: true,
        problemType: true,
        difficulty: true,
        editableFiles: true,
        initialCode: true,
        module: {
          select: {
            id: true,
            title: true,
            stage: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // 转换数据格式
    const result = problems.map((p) => ({
      id: p.id,
      title: p.title,
      problemType: p.problemType,
      difficulty: p.difficulty,
      editableFiles: p.editableFiles,
      hasInitialCode: !!p.initialCode,
      module: p.module,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin] Get problems error:", error);
    return NextResponse.json({ error: "获取题目列表失败" }, { status: 500 });
  }
}
