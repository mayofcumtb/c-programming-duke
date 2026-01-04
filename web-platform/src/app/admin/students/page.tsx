"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
  BookOpen,
  Download,
  CheckCircle,
  XCircle,
  UserPlus,
} from "lucide-react";

interface CourseInfo {
  id: string;
  code: string;
  name: string;
}

interface StudentCourse {
  courseId: string;
  course: CourseInfo;
  joinedAt: string;
}

interface Student {
  id: string;
  studentId: string | null;
  username: string;
  displayName: string | null;
  className: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  courses: StudentCourse[];
}

interface Course {
  id: string;
  code: string;
  name: string;
  _count?: { students: number };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourseId, setFilterCourseId] = useState<string>("");

  // 对话框状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // 导入状态
  const [importText, setImportText] = useState("");
  const [importCourseId, setImportCourseId] = useState("");
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);

  // 新学生表单
  const [newStudent, setNewStudent] = useState({
    studentId: "",
    username: "",
    displayName: "",
    className: "",
    courseId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/courses"),
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
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

  // 过滤学生
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.studentId?.includes(searchTerm) ||
      s.username.includes(searchTerm) ||
      s.displayName?.includes(searchTerm) ||
      s.className?.includes(searchTerm);

    const matchesCourse =
      !filterCourseId ||
      s.courses.some((c) => c.courseId === filterCourseId);

    return matchesSearch && matchesCourse;
  });

  // 批量导入
  const handleImport = async () => {
    if (!importCourseId) {
      alert("请选择要导入到的课程");
      return;
    }

    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: importText,
          courseId: importCourseId,
        }),
      });
      const result = await res.json();
      setImportResult(result);
      if (result.success > 0) {
        fetchData();
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  // 添加单个学生
  const handleAddStudent = async () => {
    if (!newStudent.courseId) {
      alert("请选择课程");
      return;
    }
    if (!newStudent.username) {
      alert("请输入用户名");
      return;
    }

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setShowAddModal(false);
        setNewStudent({ studentId: "", username: "", displayName: "", className: "", courseId: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Add student failed:", error);
    }
  };

  // 删除学生
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此学生吗？")) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // 加入课程
  const handleJoinCourse = async (courseId: string) => {
    if (!selectedStudent) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [selectedStudent.id] }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignModal(false);
        setSelectedStudent(null);
        fetchData();
      } else {
        alert(data.error || "加入失败");
      }
    } catch (error) {
      alert("加入失败");
    }
  };

  // 从课程移除
  const handleRemoveFromCourse = async (studentId: string, courseId: string) => {
    if (!confirm("确定要从该课程移除此学生吗？")) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/students?studentId=${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Remove from course failed:", error);
    }
  };

  // 下载模板
  const downloadTemplate = () => {
    const template = "学号,用户名,姓名,班级\n2024001,zhangsan,张三,计算机1班\n2024002,lisi,李四,计算机2班";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "学生导入模板.csv";
    a.click();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">学生管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            管理学生账户，通过邀请码或手动方式加入课程
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Upload className="h-4 w-4" />
            批量导入
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加学生
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索学号、用户名、姓名或班级..."
            className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-4 py-2 text-white placeholder-slate-400"
          />
        </div>
        <select
          value={filterCourseId}
          onChange={(e) => setFilterCourseId(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white"
        >
          <option value="">全部课程</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 学生列表 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">学生信息</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">班级</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">已加入课程</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">状态</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">注册时间</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {student.displayName || student.username}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.studentId && `学号: ${student.studentId}`}
                        {student.studentId && student.username !== student.studentId && ` · `}
                        {student.username !== student.studentId && `用户名: ${student.username}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-300">
                    {student.className || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {student.courses.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {student.courses.map((c) => (
                        <div key={c.courseId} className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                            <BookOpen className="h-3 w-3" />
                            {c.course.code}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCourse(student.id, c.courseId)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="从课程移除"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">未加入课程</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {student.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      正常
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                      <XCircle className="h-3 w-3" />
                      禁用
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {new Date(student.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowAssignModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="加入课程"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            {searchTerm || filterCourseId ? "没有找到匹配的学生" : "暂无学生数据"}
          </div>
        )}
      </div>

      {/* 批量导入对话框 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-slate-800 p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">批量导入学生</h2>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">导入到课程 *</label>
              <select
                value={importCourseId}
                onChange={(e) => setImportCourseId(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                required
              >
                <option value="">选择课程...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400">学生数据 (CSV格式)</label>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Download className="h-3 w-3" />
                  下载模板
                </button>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="学号,用户名,姓名,班级&#10;2024001,zhangsan,张三,计算机1班&#10;2024002,lisi,李四,计算机2班"
                className="w-full h-40 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                格式：每行一个学生，用逗号分隔 (学号,用户名,姓名,班级)。班级为可选字段。
              </p>
            </div>

            {importResult && (
              <div className={`mb-4 p-3 rounded-lg ${importResult.success > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                成功导入 {importResult.success} 人，失败 {importResult.failed} 人
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-xs max-h-20 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportText("");
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                关闭
              </button>
              <button
                onClick={handleImport}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加学生对话框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">添加学生</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">学号</label>
                <input
                  type="text"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  placeholder="如：2024001"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">用户名 *</label>
                <input
                  type="text"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  placeholder="登录用户名"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">姓名</label>
                <input
                  type="text"
                  value={newStudent.displayName}
                  onChange={(e) => setNewStudent({ ...newStudent, displayName: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  placeholder="真实姓名"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">班级名称</label>
                <input
                  type="text"
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  placeholder="如：计算机1班（用于分组统计）"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">加入课程 *</label>
                <select
                  value={newStudent.courseId}
                  onChange={(e) => setNewStudent({ ...newStudent, courseId: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                >
                  <option value="">选择课程...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500">
                初始密码为 123456，学生首次登录后可修改
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleAddStudent}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加入课程对话框 */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6 border border-slate-700 max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold text-white mb-2">加入课程</h2>
            <p className="text-sm text-slate-400 mb-4">
              为 {selectedStudent.displayName || selectedStudent.username} 添加到课程
            </p>

            <div className="flex-1 overflow-y-auto space-y-2">
              {courses.map((course) => {
                const isJoined = selectedStudent.courses.some((c) => c.courseId === course.id);
                return (
                  <div
                    key={course.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      isJoined ? "bg-blue-500/20 border border-blue-500/30" : "bg-slate-900/50 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{course.name}</div>
                      <div className="text-xs text-slate-500">{course.code}</div>
                    </div>
                    {isJoined ? (
                      <span className="text-xs text-blue-400">已加入</span>
                    ) : (
                      <button
                        onClick={() => handleJoinCourse(course.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        加入
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
