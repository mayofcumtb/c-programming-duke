import { courseStages } from "@/lib/courses";
import { BookOpen, ChevronRight, Code2, Trophy, FileText, HelpCircle, Pencil, CheckCircle } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

// 根据习题类型返回图标
function ExerciseIcon({ kind, difficulty }: { kind?: string; difficulty: string }) {
  if (kind === 'intro') return <FileText className="h-5 w-5 text-blue-500" />;
  if (kind === 'quiz') return <HelpCircle className="h-5 w-5 text-purple-500" />;
  if (kind === 'reading') return <BookOpen className="h-5 w-5 text-teal-500" />;
  
  // 代码题根据难度显示不同颜色
  switch (difficulty) {
    case '入门': return <Pencil className="h-5 w-5 text-green-500" />;
    case '基础': return <Code2 className="h-5 w-5 text-blue-500" />;
    case '进阶': return <Trophy className="h-5 w-5 text-amber-500" />;
    case '挑战': return <Trophy className="h-5 w-5 text-red-500" />;
    case '有趣': return <Trophy className="h-5 w-5 text-purple-500" />;
    default: return <Code2 className="h-5 w-5 text-slate-500" />;
  }
}

// 习题类型标签
function ExerciseTag({ kind, difficulty }: { kind?: string; difficulty: string }) {
  const getKindLabel = () => {
    switch (kind) {
      case 'intro': return { label: '导读', color: 'bg-blue-100 text-blue-700' };
      case 'quiz': return { label: '测验', color: 'bg-purple-100 text-purple-700' };
      case 'reading': return { label: '阅读', color: 'bg-teal-100 text-teal-700' };
      default: return null;
    }
  };
  
  const getDifficultyColor = () => {
    switch (difficulty) {
      case '入门': return 'bg-green-100 text-green-700';
      case '基础': return 'bg-blue-100 text-blue-700';
      case '进阶': return 'bg-amber-100 text-amber-700';
      case '挑战': return 'bg-red-100 text-red-700';
      case '有趣': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const kindInfo = getKindLabel();
  
  return (
    <div className="flex gap-1">
      {kindInfo && (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kindInfo.color}`}>
          {kindInfo.label}
        </span>
      )}
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDifficultyColor()}`}>
        {difficulty}
      </span>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header - 带权限控制 */}
      <PageHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 课程标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">C语言程序设计基础</h1>
          <p className="mt-1 text-slate-600">
            循序渐进，通过习题掌握每个知识点
          </p>
        </div>

        {/* 课程内容 */}
        <div className="space-y-8">
          {courseStages.map((stage, stageIndex) => (
            <section key={stage.id}>
              {/* 阶段标题 */}
              <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
                  {stageIndex + 1}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{stage.title}</h2>
                  <p className="text-sm text-slate-500">{stage.description}</p>
                </div>
              </div>

              {/* 模块列表 */}
              <div className="space-y-4 ml-4">
                {stage.modules.map((module) => (
                  <div key={module.id} className="rounded-lg border bg-white overflow-hidden">
                    {/* 模块标题 */}
                    <div className="px-4 py-3 bg-slate-50 border-b">
                      <h3 className="font-semibold text-slate-900">{module.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{module.description}</p>
                    </div>
                    
                    {/* 习题列表 - 紧凑展示 */}
                    <div className="divide-y">
                      {module.exercises.map((exercise, exIndex) => (
                        <div 
                          key={exercise.id} 
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 序号连接线 */}
                            <div className="relative flex items-center">
                              <ExerciseIcon kind={exercise.kind} difficulty={exercise.difficulty} />
                              {exIndex < module.exercises.length - 1 && (
                                <div className="absolute top-6 left-1/2 w-px h-4 bg-slate-200 -translate-x-1/2" />
                              )}
                            </div>
                            
                            {/* 习题信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-900 truncate">{exercise.title}</span>
                                <ExerciseTag kind={exercise.kind} difficulty={exercise.difficulty} />
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{exercise.description}</p>
                            </div>
                          </div>
                          
                          {/* 分数和按钮 */}
                          <div className="flex items-center gap-3 ml-4">
                            <span className="text-xs text-slate-400">{exercise.points}分</span>
                            <Link 
                              href={`/ide/${exercise.id}`}
                              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              {exercise.kind === 'intro' ? '阅读' : 
                               exercise.kind === 'quiz' ? '答题' : 
                               exercise.kind === 'reading' ? '阅读' : '开始'}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        
        {/* 统计 */}
        <div className="mt-12 p-6 bg-slate-100 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-xs text-slate-500">阶段</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">11</div>
              <div className="text-xs text-slate-500">模块</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">50+</div>
              <div className="text-xs text-slate-500">习题</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">循序渐进</div>
              <div className="text-xs text-slate-500">学习路径</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
