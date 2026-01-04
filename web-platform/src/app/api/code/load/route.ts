import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// 加载代码草稿
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      return NextResponse.json({ error: "缺少 problemId" }, { status: 400 });
    }

    if (!prisma.codeDraft) {
      return NextResponse.json({ files: null });
    }

    const draft = await prisma.codeDraft.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId,
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ files: null });
    }

    return NextResponse.json({
      files: draft.files,
      lastSavedAt: draft.lastSavedAt.toISOString(),
    });
  } catch (error) {
    console.error("[Code] Load error:", error);
    return NextResponse.json({ files: null });
  }
}

