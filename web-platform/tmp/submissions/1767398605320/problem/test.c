#include <stdio.h>
#include <stdlib.h>

int f(int ** r, int ** s) {
  // === 考察点: 二级指针 (Pointer to Pointer) ===
  // 这种代码考察对指针指向关系的深刻理解
  int temp = ** r;
  int temp2 = **s;
  int * z = *r;
  *r = *s;
  *s = z;
  // 交换了 r 和 s 指向的地址
  printf("**r = %d\n",**r);
  printf("**s = %d\n",**s);
  *z += 3;
  **s -= 8;
  **r -= 19;
  return temp + temp2;
}

int main(void) {
  // === 学生任务: 追踪内存变化 ===
  int a = 80;
  int b = 12;
  int * p = &a;
  int * q = &b;
  // 传入指针的地址
  int x = f(&p, &q);
  printf("x = %d\n", x);
  printf("*p = %d\n", *p);
  printf("*q = %d\n", *q);
  printf("a = %d\n", a);
  printf("b = %d\n", b);
  return EXIT_SUCCESS;
}
