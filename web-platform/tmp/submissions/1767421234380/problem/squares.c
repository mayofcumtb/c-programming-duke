#include <stdio.h>
#include <stdlib.h>

int find_max(int size1, int size2) {
  if (size1 > size2) {
    return size1;
  }
  else {
    return size2;
  }
}

void squares(int size1, int x_offset, int y_offset, int size2) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 复杂逻辑判断 (Logic Operators) 与坐标计算
  
  //计算 size1 和 (x_offset + size2) 的最大值。称之为 w
  int w = find_max(size1, x_offset + size2);
  //计算 size1 和 (y_offset + size2) 的最大值。称之为 h
  int h = find_max(size1, y_offset + size2);
  //从 0 计数到 h。用 y 表示当前计数值
  for (int y = 0; y < h; ++y) {
    //从 0 计数到 w。用 x 表示当前计数值
    for (int x = 0; x < w; ++x) {
      //检查是否满足以下任一条件：
      //    ((x 在 x_offset 和 x_offset + size2 之间) 并且 
      //     y 等于 y_offset 或者 y_offset + size2 - 1 )
      //  或者
      //    ((y 在 y_offset 和 y_offset + size2 之间) 并且
      //     x 等于 x_offset 或者 x_offset + size2 - 1)
      // 如果满足，打印一个 *
      if (((x >= x_offset && x < x_offset + size2) && (y == y_offset || y == y_offset + size2 - 1)) || ((y >= y_offset && y < y_offset + size2) && (x == x_offset || x == x_offset + size2 - 1))) {
	  printf("*");
      } else if (((x < size1) && (y == 0 || y == size1 - 1)) || ((y < size1) && (x == 0 || x == size1 - 1))) {
	  printf("#");
      //如果不满足，
      // 检查是否满足以下任一条件：
      //    x 小于 size1 并且 (y 是 0 或者 size1-1)
      // 或者
      //    y 小于 size1 并且 (x 是 0 或者 size1-1)
      //如果满足，打印一个 #
      }
      //否则打印一个空格
      else {
	  printf(" ");
      }
    //当完成 x 从 0 到 w 的计数循环时，
    }
    //打印一个换行符
    printf("\n");
  }
  // === 学生代码结束 (STUDENT CODE END) ===
}
