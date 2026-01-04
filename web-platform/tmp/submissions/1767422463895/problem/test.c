#include <stdio.h>
#include <stdlib.h>


int main(void) {
  // === 考察点: 数组与指针的关系 (Array & Pointer) ===
  int anArray[] = {5,16,33,99};
  int * p = anArray;
  printf("*p = %d\n", *p);
  
  // 指针运算：p++ 移动一个 int 的大小
  p++;
  printf("Now *p = %d\n", *p);
  
  // 数组下标取地址
  int * q = &anArray[3];
  
  // 二级指针操作
  int ** x = &q;
  **x = 12; // 修改了 anArray[3]
  *x = p;   // 修改了 q 的指向，现在 q 指向 anArray[1]
  **x = 42; // 修改了 anArray[1]
  
  q[1] = 9; // q 现在指向 anArray[1]，所以 q[1] 是 anArray[2]
  
  for (int i =0; i < 4; i++){
    printf("anArray[%d] = %d\n",i, anArray[i]);
  }
  return EXIT_SUCCESS;
}
