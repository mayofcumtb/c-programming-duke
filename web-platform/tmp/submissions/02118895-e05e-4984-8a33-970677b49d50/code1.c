int max (int num1, int num2) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 基础条件分支 (if-else)
  

  // === 学生代码结束 (STUDENT CODE END) ===
}

int main(void) {
  printf("max(42, -69) is %d\n", max(42, -69));
  printf("max(33, 0) is %d\n", max(33, 0));
  printf("max(0x123456, 123456) is %d\n", max(0x123456, 123456));
  
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 函数调用与参数传递 (Function Call & Arguments)
  //计算 0x451215AF 和 0x913591AF 的最大值并将其作为十进制数打印出来
  printf("max(0x451215AF, 0x913591AF) is %d\n", max(0x451215AF, 0x913591AF));
  // === 学生代码结束 (STUDENT CODE END) ===
  
  return 0;
}


