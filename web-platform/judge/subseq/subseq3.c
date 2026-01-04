/* 错误实现 3 - 单元素数组返回 0 而不是 1 */
#include <stdlib.h>

size_t maxSeq(int * array, size_t n) {
    if (n == 0) {
        return 0;
    }
    // Bug: n == 1 should return 1, but this starts with max = 0
    size_t max = 0;
    size_t current = 1;
    for (size_t i = 1; i < n; ++i) {
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
}

