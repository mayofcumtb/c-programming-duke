import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 删除邀请码
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    if (!prisma.inviteCode) {
      return NextResponse.json({ error: "数据库未就绪" }, { status: 500 });
    }

    await prisma.inviteCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Delete invite error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

