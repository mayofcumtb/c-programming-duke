import { cookies } from "next/headers";
import { prisma } from "./db";

export interface AuthUser {
  id: string;
  username: string;
  studentId: string | null;
  displayName: string | null;
  role: "admin" | "teacher" | "student";
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  courses: { id: string; code: string; name: string }[];
}

/**
 * 获取当前登录用户（服务端组件使用）
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            studentId: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      // 删除过期会话
      await prisma.userSession.delete({ where: { id: session.id } });
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    // 获取课程信息
    let courses: { id: string; code: string; name: string }[] = [];
    
    if (session.user.role === "student") {
      const courseStudents = await prisma.courseStudent.findMany({
        where: { studentId: session.user.id },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });
      courses = courseStudents.map((cs) => cs.course);
    } else if (session.user.role === "teacher") {
      // 教师可以看到自己教的课程
      const teacherCourses = await prisma.course.findMany({
        where: { teacherId: session.user.id },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });
      courses = teacherCourses;
    }

    return {
      user: session.user as AuthUser,
      courses,
    };
  } catch (error) {
    console.error("[Auth] getSession error:", error);
    return null;
  }
}

/**
 * 检查用户是否有权限访问某个页面
 */
export function canAccess(
  user: AuthUser | null,
  requiredRole: "admin" | "teacher" | "student" | "any"
): boolean {
  if (!user) return false;
  
  if (requiredRole === "any") return true;
  
  if (requiredRole === "admin") {
    return user.role === "admin";
  }
  
  if (requiredRole === "teacher") {
    return user.role === "admin" || user.role === "teacher";
  }
  
  // student - 所有登录用户都可以访问
  return true;
}

/**
 * 检查学生是否可以在当前时间访问课程
 */
export async function canAccessCourse(
  userId: string,
  courseId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 检查学生是否属于该课程
    const membership = await prisma.courseStudent.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: userId,
        },
      },
      include: {
        course: true,
      },
    });

    if (!membership) {
      return { allowed: false, reason: "您未加入该课程" };
    }

    const course = membership.course;
    const now = new Date();

    // 检查课程日期范围
    if (course.startDate && now < course.startDate) {
      return { allowed: false, reason: "课程尚未开始" };
    }

    if (course.endDate && now > course.endDate) {
      return { allowed: false, reason: "课程已结束" };
    }

    // 检查每日时间范围
    if (course.dailyStartTime && course.dailyEndTime) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const startTime = course.dailyStartTime.toTimeString().slice(0, 5);
      const endTime = course.dailyEndTime.toTimeString().slice(0, 5);

      if (currentTime < startTime || currentTime > endTime) {
        return {
          allowed: false,
          reason: `课程仅在 ${startTime} - ${endTime} 期间开放`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("[Auth] canAccessCourse error:", error);
    return { allowed: true }; // 出错时默认允许
  }
}

/**
 * 检查学生是否可以访问某道题目
 */
export async function canAccessProblem(
  userId: string,
  problemId: string,
  courseId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 如果没有指定课程，检查学生的所有课程
    let courseIds: string[] = [];
    
    if (courseId) {
      courseIds = [courseId];
    } else {
      const memberships = await prisma.courseStudent.findMany({
        where: { studentId: userId },
        select: { courseId: true },
      });
      courseIds = memberships.map((m) => m.courseId);
    }

    if (courseIds.length === 0) {
      return { allowed: false, reason: "您尚未加入任何课程" };
    }

    // 检查题目时间控制
    const schedules = await prisma.problemSchedule.findMany({
      where: {
        problemId,
        courseId: { in: courseIds },
        isActive: true,
      },
    });

    // 如果没有时间控制，默认允许
    if (schedules.length === 0) {
      return { allowed: true };
    }

    const now = new Date();

    // 只要有一个课程的时间允许就可以
    for (const schedule of schedules) {
      const startOk = !schedule.startTime || now >= schedule.startTime;
      const endOk = !schedule.endTime || now <= schedule.endTime;

      if (startOk && endOk) {
        return { allowed: true };
      }
    }

    // 所有课程都不在允许时间内
    const schedule = schedules[0];
    if (schedule.startTime && now < schedule.startTime) {
      return {
        allowed: false,
        reason: `题目将于 ${schedule.startTime.toLocaleString("zh-CN")} 开放`,
      };
    }
    if (schedule.endTime && now > schedule.endTime) {
      return {
        allowed: false,
        reason: "题目已截止提交",
      };
    }

    return { allowed: false, reason: "当前时间不在允许范围内" };
  } catch (error) {
    console.error("[Auth] canAccessProblem error:", error);
    return { allowed: true };
  }
}
