import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import bcrypt from "bcryptjs";

// 批量导入学生到指定课程
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { data, courseId } = body;

    if (!data || typeof data !== "string") {
      return NextResponse.json({ error: "请提供 CSV 数据" }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: "请选择目标课程" }, { status: 400 });
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

    // 解析 CSV
    const lines = data.trim().split("\n").filter((line: string) => line.trim());
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // 默认密码
    const defaultPasswordHash = await bcrypt.hash("123456", 10);

    for (const line of lines) {
      // 跳过标题行
      if (line.includes("学号") || line.includes("studentId") || line.includes("用户名")) {
        continue;
      }

      const parts = line.split(",").map((p: string) => p.trim());
      if (parts.length < 2) {
        failed++;
        errors.push(`格式错误: ${line}`);
        continue;
      }

      const [studentId, username, displayName, className] = parts;

      if (!username) {
        failed++;
        errors.push(`用户名为空: ${line}`);
        continue;
      }

      try {
        // 检查用户名是否已存在
        let user = await prisma.user.findUnique({
          where: { username },
        });

        // 检查学号是否已存在（如果提供了学号）
        if (!user && studentId) {
          const existingStudentId = await prisma.user.findUnique({
            where: { studentId },
          });
          if (existingStudentId) {
            user = existingStudentId;
          }
        }

        if (user) {
          // 用户已存在，检查是否已在课程中
          const existingEnrollment = await prisma.courseStudent.findUnique({
            where: {
              courseId_studentId: { courseId, studentId: user.id },
            },
          });

          if (existingEnrollment) {
            failed++;
            errors.push(`已在课程中: ${username}`);
            continue;
          }

          // 加入课程
          await prisma.courseStudent.create({
            data: { courseId, studentId: user.id },
          });
          success++;
        } else {
          // 创建新用户
          const newUser = await prisma.user.create({
            data: {
              studentId: studentId || null,
              username,
              displayName: displayName || null,
              className: className || null,
              passwordHash: defaultPasswordHash,
              role: "student",
              isActive: true,
            },
          });

          // 加入课程
          await prisma.courseStudent.create({
            data: { courseId, studentId: newUser.id },
          });
          success++;
        }
      } catch (err: unknown) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`处理失败: ${username} - ${message}`);
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 10), // 只返回前10个错误
    });
  } catch (error) {
    console.error("[Admin] Import students error:", error);
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}
