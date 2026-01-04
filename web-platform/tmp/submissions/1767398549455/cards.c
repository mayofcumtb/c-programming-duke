#include <stdio.h>
#include <assert.h>
#include <stdlib.h>
#include "cards.h"


void assert_card_valid(card_t c) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 断言 (Assert) 与边界检查
  // assert(c.value >= 2 && c.value <= VALUE_ACE);
  // assert(c.suit >= SPADES && c.suit <= CLUBS);
  return;
  // === 学生代码结束 (STUDENT CODE END) ===
}

const char * ranking_to_string(hand_ranking_t r) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 枚举 (Enum) 与 switch-case 语句
  switch(r) {
    // case STRAIGHT_FLUSH : return "STRAIGHT_FLUSH"; break;
    // case FOUR_OF_A_KIND : return "FOUR_OF_A_KIND"; break;
    // case FULL_HOUSE : return "FULL_HOUSE"; break;
    // case FLUSH : return "FLUSH"; break;
    // case STRAIGHT : return "STRAIGHT"; break;
    case THREE_OF_A_KIND : return "THREE_OF_A_KIND"; break;
    case TWO_PAIR : return "TWO_PAIR"; break;
    case PAIR : return "PAIR"; break;
    case NOTHING: return "NOTHING"; break;
    default : return "???"; break;
  }
  // === 学生代码结束 (STUDENT CODE END) ===
}

char value_letter(card_t c) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 复杂 switch 映射 (数值 -> 字符)
  switch(c.value) {
  case 2 : return '2'; break;
  case 3 : return '3'; break;
  case 4 : return '4'; break;
  case 5 : return '5'; break;
  case 6 : return '6'; break;
  case 7 : return '7'; break;
  case 8 : return '8'; break;
  case 9 : return '9'; break;
  case 10 : return '0'; break;
  case VALUE_JACK : return 'J'; break;
  case VALUE_QUEEN : return 'Q'; break;
  case VALUE_KING : return 'K'; break;
  case VALUE_ACE : return 'A'; break;
  default : return '?'; break;
  }
  // === 学生代码结束 (STUDENT CODE END) ===
}


char suit_letter(card_t c) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 枚举到字符的映射
  switch(c.suit) {
  case SPADES : return 's'; break;
  case HEARTS : return 'h'; break;
  case DIAMONDS : return 'd'; break;
  case CLUBS : return 'c'; break;
  default : return '?'; break;
  }
  // === 学生代码结束 (STUDENT CODE END) ===
}

void print_card(card_t c) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 函数调用组合与格式化输出
  char val = value_letter(c);
  char suit = suit_letter(c);
  printf("%c%c", val, suit);
  return;
  // === 学生代码结束 (STUDENT CODE END) ===
}

card_t card_from_letters(char value_let, char suit_let) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 逆向映射 (字符 -> 结构体) 与输入验证
  card_t temp;
  switch(value_let) {
  case '2' : temp.value = 2; break;
  case '3' : temp.value = 3; break;
  case '4' : temp.value = 4; break;
  case '5' : temp.value = 5; break;
  case '6' : temp.value = 6; break;
  case '7' : temp.value = 7; break;
  case '8' : temp.value = 8; break;
  case '9' : temp.value = 9; break;
  case '0' : temp.value = 10; break;
  case 'J' : temp.value = VALUE_JACK; break;
  case 'Q' : temp.value = VALUE_QUEEN; break;
  case 'K' : temp.value = VALUE_KING; break;
  case 'A' : temp.value = VALUE_ACE; break;
  }
  switch(suit_let) {
  case 's' : temp.suit = SPADES; break;
  case 'h' : temp.suit = HEARTS; break;
  case 'd' : temp.suit = DIAMONDS; break;
  case 'c' : temp.suit = CLUBS; break;
  }
  assert_card_valid(temp);
  return temp;
  // === 学生代码结束 (STUDENT CODE END) ===
}

card_t card_from_num(unsigned c) {
  // === 学生代码开始 (STUDENT CODE START) ===
  // 考察点: 整数映射到结构体 (位运算或算术运算)
  card_t temp;
  temp.value = (c / 4) + 2;
  temp.suit = c % 4;
  return temp;
  // === 学生代码结束 (STUDENT CODE END) ===
}
