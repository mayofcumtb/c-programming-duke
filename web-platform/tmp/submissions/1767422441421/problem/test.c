#include <stdio.h>
#include <stdlib.h>

void g(int x, int * y) {
  // === 考察点: 指针传递 vs 值传递 ===
  // x 是按值传递，修改不会影响外部
  // y 是指针，修改 *y 会影响外部变量
  printf("In g, x = %d, *y = %d\n", x, *y);
  x++;
  *y = *y - x;
  // 修改指针 y 的指向（本地副本），不会影响外部指针
  y = &x; 
}

void f(int * a, int b) {
  // === 考察点: 函数调用链与变量作用域 ===
  printf("In f, *a = %d, b = %d\n", *a, b);
  *a += b;
  b *= 2;
  // 调用 g，注意参数传递方式
  g(*a, &b);
  printf("Back in f, *a = %d, b = %d\n", *a, b);
}


int main(void) {
  // === 学生任务: 阅读代码并预测输出 ===
  int x = 3;
  int y = 4;
  f(&x, y);
  printf("In main: x = %d, y = %d\n", x, y);
  return EXIT_SUCCESS;
}
