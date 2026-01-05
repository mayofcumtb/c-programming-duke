import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

// 简单的密码验证（生产环境应使用 bcrypt）
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // 由于我们使用 PostgreSQL 的 crypt 函数，需要在数据库中验证
  // 这里使用简化的方式
  try {
    const result = await prisma.$queryRaw<{ valid: boolean }[]>`
      SELECT (password_hash = crypt(${password}, password_hash)) as valid
      FROM users
      WHERE password_hash = ${hash}
    `;
    return result[0]?.valid ?? false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { studentId: username },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "账号已被禁用" }, { status: 403 });
    }

    // 验证密码
    const validResult = await prisma.$queryRaw<{ valid: boolean }[]>`
      SELECT (password_hash = crypt(${password}, password_hash)) as valid
      FROM users
      WHERE id::text = ${user.id}
    `;

    if (!validResult[0]?.valid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    // 生成会话 token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期

    // 获取客户端信息
    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0] || request.headers.get("x-real-ip") || "";

    // 创建会话
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: "登录失败", detail: errorMessage }, { status: 500 });
  }
}

