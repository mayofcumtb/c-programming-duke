"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Code2, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle, Ticket, BookOpen } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteValidated, setInviteValidated] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ type: string; courseName?: string; courseCode?: string } | null>(null);

  const [form, setForm] = useState({
    inviteCode: "",
    studentId: "",
    username: "",
    displayName: "",
    className: "",
    password: "",
    confirmPassword: "",
  });

  // 验证邀请码
  const validateInviteCode = async () => {
    if (!form.inviteCode.trim()) {
      setError("请输入邀请码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "邀请码无效");
        return;
      }

      setInviteValidated(true);
      setInviteInfo(data);
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 提交注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (form.password.length < 6) {
      setError("密码长度至少6位");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: form.inviteCode,
          studentId: form.studentId,
          username: form.username,
          displayName: form.displayName,
          className: form.className,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI0MzAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC0ydi00aDJ2NHptMC02di00aC0ydjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">C语言学习平台</h1>
          <p className="text-slate-400 mt-2">使用邀请码注册账号</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">注册成功！</h3>
              <p className="text-slate-400">正在跳转到登录页面...</p>
            </div>
          ) : !inviteValidated ? (
            /* Step 1: Validate Invite Code */
            <div>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-emerald-400" />
                输入邀请码
              </h2>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    邀请码
                  </label>
                  <input
                    type="text"
                    value={form.inviteCode}
                    onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase tracking-widest text-center text-lg"
                    placeholder="请输入邀请码"
                    maxLength={20}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    邀请码由教师或管理员提供
                  </p>
                </div>

                <button
                  onClick={validateInviteCode}
                  disabled={loading || !form.inviteCode.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "验证邀请码"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Registration Form */
            <div>
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                填写注册信息
              </h2>
              
              {inviteInfo?.type === "teacher" ? (
                <p className="text-sm text-amber-400 mb-6">您正在注册为教师账号</p>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span>
                    加入课程：<span className="text-emerald-400">{inviteInfo?.courseName || "默认课程"}</span>
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {inviteInfo?.type === "student" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        学号 *
                      </label>
                      <input
                        type="text"
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        placeholder="请输入学号"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        班级名称
                      </label>
                      <input
                        type="text"
                        value={form.className}
                        onChange={(e) => setForm({ ...form, className: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        placeholder="如：计算机1班（用于统计分组）"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    用户名 *
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="用于登录的用户名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="您的真实姓名（选填）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    密码 *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="至少6位密码"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    确认密码 *
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="再次输入密码"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      注册
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              已有账号？{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                返回登录
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          © 2024 机器人学院 · C语言程序设计
        </p>
      </div>
    </div>
  );
}
