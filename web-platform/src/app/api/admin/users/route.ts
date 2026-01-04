import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: {
        AND: [
          searchTerm
            ? {
                OR: [
                  { username: { contains: searchTerm, mode: "insensitive" } },
                  { displayName: { contains: searchTerm, mode: "insensitive" } },
                  { studentId: { contains: searchTerm, mode: "insensitive" } },
                  { email: { contains: searchTerm, mode: "insensitive" } },
                ],
              }
            : {},
          roleFilter ? { role: roleFilter as any } : {},
        ],
      },
      select: {
        id: true,
        username: true,
        studentId: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Admin] Get users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: {
        AND: [
          searchTerm
            ? {
                OR: [
                  { username: { contains: searchTerm, mode: "insensitive" } },
                  { displayName: { contains: searchTerm, mode: "insensitive" } },
                  { studentId: { contains: searchTerm, mode: "insensitive" } },
                  { email: { contains: searchTerm, mode: "insensitive" } },
                ],
              }
            : {},
          roleFilter ? { role: roleFilter as any } : {},
        ],
      },
      select: {
        id: true,
        username: true,
        studentId: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Admin] Get users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getSession, canAccess } from "@/lib/auth";

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canAccess(session.user, "admin")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: {
        AND: [
          searchTerm
            ? {
                OR: [
                  { username: { contains: searchTerm, mode: "insensitive" } },
                  { displayName: { contains: searchTerm, mode: "insensitive" } },
                  { studentId: { contains: searchTerm, mode: "insensitive" } },
                  { email: { contains: searchTerm, mode: "insensitive" } },
                ],
              }
            : {},
          roleFilter ? { role: roleFilter as any } : {},
        ],
      },
      select: {
        id: true,
        username: true,
        studentId: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Admin] Get users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}


