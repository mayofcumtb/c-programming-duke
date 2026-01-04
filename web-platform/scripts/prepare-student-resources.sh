#!/bin/bash
# 准备学生版资源（删除答案）

set -e

# 源目录和目标目录
SOURCE_DIR="/Users/macbook/Code/c-programming-duke"
TARGET_DIR="/Users/macbook/Code/c-programming-duke/student_resources"

echo "📁 创建学生资源目录..."
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

# 需要复制的题目目录列表
PROBLEM_DIRS=(
    "00_hello"
    "01_apple"
    "02_code1"
    "03_code2"
    "04_compile"
    "05_squares"
    "06_rect"
    "07_retirement"
    "08_testing"
    "09_testing2"
    "10_gdb"
    "11_read_ptr1"
    "12_read_ptr2"
    "13_read_arr1"
    "14_array_max"
    "15_tests_subseq"
    "16_subseq"
    "17_read_arr2"
    "c2prj1_cards"
    "c2prj2_testing"
)

for dir in "${PROBLEM_DIRS[@]}"; do
    if [ -d "$SOURCE_DIR/$dir" ]; then
        echo "📋 复制 $dir..."
        cp -r "$SOURCE_DIR/$dir" "$TARGET_DIR/"
    fi
done

echo ""
echo "🧹 清理答案文件..."

# 00_hello - 清空 hello.txt
echo "" > "$TARGET_DIR/00_hello/hello.txt"
echo "  ✓ 00_hello/hello.txt"

# 01_apple - 清空 fruit.txt
echo "" > "$TARGET_DIR/01_apple/fruit.txt"
echo "  ✓ 01_apple/fruit.txt"

# 02_code1 - 保留函数签名，删除实现
cat > "$TARGET_DIR/02_code1/code1.c" << 'EOF'
#include <stdio.h>

int max(int a, int b) {
    // TODO: 实现返回两个数中较大值的函数
    return 0; // 请修改此行
}

int main() {
    // TODO: 调用 max 函数并按格式输出结果
    // 格式: max(a,b) is result
    
    return 0;
}
EOF
echo "  ✓ 02_code1/code1.c"

# 03_code2 - 保留函数签名，删除实现
cat > "$TARGET_DIR/03_code2/code2.c" << 'EOF'
#include <stdio.h>

int printTriangle(int size) {
    // TODO: 打印高度为 size 的直角三角形
    // 返回打印的 * 总数
    
    return 0; // 请修改此行
}

int main() {
    // TODO: 读取高度，调用 printTriangle 并输出结果
    // 格式见 README
    
    return 0;
}
EOF
echo "  ✓ 03_code2/code2.c"

# 04_compile - 保留基本结构
cat > "$TARGET_DIR/04_compile/hello.c" << 'EOF'
#include <stdio.h>

int main() {
    // TODO: 使用 printf 输出 "Hello World" 并换行
    
    return 0;
}
EOF
echo "  ✓ 04_compile/hello.c"

# 05_squares - 保留函数签名
cat > "$TARGET_DIR/05_squares/squares.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

void squares(int size1, int x_offset, int y_offset, int size2) {
    // TODO: 实现绘制两个正方形的函数
    // 第一个正方形用 '#' 绘制，从 (0,0) 开始
    // 第二个正方形用 '*' 绘制，从 (x_offset, y_offset) 开始
    // 重叠处 '*' 优先显示
    
}
EOF
echo "  ✓ 05_squares/squares.c"

# 06_rect - 保留结构体定义和函数签名
cat > "$TARGET_DIR/06_rect/rectangle.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

// TODO: 定义 rectangle 结构体
// 包含 x, y, width, height 四个整数字段

typedef struct {
    int x;
    int y;
    int width;
    int height;
} rectangle;

void canonicalize(rectangle * r) {
    // TODO: 规范化矩形
    // 确保 width 和 height 为正数
    
}

rectangle intersection(rectangle r1, rectangle r2) {
    // TODO: 计算两个矩形的交集
    // 如果没有交集，返回 width=0, height=0 的矩形
    
    rectangle result = {0, 0, 0, 0};
    return result;
}
EOF
echo "  ✓ 06_rect/rectangle.c"

# 07_retirement - 保留函数签名
cat > "$TARGET_DIR/07_retirement/retirement.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

// TODO: 定义 retire_info 结构体

typedef struct {
    int months;
    double contribution;
    double rate_of_return;
} retire_info;

void retirement(int startAge, double initial, retire_info working, retire_info retired) {
    // TODO: 实现退休储蓄模拟
    // 每月计算利息和存取款，输出年龄和余额
    
}

