import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, studentId, username, displayName, className, password } = body;

    if (!inviteCode || !username || !password) {
      return NextResponse.json({ error: "必填信息不完整" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度至少6位" }, { status: 400 });
    }

    // 验证邀请码
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.toUpperCase() },
    });

    if (!invite || !invite.isActive) {
      return NextResponse.json({ error: "邀请码无效" }, { status: 400 });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json({ error: "邀请码已过期" }, { status: 400 });
    }

    if (invite.usedCount >= invite.maxUses) {
      return NextResponse.json({ error: "邀请码使用次数已达上限" }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "用户名已被注册" }, { status: 400 });
    }

    // 检查学号是否已存在
    if (studentId) {
      const existingStudentId = await prisma.user.findUnique({
        where: { studentId },
      });
      if (existingStudentId) {
        return NextResponse.json({ error: "学号已被注册" }, { status: 400 });
      }
    }

    // 确定角色
    const role = invite.inviteType === "teacher" ? "teacher" : "student";

    // 创建用户（使用 PostgreSQL 的 crypt 函数加密密码）
    const userResult = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO users (id, username, student_id, display_name, class_name, password_hash, role, is_active, created_at)
      VALUES (
        gen_random_uuid(),
        ${username},
        ${studentId || null},
        ${displayName || null},
        ${className || null},
        crypt(${password}, gen_salt('bf')),
        ${role}::user_role,
        TRUE,
        NOW()
      )
      RETURNING id
    `;

    const userId = userResult[0]?.id;

    if (!userId) {
      return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
    }

    // 如果是学生且邀请码关联了课程，自动加入课程
    if (role === "student" && invite.courseId) {
      await prisma.courseStudent.create({
        data: {
          courseId: invite.courseId,
          studentId: userId,
        },
      });
    }

    // 更新邀请码使用次数
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: { usedCount: invite.usedCount + 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth] Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
