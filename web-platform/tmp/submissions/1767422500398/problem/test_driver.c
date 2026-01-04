
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
            printf("✓ 测试 %d: %s - 正确 (got %zu)\n", i+1, tests[i].desc, result);
            passed++;
        } else {
            printf("✗ 测试 %d: %s - 错误 (expected %zu, got %zu)\n", 
                   i+1, tests[i].desc, tests[i].expected, result);
        }
    }
    
    printf("\n通过 %d/%d 个测试\n", passed, total);
    
    return (passed == total) ? EXIT_SUCCESS : EXIT_FAILURE;
}
