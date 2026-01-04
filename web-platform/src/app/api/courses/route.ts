import { NextResponse } from "next/server";
import { getCourseStructure } from "@/lib/problem-service";

/**
 * GET /api/courses
 * 获取完整课程结构
 */
export async function GET() {
  try {
    const structure = await getCourseStructure();
    return NextResponse.json(structure);
  } catch (error) {
    console.error("Failed to fetch course structure:", error);
    return NextResponse.json({ error: "Failed to fetch course structure" }, { status: 500 });
  }
}

