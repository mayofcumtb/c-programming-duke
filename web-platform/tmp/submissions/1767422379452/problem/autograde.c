
#include <stdio.h>
#include <limits.h>
#define main student_main
#include "code1.c"
#undef main
static int expect_max(int a, int b) { return a > b ? a : b; }
int main(void) {
  int xs[] = {-999, -87, 0, 1, 240, 345, 999999, INT_MAX};
  int ys[] = {INT_MIN, 123, 567, 891, 0, 1, -999, 123123123};
  size_t i, j;
  int ok = 1;
  for (i = 0; i < sizeof(xs)/sizeof(xs[0]); i++) {
    for (j = 0; j < sizeof(ys)/sizeof(ys[0]); j++) {
      int a = xs[i], b = ys[j];
      int got = max(a, b);
      int exp = expect_max(a, b);
      if (got == exp) printf("Testing max(%d, %d) ... Correct\n", a, b);
      else { printf("Testing max(%d, %d) ... Incorrect (got %d, expected %d)\n", a, b, got, exp); ok = 0; }
    }
  }
  return ok ? 0 : 1;
}
