"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Edit2,
  Trash2,
  Settings,
  Ticket,
  Copy,
  CheckCircle,
} from "lucide-react";

interface Teacher {
  id: string;
  displayName: string | null;
  username: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  createdAt: string;
  teacher: Teacher;
  _count: {
    students: number;
    inviteCodes: number;
  };
}

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 创建课程对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    dailyStartTime: "08:00",
    dailyEndTime: "22:00",
  });
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  // 编辑课程
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      } else {
        setError("获取课程失败");
      }
    } catch (err) {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // 显示创建成功和邀请码
        setCreatedInviteCode(data.inviteCode);
        setNewCourse({
          code: "",
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          dailyStartTime: "08:00",
          dailyEndTime: "22:00",
        });
        fetchCourses();
      }
    } catch (err) {
      alert("创建失败");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("确定要删除此课程吗？这将同时删除所有学生关联和邀请码！")) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch (err) {
      alert("删除失败");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("复制失败", err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">课程管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            创建课程，生成邀请码，学生通过邀请码加入课程
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/content"
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-4 w-4" />
            题目内容管理
          </Link>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            创建课程
          </button>
        </div>
      </div>

      {loading && <p className="text-slate-400">加载中...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {/* 课程列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden hover:border-slate-600 transition-colors"
          >
            {/* 课程头部 */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {course.code}
                    </span>
                    {!course.isActive && (
                      <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                        已停用
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCourse(course)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{course.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                {course.description || "暂无描述"}
              </p>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>{course._count.students} 名学生</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Ticket className="h-4 w-4" />
                  <span>{course._count.inviteCodes} 个邀请码</span>
                </div>
              </div>

              {/* 时间信息 */}
              {(course.startDate || course.endDate) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {course.startDate ? new Date(course.startDate).toLocaleDateString() : "未设置"}
                    {" - "}
                    {course.endDate ? new Date(course.endDate).toLocaleDateString() : "未设置"}
                  </span>
                </div>
              )}
            </div>

            {/* 快捷操作 */}
            <div className="px-5 py-3 bg-slate-900/30 border-t border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                授课：{course.teacher.displayName || course.teacher.username}
              </span>
              <Link
                href={`/admin/invites?courseId=${course.id}`}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                管理邀请码 →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">暂无课程</h3>
          <p className="text-slate-500 mb-4">点击"创建课程"开始设置您的第一门课程</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            创建课程
          </button>
        </div>
      )}

      {/* 创建课程对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-slate-800 p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            {createdInviteCode ? (
              // 创建成功页面
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">课程创建成功！</h2>
                <p className="text-slate-400 mb-6">请将以下邀请码分享给学生</p>

                <div className="bg-slate-900 rounded-lg p-4 mb-6">
                  <div className="text-xs text-slate-500 mb-2">学生邀请码</div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                      {createdInviteCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdInviteCode)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="复制"
                    >
                      {copiedCode === createdInviteCode ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-6">
                  学生使用此邀请码注册或加入课程后，即可访问课程内容
                </p>

                <button
                  onClick={() => {
                    setCreatedInviteCode(null);
                    setShowCreateDialog(false);
                  }}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  完成
                </button>
              </div>
            ) : (
              // 创建表单
              <>
                <h2 className="text-lg font-bold text-white mb-4">创建课程</h2>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">课程代码 *</label>
                      <input
                        type="text"
                        value={newCourse.code}
                        onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                        placeholder="如：CS101"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">课程名称 *</label>
                      <input
                        type="text"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                        placeholder="如：C语言程序设计"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">课程描述</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white h-20 resize-none"
                      placeholder="课程简介..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">开课日期</label>
                      <input
                        type="date"
                        value={newCourse.startDate}
                        onChange={(e) => setNewCourse({ ...newCourse, startDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">结课日期</label>
                      <input
                        type="date"
                        value={newCourse.endDate}
                        onChange={(e) => setNewCourse({ ...newCourse, endDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">每日开始时间</label>
                      <input
                        type="time"
                        value={newCourse.dailyStartTime}
                        onChange={(e) => setNewCourse({ ...newCourse, dailyStartTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">每日结束时间</label>
                      <input
                        type="time"
                        value={newCourse.dailyEndTime}
                        onChange={(e) => setNewCourse({ ...newCourse, dailyEndTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    创建课程后会自动生成一个学生邀请码，学生使用邀请码注册或加入课程
                  </p>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateDialog(false)}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      创建课程
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 编辑课程对话框 */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">编辑课程</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editingCourse.name,
                      description: editingCourse.description,
                      isActive: editingCourse.isActive,
                    }),
                  });
                  if (res.ok) {
                    setEditingCourse(null);
                    fetchCourses();
                  } else {
                    const data = await res.json();
                    alert(data.error || "更新失败");
                  }
                } catch (err) {
                  alert("更新失败");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-slate-400 mb-1">课程代码</label>
                <input
                  type="text"
                  value={editingCourse.code}
                  disabled
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">课程名称</label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">课程描述</label>
                <textarea
                  value={editingCourse.description || ""}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white h-24 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingCourse.isActive}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, isActive: e.target.checked })
                  }
                  className="rounded border-slate-600 bg-slate-700"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">
                  启用课程
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
