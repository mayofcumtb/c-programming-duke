/* 错误实现 1 - 使用 >= 而不是 > (非严格递增) */
#include <stdlib.h>

size_t maxSeq(int * array, size_t n) {
    if (n == 0) {
        return 0;
    }
    size_t max = 1;
    size_t current = 1;
    for (size_t i = 1; i < n; ++i) {
        // Bug: >= instead of > (allows equal elements)
        if (array[i] >= array[i-1]) {
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
