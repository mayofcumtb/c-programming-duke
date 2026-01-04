import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 查找会话
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            studentId: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      // Token 无效，清除 cookie
      const response = NextResponse.json({ error: "会话无效" }, { status: 401 });
      response.cookies.delete("auth_token");
      return response;
    }

    if (new Date() > session.expiresAt) {
      // 删除过期会话
      await prisma.userSession.delete({ where: { id: session.id } });
      const response = NextResponse.json({ error: "会话已过期" }, { status: 401 });
      response.cookies.delete("auth_token");
      return response;
    }

    if (!session.user.isActive) {
      return NextResponse.json({ error: "账号已被禁用" }, { status: 403 });
    }

    // 获取学生的课程信息
    let courses: { id: string; code: string; name: string }[] = [];
    if (session.user.role === "student") {
      const courseStudents = await prisma.courseStudent.findMany({
        where: { studentId: session.user.id },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });
      courses = courseStudents.map((cs) => cs.course);
    } else if (session.user.role === "teacher") {
      const teacherCourses = await prisma.course.findMany({
        where: { teacherId: session.user.id },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });
      courses = teacherCourses;
    }

    return NextResponse.json({
      user: session.user,
      courses,
    });
  } catch (error) {
    console.error("[Auth] Get me error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}

