import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

// 行为事件类型
interface BehaviorEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// 上报数据结构
interface TrackPayload {
  sessionId: string;
  sessionStats: {
    totalDuration?: number;
    activeDuration?: number;
    idleDuration?: number;
    tabSwitches?: number;
    focusLostCount?: number;
    mouseClicks?: number;
    keyPresses?: number;
    scrollCount?: number;
  };
  pageStats: {
    pagePath?: string;
    problemId?: string;
    duration?: number;
    activeDuration?: number;
    tabSwitches?: number;
    focusLostCount?: number;
    scrollDepth?: number;
  };
  events: BehaviorEvent[];
}

// IP 哈希（脱敏）
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip + "salt_for_privacy").digest("hex").substring(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const payload: TrackPayload = await request.json();
    const { sessionId, sessionStats, pageStats, events } = payload;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 获取当前登录用户
    let userId: string | null = null;
    try {
      const authSession = await getSession();
      userId = authSession?.user?.id || null;
    } catch (e) {
      // 未登录用户也可以追踪
    }

    // 获取 IP（用于分析，脱敏存储）
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0] || realIp || "unknown";
    const ipHash = hashIP(clientIp);

    // 获取 User-Agent
    const userAgent = request.headers.get("user-agent") || "";

    // 查找或创建会话
    let session = await prisma.learningSession.findUnique({
      where: { sessionToken: sessionId },
    });

    if (!session) {
      // 创建新会话
      session = await prisma.learningSession.create({
        data: {
          sessionToken: sessionId,
          userId,  // 关联用户
          ipHash,
          userAgent,
          startedAt: new Date(),
          totalDurationSec: 0,
          activeDurationSec: 0,
          idleDurationSec: 0,
          tabSwitches: 0,
          focusLostCount: 0,
          mouseClicks: 0,
          keyPresses: 0,
          scrollCount: 0,
          pagesVisited: 0,
          problemsAttempted: 0,
          problemsSolved: 0,
        },
      });
    } else if (!session.userId && userId) {
      // 如果会话没有关联用户但现在用户已登录，更新关联
      await prisma.learningSession.update({
        where: { id: session.id },
        data: { userId },
      });
      session = { ...session, userId };
    }

    // 更新会话统计
    await prisma.learningSession.update({
      where: { id: session.id },
      data: {
        totalDurationSec: Math.floor((sessionStats.totalDuration || 0) / 1000),
        activeDurationSec: Math.floor((sessionStats.activeDuration || 0) / 1000),
        idleDurationSec: Math.floor((sessionStats.idleDuration || 0) / 1000),
        tabSwitches: sessionStats.tabSwitches || 0,
        focusLostCount: sessionStats.focusLostCount || 0,
        mouseClicks: sessionStats.mouseClicks || 0,
        keyPresses: sessionStats.keyPresses || 0,
        scrollCount: sessionStats.scrollCount || 0,
      },
    });

    // 处理页面访问
    if (pageStats.pagePath) {
      // 查找当前页面访问记录
      const existingVisit = await prisma.pageVisit.findFirst({
        where: {
          sessionId: session.id,
          pagePath: pageStats.pagePath,
          leftAt: null, // 尚未离开
        },
        orderBy: { enteredAt: "desc" },
      });

      if (existingVisit) {
        // 更新现有记录
        await prisma.pageVisit.update({
          where: { id: existingVisit.id },
          data: {
            durationSec: Math.floor((pageStats.duration || 0) / 1000),
            activeSec: Math.floor((pageStats.activeDuration || 0) / 1000),
            tabSwitches: pageStats.tabSwitches || 0,
            focusLostCount: pageStats.focusLostCount || 0,
            scrollDepthPercent: pageStats.scrollDepth || 0,
          },
        });
      } else {
        // 创建新页面访问记录
        await prisma.pageVisit.create({
          data: {
            sessionId: session.id,
            pagePath: pageStats.pagePath,
            problemId: pageStats.problemId,
            enteredAt: new Date(),
            durationSec: Math.floor((pageStats.duration || 0) / 1000),
            activeSec: Math.floor((pageStats.activeDuration || 0) / 1000),
            tabSwitches: pageStats.tabSwitches || 0,
            focusLostCount: pageStats.focusLostCount || 0,
            scrollDepthPercent: pageStats.scrollDepth || 0,
          },
        });
      }
    }

    // 批量存储行为事件
    if (events.length > 0) {
      // 查找最近的页面访问
      const latestVisit = await prisma.pageVisit.findFirst({
        where: { sessionId: session.id },
        orderBy: { enteredAt: "desc" },
      });

      await prisma.behaviorEvent.createMany({
        data: events.map((event) => ({
          sessionId: session.id,
          pageVisitId: latestVisit?.id,
          eventType: event.type,
          eventData: event.data || {},
          createdAt: new Date(event.timestamp),
        })),
      });
    }

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      eventsReceived: events.length,
    });
  } catch (error) {
    console.error("[Analytics] Track error:", error);
    return NextResponse.json(
      { error: "Failed to track behavior" },
      { status: 500 }
    );
  }
}

