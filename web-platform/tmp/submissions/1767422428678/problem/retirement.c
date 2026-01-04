#include<stdlib.h>
#include<stdio.h>

struct _retire_info {
  int months;
  double contribution; // dollars contributed or spent in month
  double rate_of_return;
};

typedef struct _retire_info retire_info;

void print_monthly_info(int months, double balance) {
  printf("Age %3d month %2d you have $%.2lf\n", months / 12, months % 12, balance);

  return;
}

double balance_calc(double balance, retire_info retire_stats) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 数学计算与结构体传参
  balance += balance * retire_stats.rate_of_return;
  balance += retire_stats.contribution;

  return balance;
  // === 学生代码结束 (STUDENT CODE END) ===
}

void retirement(int startAge, double initial, retire_info working, retire_info retired) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 复杂循环控制与状态更新
  // 将初始余额设置为 start
  double balance = initial;
  int total_months = startAge - 1;

  for (int i = 0; i < working.months; i++) {
    total_months += 1;
    print_monthly_info(total_months, balance); 
    balance = balance_calc(balance, working);
  }

  for (int j = 0; j < retired.months; j++) {
    total_months += 1;
    print_monthly_info(total_months, balance);
    balance = balance_calc(balance, retired);
  }

  return;
  // === 学生代码结束 (STUDENT CODE END) ===
}

int main() {
  retire_info working;
  working.months = 489;
  working.contribution = 1000;
  working.rate_of_return = 0.045 / 12.0;
  
  retire_info retired;
  retired.months = 384;
  retired.contribution = -4000;
  retired.rate_of_return = 0.01 / 12.0;

  retirement(327, 21345, working, retired);

  return 0;
}
