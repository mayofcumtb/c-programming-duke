import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import crypto from "crypto";

// 生成随机邀请码
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 获取所有邀请码
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    if (!prisma.inviteCode) {
      return NextResponse.json({ invites: [] });
    }

    // 教师只能看到自己课程的邀请码，管理员可以看所有
    const whereCondition = session.user.role === "teacher"
      ? {
          OR: [
            { createdBy: session.user.id },
            { course: { teacherId: session.user.id } },
          ],
        }
      : {};

    const invites = await prisma.inviteCode.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return NextResponse.json({
      invites: invites.map((i) => ({
        id: i.id,
        code: i.code,
        inviteType: i.inviteType,
        courseId: i.courseId,
        courseCode: i.course?.code,
        courseName: i.course?.name,
        maxUses: i.maxUses,
        usedCount: i.usedCount,
        expiresAt: i.expiresAt?.toISOString(),
        isActive: i.isActive,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Admin] Get invites error:", error);
    return NextResponse.json({ invites: [] });
  }
}

// 创建邀请码
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { type, courseId, maxUses, expiresInDays } = body;

    if (!prisma.inviteCode) {
      return NextResponse.json({ error: "数据库未就绪" }, { status: 500 });
    }

    // 学生邀请码必须关联课程
    if (type === "student" && !courseId) {
      return NextResponse.json({ error: "学生邀请码必须关联课程" }, { status: 400 });
    }

    // 验证课程存在和权限
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return NextResponse.json({ error: "课程不存在" }, { status: 404 });
      }

      if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
        return NextResponse.json({ error: "无权为此课程创建邀请码" }, { status: 403 });
      }
    }

    const code = generateInviteCode();
    const expiresAt = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // 确保空字符串转为 null（UUID 不接受空字符串）
    const validCourseId = courseId && courseId.trim() ? courseId : null;

    const invite = await prisma.inviteCode.create({
      data: {
        code,
        inviteType: type,
        courseId: type === "student" ? validCourseId : null,
        maxUses: maxUses || 100,
        expiresAt,
        createdBy: session.user.id,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error("[Admin] Create invite error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
