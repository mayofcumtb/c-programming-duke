import { NextRequest, NextResponse } from "next/server";
import { getProblemContent } from "@/lib/problem-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/problems/[id]
 * 获取单个题目详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const content = await getProblemContent(id);

    if (!content) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return NextResponse.json({ error: "Failed to fetch problem" }, { status: 500 });
  }
}