int main() {
    // TODO: 调用 retirement 函数进行模拟
    
    return 0;
}
EOF
echo "  ✓ 07_retirement/retirement.c"

# 08_testing - 清空输入文件
for i in 1 2 3 4; do
    echo "" > "$TARGET_DIR/08_testing/input.$i"
done
echo "  ✓ 08_testing/input.*"

# 09_testing2 - 清空测试文件
echo "" > "$TARGET_DIR/09_testing2/tests.txt"
echo "  ✓ 09_testing2/tests.txt"

# 10_gdb - 清空输入文件
echo "" > "$TARGET_DIR/10_gdb/input.txt"
echo "  ✓ 10_gdb/input.txt"

# 11_read_ptr1 - 清空答案文件
echo "" > "$TARGET_DIR/11_read_ptr1/answer.txt"
cat > "$TARGET_DIR/11_read_ptr1/Makefile" << 'EOF'
# TODO: 编写 Makefile
# 目标: 编译 test.c 生成 test 可执行文件

test: test.c
	# 请补充编译命令
EOF
echo "  ✓ 11_read_ptr1/answer.txt, Makefile"

# 12_read_ptr2 - 清空答案文件
echo "" > "$TARGET_DIR/12_read_ptr2/answer.txt"
cat > "$TARGET_DIR/12_read_ptr2/Makefile" << 'EOF'
test: test.c
	# TODO: 请补充编译命令
EOF
echo "  ✓ 12_read_ptr2/answer.txt, Makefile"

# 13_read_arr1 - 清空答案文件
echo "" > "$TARGET_DIR/13_read_arr1/answer.txt"
cat > "$TARGET_DIR/13_read_arr1/Makefile" << 'EOF'
test: test.c
	# TODO: 请补充编译命令
EOF
echo "  ✓ 13_read_arr1/answer.txt, Makefile"

# 14_array_max - 保留函数签名
cat > "$TARGET_DIR/14_array_max/arrayMax.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

int * arrayMax(int * arr, size_t n) {
    // TODO: 返回指向数组中最大元素的指针
    // 如果数组为空，返回 NULL
    
    return NULL; // 请修改此行
}
EOF
echo "  ✓ 14_array_max/arrayMax.c"

# 15_tests_subseq - 保留测试框架
cat > "$TARGET_DIR/15_tests_subseq/test-subseq.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

// maxSeq 函数声明（由外部提供）
size_t maxSeq(int * array, size_t n);

int main() {
    // TODO: 编写测试用例
    // 使用不同的输入数组测试 maxSeq 函数
    // 如果测试通过，打印 "PASSED"
    // 如果测试失败，打印 "FAILED: ..." 并说明原因
    
    printf("请编写测试用例\n");
    
    return EXIT_SUCCESS;
}
EOF
echo "  ✓ 15_tests_subseq/test-subseq.c"

# 16_subseq - 保留函数签名
cat > "$TARGET_DIR/16_subseq/maxSeq.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>

size_t maxSeq(int * array, size_t n) {
    // TODO: 返回最长严格递增连续子序列的长度
    // 例如: [1,2,3,1,2] 返回 3
    
    return 0; // 请修改此行
}
EOF
echo "  ✓ 16_subseq/maxSeq.c"

# c2prj1_cards - 保留函数签名
cat > "$TARGET_DIR/c2prj1_cards/cards.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include "cards.h"

// TODO: 实现以下函数

void assert_card_valid(card_t c) {
    // 验证卡牌有效性
}

const char * ranking_to_string(hand_ranking_t r) {
    // 返回手牌等级的字符串表示
    return "";
}

char value_letter(card_t c) {
    // 返回卡牌值的字母表示
    return '?';
}

char suit_letter(card_t c) {
    // 返回花色的字母表示
    return '?';
}

void print_card(card_t c) {
    // 打印卡牌
}

card_t card_from_letters(char value_let, char suit_let) {
    // 从字母创建卡牌
    card_t temp;
    return temp;
}

card_t card_from_num(unsigned c) {
    // 从数字创建卡牌 (0-51)
    card_t temp;
    return temp;
}
EOF
echo "  ✓ c2prj1_cards/cards.c"

# c2prj2_testing - 清空测试文件
echo "" > "$TARGET_DIR/c2prj2_testing/tests.txt"
echo "  ✓ c2prj2_testing/tests.txt"

echo ""
echo "✅ 学生资源准备完成！"
echo "📂 目录: $TARGET_DIR"
echo ""
echo "文件统计:"
find "$TARGET_DIR" -type f | wc -l

