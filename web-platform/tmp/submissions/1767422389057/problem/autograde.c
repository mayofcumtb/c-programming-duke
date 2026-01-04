
#include <stdio.h>
#include <stdlib.h>
#define main student_main
#include "code2.c"
#undef main
static int triangular(int n) { return n <= 0 ? 0 : (n * (n + 1)) / 2; }
int main(void) {
  freopen("/dev/null", "w", stdout);
  int tests[] = {0, 1, 2, 3, 4, 7, 9, 12, 95, 159, 343, 2438};
  size_t i;
  int ok = 1;
  for (i = 0; i < sizeof(tests)/sizeof(tests[0]); i++) {
    int n = tests[i];
    int got = printTriangle(n);
    int pass = (got == triangular(n));
    if (pass) fprintf(stderr, "Testing printTriangle(%d) ... Correct\n", n);
    else { fprintf(stderr, "Testing printTriangle(%d) ... Incorrect\n", n); ok = 0; }
  }
  return ok ? 0 : 1;
}
