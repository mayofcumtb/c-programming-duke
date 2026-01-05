#!/usr/bin/env python3
"""
Judge Core - 判题核心逻辑
支持多种题目类型和编译模式
"""

import os
import subprocess
import json
import glob
import shutil

# ============================================================
# 题目配置 (Problem Configuration)
# ============================================================

PROBLEM_CONFIG = {
    # 入门文本题
    "00_hello": {
        "type": "text_exact",
        "filename": "hello.txt",
        "expected": "hello"
    },
    "01_apple": {
        "type": "text_exact", 
        "filename": "fruit.txt",
        "expected": "apple"
    },
    
    # 简单编译运行
    "04_compile": {
        "type": "compile_run",
        "filename": "hello.c",
        "expected_output": "Hello World\n",
        "compile_cmd": "gcc -o main -pedantic -std=gnu99 -Wall -Werror {filename}"
    },
    
    # 带测试的代码题
    "02_code1": {
        "type": "code_with_grader",
        "filename": "code1.c",
        "grader": "code1_grader"
    },
    "03_code2": {
        "type": "code_with_grader",
        "filename": "code2.c", 
        "grader": "code2_grader"
    },
    
    # 需要链接 .o 文件的题目
    "05_squares": {
        "type": "link_object",
        "filename": "squares.c",
        "objects": ["squares_test.o"],
        "compile_cmd": "gcc -o squares -Wall -Werror -std=gnu99 -pedantic -no-pie squares.c squares_test.o",
        "test_cases": [
            {"args": "3 5 8 2", "expected_file": "ans_3_5_8_2.txt"},
            {"args": "5 2 4 6", "expected_file": "ans_5_2_4_6.txt"},
            {"args": "9 2 3 4", "expected_file": "ans_9_2_3_4.txt"}
        ]
    },
    
    # Makefile 项目
    "06_rect": {
        "type": "makefile_project",
        "filename": "rectangle.c",
        "make_target": "rectangle",
        "executable": "rectangle",
        "expected_file": "rectangle_ans.txt"
    },
    "07_retirement": {
        "type": "makefile_project",
        "filename": "retirement.c",
        "make_target": "retirement",
        "executable": "retirement",
        "expected_file": "retirement_ans.txt"
    },
    
    # 阅读理解题
    "11_read_ptr1": {
        "type": "reading",
        "answer_file": "answer.txt",
        "verify_makefile": True,
        "test_program": "test"
    },
    "12_read_ptr2": {
        "type": "reading",
        "answer_file": "answer.txt",
        "verify_makefile": True,
        "test_program": "test"
    },
    "13_read_arr1": {
        "type": "reading",
        "answer_file": "answer.txt",
        "verify_makefile": True,
        "test_program": "test"
    },
    
    # 数组算法
    "14_array_max": {
        "type": "code_with_grader",
        "filename": "arrayMax.c",
        "grader": "array_max_grader"
    },
    
    # 测试生成题
    "08_testing": {
        "type": "testgen_multi",
        "files": ["input.1", "input.2", "input.3", "input.4"],
        "correct_program": "isPrime-correct",
        "broken_programs": ["isPrime-broken1", "isPrime-broken2", "isPrime-broken3", "isPrime-broken4"]
    },
    
    # 单元测试编写
    "15_tests_subseq": {
        "type": "unittest_subseq",
        "filename": "test-subseq.c",
        "test_runner": "run_all.sh"
    },
    
    # 子序列算法 - 需要自动生成测试驱动
    "16_subseq": {
        "type": "code_with_grader",
        "filename": "maxSeq.c",
        "grader": "maxseq_grader"
    },
    
    # 综合项目 - 需要自动生成测试
    "c2prj1_cards": {
        "type": "code_with_grader",
        "filenames": ["cards.c", "cards.h"],
        "grader": "cards_grader"
    },
    "c2prj2_testing": {
        "type": "testgen_advanced",
        "filename": "tests.txt"
    },
    
    # GDB 调试题
    "10_gdb": {
        "type": "gdb_challenge",
        "filename": "input.txt",
        "game_program": "game"
    }
}


# ============================================================
# 工具函数 (Utility Functions)
# ============================================================

