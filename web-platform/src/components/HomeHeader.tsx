"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cpu, LogOut, User, ChevronDown, BookOpen, Settings, Trophy } from "lucide-react";

interface UserInfo {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
}

export default function HomeHeader() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        // 未登录
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Cpu className="h-6 w-6" />
          <span>机器人学院</span>
        </div>
        
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/courses" className="hover:text-blue-600">课程大纲</Link>
          <Link href="/courses" className="hover:text-blue-600">在线题库</Link>
          <Link href="#" className="hover:text-blue-600">实验指导</Link>
          <Link href="#" className="hover:text-blue-600">关于平台</Link>
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 rounded bg-slate-200 animate-pulse" />
          ) : user ? (
            <>
              {/* 已登录用户 */}
              <Link
                href="/courses"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                <BookOpen className="h-4 w-4" />
                进入课程
              </Link>

              {isTeacherOrAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                  <Settings className="h-4 w-4" />
                  管理
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user.displayName || user.username}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border bg-white py-1 shadow-lg">
                      <div className="px-3 py-2 border-b">
                        <div className="text-sm font-medium text-slate-900">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.role === "admin" ? "管理员" : user.role === "teacher" ? "教师" : "学生"}
                        </div>
                      </div>
                      
                      <Link
                        href="/my"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Trophy className="h-4 w-4" />
                        我的成绩
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 未登录用户 */}
              <Link href="/login" className="text-sm font-medium hover:underline">登录</Link>
              <Link
                href="/register"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                注册账户
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

