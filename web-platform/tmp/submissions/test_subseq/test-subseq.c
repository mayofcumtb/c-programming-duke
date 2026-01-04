#include <stdio.h>
#include <stdlib.h>

size_t maxSeq(int * array, size_t n);

int main(void) {
    // 测试 1: 正常递增序列
    int arr1[] = {1, 2, 3, 4, 5};
    if (maxSeq(arr1, 5) != 5) {
        printf("Test 1 failed: expected 5\n");
        return EXIT_FAILURE;
    }
    
    // 测试 2: 混合序列
    int arr2[] = {1, 2, 1, 2, 3};
    if (maxSeq(arr2, 5) != 3) {
        printf("Test 2 failed: expected 3\n");
        return EXIT_FAILURE;
    }
    
    // 测试 3: 空数组
    if (maxSeq(NULL, 0) != 0) {
        printf("Test 3 failed: expected 0\n");
        return EXIT_FAILURE;
    }
    
    // 测试 4: 单元素
    int arr4[] = {42};
    if (maxSeq(arr4, 1) != 1) {
        printf("Test 4 failed: expected 1\n");
        return EXIT_FAILURE;
    }
    
    // 测试 5: 全递减
    int arr5[] = {5, 4, 3, 2, 1};
    if (maxSeq(arr5, 5) != 1) {
        printf("Test 5 failed: expected 1\n");
        return EXIT_FAILURE;
    }
    
    // 测试 6: 相等元素 (不应该算递增)
    int arr6[] = {1, 1, 1, 1};
    if (maxSeq(arr6, 4) != 1) {
        printf("Test 6 failed: expected 1 for equal elements\n");
        return EXIT_FAILURE;
    }
    
    printf("All tests passed!\n");
    return EXIT_SUCCESS;
}
