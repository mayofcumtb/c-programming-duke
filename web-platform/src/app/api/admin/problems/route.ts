import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 获取所有题目
export async function GET() {
  try {
    if (!prisma.problem) {
      return NextResponse.json({ problems: [], _warning: "数据库模型未加载" });
    }

    const problems = await prisma.problem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        problemType: true,
        displayType: true,
        difficulty: true,
        points: true,
        isActive: true,
        moduleId: true,
      },
    });

    return NextResponse.json({ problems });
  } catch (error) {
    console.error("[Admin] Get problems error:", error);
    return NextResponse.json({ problems: [], error: "获取题目列表失败" });
  }
}

// 添加题目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, moduleId, problemType, displayType, difficulty, points, descriptionZh } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "题目ID和标题必填" }, { status: 400 });
    }

    if (!prisma.problem) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    // 检查是否已存在
    const existing = await prisma.problem.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json({ error: "题目ID已存在" }, { status: 400 });
    }

    const problem = await prisma.problem.create({
      data: {
        id,
        title,
        moduleId: moduleId || null,
        problemType: problemType || "compile_run",
        displayType: displayType || "standard",
        difficulty: difficulty || "basic",
        points: points || 10,
        descriptionZh: descriptionZh || "",
        editableFiles: [],
        readonlyFiles: [],
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, problem });
  } catch (error) {
    console.error("[Admin] Add problem error:", error);
    return NextResponse.json({ error: "添加题目失败" }, { status: 500 });
  }
}

