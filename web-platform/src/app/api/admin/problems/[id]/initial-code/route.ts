import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// 获取题目的初始代码（优先数据库，其次文件系统）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        editableFiles: true,
        resourcePath: true,
        initialCode: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const editableFiles = (problem.editableFiles as string[]) || [];
    let initialCode: Record<string, string> = {};

    // 优先使用数据库中的初始代码
    if (problem.initialCode) {
      initialCode = problem.initialCode as Record<string, string>;
    } else if (problem.resourcePath) {
      // 否则从文件系统加载（原始目录，包含答案）
      const projectRoot = path.resolve(process.cwd(), "..");
      const resourceDir = path.join(projectRoot, problem.resourcePath);

      for (const filename of editableFiles) {
        try {
          const content = await fs.readFile(
            path.join(resourceDir, filename),
            "utf-8"
          );
          initialCode[filename] = content;
        } catch {
          initialCode[filename] = getDefaultTemplate(filename);
        }
      }
    } else {
      // 没有资源路径，使用默认模板
      for (const filename of editableFiles) {
        initialCode[filename] = getDefaultTemplate(filename);
      }
    }

    return NextResponse.json({
      problem: {
        id: problem.id,
        title: problem.title,
        editableFiles,
      },
      initialCode,
      savedInDb: !!problem.initialCode,
    });
  } catch (error) {
    console.error("[Admin] Get initial code error:", error);
    return NextResponse.json({ error: "获取初始代码失败" }, { status: 500 });
  }
}

// 保存初始代码到数据库
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "teacher")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { initialCode } = body;

    if (!initialCode || typeof initialCode !== "object") {
      return NextResponse.json({ error: "无效的初始代码" }, { status: 400 });
    }

    await prisma.problem.update({
      where: { id },
      data: { initialCode },
    });

    return NextResponse.json({ success: true, message: "初始代码已保存" });
  } catch (error) {
    console.error("[Admin] Save initial code error:", error);
    return NextResponse.json({ error: "保存初始代码失败" }, { status: 500 });
  }
}

function getDefaultTemplate(filename: string): string {
  if (filename.endsWith(".c")) {
    return `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // TODO: 在这里编写你的代码
    
    return EXIT_SUCCESS;
}
`;
  }
  if (filename.endsWith(".h")) {
    const guard = filename.replace(".h", "_H").toUpperCase();
    return `#ifndef ${guard}
#define ${guard}

// TODO: 在这里添加声明

#endif
`;
  }
  if (filename.endsWith(".txt")) {
    return "";
  }
  return "// 请编写你的代码\n";
}

