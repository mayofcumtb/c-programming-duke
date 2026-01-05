#!/bin/bash
# 准备学生版资源（删除答案）

set -e

# 获取脚本所在目录的父目录的父目录作为项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_PLATFORM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$WEB_PLATFORM_DIR")"

# 源目录和目标目录（自动检测）
SOURCE_DIR="${PROJECT_ROOT}"
TARGET_DIR="${PROJECT_ROOT}/student_resources"

echo "📍 项目根目录: $PROJECT_ROOT"
echo "📍 源目录: $SOURCE_DIR"
echo "📍 目标目录: $TARGET_DIR"
echo ""

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

# c2prj1_cards - 详细的学生模板
cat > "$TARGET_DIR/c2prj1_cards/cards.c" << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include "cards.h"

/*
 * 扑克牌项目 - 学生代码模板
 * 
 * 请仔细阅读 cards.h 中的类型定义：
 * - card_t: 包含 value (2-14) 和 suit (SPADES/HEARTS/DIAMONDS/CLUBS)
 * - VALUE_ACE = 14, VALUE_KING = 13, VALUE_QUEEN = 12, VALUE_JACK = 11
 * - suit_t: SPADES=0, HEARTS=1, DIAMONDS=2, CLUBS=3
 */

void assert_card_valid(card_t c) {
    /*
     * TODO: 验证卡牌有效性
     * 
     * 要求：使用 assert() 检查：
     * 1. c.value 必须在 2 到 VALUE_ACE (14) 之间（包含边界）
     * 2. c.suit 必须在 SPADES 到 CLUBS 之间（包含边界）
     * 
     * 如果卡牌无效，程序应该通过 assert 终止
     * 
     * 提示：assert(条件) - 如果条件为假，程序会终止
     */
    
    // 在下面编写你的代码
    
}

const char * ranking_to_string(hand_ranking_t r) {
    /*
     * TODO: 返回手牌等级的字符串表示
     * 
     * 要求：根据 r 的值返回对应的字符串：
     * - STRAIGHT_FLUSH  -> "STRAIGHT_FLUSH"
     * - FOUR_OF_A_KIND  -> "FOUR_OF_A_KIND"
     * - FULL_HOUSE      -> "FULL_HOUSE"
     * - FLUSH           -> "FLUSH"
     * - STRAIGHT        -> "STRAIGHT"
     * - THREE_OF_A_KIND -> "THREE_OF_A_KIND"
     * - TWO_PAIR        -> "TWO_PAIR"
     * - PAIR            -> "PAIR"
     * - NOTHING         -> "NOTHING"
     * 
     * 提示：使用 switch-case 语句
     */
    
    // 在下面编写你的代码
    
    return "";  // 请修改此行
}

char value_letter(card_t c) {
    /*
     * TODO: 返回卡牌值对应的字符
     * 
     * 映射规则：
     * - 2-9   -> '2'-'9'
     * - 10    -> '0' (注意：10 用字符 '0' 表示)
     * - Jack  -> 'J'
     * - Queen -> 'Q'
     * - King  -> 'K'
     * - Ace   -> 'A'
     * 
     * 提示：使用 switch-case 语句
     */
    
    // 在下面编写你的代码
    
    return '?';  // 请修改此行
}

char suit_letter(card_t c) {
    /*
     * TODO: 返回花色对应的字符
     * 
     * 映射规则：
     * - SPADES   -> 's' (黑桃)
     * - HEARTS   -> 'h' (红心)
     * - DIAMONDS -> 'd' (方块)
     * - CLUBS    -> 'c' (梅花)
     * 
     * 提示：使用 switch-case 语句
     */
    
    // 在下面编写你的代码
    
    return '?';  // 请修改此行
}

void print_card(card_t c) {
    /*
     * TODO: 打印卡牌
     * 
     * 格式：两个字符，无换行
     * 例如：As (黑桃A), 0h (红心10), Kc (梅花K)
     * 
     * 提示：调用 value_letter() 和 suit_letter() 函数
     */
    
    // 在下面编写你的代码
    
}

card_t card_from_letters(char value_let, char suit_let) {
    /*
     * TODO: 从字符创建卡牌
     * 
     * 参数：
     * - value_let: '2'-'9', '0'(10), 'J', 'Q', 'K', 'A'
     * - suit_let: 's', 'h', 'd', 'c'
     * 
     * 返回：对应的 card_t 结构体
     * 
     * 注意：创建完成后应该调用 assert_card_valid() 验证
     */
    
    card_t temp;
    
    // 在下面编写你的代码
    // 1. 根据 value_let 设置 temp.value
    // 2. 根据 suit_let 设置 temp.suit
    // 3. 调用 assert_card_valid(temp) 验证
    
    return temp;
}

card_t card_from_num(unsigned c) {
    /*
     * TODO: 从数字 (0-51) 创建卡牌
     * 
     * 参数：c 是 0-51 的数字，代表一副牌中的一张
     * 
     * 映射方式（你需要设计）：
     * - 52 张牌需要唯一映射到 0-51
     * - 建议：使用除法和取余运算
     * - 例如：c / 4 可以得到 0-12，加 2 得到 value (2-14)
     *        c % 4 可以得到 0-3，对应四种花色
     * 
     * 返回：对应的 card_t 结构体
     */
    
    card_t temp;
    
    // 在下面编写你的代码
    
    return temp;
}
EOF
echo "  ✓ c2prj1_cards/cards.c (详细模板)"

# c2prj2_testing - 提供详细的测试模板
cat > "$TARGET_DIR/c2prj2_testing/tests.txt" << 'EOF'
# ==================================================
# 扑克牌测试用例 - 学生模板
# ==================================================
#
# 格式：手牌1; 手牌2
# 每张牌用两个字符表示：值 + 花色
#   值: 2-9, 0(10), J, Q, K, A
#   花色: s(黑桃), h(红心), d(方块), c(梅花)
#
# 示例：
#   As Ks Qs Js 0s 9s 8s; 2h 3h 4h 5h 6h 7h 8h
#   (黑桃皇家同花顺 vs 红心同花顺)
#
# 你需要设计测试用例来检测程序中可能的bug，包括：
# 1. 各种手牌类型的基本测试
# 2. 边界情况
# 3. 可能的off-by-one错误
# 4. 同花顺vs普通同花+普通顺子的区别
# 5. 两对的正确排序
#
# 请删除这些注释行，在下面编写你的测试用例：
# ==================================================

EOF
echo "  ✓ c2prj2_testing/tests.txt (详细模板)"

echo ""
echo "✅ 学生资源准备完成！"
echo "📂 目录: $TARGET_DIR"
echo ""
echo "文件统计:"
find "$TARGET_DIR" -type f | wc -l

