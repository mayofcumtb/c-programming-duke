-- ============================================================
-- C Programming Judge - 数据库初始化脚本
-- 学生通过邀请码加入课程
-- ============================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 枚举类型
-- ============================================================

-- 用户角色
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- 邀请码类型
CREATE TYPE invite_type AS ENUM ('teacher', 'student');

-- 题目类型
CREATE TYPE problem_type AS ENUM (
    'text_exact', 'compile_run', 'code_with_grader', 'link_object',
    'makefile_project', 'reading', 'testgen', 'project', 'quiz'
);

-- 显示类型
CREATE TYPE display_type AS ENUM ('standard', 'multi_file', 'reading', 'testgen', 'quiz');

-- 提交状态
CREATE TYPE submission_status AS ENUM (
    'pending', 'running', 'accepted', 'wrong_answer',
    'compile_error', 'runtime_error', 'time_limit_exceeded', 'system_error'
);

-- 难度级别
CREATE TYPE difficulty_level AS ENUM ('beginner', 'basic', 'intermediate', 'advanced', 'fun');

-- ============================================================
-- 用户系统
-- ============================================================

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE,              -- 学号（学生）
    username VARCHAR(100) NOT NULL UNIQUE,      -- 用户名（登录用）
    email VARCHAR(200),                         -- 邮箱
    password_hash VARCHAR(255) NOT NULL DEFAULT '', -- 密码哈希
    display_name VARCHAR(100),                  -- 显示名称/真实姓名
    class_name VARCHAR(100),                    -- 班级名称（仅文本，用于分组统计）
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 用户会话表
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,         -- 会话 token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 课程系统
-- ============================================================

-- 课程表（一个教师可以创建多个课程）
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,           -- 课程代码（如 CS101）
    name VARCHAR(200) NOT NULL,                 -- 课程名称
    description TEXT,                           -- 课程描述
    teacher_id UUID NOT NULL REFERENCES users(id), -- 授课教师
    -- 时间控制
    start_date DATE,                            -- 开课日期
    end_date DATE,                              -- 结课日期
    daily_start_time TIME,                      -- 每日开始时间（如 08:00）
    daily_end_time TIME,                        -- 每日结束时间（如 22:00）
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 课程学生关联表（学生通过邀请码加入课程）
CREATE TABLE course_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

-- 邀请码表（关联到课程）
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,           -- 邀请码
    invite_type invite_type NOT NULL,           -- 邀请类型
    created_by UUID REFERENCES users(id),       -- 创建者
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- 关联课程（学生邀请码）
    max_uses INT DEFAULT 1,                     -- 最大使用次数
    used_count INT DEFAULT 0,                   -- 已使用次数
    expires_at TIMESTAMP WITH TIME ZONE,        -- 过期时间
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 课程内容
-- ============================================================

