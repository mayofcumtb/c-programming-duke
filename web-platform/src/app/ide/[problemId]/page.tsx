import IDEWorkspace from "@/components/IDEWorkspace";
import { courseStages } from "@/lib/courses";
import { getProblemContent, DisplayType } from "@/lib/problems";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    problemId: string;
  }>;
}

export default async function IDEPage({ params }: PageProps) {
  const { problemId } = await params;

  // 查找题目元数据
  let exercise = null;
  for (const stage of courseStages) {
    for (const mod of stage.modules) {
      const found = mod.exercises.find((e) => e.id === problemId);
      if (found) {
        exercise = found;
        break;
      }
    }
    if (exercise) break;
  }

  if (!exercise) {
    notFound();
  }

  // 读取真实题目内容
  const content = await getProblemContent(problemId);

  return (
    <IDEWorkspace
      problemId={problemId}
      title={exercise.title}
      description={content.description}
      initialCode={content.initialCode}
      kind={content.kind}
      displayType={(content as { displayType?: DisplayType }).displayType || "standard"}
      initialFiles={"initialFiles" in content ? content.initialFiles : {}}
      editableFilenames={"editableFilenames" in content ? content.editableFilenames : []}
      readonlyFiles={"readonlyFiles" in content ? content.readonlyFiles : {}}
      readonlyFilenames={"readonlyFilenames" in content ? content.readonlyFilenames : []}
      learningGoals={"learningGoals" in content ? content.learningGoals : undefined}
      hints={"hints" in content ? content.hints : undefined}
      quiz={"quiz" in content ? content.quiz : undefined}
    />
  );
}
