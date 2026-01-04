import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取所有课程（包含学生数和邀请码数）
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: {
        // 教师只能看自己的课程，管理员可以看所有
        ...(session.user.role === "teacher" ? { teacherId: session.user.id } : {}),
      },
      include: {
        teacher: {
          select: { id: true, displayName: true, username: true },
        },
        _count: {
          select: {
            students: true,
            inviteCodes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("[Admin] Get courses error:", error);
    return NextResponse.json({ error: "获取课程失败" }, { status: 500 });
  }
}

// 创建新课程
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, description, startDate, endDate, dailyStartTime, dailyEndTime } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "课程代码和名称必填" }, { status: 400 });
    }

    // 检查课程代码是否已存在
    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "课程代码已存在" }, { status: 409 });
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        teacherId: session.user.id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dailyStartTime: dailyStartTime ? new Date(`1970-01-01T${dailyStartTime}:00`) : null,
        dailyEndTime: dailyEndTime ? new Date(`1970-01-01T${dailyEndTime}:00`) : null,
      },
    });

    // 自动创建一个学生邀请码
    const inviteCode = generateInviteCode();
    await prisma.inviteCode.create({
      data: {
        code: inviteCode,
        inviteType: "student",
        courseId: course.id,
        createdBy: session.user.id,
        maxUses: 9999,
        isActive: true,
      },
    });

    return NextResponse.json({ course, inviteCode });
  } catch (error) {
    console.error("[Admin] Create course error:", error);
    return NextResponse.json({ error: "创建课程失败" }, { status: 500 });
  }
}

// 生成随机邀请码
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