def run_command(cmd, timeout=10, cwd=None, input_data=None):
    """执行命令并返回结果"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd,
            input=input_data
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode,
            "timeout": False
        }
    except subprocess.TimeoutExpired as e:
        return {
            "stdout": e.stdout if e.stdout else "",
            "stderr": "Execution timed out after {} seconds".format(timeout),
            "exit_code": -1,
            "timeout": True
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": str(e),
            "exit_code": -1,
            "timeout": False
        }


def read_text_file(file_path):
    """读取文本文件"""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception:
        return None


def write_text_file(file_path, content):
    """写入文本文件"""
    with open(file_path, "w") as f:
        f.write(content)


def prepare_problem_workspace(problem_id, work_dir, resource_dir):
    """准备题目工作空间：复制资源文件到工作目录"""
    src_dir = os.path.join(resource_dir, problem_id)
    if not os.path.isdir(src_dir):
        return None, ["Problem resources not found: {}".format(src_dir)]

    dst_dir = os.path.join(work_dir, "problem")
    
    # 清理旧目录
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    
    # 复制资源
    try:
        result = subprocess.run(
            ["cp", "-r", src_dir, dst_dir],
            timeout=30,
            capture_output=True
        )
        if result.returncode != 0:
            return None, ["Failed to copy resources: {}".format(result.stderr.decode())]
    except subprocess.TimeoutExpired:
        return None, ["Copy resources timed out"]
    except Exception as e:
        # Fallback to shutil
        try:
            shutil.copytree(src_dir, dst_dir)
        except Exception as e2:
            return None, ["Failed to copy resources: {}".format(str(e2))]
    
    return dst_dir, []


def overlay_submission(work_dir, problem_workspace_dir):
    """将学生提交的文件覆盖到题目工作空间"""
    try:
        for name in os.listdir(work_dir):
            if name == "problem":
                continue

            src = os.path.join(work_dir, name)
            dst = os.path.join(problem_workspace_dir, name)

            if os.path.isdir(src):
                if os.path.exists(dst):
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)

        return []
    except Exception as e:
        return ["Failed to overlay submission:", str(e)]


# ============================================================
# 判题器 (Judgers)
# ============================================================

def judge_text_exact(config, work_dir, resource_dir):
    """精确文本匹配"""
    filename = config["filename"]
    expected = config["expected"]
    
    content = read_text_file(os.path.join(work_dir, filename))
    if content is None:
        return {
            "status": "runtime_error",
            "score": 0,
            "logs": ["Missing file: {}".format(filename)]
        }
    
    if content.strip() == expected:
        return {
            "status": "accepted",
            "score": 100,
            "logs": ["✓ 正确！文件内容匹配。"]
        }
    else:
        return {
            "status": "wrong_answer",
            "score": 0,
            "logs": [
                "✗ 内容不匹配",
                "期望: {}".format(expected),
                "实际: {}".format(content.strip())
            ]
        }


def judge_compile_run(config, work_dir, resource_dir, problem_id):
    """编译运行并检查输出"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    filename = config["filename"]
    compile_cmd = config.get("compile_cmd", "gcc -o main -pedantic -std=gnu99 -Wall -Werror {}").format(filename=filename)
    expected_output = config["expected_output"]
    
    # 编译
    logs.append("正在编译...")
    build_res = run_command(compile_cmd, timeout=30, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {
            "status": "compile_error",
            "score": 0,
            "logs": logs + ["编译失败:", build_res["stderr"]]
        }
    logs.append("✓ 编译成功")
    
    # 运行
    logs.append("正在运行...")
    run_res = run_command("./main", timeout=5, cwd=problem_ws)
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    if run_res["exit_code"] != 0:
        return {
            "status": "runtime_error", 
            "score": 0, 
            "logs": logs + ["运行错误 (退出码 {}):".format(run_res["exit_code"]), run_res["stderr"]]
        }
    
    # 检查输出
    if run_res["stdout"] == expected_output:
        return {
            "status": "accepted",
            "score": 100,
            "logs": logs + ["✓ 输出正确!", "--- 输出 ---", run_res["stdout"]]
        }
    else:
        return {
            "status": "wrong_answer",
            "score": 0,
            "logs": logs + [
                "✗ 输出不匹配",
                "--- 期望 ---", expected_output,
                "--- 实际 ---", run_res["stdout"]
            ]
        }


def judge_link_object(config, work_dir, resource_dir, problem_id):
    """链接 .o 文件编译"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    compile_cmd = config["compile_cmd"]
    test_cases = config.get("test_cases", [])
    
    # 编译
    logs.append("正在编译 (链接 .o 文件)...")
    build_res = run_command(compile_cmd, timeout=30, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {
            "status": "compile_error",
            "score": 0,
            "logs": logs + ["编译失败:", build_res["stderr"]]
        }
    logs.append("✓ 编译成功")
    
    # 获取可执行文件名
    exe_name = compile_cmd.split("-o")[1].strip().split()[0] if "-o" in compile_cmd else "a.out"
    
    # 运行测试用例
    if test_cases:
        passed = 0
        total = len(test_cases)
        
        for i, tc in enumerate(test_cases):
            args = tc.get("args", "")
            expected_file = tc.get("expected_file")
            
            run_res = run_command("./{} {}".format(exe_name, args), timeout=5, cwd=problem_ws)
            
            if run_res["timeout"]:
                logs.append("测试 {} ({}) - 超时".format(i+1, args))
                continue
            
            if run_res["exit_code"] != 0:
                logs.append("测试 {} ({}) - 运行错误".format(i+1, args))
                continue
            
            # 检查输出
            if expected_file:
                expected = read_text_file(os.path.join(problem_ws, expected_file))
                if expected and run_res["stdout"] == expected:
                    logs.append("✓ 测试 {} ({}) - 通过".format(i+1, args))
                    passed += 1
                else:
                    logs.append("✗ 测试 {} ({}) - 输出不匹配".format(i+1, args))
            else:
                logs.append("? 测试 {} ({}) - 已运行".format(i+1, args))
                passed += 1
        
        score = int(100 * passed / total) if total > 0 else 0
        status = "accepted" if passed == total else "wrong_answer"
        logs.append("通过 {}/{} 个测试".format(passed, total))
        
        return {"status": status, "score": score, "logs": logs}
    else:
        # 无测试用例，只验证编译
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 编译验证通过"]}


def judge_makefile_project(config, work_dir, resource_dir, problem_id):
    """使用 Makefile 编译的项目"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    make_target = config.get("make_target", "")
    executable = config.get("executable", make_target)
    expected_file = config.get("expected_file")
    
    # Make 编译
    logs.append("正在使用 Makefile 编译...")
    make_cmd = "make {}".format(make_target) if make_target else "make"
    build_res = run_command(make_cmd, timeout=60, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {
            "status": "compile_error",
            "score": 0,
            "logs": logs + ["Make 失败:", build_res["stderr"], build_res["stdout"]]
        }
    logs.append("✓ 编译成功")
    
    # 运行
    logs.append("正在运行 {}...".format(executable))
    run_res = run_command("./{}".format(executable), timeout=10, cwd=problem_ws)
    
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    if run_res["exit_code"] != 0:
        return {
            "status": "runtime_error",
            "score": 0,
            "logs": logs + ["运行错误 (退出码 {}):".format(run_res["exit_code"]), run_res["stderr"]]
        }
    
    # 检查输出
    if expected_file:
        expected = read_text_file(os.path.join(problem_ws, expected_file))
        if expected and run_res["stdout"] == expected:
            return {
                "status": "accepted",
                "score": 100,
                "logs": logs + ["✓ 输出正确!", "--- 输出 ---", run_res["stdout"]]
            }
        else:
            return {
                "status": "wrong_answer",
                "score": 0,
                "logs": logs + [
                    "✗ 输出不匹配",
                    "--- 期望 ---", expected or "(无法读取)",
                    "--- 实际 ---", run_res["stdout"]
                ]
            }
    else:
        return {
            "status": "accepted",
            "score": 100,
            "logs": logs + ["✓ 程序运行成功", "--- 输出 ---", run_res["stdout"]]
        }


def judge_code1_grader(work_dir, problem_ws, logs):
    """code1 (Max函数) 专用评测器"""
    code_path = os.path.join(problem_ws, "code1.c")
    code = read_text_file(code_path)
    if code is None:
        return {"status": "runtime_error", "score": 0, "logs": ["缺少文件: code1.c"]}

    if not ("int max" in code and "int main" in code):
        return {"status": "wrong_answer", "score": 0, "logs": ["缺少必需函数: int max(...) 和 int main(void)"]}

    # 添加头文件并编译
    tmp_c = os.path.join(problem_ws, "temp.c")
    write_text_file(tmp_c, "#include <stdio.h>\n#include <stdlib.h>\n" + code)
    build_res = run_command('gcc -Wall -Werror -pedantic -std=gnu99 temp.c -o code1', timeout=30, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", build_res["stderr"]]}

    # 运行学生程序
    run_res = run_command("./code1", timeout=5, cwd=problem_ws)
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    if run_res["exit_code"] != 0:
        return {"status": "runtime_error", "score": 0, "logs": logs + ["运行错误:", run_res["stderr"]]}

    expected_stdout = (
        "max(42,-69) is 42\n"
        "max(33,0) is 33\n"
        "max(0x123456,123456) is 1193046\n"
        "max(0x451215AF,0x913591AF) is 1158813103\n"
    )
    
    def normalize_output(s):
        return "".join(line.replace(", ", ",").replace(" ,", ",") for line in s.splitlines(True))

    if normalize_output(run_res["stdout"]) != expected_stdout:
        return {
            "status": "wrong_answer", 
            "score": 0, 
            "logs": logs + ["基础测试输出不匹配", "--- 期望 ---", expected_stdout, "--- 实际 ---", run_res["stdout"]]
        }
    
    logs.append("✓ 基础测试通过")
    
    # 隐藏测试
    grade_c = """
#include <stdio.h>
#include <limits.h>
#define main student_main
#include "code1.c"
#undef main
static int expect_max(int a, int b) { return a > b ? a : b; }
int main(void) {
  int xs[] = {-999, -87, 0, 1, 240, 345, 999999, INT_MAX};
  int ys[] = {INT_MIN, 123, 567, 891, 0, 1, -999, 123123123};
  size_t i, j;
  int ok = 1;
  for (i = 0; i < sizeof(xs)/sizeof(xs[0]); i++) {
    for (j = 0; j < sizeof(ys)/sizeof(ys[0]); j++) {
      int a = xs[i], b = ys[j];
      int got = max(a, b);
      int exp = expect_max(a, b);
      if (got == exp) printf("Testing max(%d, %d) ... Correct\\n", a, b);
      else { printf("Testing max(%d, %d) ... Incorrect (got %d, expected %d)\\n", a, b, got, exp); ok = 0; }
    }
  }
  return ok ? 0 : 1;
}
"""
    write_text_file(os.path.join(problem_ws, "autograde.c"), grade_c)
    grade_build = run_command('gcc -Wall -Werror -pedantic -std=gnu99 autograde.c -o autograde', timeout=30, cwd=problem_ws)
    if grade_build["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["评测器编译失败:", grade_build["stderr"]]}

    grade_run = run_command("./autograde", timeout=5, cwd=problem_ws)
    if grade_run["exit_code"] != 0:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["隐藏测试未通过:", grade_run["stdout"]]}

    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!", "--- 隐藏测试结果 ---", grade_run["stdout"]]}


def judge_code2_grader(work_dir, problem_ws, logs):
    """code2 (PrintTriangle) 专用评测器"""
    code_path = os.path.join(problem_ws, "code2.c")
    code = read_text_file(code_path)
    if code is None:
        return {"status": "runtime_error", "score": 0, "logs": ["缺少文件: code2.c"]}

    if not ("int printTriangle" in code and "int main" in code):
        return {"status": "wrong_answer", "score": 0, "logs": ["缺少必需函数: int printTriangle(int size) 和 int main(void)"]}

    # 编译
    tmp_c = os.path.join(problem_ws, "temp.c")
    write_text_file(tmp_c, "#include <stdio.h>\n#include <stdlib.h>\n" + code)
    build_res = run_command('gcc -Wall -Werror -pedantic -std=gnu99 temp.c -o code2', timeout=30, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", build_res["stderr"]]}

    # 运行
    run_res = run_command("./code2", timeout=5, cwd=problem_ws)
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    if run_res["exit_code"] != 0:
        return {"status": "runtime_error", "score": 0, "logs": logs + ["运行错误:", run_res["stderr"]]}

    expected_stdout = (
        "Here is a triangle with height 4\n*\n**\n***\n****\n"
        "That triangle had 10 total stars\n"
        "Here is a triangle with height 7\n*\n**\n***\n****\n*****\n******\n*******\n"
        "That triangle had 28 total stars\n"
    )
    
    if run_res["stdout"] != expected_stdout:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["基础测试输出不匹配", "--- 期望 ---", expected_stdout, "--- 实际 ---", run_res["stdout"]]}
    
    logs.append("✓ 基础测试通过")
    
    # 隐藏测试
    grade_c = """
#include <stdio.h>
#include <stdlib.h>
#define main student_main
#include "code2.c"
#undef main
static int triangular(int n) { return n <= 0 ? 0 : (n * (n + 1)) / 2; }
int main(void) {
  freopen("/dev/null", "w", stdout);
  int tests[] = {0, 1, 2, 3, 4, 7, 9, 12, 95, 159, 343, 2438};
  size_t i;
  int ok = 1;
  for (i = 0; i < sizeof(tests)/sizeof(tests[0]); i++) {
    int n = tests[i];
    int got = printTriangle(n);
    int pass = (got == triangular(n));
    if (pass) fprintf(stderr, "Testing printTriangle(%d) ... Correct\\n", n);
    else { fprintf(stderr, "Testing printTriangle(%d) ... Incorrect\\n", n); ok = 0; }
  }
  return ok ? 0 : 1;
}
"""
    write_text_file(os.path.join(problem_ws, "autograde.c"), grade_c)
    grade_build = run_command('gcc -Wall -Werror -pedantic -std=gnu99 autograde.c -o autograde', timeout=30, cwd=problem_ws)
    if grade_build["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["评测器编译失败:", grade_build["stderr"]]}

    grade_run = run_command("./autograde", timeout=10, cwd=problem_ws)
    if grade_run["exit_code"] != 0:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["隐藏测试未通过:", grade_run["stderr"]]}
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!", "--- 隐藏测试结果 ---", grade_run["stderr"]]}


def judge_array_max_grader(work_dir, problem_ws, logs):
    """arrayMax 专用评测器"""
    build_res = run_command('gcc -o main -pedantic -std=gnu99 -Wall -Werror arrayMax.c', timeout=30, cwd=problem_ws)
    if build_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", build_res["stderr"]]}
    
    logs.append("✓ 编译成功")
    
    run_res = run_command("./main", timeout=5, cwd=problem_ws)
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    if run_res["exit_code"] != 0:
        return {"status": "runtime_error", "score": 0, "logs": logs + ["运行错误:", run_res["stderr"]]}
    
    expected = ["99", "-3", "425", "NULL", "NULL"]
    tokens = []
    for line in run_res["stdout"].splitlines():
        s = line.strip()
        if s == "NULL":
            tokens.append("NULL")
        else:
            try:
                int(s)
                tokens.append(s)
            except:
                pass
    
    if tokens[:5] != expected:
        return {
            "status": "wrong_answer",
            "score": 0,
            "logs": logs + ["结果不匹配", "期望: {}".format(", ".join(expected)), "实际: {}".format(", ".join(tokens[:5])), "--- 原始输出 ---", run_res["stdout"]]
        }
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!", "--- 输出 ---", run_res["stdout"]]}


def judge_maxseq_grader(work_dir, problem_ws, logs):
    """maxSeq (最长连续子序列) 专用评测器"""
    
    # 检查 maxSeq.c 是否存在
    src_path = os.path.join(problem_ws, "maxSeq.c")
    if not os.path.exists(src_path):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少文件: maxSeq.c"]}
    
    # 读取学生代码
    student_code = read_text_file(src_path)
    if student_code is None:
        return {"status": "runtime_error", "score": 0, "logs": ["无法读取 maxSeq.c"]}
    
    # 创建测试驱动程序
    test_driver = '''
#include <stdio.h>
#include <stdlib.h>

// 学生实现的函数
size_t maxSeq(int * array, size_t n);

// 测试用例结构
typedef struct {
    int *arr;
    size_t n;
    size_t expected;
    const char *desc;
} TestCase;

int main(void) {
    int passed = 0;
    int total = 0;
    
    // 测试用例
    int arr1[] = {1, 2, 3, 4, 5};
    int arr2[] = {5, 4, 3, 2, 1};
    int arr3[] = {1, 2, 1, 2, 1};
    int arr4[] = {1};
    int arr5[] = {1, 2, 3, 1, 2, 3, 4, 5};
    int arr6[] = {1, 1, 1, 1};
    int arr7[] = {-5, -4, -3, -2, -1};
    int arr8[] = {1, 3, 5, 4, 7};
    
    TestCase tests[] = {
        {arr1, 5, 5, "递增序列 [1,2,3,4,5]"},
        {arr2, 5, 1, "递减序列 [5,4,3,2,1]"},
        {arr3, 5, 2, "交替序列 [1,2,1,2,1]"},
        {arr4, 1, 1, "单元素 [1]"},
        {NULL, 0, 0, "空数组"},
        {arr5, 8, 5, "后半段更长 [1,2,3,1,2,3,4,5]"},
        {arr6, 4, 1, "全相等 [1,1,1,1]"},
        {arr7, 5, 5, "负数递增 [-5,-4,-3,-2,-1]"},
        {arr8, 5, 3, "中间下降 [1,3,5,4,7]"},
    };
    
    total = sizeof(tests) / sizeof(tests[0]);
    
    for (int i = 0; i < total; i++) {
        size_t result = maxSeq(tests[i].arr, tests[i].n);
        if (result == tests[i].expected) {
            printf("✓ 测试 %d: %s - 正确 (got %zu)\\n", i+1, tests[i].desc, result);
            passed++;
        } else {
            printf("✗ 测试 %d: %s - 错误 (expected %zu, got %zu)\\n", 
                   i+1, tests[i].desc, tests[i].expected, result);
        }
    }
    
    printf("\\n通过 %d/%d 个测试\\n", passed, total);
    
    return (passed == total) ? EXIT_SUCCESS : EXIT_FAILURE;
}
'''
    
    # 写入测试驱动
    test_driver_path = os.path.join(problem_ws, "test_driver.c")
    write_text_file(test_driver_path, test_driver)
    
    # 编译：学生代码 + 测试驱动
    logs.append("正在编译...")
    compile_cmd = "gcc -o test_maxseq -Wall -Werror -std=gnu99 -pedantic maxSeq.c test_driver.c"
    build_res = run_command(compile_cmd, timeout=30, cwd=problem_ws)
    
    if build_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", build_res["stderr"]]}
    
    logs.append("✓ 编译成功")
    
    # 运行测试
    logs.append("正在运行测试...")
    run_res = run_command("./test_maxseq", timeout=5, cwd=problem_ws)
    
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    
    logs.append(run_res["stdout"])
    
    if run_res["exit_code"] != 0:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["部分测试未通过"]}
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!"]}


def judge_cards_grader(work_dir, problem_ws, logs):
    """cards (扑克牌) 专用评测器"""
    
    # 检查必要文件
    cards_c = os.path.join(problem_ws, "cards.c")
    cards_h = os.path.join(problem_ws, "cards.h")
    
    if not os.path.exists(cards_c):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少文件: cards.c"]}
    if not os.path.exists(cards_h):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少文件: cards.h"]}
    
    # 创建测试程序
    test_code = '''
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "cards.h"

int passed = 0;
int total = 0;

void test(int condition, const char *name) {
    total++;
    if (condition) {
        printf("✓ %s\\n", name);
        passed++;
    } else {
        printf("✗ %s\\n", name);
    }
}

int main(void) {
    printf("=== 扑克牌测试 ===\\n\\n");
    
    // 测试 card_from_num
    printf("--- card_from_num 测试 ---\\n");
    
    // 验证 52 张牌都不同
    int seen[52] = {0};
    int unique = 1;
    for (unsigned i = 0; i < 52; i++) {
        card_t c = card_from_num(i);
        // 验证牌值有效
        if (c.value < 2 || c.value > VALUE_ACE || c.suit < SPADES || c.suit > CLUBS) {
            unique = 0;
            break;
        }
        int idx = (c.value - 2) * 4 + c.suit;
        if (idx < 0 || idx >= 52 || seen[idx]) {
            unique = 0;
            break;
        }
        seen[idx] = 1;
    }
    test(unique, "card_from_num 生成 52 张不同的牌");
    
    // 测试 value_letter
    printf("\\n--- value_letter 测试 ---\\n");
    card_t c2 = {2, SPADES};
    card_t c10 = {10, HEARTS};
    card_t cJ = {VALUE_JACK, DIAMONDS};
    card_t cQ = {VALUE_QUEEN, CLUBS};
    card_t cK = {VALUE_KING, SPADES};
    card_t cA = {VALUE_ACE, HEARTS};
    
    test(value_letter(c2) == '2', "value_letter(2) == '2'");
    test(value_letter(c10) == '0', "value_letter(10) == '0'");
    test(value_letter(cJ) == 'J', "value_letter(Jack) == 'J'");
    test(value_letter(cQ) == 'Q', "value_letter(Queen) == 'Q'");
    test(value_letter(cK) == 'K', "value_letter(King) == 'K'");
    test(value_letter(cA) == 'A', "value_letter(Ace) == 'A'");
    
    // 测试 suit_letter
    printf("\\n--- suit_letter 测试 ---\\n");
    card_t cs = {5, SPADES};
    card_t ch = {5, HEARTS};
    card_t cd = {5, DIAMONDS};
    card_t cc = {5, CLUBS};
    
    test(suit_letter(cs) == 's', "suit_letter(SPADES) == 's'");
    test(suit_letter(ch) == 'h', "suit_letter(HEARTS) == 'h'");
    test(suit_letter(cd) == 'd', "suit_letter(DIAMONDS) == 'd'");
    test(suit_letter(cc) == 'c', "suit_letter(CLUBS) == 'c'");
    
    // 测试 card_from_letters
    printf("\\n--- card_from_letters 测试 ---\\n");
    card_t as = card_from_letters('A', 's');
    test(as.value == VALUE_ACE && as.suit == SPADES, "card_from_letters('A', 's')");
    
    card_t kc = card_from_letters('K', 'c');
    test(kc.value == VALUE_KING && kc.suit == CLUBS, "card_from_letters('K', 'c')");
    
    card_t ten_d = card_from_letters('0', 'd');
    test(ten_d.value == 10 && ten_d.suit == DIAMONDS, "card_from_letters('0', 'd')");
    
    // 测试 ranking_to_string
    printf("\\n--- ranking_to_string 测试 ---\\n");
    test(strcmp(ranking_to_string(STRAIGHT_FLUSH), "STRAIGHT_FLUSH") == 0, "STRAIGHT_FLUSH");
    test(strcmp(ranking_to_string(FOUR_OF_A_KIND), "FOUR_OF_A_KIND") == 0, "FOUR_OF_A_KIND");
    test(strcmp(ranking_to_string(NOTHING), "NOTHING") == 0, "NOTHING");
    
    printf("\\n=== 结果: %d/%d 通过 ===\\n", passed, total);
    
    return (passed == total) ? EXIT_SUCCESS : EXIT_FAILURE;
}
'''
    
    # 写入测试程序
    test_path = os.path.join(problem_ws, "auto_test.c")
    write_text_file(test_path, test_code)
    
    # 编译
    logs.append("正在编译 cards.c...")
    compile_cmd = "gcc -o auto_test -Wall -Werror -std=gnu99 -pedantic cards.c auto_test.c"
    build_res = run_command(compile_cmd, timeout=30, cwd=problem_ws)
    
    if build_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", build_res["stderr"]]}
    
    logs.append("✓ 编译成功")
    
    # 运行测试
    logs.append("正在运行测试...")
    run_res = run_command("./auto_test", timeout=10, cwd=problem_ws)
    
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    
    logs.append(run_res["stdout"])
    
    if run_res["exit_code"] != 0:
        # 计算部分分数
        output = run_res["stdout"]
        if "结果:" in output:
            try:
                # 解析 "结果: X/Y 通过"
                import re
                match = re.search(r'(\d+)/(\d+)', output)
                if match:
                    passed_count = int(match.group(1))
                    total_count = int(match.group(2))
                    score = int(100 * passed_count / total_count) if total_count > 0 else 0
                    return {"status": "wrong_answer", "score": score, "logs": logs + ["部分测试通过"]}
            except:
                pass
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["测试未通过"]}
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!"]}


def judge_code_with_grader(config, work_dir, resource_dir, problem_id):
    """带评测器的代码题"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    grader = config["grader"]
    
    if grader == "code1_grader":
        return judge_code1_grader(work_dir, problem_ws, logs)
    elif grader == "code2_grader":
        return judge_code2_grader(work_dir, problem_ws, logs)
    elif grader == "array_max_grader":
        return judge_array_max_grader(work_dir, problem_ws, logs)
    elif grader == "maxseq_grader":
        return judge_maxseq_grader(work_dir, problem_ws, logs)
    elif grader == "cards_grader":
        return judge_cards_grader(work_dir, problem_ws, logs)
    else:
        return {"status": "system_error", "score": 0, "logs": ["Unknown grader: " + grader]}


def judge_reading(config, work_dir, resource_dir, problem_id):
    """阅读理解题"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    answer_file = config.get("answer_file", "answer.txt")
    answer_path = os.path.join(problem_ws, answer_file)
    
    if not os.path.exists(answer_path):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少答案文件: " + answer_file]}
    
    # 检查 Makefile
    if config.get("verify_makefile"):
        if not os.path.exists(os.path.join(problem_ws, "Makefile")):
            return {"status": "wrong_answer", "score": 0, "logs": ["缺少 Makefile"]}
        
        logs.append("正在使用 Makefile 编译测试程序...")
        make_res = run_command("make", timeout=30, cwd=problem_ws)
        if make_res["exit_code"] != 0:
            return {"status": "compile_error", "score": 0, "logs": logs + ["Make 失败:", make_res["stderr"]]}
        logs.append("✓ 编译成功")
    
    # 运行测试程序并比较答案
    test_program = config.get("test_program", "test")
    if os.path.exists(os.path.join(problem_ws, test_program)):
        run_command("chmod +x {}".format(test_program), cwd=problem_ws)
        run_res = run_command("./{}".format(test_program), timeout=5, cwd=problem_ws)
    
        if run_res["exit_code"] != 0:
            return {"status": "runtime_error", "score": 0, "logs": logs + ["测试程序运行失败:", run_res["stderr"]]}
        
        student_answer = read_text_file(answer_path)
        expected_output = run_res["stdout"]
        
        if student_answer and student_answer.strip() == expected_output.strip():
            return {"status": "accepted", "score": 100, "logs": logs + ["✓ 答案正确!", "--- 你的答案 ---", student_answer.strip()]}
        else:
            return {
                "status": "wrong_answer",
                "score": 0,
                "logs": logs + ["✗ 答案不匹配", "--- 你的答案 ---", student_answer.strip() if student_answer else "(空)", "--- 正确答案 ---", expected_output.strip()]
            }
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 答案文件已提交"]}


def judge_project_with_test(config, work_dir, resource_dir, problem_id):
    """综合项目（使用 make test）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    make_target = config.get("make_target", "test")
    test_executable = config.get("test_executable", "test")
    
    # 编译
    logs.append("正在编译项目...")
    make_res = run_command("make {}".format(make_target), timeout=60, cwd=problem_ws)
    if make_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["Make 失败:", make_res["stderr"], make_res["stdout"]]}
    logs.append("✓ 编译成功")
    
    # 运行测试
    logs.append("正在运行测试...")
    run_command("chmod +x {}".format(test_executable), cwd=problem_ws)
    run_res = run_command("./{}".format(test_executable), timeout=10, cwd=problem_ws)
    
    if run_res["exit_code"] != 0:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["测试未通过 (退出码 {})".format(run_res["exit_code"]), run_res["stdout"], run_res["stderr"]]}
    
    return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过!", "--- 输出 ---", run_res["stdout"]]}


def judge_testgen_multi(config, work_dir, resource_dir, problem_id):
    """多文件测试生成题（如 08_testing）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    input_files = config.get("files", [])
    correct_program = config.get("correct_program", "isPrime-correct")
    broken_programs = config.get("broken_programs", [])
    
    if not input_files or not broken_programs:
        return {"status": "system_error", "score": 0, "logs": ["配置错误: 缺少输入文件或错误程序列表"]}
    
    # 确保程序可执行
    run_command("chmod +x {}".format(correct_program), cwd=problem_ws)
    for prog in broken_programs:
        run_command("chmod +x {}".format(prog), cwd=problem_ws)
    
    bugs_found = 0
    total_tests = len(input_files)
    
    for i, input_file in enumerate(input_files):
        broken_prog = broken_programs[i] if i < len(broken_programs) else None
        if not broken_prog:
            continue
            
        input_path = os.path.join(problem_ws, input_file)
        
        if not os.path.exists(input_path):
            logs.append("✗ {} - 文件不存在".format(input_file))
            continue
        
        # 读取输入
        test_input = read_text_file(input_path)
        if not test_input or not test_input.strip():
            logs.append("✗ {} - 文件为空".format(input_file))
            continue
        
        test_arg = test_input.strip().split()[0]  # 取第一个数字
        logs.append("测试 {}: 输入 = {}".format(input_file, test_arg))
        
        # 运行正确程序
        correct_res = run_command("./{} {}".format(correct_program, test_arg), timeout=5, cwd=problem_ws)
        correct_output = correct_res["stdout"].strip()
        
        # 运行错误程序
        broken_res = run_command("./{} {}".format(broken_prog, test_arg), timeout=5, cwd=problem_ws)
        broken_output = broken_res["stdout"].strip()
        
        if correct_output != broken_output:
            logs.append("  ✓ 发现差异!")
            logs.append("    正确输出: {}".format(correct_output))
            logs.append("    错误输出: {}".format(broken_output))
            bugs_found += 1
        else:
            logs.append("  ✗ 输出相同 (未能发现 bug)")
            logs.append("    输出: {}".format(correct_output))
    
    score = int(100 * bugs_found / total_tests)
    
    if bugs_found == total_tests:
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 成功发现所有 {} 个 bug!".format(bugs_found)]}
    elif bugs_found > 0:
        return {"status": "wrong_answer", "score": score, "logs": logs + ["部分通过: 发现 {}/{} 个 bug".format(bugs_found, total_tests)]}
    else:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["未能发现任何 bug"]}


