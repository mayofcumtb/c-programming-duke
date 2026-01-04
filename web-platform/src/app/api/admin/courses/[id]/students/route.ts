import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取课程学生列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id: courseId } = await params;

    // 验证教师权限
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权限访问此课程" }, { status: 403 });
    }

    const courseStudents = await prisma.courseStudent.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            username: true,
            displayName: true,
            className: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      students: courseStudents.map((cs) => ({
        ...cs.student,
        joinedAt: cs.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Admin] Get course students error:", error);
    return NextResponse.json({ error: "获取课程学生失败" }, { status: 500 });
  }
}

// 添加学生到课程
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "请提供学生ID" }, { status: 400 });
    }

    // 验证教师权限
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权限管理此课程" }, { status: 403 });
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const studentId of studentIds) {
      try {
        // 检查是否已在课程中
        const existing = await prisma.courseStudent.findUnique({
          where: {
            courseId_studentId: { courseId, studentId },
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        await prisma.courseStudent.create({
          data: { courseId, studentId },
        });
        addedCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      skippedCount,
    });
  } catch (error) {
    console.error("[Admin] Add course students error:", error);
    return NextResponse.json({ error: "添加学生失败" }, { status: 500 });
  }
}

// 从课程移除学生
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id: courseId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "请提供学生ID" }, { status: 400 });
    }

    // 验证教师权限
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权限管理此课程" }, { status: 403 });
    }

    await prisma.courseStudent.delete({
      where: {
        courseId_studentId: { courseId, studentId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Remove course student error:", error);
    return NextResponse.json({ error: "移除学生失败" }, { status: 500 });
  }
}

