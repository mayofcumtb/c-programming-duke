import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // 检查 Prisma 客户端是否有 learningSession 模型
    if (!prisma.learningSession) {
      console.error("[Analytics] Prisma client missing learningSession model. Available models:", Object.keys(prisma));
      return NextResponse.json({
        summary: {
          totalSessions: 0,
          totalDurationHours: 0,
          totalActiveHours: 0,
          avgSessionMinutes: 0,
          avgActivePercent: 0,
          totalTabSwitches: 0,
          totalFocusLost: 0,
        },
        eventCounts: [],
        pageVisitStats: [],
        dailyData: [],
        recentSessions: [],
        _warning: "数据库模型未加载，请重启 Next.js 开发服务器"
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取会话统计
    const sessions = await prisma.learningSession.findMany({
      where: {
        startedAt: { gte: startDate },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            studentId: true,
          },
        },
      },
    });

    // 聚合统计
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + s.totalDurationSec, 0);
    const totalActive = sessions.reduce((sum, s) => sum + s.activeDurationSec, 0);
    const totalTabSwitches = sessions.reduce((sum, s) => sum + s.tabSwitches, 0);
    const totalFocusLost = sessions.reduce((sum, s) => sum + s.focusLostCount, 0);

    // 获取最近的行为事件统计
    const eventCounts = await prisma.behaviorEvent.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // 获取页面访问统计
    const pageVisitStats = await prisma.pageVisit.groupBy({
      by: ["problemId"],
      where: {
        enteredAt: { gte: startDate },
        problemId: { not: null },
      },
      _count: true,
      _sum: {
        durationSec: true,
        activeSec: true,
        tabSwitches: true,
      },
    });

    // 每日统计（过去7天）
    const dailyData: { date: string; sessions: number; duration: number; active: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessions = sessions.filter(s => {
        const sDate = new Date(s.startedAt);
        return sDate >= dayStart && sDate < dayEnd;
      });

      dailyData.push({
        date: dateStr,
        sessions: daySessions.length,
        duration: daySessions.reduce((sum, s) => sum + s.totalDurationSec, 0),
        active: daySessions.reduce((sum, s) => sum + s.activeDurationSec, 0),
      });
    }

    // 最近活跃会话详情
    const recentSessions = sessions.slice(0, 20).map(s => ({
      id: s.id,
      sessionToken: s.sessionToken.substring(0, 12) + "...",
      user: s.user ? {
        username: s.user.username,
        displayName: s.user.displayName,
        studentId: s.user.studentId,
      } : null,
      startedAt: s.startedAt.toISOString(),
      duration: s.totalDurationSec,
      activeDuration: s.activeDurationSec,
      idleDuration: s.idleDurationSec,
      tabSwitches: s.tabSwitches,
      focusLostCount: s.focusLostCount,
      pagesVisited: s.pagesVisited,
      problemsAttempted: s.problemsAttempted,
    }));

    return NextResponse.json({
      summary: {
        totalSessions,
        totalDurationHours: Math.round(totalDuration / 3600 * 10) / 10,
        totalActiveHours: Math.round(totalActive / 3600 * 10) / 10,
        avgSessionMinutes: totalSessions > 0 
          ? Math.round(totalDuration / totalSessions / 60) 
          : 0,
        avgActivePercent: totalDuration > 0 
          ? Math.round(totalActive / totalDuration * 100) 
          : 0,
        totalTabSwitches,
        totalFocusLost,
      },
      eventCounts: eventCounts.map(e => ({
        type: e.eventType,
        count: e._count,
      })),
      pageVisitStats: pageVisitStats
        .filter(p => p.problemId)
        .map(p => ({
          problemId: p.problemId,
          visits: p._count,
          totalDurationMin: Math.round((p._sum.durationSec || 0) / 60),
          totalActiveMin: Math.round((p._sum.activeSec || 0) / 60),
          avgTabSwitches: p._count > 0 
            ? Math.round((p._sum.tabSwitches || 0) / p._count * 10) / 10 
            : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20),
      dailyData: dailyData.reverse(),
      recentSessions,
    });
  } catch (error) {
    console.error("[Analytics] Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

