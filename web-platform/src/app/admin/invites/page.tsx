"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  CheckCircle,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface InviteCode {
  id: string;
  code: string;
  inviteType: "teacher" | "student";
  courseId: string | null;
  courseName?: string;
  courseCode?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function InvitesPage() {
  const searchParams = useSearchParams();
  const filterCourseId = searchParams.get("courseId");

  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newInvite, setNewInvite] = useState({
    type: "student" as "teacher" | "student",
    courseId: filterCourseId || "",
    maxUses: 100,
    expiresInDays: 90,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invitesRes, coursesRes] = await Promise.all([
        fetch("/api/admin/invites"),
        fetch("/api/admin/courses"),
      ]);

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data.invites || []);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 过滤邀请码
  const filteredInvites = filterCourseId
    ? invites.filter((i) => i.courseId === filterCourseId)
    : invites;

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvite),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowCreateModal(false);
        setNewInvite({
          type: "student",
          courseId: filterCourseId || "",
          maxUses: 100,
          expiresInDays: 90,
        });
        fetchData();
      }
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个邀请码吗？")) return;
    try {
      await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Ticket className="h-7 w-7 text-purple-400" />
            邀请码管理
          </h1>
          <p className="mt-1 text-slate-400">
            {filterCourseId ? "查看课程邀请码" : "创建和管理教师/学生注册邀请码"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            创建邀请码
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="text-sm text-slate-400">总邀请码</div>
          <div className="mt-1 text-2xl font-bold text-white">{filteredInvites.length}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="text-sm text-slate-400">教师邀请码</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            {filteredInvites.filter((i) => i.inviteType === "teacher").length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="text-sm text-slate-400">学生邀请码</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">
            {filteredInvites.filter((i) => i.inviteType === "student").length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800">
              <th className="py-4 px-4 text-left font-medium text-slate-400">邀请码</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">类型</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">关联课程</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">使用情况</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">过期时间</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">状态</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-purple-400" />
                </td>
              </tr>
            ) : filteredInvites.length > 0 ? (
              filteredInvites.map((invite) => (
                <tr
                  key={invite.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-lg text-white bg-slate-900 px-2 py-1 rounded">
                        {invite.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(invite.code, invite.id)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedId === invite.id ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {invite.inviteType === "teacher" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-400">
                        <GraduationCap className="h-3 w-3" />
                        教师
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                        <Users className="h-3 w-3" />
                        学生
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {invite.courseCode ? (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                        {invite.courseCode}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">{invite.usedCount}</span>
                    <span className="text-slate-500"> / {invite.maxUses}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {invite.expiresAt
                      ? new Date(invite.expiresAt).toLocaleDateString("zh-CN")
                      : "永久"}
                  </td>
                  <td className="py-4 px-4">
                    {invite.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        有效
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                        已禁用
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleDelete(invite.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  暂无邀请码
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              创建邀请码
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">邀请类型</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewInvite({ ...newInvite, type: "student" })}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 transition-colors ${
                      newInvite.type === "student"
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    学生
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInvite({ ...newInvite, type: "teacher", courseId: "" })}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 transition-colors ${
                      newInvite.type === "teacher"
                        ? "border-amber-500 bg-amber-500/20 text-amber-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <GraduationCap className="h-5 w-5" />
                    教师
                  </button>
                </div>
              </div>

              {newInvite.type === "student" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">关联课程 *</label>
                  <select
                    value={newInvite.courseId}
                    onChange={(e) => setNewInvite({ ...newInvite, courseId: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-purple-500"
                    required
                  >
                    <option value="">选择课程...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    学生使用此邀请码注册后将自动加入所选课程
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1">最大使用次数</label>
                <input
                  type="number"
                  value={newInvite.maxUses}
                  onChange={(e) => setNewInvite({ ...newInvite, maxUses: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">有效期（天）</label>
                <input
                  type="number"
                  value={newInvite.expiresInDays}
                  onChange={(e) => setNewInvite({ ...newInvite, expiresInDays: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-purple-500"
                  placeholder="0 表示永久有效"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