def judge_unittest_subseq(config, work_dir, resource_dir, problem_id):
    """单元测试题（如 15_tests_subseq）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    test_file = config.get("filename", "test-subseq.c")
    test_path = os.path.join(problem_ws, test_file)
    
    if not os.path.exists(test_path):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少测试文件: " + test_file]}
    
    # 检查 run_all.sh 是否存在
    run_all_script = os.path.join(problem_ws, "run_all.sh")
    if os.path.exists(run_all_script):
        run_command("chmod +x run_all.sh", cwd=problem_ws)
        
        logs.append("正在运行测试套件...")
        run_res = run_command("./run_all.sh 2>&1", timeout=60, cwd=problem_ws)
        
        if run_res["timeout"]:
            return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["测试超时"]}
        
        output = run_res["stdout"]
        logs.append("--- 测试输出 ---")
        logs.append(output[:2000] if len(output) > 2000 else output)
        
        # 分析输出
        # run_all.sh 会依次测试正确实现和错误实现
        # 正确实现必须通过，错误实现必须被识别
        lines = output.split('\n')
        correct_passed = False
        broken_found = 0
        total_broken = 0
        
        for i, line in enumerate(lines):
            if "correct implementation" in line.lower():
                # 检查正确实现是否通过
                for j in range(i+1, min(i+5, len(lines))):
                    if "all tests passed" in lines[j].lower():
                        correct_passed = True
                        break
            if "broken implementation" in line.lower():
                total_broken += 1
                # 检查是否发现了这个broken实现
                for j in range(i+1, min(i+5, len(lines))):
                    if "failed" in lines[j].lower():
                        broken_found += 1
                        break
        
        if run_res["exit_code"] == 0:
            return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有测试通过! 成功识别所有错误实现!"]}
        
        if not correct_passed:
            return {"status": "wrong_answer", "score": 0, "logs": logs + ["✗ 你的测试代码无法通过正确实现!"]}
        
        if total_broken > 0:
            score = int(100 * broken_found / total_broken)
            return {"status": "wrong_answer", "score": score, "logs": logs + [
                "部分通过: 识别了 {}/{} 个错误实现".format(broken_found, total_broken),
                "提示: 尝试更多边缘情况，如先长后短的序列、负数等"
            ]}
        else:
            return {"status": "wrong_answer", "score": 0, "logs": logs + ["测试未完全通过"]}
    
    # 如果没有 run_all.sh，尝试直接编译测试文件
    logs.append("正在编译测试程序...")
    
    # 首先尝试与正确实现链接
    compile_cmd = "gcc -o test_runner -Wall -std=gnu99 {} -lm".format(test_file)
    compile_res = run_command(compile_cmd, timeout=30, cwd=problem_ws)
    
    if compile_res["exit_code"] != 0:
        logs.append("编译失败:")
        logs.append(compile_res["stderr"][:1000])
        return {"status": "compile_error", "score": 0, "logs": logs}
    
    logs.append("编译成功，运行测试...")
    run_res = run_command("./test_runner", timeout=10, cwd=problem_ws)
    
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    
    logs.append("--- 测试输出 ---")
    logs.append(run_res["stdout"][:1000] if run_res["stdout"] else "(无输出)")
    
    if run_res["exit_code"] == 0:
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 测试通过!"]}
    else:
        return {"status": "wrong_answer", "score": 50, "logs": logs + ["测试失败，exit code: {}".format(run_res["exit_code"])]}


def judge_gdb_challenge(config, work_dir, resource_dir, problem_id):
    """GDB 调试题（如 10_gdb）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    input_file = config.get("filename", "input.txt")
    game_program = config.get("game_program", "game")
    input_path = os.path.join(problem_ws, input_file)
    game_path = os.path.join(problem_ws, game_program)
    
    if not os.path.exists(input_path):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少答案文件: " + input_file]}
    
    if not os.path.exists(game_path):
        return {"status": "system_error", "score": 0, "logs": ["缺少游戏程序: " + game_program]}
    
    # 读取用户答案
    user_input = read_text_file(input_path)
    if not user_input or not user_input.strip():
        return {"status": "wrong_answer", "score": 0, "logs": ["答案文件为空"]}
    
    logs.append("你的答案:")
    logs.append(user_input.strip())
    
    # 确保程序可执行
    run_command("chmod +x {}".format(game_program), cwd=problem_ws)
    
    # 运行游戏程序
    logs.append("正在验证答案...")
    run_res = run_command("./{} < {}".format(game_program, input_file), timeout=10, cwd=problem_ws)
    
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    
    output = run_res["stdout"]
    logs.append("--- 游戏输出 ---")
    logs.append(output)
    
    # 检查是否通过两轮
    round1_pass = "win round" in output.lower() or "correct" in output.lower()
    round2_pass = "win round 2" in output.lower()
    
    if round2_pass:
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 恭喜！两轮都通过了！你已掌握 GDB 基础！"]}
    elif round1_pass:
        return {"status": "wrong_answer", "score": 50, "logs": logs + ["第一轮通过，但第二轮答案错误。提示：使用断点跳过循环。"]}
    else:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["答案错误。提示：使用 GDB 的 print 命令查看变量值。"]}


