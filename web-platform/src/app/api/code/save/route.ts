import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 保存代码草稿
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { problemId, files } = body;

    if (!problemId || !files) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    if (!prisma.codeDraft) {
      return NextResponse.json({ error: "数据库未就绪" }, { status: 500 });
    }

    // 使用 upsert 更新或创建
    await prisma.codeDraft.upsert({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
      update: {
        files,
        lastSavedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        problemId,
        files,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Code] Save error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

