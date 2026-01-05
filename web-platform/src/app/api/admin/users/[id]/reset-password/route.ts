import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 重置用户密码
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "密码长度至少6位" }, { status: 400 });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 使用 PostgreSQL 的 crypt 函数加密密码
    await prisma.$executeRaw`
      UPDATE users 
      SET password_hash = crypt(${newPassword}, gen_salt('bf'))
      WHERE id::text = ${id}
    `;

    // 删除该用户的所有会话（强制重新登录）
    await prisma.userSession.deleteMany({
      where: { userId: id },
    });

    return NextResponse.json({ 
      success: true, 
      message: `用户 ${user.username} 的密码已重置` 
    });
  } catch (error) {
    console.error("[Admin] Reset password error:", error);
    return NextResponse.json({ error: "重置密码失败" }, { status: 500 });
  }
}
