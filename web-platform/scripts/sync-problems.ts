import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { courseStages } from "../src/lib/courses";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://cjudge:cjudge_dev_password@localhost:5432/cjudge";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncProblems() {
  console.log("开始同步题目到数据库...\n");

  let createdCount = 0;
  let updatedCount = 0;
  let stageOrder = 0;

  for (const stage of courseStages) {
    stageOrder++;
    console.log(`处理阶段: ${stage.title}`);
    let moduleOrder = 0;

    // 创建或更新 Stage
    const existingStage = await prisma.stage.findUnique({
      where: { id: stage.id },
    });

    if (!existingStage) {
      await prisma.stage.create({
        data: {
          id: stage.id,
          title: stage.title,
          description: stage.description || null,
          sortOrder: stageOrder,
          isActive: true,
        },
      });
      console.log(`  ✓ 创建阶段: ${stage.id}`);
    }

    for (const mod of stage.modules) {
      moduleOrder++;

      // 创建或更新 Module
      const existingModule = await prisma.module.findUnique({
        where: { id: mod.id },
      });

      if (!existingModule) {
        await prisma.module.create({
          data: {
            id: mod.id,
            stageId: stage.id,
            title: mod.title,
            sortOrder: moduleOrder,
          },
        });
        console.log(`    ✓ 创建模块: ${mod.id}`);
      }

      let exerciseOrder = 0;
      for (const exercise of mod.exercises) {
        exerciseOrder++;

        // 确定题目类型 - 使用 Prisma schema 定义的枚举值
        // ProblemType: text_exact, compile_run, code_with_grader, link_object, makefile_project, quiz
        // DisplayType: standard, multi_file, reading, testgen, quiz
        let problemType: "text_exact" | "compile_run" | "quiz" = "compile_run";
        let displayType: "standard" | "reading" | "quiz" = "standard";

        if (exercise.kind === "intro" || exercise.kind === "reading") {
          problemType = "text_exact"; // 阅读类题目用 text_exact
          displayType = "reading";
        } else if (exercise.kind === "quiz") {
          problemType = "quiz";
          displayType = "quiz";
        }

        // 检查题目是否存在
        const existingProblem = await prisma.problem.findUnique({
          where: { id: exercise.id },
        });

        const difficultyMap: Record<string, string> = {
          入门: "beginner",
          基础: "basic",
          进阶: "intermediate",
          挑战: "advanced",
          有趣: "fun",
        };

        if (!existingProblem) {
          // 创建题目
          await prisma.problem.create({
            data: {
              id: exercise.id,
              moduleId: mod.id,
              title: exercise.title,
              descriptionZh: null,
              difficulty: difficultyMap[exercise.difficulty] || "basic",
              points: exercise.points,
              problemType,
              displayType,
              editableFiles: [],
              readonlyFiles: [],
              learningGoals: [],
              hints: [],
              sortOrder: exerciseOrder,
              isActive: true,
            },
          });
          createdCount++;
          console.log(`      + 创建题目: ${exercise.id} (${exercise.title})`);
        } else {
          // 更新现有题目
          await prisma.problem.update({
            where: { id: exercise.id },
            data: {
              title: exercise.title,
              difficulty: difficultyMap[exercise.difficulty] || existingProblem.difficulty,
              points: exercise.points,
              problemType,
              displayType,
              sortOrder: exerciseOrder,
            },
          });
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ 同步完成！`);
  console.log(`   创建: ${createdCount} 个题目`);
  console.log(`   更新: ${updatedCount} 个题目`);

  await prisma.$disconnect();
  await pool.end();
}

syncProblems().catch((e) => {
  console.error("同步失败:", e);
  process.exit(1);
});

              sortOrder: exerciseOrder,
            },
          });
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ 同步完成！`);
  console.log(`   创建: ${createdCount} 个题目`);
  console.log(`   更新: ${updatedCount} 个题目`);

  await prisma.$disconnect();
  await pool.end();
}

syncProblems().catch((e) => {
  console.error("同步失败:", e);
  process.exit(1);
});

              sortOrder: exerciseOrder,
            },
          });
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ 同步完成！`);
  console.log(`   创建: ${createdCount} 个题目`);
  console.log(`   更新: ${updatedCount} 个题目`);

  await prisma.$disconnect();
  await pool.end();
}

syncProblems().catch((e) => {
  console.error("同步失败:", e);
  process.exit(1);
});
