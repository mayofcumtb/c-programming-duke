"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, FileCode, CheckCircle, XCircle, Edit, Search } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  problemType: string;
  difficulty: string;
  editableFiles: string[];
  hasInitialCode: boolean;
  module?: {
    title: string;
    stage?: {
      title: string;
    };
  };
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/problems");
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setProblems(data);
    } catch (error) {
      console.error("加载题目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase())
  );

  // 按阶段和模块分组
  const groupedProblems = filteredProblems.reduce((acc, problem) => {
    const stageName = problem.module?.stage?.title || "未分类";
    const moduleName = problem.module?.title || "未分类";
    const key = `${stageName} > ${moduleName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(problem);
    return acc;
  }, {} as Record<string, Problem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">题目管理</h1>
          <p className="text-gray-500">管理题目的初始代码模板</p>
        </div>
        <div className="text-sm text-gray-500">
          共 {problems.length} 道题目
        </div>
      </div>

      {/* 搜索 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索题目 ID 或标题..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 说明 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">📝 初始代码管理</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>已配置</strong>: 初始代码已保存到数据库，学生看到的是无答案版本</li>
          <li>• <strong>未配置</strong>: 从文件系统加载，可能包含答案，需要配置</li>
          <li>• 点击"编辑初始代码"可以删除答案，保存学生模板</li>
        </ul>
      </div>

      {/* 题目列表 */}
      {Object.entries(groupedProblems).map(([group, groupProblems]) => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
            {group}
          </h2>
          <div className="space-y-2">
            {groupProblems.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <FileCode className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{problem.title}</div>
                    <div className="text-sm text-gray-500">
                      ID: {problem.id} | 
                      类型: {problem.problemType} | 
                      文件: {(problem.editableFiles || []).join(", ") || "无"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {problem.hasInitialCode ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      已配置
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm">
                      <XCircle className="w-4 h-4" />
                      未配置
                    </span>
                  )}
                  {(problem.editableFiles || []).length > 0 && (
                    <Link
                      href={`/admin/problems/${problem.id}/edit-code`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      编辑初始代码
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredProblems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          没有找到匹配的题目
        </div>
      )}
    </div>
  );
}

