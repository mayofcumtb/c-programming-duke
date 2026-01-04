import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 获取单个题目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!prisma.problem) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        judgeConfig: true,
        quizConfig: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    return NextResponse.json({ problem });
  } catch (error) {
    console.error("[Admin] Get problem error:", error);
    return NextResponse.json({ error: "获取题目失败" }, { status: 500 });
  }
}

// 更新题目
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!prisma.problem) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: {
        title: body.title,
        descriptionZh: body.descriptionZh,
        problemType: body.problemType,
        displayType: body.displayType,
        difficulty: body.difficulty,
        points: body.points,
        isActive: body.isActive,
        editableFiles: body.editableFiles,
        readonlyFiles: body.readonlyFiles,
        learningGoals: body.learningGoals,
        hints: body.hints,
      },
    });

    return NextResponse.json({ success: true, problem });
  } catch (error) {
    console.error("[Admin] Update problem error:", error);
    return NextResponse.json({ error: "更新题目失败" }, { status: 500 });
  }
}

// 删除题目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!prisma.problem) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    // 先删除关联的配置
    await prisma.judgeConfig.deleteMany({ where: { problemId: id } });
    await prisma.quizConfig.deleteMany({ where: { problemId: id } });

    // 删除题目
    await prisma.problem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Delete problem error:", error);
    return NextResponse.json({ error: "删除题目失败" }, { status: 500 });
  }
}