def judge_testgen(config, work_dir, resource_dir, problem_id):
    """测试生成题（黑盒测试）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    input_file = os.path.join(problem_ws, config.get("filename", "input.txt"))
    
    if not os.path.exists(input_file):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少输入文件: input.txt"]}
    
    input_content = read_text_file(input_file)
    logs.append("输入内容: {}".format(input_content.strip()[:100]))
    
    # 获取正确程序和错误程序
    broken_programs = glob.glob(os.path.join(problem_ws, "isPrime-broken*"))
    correct_program = os.path.join(problem_ws, "isPrime-correct")
    
    if not os.path.exists(correct_program) or not broken_programs:
        # 模拟模式
        if "42" in (input_content or ""):
            return {"status": "accepted", "score": 100, "logs": logs + ["✓ 成功发现 bug (模拟模式)"]}
        else:
            return {"status": "wrong_answer", "score": 0, "logs": logs + ["未能发现 bug (模拟模式)"]}
    
    # 运行正确程序
    run_command("chmod +x isPrime-correct", cwd=problem_ws)
    correct_res = run_command("./isPrime-correct < {}".format(config.get("filename", "input.txt")), timeout=5, cwd=problem_ws)
    
    # 运行错误程序并检查差异
    bugs_found = 0
    for broken in broken_programs:
        name = os.path.basename(broken)
        run_command("chmod +x {}".format(name), cwd=problem_ws)
        broken_res = run_command("./{} < {}".format(name, config.get("filename", "input.txt")), timeout=5, cwd=problem_ws)
        
        if broken_res["stdout"] != correct_res["stdout"]:
            logs.append("✓ {} - 发现差异!".format(name))
            bugs_found += 1
        else:
            logs.append("✗ {} - 输出相同".format(name))
    
    if bugs_found == len(broken_programs):
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 成功发现所有 {} 个 bug!".format(bugs_found)]}
    elif bugs_found > 0:
        score = int(100 * bugs_found / len(broken_programs))
        return {"status": "wrong_answer", "score": score, "logs": logs + ["部分通过: 发现 {}/{} 个 bug".format(bugs_found, len(broken_programs))]}
    else:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["未能发现任何 bug"]}


def judge_testgen_advanced(config, work_dir, resource_dir, problem_id):
    """高级测试生成题（如 c2prj2_testing 扑克牌评估）"""
    logs = []
    
    # 准备工作空间
    problem_ws, prep_logs = prepare_problem_workspace(problem_id, work_dir, resource_dir)
    if problem_ws is None:
        return {"status": "system_error", "score": 0, "logs": prep_logs}
    
    overlay_logs = overlay_submission(work_dir, problem_ws)
    if overlay_logs and overlay_logs[0].startswith("Failed"):
        return {"status": "system_error", "score": 0, "logs": overlay_logs}
    
    test_file = config.get("filename", "tests.txt")
    test_path = os.path.join(problem_ws, test_file)
    
    if not os.path.exists(test_path):
        return {"status": "runtime_error", "score": 0, "logs": ["缺少测试文件: " + test_file]}
    
    test_content = read_text_file(test_path)
    if not test_content or not test_content.strip():
        return {"status": "wrong_answer", "score": 0, "logs": ["测试文件为空"]}
    
    test_lines = [l for l in test_content.strip().split('\n') if l.strip()]
    logs.append("提交了 {} 个测试用例".format(len(test_lines)))
    
    # 检查 run_all.sh 是否存在
    run_all_script = os.path.join(problem_ws, "run_all.sh")
    if os.path.exists(run_all_script):
        run_command("chmod +x run_all.sh", cwd=problem_ws)
        run_command("chmod +x test-eval", cwd=problem_ws)
        
        # 运行测试脚本
        logs.append("正在运行测试...")
        run_res = run_command("./run_all.sh 2>&1", timeout=60, cwd=problem_ws)
        
        if run_res["timeout"]:
            return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["测试超时"]}
        
        output = run_res["stdout"]
        logs.append("--- 测试输出 ---")
        logs.append(output[:2000] if len(output) > 2000 else output)
        
        # 分析输出查找"发现差异"或"不同"的情况
        # run_all.sh 通常会对比正确实现和错误实现
        if run_res["exit_code"] == 0:
            return {"status": "accepted", "score": 100, "logs": logs + ["✓ 测试通过!"]}
        else:
            # 部分通过或全部失败
            return {"status": "wrong_answer", "score": 50, "logs": logs + ["部分测试未通过"]}
    
    # 如果没有 run_all.sh，检查 test-eval 是否存在
    test_eval = os.path.join(problem_ws, "test-eval")
    if os.path.exists(test_eval):
        run_command("chmod +x test-eval", cwd=problem_ws)
        
        logs.append("正在使用 test-eval 运行测试...")
        run_res = run_command("./test-eval {}".format(test_file), timeout=30, cwd=problem_ws)
        
        if run_res["timeout"]:
            return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["测试超时"]}
        
        output = run_res["stdout"]
        logs.append("--- 评估输出 ---")
        logs.append(output[:2000] if len(output) > 2000 else output)
        
        if run_res["exit_code"] == 0:
            return {"status": "accepted", "score": 100, "logs": logs + ["✓ 测试文件格式正确!"]}
        else:
            return {"status": "runtime_error", "score": 0, "logs": logs + ["test-eval 运行失败:", run_res["stderr"]]}
    
    # 没有测试程序，只验证文件格式
    logs.append("验证测试用例格式...")
    valid_count = 0
    for i, line in enumerate(test_lines):
        if ';' in line:
            parts = line.split(';')
            if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                valid_count += 1
            else:
                logs.append("第 {} 行格式错误: {}".format(i+1, line[:50]))
        else:
            logs.append("第 {} 行缺少分号: {}".format(i+1, line[:50]))
    
    if valid_count == len(test_lines):
        return {"status": "accepted", "score": 100, "logs": logs + ["✓ 所有 {} 个测试用例格式正确!".format(valid_count)]}
    elif valid_count > 0:
        score = int(100 * valid_count / len(test_lines))
        return {"status": "wrong_answer", "score": score, "logs": logs + ["{}/{} 个测试用例格式正确".format(valid_count, len(test_lines))]}
    else:
        return {"status": "wrong_answer", "score": 0, "logs": logs + ["没有有效的测试用例"]}


def judge_standard(work_dir, resource_dir, problem_id):
    """通用判题（fallback）- 未配置的题目只验证编译，不给满分"""
    logs = []
    logs.append("⚠️ 该题目尚未配置自动评分，仅验证编译")
    
    # 查找 .c 文件
    c_files = glob.glob(os.path.join(work_dir, "*.c"))
    if not c_files:
        return {"status": "runtime_error", "score": 0, "logs": ["未找到 .c 文件"]}
    
    src_file = os.path.basename(c_files[0])
    
    # 编译
    logs.append("正在编译 {}...".format(src_file))
    compile_res = run_command("gcc -o main -Wall -Werror {}".format(src_file), cwd=work_dir)
    if compile_res["exit_code"] != 0:
        return {"status": "compile_error", "score": 0, "logs": logs + ["编译失败:", compile_res["stderr"]]}
    logs.append("✓ 编译成功")
    
    # 运行
    run_res = run_command("./main", timeout=5, cwd=work_dir)
    if run_res["timeout"]:
        return {"status": "time_limit_exceeded", "score": 0, "logs": logs + ["运行超时"]}
    
    if run_res["exit_code"] != 0:
        return {"status": "runtime_error", "score": 0, "logs": logs + ["运行时错误，退出码: {}".format(run_res["exit_code"])]}
    
    logs.append("运行完成")
    logs.append("--- 输出 ---")
    logs.append(run_res["stdout"])
    
    # 未配置的题目只给编译通过分数，需要人工评阅
    logs.append("")
    logs.append("📝 此题目需要人工评阅，暂时给予部分分数")
    return {"status": "pending", "score": 10, "logs": logs}


# ============================================================
# 主入口 (Main Entry)
# ============================================================

def judge_submission(problem_id, work_dir, resource_dir):
    """判题主入口"""
    config = PROBLEM_CONFIG.get(problem_id)
    
    if not config:
        # 未知题目，使用通用判题
        return judge_standard(work_dir, resource_dir, problem_id)
    
    problem_type = config.get("type")
    
    try:
        if problem_type == "text_exact":
            return judge_text_exact(config, work_dir, resource_dir)
        elif problem_type == "compile_run":
            return judge_compile_run(config, work_dir, resource_dir, problem_id)
        elif problem_type == "code_with_grader":
            return judge_code_with_grader(config, work_dir, resource_dir, problem_id)
        elif problem_type == "link_object":
            return judge_link_object(config, work_dir, resource_dir, problem_id)
        elif problem_type == "makefile_project":
            return judge_makefile_project(config, work_dir, resource_dir, problem_id)
        elif problem_type == "reading":
            return judge_reading(config, work_dir, resource_dir, problem_id)
        elif problem_type == "project_with_test":
            return judge_project_with_test(config, work_dir, resource_dir, problem_id)
        elif problem_type == "testgen":
            return judge_testgen(config, work_dir, resource_dir, problem_id)
        elif problem_type == "testgen_multi":
            return judge_testgen_multi(config, work_dir, resource_dir, problem_id)
        elif problem_type == "testgen_advanced":
            return judge_testgen_advanced(config, work_dir, resource_dir, problem_id)
        elif problem_type == "gdb_challenge":
            return judge_gdb_challenge(config, work_dir, resource_dir, problem_id)
        elif problem_type == "unittest_subseq":
            return judge_unittest_subseq(config, work_dir, resource_dir, problem_id)
        elif problem_type == "unittest":
            # 单元测试题
            return judge_project_with_test({
                "make_target": "",
                "test_executable": config.get("test_runner", "run_all.sh")
            }, work_dir, resource_dir, problem_id)
        else:
            return judge_standard(work_dir, resource_dir, problem_id)
    except Exception as e:
        import traceback
        return {
            "status": "system_error",
            "score": 0,
            "logs": ["判题异常: " + str(e), traceback.format_exc()]
        }


def main():
    """命令行入口（兼容旧方式）"""
    PROBLEM_ID = os.environ.get("PROBLEM_ID", "02_code1")
    WORK_DIR = "/workspace"
    RESOURCE_DIR = "/resources"
    
    print("Starting judge for {}...".format(PROBLEM_ID))
    
    result = judge_submission(PROBLEM_ID, WORK_DIR, RESOURCE_DIR)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
