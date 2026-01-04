import { NextResponse } from "next/server";
import { getCourseStructure, getAllActiveProblems } from "@/lib/problem-service";

/**
 * GET /api/problems
 * 获取所有题目列表
 */
export async function GET() {
  try {
    const problems = await getAllActiveProblems();
    return NextResponse.json(problems);
  } catch (error) {
    console.error("Failed to fetch problems:", error);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}

