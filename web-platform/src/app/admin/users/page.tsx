"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Key,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  GraduationCap,
  User,
  X,
} from "lucide-react";

interface UserInfo {
  id: string;
  username: string;
  studentId: string | null;
  displayName: string | null;
  email: string | null;
  role: "admin" | "teacher" | "student";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleLabels = {
  admin: { label: "管理员", color: "text-red-400 bg-red-500/20", icon: Shield },
  teacher: { label: "教师", color: "text-amber-400 bg-amber-500/20", icon: GraduationCap },
  student: { label: "学生", color: "text-blue-400 bg-blue-500/20", icon: User },
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  
  // 密码重置弹窗
  const [resetPasswordUser, setResetPasswordUser] = useState<UserInfo | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  
  // 编辑用户弹窗
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", email: "", role: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter) params.set("role", roleFilter);
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    if (newPassword.length < 6) {
      alert("密码长度至少6位");
      return;
    }
    
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`密码重置成功！用户 ${resetPasswordUser.username} 需要重新登录。`);
        setResetPasswordUser(null);
        setNewPassword("");
      } else {
        alert(`重置失败: ${data.error}`);
      }
    } catch (error) {
      alert("重置失败");
    } finally {
      setResetting(false);
    }
  };

  const handleEditUser = (user: UserInfo) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || "",
      email: user.email || "",
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`保存失败: ${data.error}`);
      }
    } catch (error) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: UserInfo) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复！`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      alert("删除失败");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="h-7 w-7 text-purple-400" />
          用户管理
        </h1>
        <p className="text-slate-400 mt-2">管理系统中的所有用户账号</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索用户名、姓名、学号、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 pl-10 pr-4 py-2 text-white placeholder-slate-500 outline-none focus:border-purple-500"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white outline-none focus:border-purple-500"
        >
          <option value="">所有角色</option>
          <option value="admin">管理员</option>
          <option value="teacher">教师</option>
          <option value="student">学生</option>
        </select>
        
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-slate-400">总用户数</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="text-2xl font-bold text-red-400">
            {users.filter(u => u.role === "admin").length}
          </div>
          <div className="text-sm text-slate-400">管理员</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="text-2xl font-bold text-amber-400">
            {users.filter(u => u.role === "teacher").length}
          </div>
          <div className="text-sm text-slate-400">教师</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="text-2xl font-bold text-blue-400">
            {users.filter(u => u.role === "student").length}
          </div>
          <div className="text-sm text-slate-400">学生</div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800">
              <th className="py-4 px-4 text-left font-medium text-slate-400">用户名</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">姓名</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">学号</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">角色</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">状态</th>
              <th className="py-4 px-4 text-left font-medium text-slate-400">最后登录</th>
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
            ) : users.length > 0 ? (
              users.map((user) => {
                const roleInfo = roleLabels[user.role];
                const RoleIcon = roleInfo.icon;
                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{user.username}</div>
                      {user.email && (
                        <div className="text-xs text-slate-500">{user.email}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{user.displayName || "-"}</td>
                    <td className="py-4 px-4 text-slate-300">{user.studentId || "-"}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${roleInfo.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                          <CheckCircle className="h-3 w-3" /> 活跃
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                          <XCircle className="h-3 w-3" /> 禁用
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setResetPasswordUser(user)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="重置密码"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  暂无用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 重置密码弹窗 */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                重置密码
              </h2>
              <button
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                为用户 <span className="text-white font-medium">{resetPasswordUser.username}</span> 
                {resetPasswordUser.displayName && ` (${resetPasswordUser.displayName})`} 设置新密码：
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码（至少6位）"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || newPassword.length < 6}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resetting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户弹窗 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-400" />
                编辑用户
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">用户名</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-slate-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">显示名称</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">角色</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="admin">管理员</option>
                  <option value="teacher">教师</option>
                  <option value="student">学生</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500"
                />
                <label htmlFor="isActive" className="text-slate-300">账号激活</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
