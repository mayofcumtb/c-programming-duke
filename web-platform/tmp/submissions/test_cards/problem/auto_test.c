
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "cards.h"

int passed = 0;
int total = 0;

void test(int condition, const char *name) {
    total++;
    if (condition) {
        printf("✓ %s\n", name);
        passed++;
    } else {
        printf("✗ %s\n", name);
    }
}

int main(void) {
    printf("=== 扑克牌测试 ===\n\n");
    
    // 测试 card_from_num
    printf("--- card_from_num 测试 ---\n");
    
    // 验证 52 张牌都不同
    int seen[52] = {0};
    int unique = 1;
    for (unsigned i = 0; i < 52; i++) {
        card_t c = card_from_num(i);
        // 验证牌值有效
        if (c.value < 2 || c.value > VALUE_ACE || c.suit < SPADES || c.suit > CLUBS) {
            unique = 0;
            break;
        }
        int idx = (c.value - 2) * 4 + c.suit;
        if (idx < 0 || idx >= 52 || seen[idx]) {
            unique = 0;
            break;
        }
        seen[idx] = 1;
    }
    test(unique, "card_from_num 生成 52 张不同的牌");
    
    // 测试 value_letter
    printf("\n--- value_letter 测试 ---\n");
    card_t c2 = {2, SPADES};
    card_t c10 = {10, HEARTS};
    card_t cJ = {VALUE_JACK, DIAMONDS};
    card_t cQ = {VALUE_QUEEN, CLUBS};
    card_t cK = {VALUE_KING, SPADES};
    card_t cA = {VALUE_ACE, HEARTS};
    
    test(value_letter(c2) == '2', "value_letter(2) == '2'");
    test(value_letter(c10) == '0', "value_letter(10) == '0'");
    test(value_letter(cJ) == 'J', "value_letter(Jack) == 'J'");
    test(value_letter(cQ) == 'Q', "value_letter(Queen) == 'Q'");
    test(value_letter(cK) == 'K', "value_letter(King) == 'K'");
    test(value_letter(cA) == 'A', "value_letter(Ace) == 'A'");
    
    // 测试 suit_letter
    printf("\n--- suit_letter 测试 ---\n");
    card_t cs = {5, SPADES};
    card_t ch = {5, HEARTS};
    card_t cd = {5, DIAMONDS};
    card_t cc = {5, CLUBS};
    
    test(suit_letter(cs) == 's', "suit_letter(SPADES) == 's'");
    test(suit_letter(ch) == 'h', "suit_letter(HEARTS) == 'h'");
    test(suit_letter(cd) == 'd', "suit_letter(DIAMONDS) == 'd'");
    test(suit_letter(cc) == 'c', "suit_letter(CLUBS) == 'c'");
    
    // 测试 card_from_letters
    printf("\n--- card_from_letters 测试 ---\n");
    card_t as = card_from_letters('A', 's');
    test(as.value == VALUE_ACE && as.suit == SPADES, "card_from_letters('A', 's')");
    
    card_t kc = card_from_letters('K', 'c');
    test(kc.value == VALUE_KING && kc.suit == CLUBS, "card_from_letters('K', 'c')");
    
    card_t ten_d = card_from_letters('0', 'd');
    test(ten_d.value == 10 && ten_d.suit == DIAMONDS, "card_from_letters('0', 'd')");
    
    // 测试 ranking_to_string
    printf("\n--- ranking_to_string 测试 ---\n");
    test(strcmp(ranking_to_string(STRAIGHT_FLUSH), "STRAIGHT_FLUSH") == 0, "STRAIGHT_FLUSH");
    test(strcmp(ranking_to_string(FOUR_OF_A_KIND), "FOUR_OF_A_KIND") == 0, "FOUR_OF_A_KIND");
    test(strcmp(ranking_to_string(NOTHING), "NOTHING") == 0, "NOTHING");
    
    printf("\n=== 结果: %d/%d 通过 ===\n", passed, total);
    
    return (passed == total) ? EXIT_SUCCESS : EXIT_FAILURE;
}
