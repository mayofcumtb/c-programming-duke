#include <stdlib.h>
#include <stdio.h>

size_t maxSeq(int * array, size_t n) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 动态规划思想、连续子序列判断、类型匹配 (size_t)
  
  if (n == 0) {
    return 0;
  }
  size_t max = 1;
  size_t current = 1;
  for (size_t i=1; i < n; ++i) {
    if (array[i] > array[i-1]) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > max) {
      max = current;
    }
  }

  return max;
  // === 学生代码结束 (STUDENT CODE END) ===
}
