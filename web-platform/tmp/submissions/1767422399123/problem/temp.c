#include <stdio.h>
#include <stdlib.h>

int printTriangle(int size) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 嵌套循环 (Nested Loops) 与变量更新
  
  //将 starCount 初始化为 0
  int starCount = 0;
  //从 0 (包含) 计数到 size (不包含)，对于计数的每个数字 i
  for(int i = 0; i < size; ++i) {
     //从 0 (包含) 计数到 i (包含)，对于计数的每个数字 j
     for(int j = 0; j <= i; ++j) {
        //打印一个 "*"
        printf("*");
        //starCount 加 1
        starCount += 1;
     //当完成 j 的计数循环时，
     }
     //打印一个换行符 ("\n")
     printf("\n");     
  //当完成 i 的计数循环时，
  }
  //你的答案是 starCount
  return starCount;
  // === 学生代码结束 (STUDENT CODE END) ===
}


int main(void) {
  int numStars;
  printf("Here is a triangle with height 4\n");
  numStars = printTriangle(4);
  printf("That triangle had %d total stars\n", numStars);
  
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 函数复用与标准输出
  //现在打印 "Here is a triangle with height 7\n"
  printf("Here is a triangle with height 7\n");
  //然后调用 printTriangle，传入 7，并将结果赋值给 numStars
  numStars = printTriangle(7);
  //最后，打印 "That triangle had %d total stars\n"，其中 %d 
  //打印 numStars 的值
  printf("That triangle had %d total stars\n", numStars);
  // === 学生代码结束 (STUDENT CODE END) ===

  return 0;
}