-- 课程阶段表（属于特定课程）
CREATE TABLE stages (
    id VARCHAR(50) PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 模块表
CREATE TABLE modules (
    id VARCHAR(50) PRIMARY KEY,
    stage_id VARCHAR(50) NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 题目表
CREATE TABLE problems (
    id VARCHAR(50) PRIMARY KEY,
    module_id VARCHAR(50) REFERENCES modules(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description_zh TEXT,
    description_en TEXT,
    problem_type problem_type NOT NULL,
    display_type display_type NOT NULL DEFAULT 'standard',
    difficulty difficulty_level NOT NULL DEFAULT 'basic',
    points INT NOT NULL DEFAULT 10,
    editable_files JSONB NOT NULL DEFAULT '[]',
    readonly_files JSONB NOT NULL DEFAULT '[]',
    learning_goals JSONB DEFAULT '[]',
    hints JSONB DEFAULT '[]',
    resource_path VARCHAR(200),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 题目时间控制（可为特定课程设置题目开放时间）
CREATE TABLE problem_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id VARCHAR(50) NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,        -- 开放时间
    end_time TIMESTAMP WITH TIME ZONE,          -- 截止时间
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(problem_id, course_id)
);

-- ============================================================
-- 判题与提交
-- ============================================================

CREATE TABLE judge_configs (
    problem_id VARCHAR(50) PRIMARY KEY REFERENCES problems(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}',
    main_file VARCHAR(100),
    compile_cmd TEXT,
    expected_output TEXT,
    grader_code TEXT,
    test_cases JSONB DEFAULT '[]',
    time_limit_ms INT NOT NULL DEFAULT 5000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_configs (
    problem_id VARCHAR(50) PRIMARY KEY REFERENCES problems(id) ON DELETE CASCADE,
    quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('single', 'true_false', 'fill')),
    prompt TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id VARCHAR(50) NOT NULL REFERENCES problems(id),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID REFERENCES courses(id),      -- 所属课程
    files JSONB NOT NULL,
    status submission_status NOT NULL DEFAULT 'pending',
    score INT NOT NULL DEFAULT 0,
    logs JSONB DEFAULT '[]',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    judged_at TIMESTAMP WITH TIME ZONE,
    compile_time_ms INT,
    run_time_ms INT,
    memory_kb INT
);

-- 学生代码草稿（自动保存）
CREATE TABLE code_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id VARCHAR(50) NOT NULL,
    files JSONB NOT NULL DEFAULT '{}',           -- {filename: content}
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, problem_id)
);

-- ============================================================
-- 学习行为追踪
-- ============================================================

CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    total_duration_sec INT DEFAULT 0,
    active_duration_sec INT DEFAULT 0,
    idle_duration_sec INT DEFAULT 0,
    tab_switches INT DEFAULT 0,
    focus_lost_count INT DEFAULT 0,
    mouse_clicks INT DEFAULT 0,
    key_presses INT DEFAULT 0,
    scroll_count INT DEFAULT 0,
    pages_visited INT DEFAULT 0,
    problems_attempted INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    user_agent TEXT,
    screen_width INT,
    screen_height INT,
    ip_hash VARCHAR(64)
);

