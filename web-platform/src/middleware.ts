import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 公开路由（无需登录）
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/validate-invite",
  "/api/auth/logout",
];

// 管理员/教师路由
const adminPaths = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源跳过
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // API 路由让各自的 handler 处理认证
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 检查是否是公开路由
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // 获取认证 token
  const token = request.cookies.get("auth_token")?.value;

  // 未登录用户访问非公开路由 -> 重定向到登录
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户访问登录/注册页面 -> 检查 token 是否有效（通过检查 cookie 格式）
  // 注意：完整验证在 /api/auth/me 中进行，这里只做基本检查
  if (token && (pathname === "/login" || pathname === "/register")) {
    // 如果 token 格式明显无效，清除并允许访问登录页
    if (token.length < 32) {
      const response = NextResponse.next();
      response.cookies.delete("auth_token");
      return response;
    }
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api 路由（在 API 内部处理认证）
     * - _next 静态文件
     * - 图片等静态资源
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

