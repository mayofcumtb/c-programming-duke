import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 删除学生
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!prisma.user) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Delete student error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

// 更新学生
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!prisma.user) {
      return NextResponse.json({ error: "数据库模型未加载" }, { status: 500 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        displayName: body.displayName,
        className: body.className,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[Admin] Update student error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