CREATE TABLE page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    page_path VARCHAR(500) NOT NULL,
    problem_id VARCHAR(50),
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_sec INT DEFAULT 0,
    active_sec INT DEFAULT 0,
    tab_switches INT DEFAULT 0,
    focus_lost_count INT DEFAULT 0,
    scroll_depth_percent INT DEFAULT 0,
    reading_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE behavior_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    page_visit_id UUID REFERENCES page_visits(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_class_name ON users(class_name);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_course ON invite_codes(course_id);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_course_students_course ON course_students(course_id);
CREATE INDEX idx_course_students_student ON course_students(student_id);

CREATE INDEX idx_stages_course ON stages(course_id);
CREATE INDEX idx_problems_module ON problems(module_id);
CREATE INDEX idx_problem_schedules_problem ON problem_schedules(problem_id);
CREATE INDEX idx_problem_schedules_course ON problem_schedules(course_id);

CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_course ON submissions(course_id);
CREATE INDEX idx_submissions_time ON submissions(submitted_at DESC);

CREATE INDEX idx_code_drafts_user ON code_drafts(user_id);
CREATE INDEX idx_code_drafts_problem ON code_drafts(problem_id);

CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_token ON learning_sessions(session_token);

-- ============================================================
-- 初始数据：管理员账户
-- ============================================================

-- 默认管理员账户 (密码: admin123)
INSERT INTO users (username, password_hash, display_name, role, email) VALUES
('admin', crypt('admin123', gen_salt('bf')), '系统管理员', 'admin', 'admin@example.com');

-- 默认教师邀请码（永久有效，无限使用）
INSERT INTO invite_codes (code, invite_type, max_uses, is_active) VALUES
('TEACHER2024', 'teacher', 9999, TRUE);

-- ============================================================
-- 默认课程（C语言程序设计）
-- ============================================================

-- 创建默认课程
INSERT INTO courses (id, code, name, description, teacher_id, start_date, end_date, daily_start_time, daily_end_time)
SELECT 
    'c0000000-0000-0000-0000-000000000001'::UUID,
    'CS101',
    'C语言程序设计基础',
    '机器人学院C语言程序课程工程化实践平台',
    id,
    '2024-01-01',
    '2030-12-31',
    '00:00',
    '23:59'
FROM users WHERE username = 'admin';

-- 创建默认学生邀请码（关联到默认课程）
INSERT INTO invite_codes (code, invite_type, course_id, max_uses, is_active, created_by) 
SELECT 
    'STUDENT2024',
    'student',
    'c0000000-0000-0000-0000-000000000001'::UUID,
    9999,
    TRUE,
    id
FROM users WHERE username = 'admin';

-- ============================================================
-- 课程阶段（关联默认课程）
-- ============================================================

INSERT INTO stages (id, course_id, title, description, sort_order) VALUES
('stage-1', 'c0000000-0000-0000-0000-000000000001'::UUID, '阶段 1：C语言基础', '掌握编译运行、变量类型、控制流及基础工程结构', 1),
('stage-2', 'c0000000-0000-0000-0000-000000000001'::UUID, '阶段 2：内存与指针', '深入理解内存模型、指针运算与动态内存管理', 2),
('stage-3', 'c0000000-0000-0000-0000-000000000001'::UUID, '阶段 3：软件工程与测试', '测试驱动开发 (TDD)、调试技术与代码质量', 3),
('stage-4', 'c0000000-0000-0000-0000-000000000001'::UUID, '阶段 4：综合项目实战', '大型项目开发、模块化编程与复杂数据结构', 4);

-- 模块
INSERT INTO modules (id, stage_id, title, description, sort_order) VALUES
('module-1', 'stage-1', '模块 1：编译与运行', 'GCC 编译器、Hello World、基本输出', 1),
('module-2', 'stage-1', '模块 2：变量与控制流', '变量类型、if-else 分支、循环结构', 2),
('module-3', 'stage-1', '模块 3：结构体与工程基础', 'struct 定义、多文件编译、Makefile', 3),
('module-4', 'stage-2', '模块 4：指针入门', '指针声明、解引用、指针运算', 4),
('module-5', 'stage-2', '模块 5：数组与动态内存', '数组与指针的关系、malloc/free', 5),
('module-6', 'stage-3', '模块 6：测试驱动开发 (TDD)', '单元测试、黑盒测试、边界条件', 6),
('module-7', 'stage-3', '模块 7：调试技术', 'GDB 使用、断点调试', 7),
('module-8', 'stage-4', '模块 8：扑克牌评估系统', '复杂数据结构、模块化编程、位运算', 8);

-- 基础题目
INSERT INTO problems (id, module_id, title, description_zh, problem_type, display_type, difficulty, points, editable_files, resource_path, sort_order) VALUES
('00_hello', 'module-1', 'Hello World', '# Hello World 入门练习', 'text_exact', 'standard', 'beginner', 10, '["hello.txt"]', '00_hello', 1),
('04_compile', 'module-1', '编译原理初探', '# 编译原理初探', 'compile_run', 'standard', 'beginner', 10, '["hello.c"]', '04_compile', 2),
('02_code1', 'module-2', 'Max 函数实现', '# Max 函数实现', 'code_with_grader', 'standard', 'basic', 20, '["code1.c"]', '02_code1', 1),
('03_code2', 'module-2', '打印三角形', '# 打印三角形', 'code_with_grader', 'standard', 'basic', 25, '["code2.c"]', '03_code2', 2);

-- 判题配置
INSERT INTO judge_configs (problem_id, config, main_file, expected_output) VALUES
('00_hello', '{"type": "text_exact", "expected": "hello"}', 'hello.txt', 'hello'),
('04_compile', '{"type": "compile_run"}', 'hello.c', 'Hello World\n');

INSERT INTO judge_configs (problem_id, config, main_file) VALUES
('02_code1', '{"type": "code_with_grader", "grader": "code1"}', 'code1.c'),
('03_code2', '{"type": "code_with_grader", "grader": "code2"}', 'code2.c');

-- ============================================================
-- 完成
-- ============================================================
SELECT 'Database initialized successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_courses FROM courses;
SELECT COUNT(*) AS total_problems FROM problems;
