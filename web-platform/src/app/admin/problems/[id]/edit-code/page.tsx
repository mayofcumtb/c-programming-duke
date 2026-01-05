"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw, FileCode, AlertCircle, CheckCircle } from "lucide-react";

interface ProblemInfo {
  id: string;
  title: string;
  editableFiles: string[];
}

export default function EditInitialCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<ProblemInfo | null>(null);
  const [initialCode, setInitialCode] = useState<Record<string, string>>({});
  const [savedInDb, setSavedInDb] = useState(false);
  const [activeFile, setActiveFile] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/problems/${id}/initial-code`);
      if (!res.ok) throw new Error("加载失败");
      const data = await res.json();
      setProblem(data.problem);
      setInitialCode(data.initialCode);
      setSavedInDb(data.savedInDb);
      if (data.problem.editableFiles.length > 0) {
        setActiveFile(data.problem.editableFiles[0]);
      }
    } catch (error) {
      setMessage({ type: "error", text: "加载题目失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/problems/${id}/initial-code`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialCode }),
      });
      if (!res.ok) throw new Error("保存失败");
      setSavedInDb(true);
      setMessage({ type: "success", text: "初始代码已保存到数据库" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleCodeChange = (content: string) => {
    setInitialCode((prev) => ({
      ...prev,
      [activeFile]: content,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6">
        <div className="text-red-500">题目不存在</div>
        <Link href="/admin/problems" className="text-blue-500 hover:underline mt-4 inline-block">
          返回题目列表
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/problems"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑初始代码</h1>
            <p className="text-gray-500">{problem.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedInDb ? (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              已保存到数据库
            </span>
          ) : (
            <span className="text-yellow-600 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              从文件加载（未保存）
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存到数据库"}
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">💡 使用说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 这里编辑的是<strong>学生初始看到的代码模板</strong></li>
          <li>• 请删除答案部分，保留框架和 TODO 注释</li>
          <li>• 保存后，学生打开题目时会看到这里的代码</li>
          <li>• 未保存时，系统会从原始文件加载（可能包含答案）</li>
        </ul>
      </div>

      {/* 文件标签 */}
      <div className="flex gap-2 mb-4">
        {problem.editableFiles.map((file) => (
          <button
            key={file}
            onClick={() => setActiveFile(file)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeFile === file
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileCode className="w-4 h-4" />
            {file}
          </button>
        ))}
      </div>

      {/* 代码编辑器 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 font-mono">
          {activeFile}
        </div>
        <textarea
          value={initialCode[activeFile] || ""}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-[500px] p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
          spellCheck={false}
          placeholder="// 在这里编辑初始代码模板..."
        />
      </div>

      {/* 底部提示 */}
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>提示：</strong> 保存后需要重新部署或重启服务器才能生效。
          学生已经加载的页面需要刷新才能看到新模板。
        </p>
      </div>
    </div>
  );
}

