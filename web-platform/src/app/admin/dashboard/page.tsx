import { Users, FileCode, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
        <div className="text-sm text-slate-500">最后更新: 2026-01-01 12:00</div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">活跃学生</p>
              <h3 className="text-2xl font-bold text-slate-900">1,234</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">今日提交</p>
              <h3 className="text-2xl font-bold text-slate-900">456</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">平均通过率</p>
              <h3 className="text-2xl font-bold text-slate-900">85%</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">作弊预警</p>
              <h3 className="text-2xl font-bold text-slate-900">3</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-slate-900">近期提交动态</h2>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div>
                  <p className="font-medium text-slate-900">张三 {i}</p>
                  <p className="text-sm text-slate-500">提交了 Module 1: Hello World</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Accepted
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
