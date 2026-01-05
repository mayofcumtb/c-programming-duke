import Link from "next/link";
import { BarChart3, Users, BookOpen, Home, Ticket, LogOut, Settings, FileText, UserCog, Code } from "lucide-react";
import { getSession, canAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 验证权限
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  if (!canAccess(session.user, "teacher")) {
    redirect("/courses");
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-900">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-6">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold text-white">教学管理</span>
          </div>

          {/* User Info */}
          <div className="border-b border-slate-700 px-6 py-4">
            <div className="text-sm text-slate-400">当前用户</div>
            <div className="text-white font-medium">{session.user.displayName || session.user.username}</div>
            <div className="text-xs text-slate-500">{session.user.role === "admin" ? "管理员" : "教师"}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/admin" icon={<Home className="h-5 w-5" />}>
              数据概览
            </NavLink>
            <NavLink href="/admin/courses" icon={<BookOpen className="h-5 w-5" />}>
              课程管理
            </NavLink>
            <NavLink href="/admin/students" icon={<Users className="h-5 w-5" />}>
              学生管理
            </NavLink>
            <NavLink href="/admin/invites" icon={<Ticket className="h-5 w-5" />}>
              邀请码管理
            </NavLink>
            <NavLink href="/admin/content" icon={<FileText className="h-5 w-5" />}>
              题目内容
            </NavLink>
            <NavLink href="/admin/problems" icon={<Code className="h-5 w-5" />}>
              初始代码管理
            </NavLink>
            {isAdmin && (
              <>
                <NavLink href="/admin/users" icon={<UserCog className="h-5 w-5" />}>
                  用户管理
                </NavLink>
                <NavLink href="/admin/settings" icon={<Settings className="h-5 w-5" />}>
                  系统设置
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700 p-4 space-y-2">
            <Link
              href="/courses"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ← 返回课程
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
