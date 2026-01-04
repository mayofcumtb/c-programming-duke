import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "请输入邀请码" }, { status: 400 });
    }

    // 查找邀请码
    const invite = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    }

    if (!invite.isActive) {
      return NextResponse.json({ error: "邀请码已失效" }, { status: 400 });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "邀请码已过期" }, { status: 400 });
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json({ error: "邀请码使用次数已达上限" }, { status: 400 });
    }

    return NextResponse.json({
      type: invite.inviteType,
      courseCode: invite.course?.code,
      courseName: invite.course?.name,
    });
  } catch (error) {
    console.error("[Auth] Validate invite error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
