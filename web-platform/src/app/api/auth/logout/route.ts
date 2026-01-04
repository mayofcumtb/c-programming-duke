import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

async function handleLogout(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      // 删除会话
      try {
        await prisma.userSession.deleteMany({
          where: { token },
        });
      } catch (e) {
        console.warn("[Auth] Failed to delete session from DB:", e);
      }
    }

    // 重定向到登录页面，并清除 cookie
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    // 即使出错也尝试重定向并清除 cookie
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

