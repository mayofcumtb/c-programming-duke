import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个课程详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, displayName: true, username: true },
        },
        classes: {
          include: {
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    // 验证权限
    if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权访问此课程" }, { status: 403 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[Admin] Get course error:", error);
    return NextResponse.json({ error: "获取课程失败" }, { status: 500 });
  }
}

// 更新课程
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    // 验证课程存在和权限
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    if (session.user.role === "teacher" && course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "无权修改此课程" }, { status: 403 });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ course: updated });
  } catch (error) {
    console.error("[Admin] Update course error:", error);
    return NextResponse.json({ error: "更新课程失败" }, { status: 500 });
  }
}

// 删除课程
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      // 只有管理员可以删除课程
      return NextResponse.json({ error: "无权限，只有管理员可以删除课程" }, { status: 403 });
    }

    const { id } = await params;

    // 验证课程存在
    const course = await prisma.course.findUnique({
      where: { id },
      include: { classes: true },
    });

    if (!course) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    // 删除课程（级联删除班级）
    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Delete course error:", error);
    return NextResponse.json({ error: "删除课程失败" }, { status: 500 });
  }
}

