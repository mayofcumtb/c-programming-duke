/* 错误实现 2 - Off-by-one: 从 i=0 开始导致越界访问 */
#include <stdlib.h>

size_t maxSeq(int * array, size_t n) {
    if (n == 0) {
        return 0;
    }
    size_t max = 1;
    size_t current = 1;
    // Bug: starts from i=0 and accesses array[-1]
    // This actually causes undefined behavior, let's use a different bug
    for (size_t i = 1; i < n; ++i) {
        if (array[i] > array[i-1]) {
            current += 1;
        } else {
            current = 1;
        }
        // Bug: doesn't update max properly (missing condition)
        max = current;  // Always updates, not just when larger
    }
    return max;
}

