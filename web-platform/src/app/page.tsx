import { BookOpen, Code, GraduationCap, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - 智能检测登录状态 */}
      <HomeHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              C语言程序课程<br />
              <span className="text-blue-600">工程化实践平台</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
              面向机器人学院学生打造的专业级编程训练环境。
              集成在线IDE、自动化评测与防作弊机制，助你掌握从基础语法到工程实战的核心技能。
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/courses" className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 transition-all">
                <Terminal className="h-5 w-5" />
                开始学习
              </Link>
              <Link href="/courses" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                <BookOpen className="h-5 w-5" />
                查看课程计划
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">全栈式教学辅助体系</h2>
              <p className="mt-4 text-lg text-slate-600">融合理论与实践，打通从代码编写到工程落地的最后一公里</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border bg-slate-50 p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 inline-block rounded-lg bg-blue-100 p-3 text-blue-600">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold">循序渐进的课程体系</h3>
                <p className="text-slate-600">
                  从基础语法到指针内存，再到大型工程项目。
                  8大教学模块，19个精选练习，构建完整的知识图谱。
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 inline-block rounded-lg bg-green-100 p-3 text-green-600">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold">智能在线评测 (OJ)</h3>
                <p className="text-slate-600">
                  基于Docker容器的隔离沙箱环境。
                  支持标准输出比对、单元测试生成、内存泄漏检测等多种评测模式。
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 inline-block rounded-lg bg-red-100 p-3 text-red-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-bold">严格的防作弊机制</h3>
                <p className="text-slate-600">
                  前端禁用粘贴/拖拽，强制逐行编码。
                  后端集成代码指纹分析，有效识别抄袭行为，保障教学公平。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-blue-600 py-20 text-white">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              <div>
                <div className="text-4xl font-bold">8+</div>
                <div className="mt-2 text-blue-100">核心教学模块</div>
              </div>
              <div>
                <div className="text-4xl font-bold">500+</div>
                <div className="mt-2 text-blue-100">累计服务学生</div>
              </div>
              <div>
                <div className="text-4xl font-bold">10k+</div>
                <div className="mt-2 text-blue-100">代码提交次数</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-slate-50 py-10">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p className="mb-2">© 2026 机器人学院 C语言程序课程组. All rights reserved.</p>
          <p className="text-sm">Designed for Engineering Practice.</p>
        </div>
      </footer>
    </div>
  );
}
