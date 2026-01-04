#include <stdio.h>
#include <stdlib.h>
//我提供了 "min" 和 "max" 函数，
//以防它们对你有用
int min (int a, int b) {
  if (a < b) {
    return a;
  }
  return b;
}
int max (int a, int b) {
  if (a > b) {
    return a;
  }
  return b;
}

//在这里声明你的矩形结构体！
// === 学生代码开始 (STUDENT CODE START) ===
// 考察点: 结构体定义 (Struct Definition)
typedef struct rect {
  int x;
  int y;
  int width;
  int height;
} rectangle;
// === 学生代码结束 (STUDENT CODE END) ===

rectangle canonicalize(rectangle r) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 结构体成员访问与逻辑处理
  //将负的宽度和高度改为正数，
  //同时适当地调整 x 或 y
  if (r.width < 0) {
    r.x += r.width;
    r.width *= -1;
  }
  if (r.height < 0) {
    r.y += r.height;
    r.height *= -1;
  }
  return r;
  // === 学生代码结束 (STUDENT CODE END) ===
}
rectangle intersection(rectangle r1, rectangle r2) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 几何逻辑与结构体操作
  //找到两个矩形的交集
  rectangle inter_rect;

  // 规范化输入
  r1 = canonicalize(r1);
  r2 = canonicalize(r2);

  // 如果不可能相交，则返回空矩形
  if (((r1.x + r1.width < r2.x) || (r2.x + r2.width < r1.x))
      || ((r1.y + r1.height < r2.y) || (r2.y + r2.height < r1.y))) {
    // 仅返回全零
    inter_rect.x = 0;
    inter_rect.y = 0;
    inter_rect.width = 0;
    inter_rect.height = 0;
    
    return inter_rect;
  }

  // 交集区域
  inter_rect.x = max(r1.x, r2.x);
  inter_rect.width = min(r1.x + r1.width, r2.x + r2.width) - inter_rect.x;
  inter_rect.y = max(r1.y, r2.y);
  inter_rect.height = min(r1.y + r1.height, r2.y + r2.height) - inter_rect.y;
  
  return inter_rect;
  // === 学生代码结束 (STUDENT CODE END) ===
}

//你不应该需要修改这行以下的任何代码
void printRectangle(rectangle r) {
  r = canonicalize(r);
  if (r.width == 0 && r.height == 0) {
    printf("<empty>\n");
  }
  else {
    printf("(%d,%d) to (%d,%d)\n", r.x, r.y, 
	                           r.x + r.width, r.y + r.height);
  }
}

int main (void) {
  rectangle r1;
  rectangle r2;
  rectangle r3;
  rectangle r4;

  r1.x = 2;
  r1.y = 3;
  r1.width = 5;
  r1.height = 6;
  printf("r1 is ");
  printRectangle(r1);

  r2.x = 4;
  r2.y = 5;
  r2.width = -5;
  r2.height = -7;
  printf("r2 is ");
  printRectangle(r2);
  
  r3.x = -2;
  r3.y = 7;
  r3.width = 7;
  r3.height = -10;
  printf("r3 is ");
  printRectangle(r3);

  r4.x = 0;
  r4.y = 7;
  r4.width = -4;
  r4.height = 2;
  printf("r4 is ");
  printRectangle(r4);

  //用 r1 测试所有情况
  rectangle i = intersection(r1,r1);
  printf("intersection(r1,r1): ");
  printRectangle(i);

  i = intersection(r1,r2);
  printf("intersection(r1,r2): ");
  printRectangle(i);
  
  i = intersection(r1,r3);
  printf("intersection(r1,r3): ");
  printRectangle(i);

  i = intersection(r1,r4);
  printf("intersection(r1,r4): ");
  printRectangle(i);

  //用 r2 测试所有情况
  i = intersection(r2,r1);
  printf("intersection(r2,r1): ");
  printRectangle(i);

  i = intersection(r2,r2);
  printf("intersection(r2,r2): ");
  printRectangle(i);
  
  i = intersection(r2,r3);
  printf("intersection(r2,r3): ");
  printRectangle(i);

  i = intersection(r2,r4);
  printf("intersection(r2,r4): ");
  printRectangle(i);

  //用 r3 测试所有情况
  i = intersection(r3,r1);
  printf("intersection(r3,r1): ");
  printRectangle(i);

  i = intersection(r3,r2);
  printf("intersection(r3,r2): ");
  printRectangle(i);
  
  i = intersection(r3,r3);
  printf("intersection(r3,r3): ");
  printRectangle(i);

  i = intersection(r3,r4);
  printf("intersection(r3,r4): ");
  printRectangle(i);

  //用 r4 测试所有情况
  i = intersection(r4,r1);
  printf("intersection(r4,r1): ");
  printRectangle(i);

  i = intersection(r4,r2);
  printf("intersection(r4,r2): ");
  printRectangle(i);
  
  i = intersection(r4,r3);
  printf("intersection(r4,r3): ");
  printRectangle(i);

  i = intersection(r4,r4);
  printf("intersection(r4,r4): ");
  printRectangle(i);


  return EXIT_SUCCESS;

}
