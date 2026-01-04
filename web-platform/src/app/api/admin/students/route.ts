import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 获取所有学生（包含课程关联信息）
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    // 检查 prisma.user 是否可用
    if (!prisma.user) {
      return NextResponse.json({ students: [], _warning: "数据库模型未加载" });
    }

    const users = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentId: true,
        username: true,
        displayName: true,
        className: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        courseStudents: {
          include: {
            course: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    // 转换数据结构
    const students = users.map((u) => ({
      id: u.id,
      studentId: u.studentId,
      username: u.username,
      displayName: u.displayName,
      className: u.className,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
      courses: u.courseStudents.map((cs) => ({
        courseId: cs.course.id,
        course: cs.course,
        joinedAt: cs.joinedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("[Admin] Get students error:", error);
    return NextResponse.json({ students: [], error: "获取学生列表失败" });
  }
}

// 添加单个学生（并加入课程）
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, username, displayName, className, courseId } = body;

    if (!username) {
      return NextResponse.json({ error: "用户名必填" }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: "请选择课程" }, { status: 400 });
    }

    // 检查 prisma.user 是否可用
    if (!prisma.user) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    // 验证课程存在和权限
    const targetCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!targetCourse) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    if (session.user.role === "teacher" && targetCourse.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权向此课程添加学生" }, { status: 403 });
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
    }

    // 检查学号是否已存在
    if (studentId) {
      const existingStudentId = await prisma.user.findUnique({
        where: { studentId },
      });
      if (existingStudentId) {
        return NextResponse.json({ error: "学号已存在" }, { status: 400 });
      }
    }

    // 创建用户（默认密码 123456）
    const passwordHash = await bcrypt.hash("123456", 10);

    const user = await prisma.user.create({
      data: {
        studentId: studentId || null,
        username,
        displayName: displayName || null,
        className: className || null,
        passwordHash,
        role: "student",
        isActive: true,
      },
    });

    // 加入课程
    await prisma.courseStudent.create({
      data: {
        courseId,
        studentId: user.id,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[Admin] Add student error:", error);
    return NextResponse.json({ error: "添加学生失败" }, { status: 500 });
  }
}
