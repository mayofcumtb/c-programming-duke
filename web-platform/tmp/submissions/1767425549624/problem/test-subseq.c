#include <stdio.h>
#include <stdlib.h>

size_t maxSeq(int * array, size_t n);

int main(void) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 单元测试设计 (Unit Testing)
  // 你的任务是编写测试用例，能够区分“正确代码”和“错误代码”
  // 如果发现 maxSeq 的行为不符合预期，main 函数应该返回 EXIT_FAILURE
  // 如果一切正常，返回 EXIT_SUCCESS
  
  // 案例 1: 正常递增数组
  int array1[] = { 1, 2, 3 };
  if (maxSeq(array1, 3) != 3) {
    return EXIT_FAILURE;
  }
  
  // 案例 2: 空数组 (边界条件)
  if (maxSeq(NULL, 0) != 0) {
    return EXIT_FAILURE;
  }
  
  // 案例 3: 乱序数组
  int array2[] = { 1, 2, 1, 3, 5, 7, 2, 4, 6, 9 };
  if (maxSeq(array2, 10) != 4) {
    return EXIT_FAILURE;
  }

  // 更多测试用例...
  
  return EXIT_SUCCESS;
  // === 学生代码结束 (STUDENT CODE END) ===
}
