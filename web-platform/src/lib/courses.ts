export interface Exercise {
  id: string;
  title: string;
  description: string;
  kind?: 'code' | 'quiz' | 'reading' | 'intro';  // intro 是导读课
  difficulty: '入门' | '基础' | '进阶' | '挑战' | '有趣';
  points: number;
  prerequisites?: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Stage {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export const courseStages: Stage[] = [
  {
    id: 'stage-1',
    title: '阶段一：C语言入门',
    description: '从零开始，掌握C语言的基本语法和程序结构',
    modules: [
      {
        id: 'module-1',
        title: '模块 1：初识C语言',
        description: '理解什么是编程，编写第一个程序',
        exercises: [
          // 1. 先有导读介绍
          {
            id: 'intro_what_is_c',
            title: '1.0 什么是C语言？',
            description: '了解C语言的历史、特点和应用场景',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          // 2. 阅读理解巩固概念
          {
            id: 'qz_compile_concept',
            title: '1.1 编译的概念',
            description: '判断题：理解源代码、编译器、可执行文件的关系',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_what_is_c']
          },
          // 3. 动手实践
          {
            id: '00_hello',
            title: '1.2 Hello World',
            description: '编写你的第一个C程序',
            kind: 'code',
            difficulty: '入门',
            points: 10,
            prerequisites: ['qz_compile_concept']
          },
          // 4. 巩固练习
          {
            id: 'qz_c_basics_mcq_1',
            title: '1.3 gcc 命令测验',
            description: '选择正确的编译命令',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['00_hello']
          },
          // 5. 进阶：错误处理
          {
            id: 'intro_compile_errors',
            title: '1.4 编译错误怎么看？',
            description: '学会阅读和理解编译器的错误信息',
            kind: 'intro',
            difficulty: '入门',
            points: 5,
            prerequisites: ['00_hello']
          },
          {
            id: '04_compile',
            title: '1.5 修复编译错误',
            description: '根据错误信息修复代码中的问题',
            kind: 'code',
            difficulty: '入门',
            points: 10,
            prerequisites: ['intro_compile_errors']
          }
        ]
      },
      {
        id: 'module-2',
        title: '模块 2：变量与数据',
        description: '学习如何存储和处理数据',
        exercises: [
          {
            id: 'intro_variables',
            title: '2.0 变量是什么？',
            description: '理解变量的概念：给数据起名字',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_variable_types',
            title: '2.1 数据类型测验',
            description: '匹配题：int、char、float 分别存什么？',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_variables']
          },
          {
            id: 'qz_c_printf_fill_1',
            title: '2.2 printf 格式化',
            description: '填空题：用正确的占位符输出不同类型的数据',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['qz_variable_types']
          },
          {
            id: 'code_swap_vars',
            title: '2.3 交换两个变量',
            description: '经典问题：不使用第三个变量，交换 a 和 b 的值',
            kind: 'code',
            difficulty: '基础',
            points: 15,
            prerequisites: ['qz_c_printf_fill_1']
          }
        ]
      },
      {
        id: 'module-3',
        title: '模块 3：条件判断',
        description: '让程序学会做决策',
        exercises: [
          {
            id: 'intro_if_else',
            title: '3.0 程序如何做决策？',
            description: '理解 if-else 的逻辑：满足条件就执行',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_c_controlflow_tf_1',
            title: '3.1 真假判断',
            description: '判断题：C语言中 0 是假，非0 是真',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_if_else']
          },
          {
            id: 'qz_logic_operators',
            title: '3.2 逻辑运算符',
            description: '选择题：&& || ! 的使用',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['qz_c_controlflow_tf_1']
          },
          {
            id: '02_code1',
            title: '3.3 实现 Max 函数',
            description: '使用 if-else 返回两个数中较大的那个',
            kind: 'code',
            difficulty: '基础',
            points: 20,
            prerequisites: ['qz_logic_operators']
          },
          {
            id: 'code_grade_judge',
            title: '3.4 成绩等级判断',
            description: '根据分数输出 A/B/C/D/F 等级',
            kind: 'code',
            difficulty: '基础',
            points: 20,
            prerequisites: ['02_code1']
          }
        ]
      },
      {
        id: 'module-4',
        title: '模块 4：循环结构',
        description: '让程序重复执行任务',
        exercises: [
          {
            id: 'intro_loops',
            title: '4.0 为什么需要循环？',
            description: '理解循环的意义：避免重复写代码',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_loop_types',
            title: '4.1 循环类型',
            description: '选择题：for vs while vs do-while 的区别',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_loops']
          },
          {
            id: 'code_sum_1_to_n',
            title: '4.2 计算 1+2+...+N',
            description: '使用循环计算从 1 到 N 的和',
            kind: 'code',
            difficulty: '基础',
            points: 15,
            prerequisites: ['qz_loop_types']
          },
          {
            id: 'code_factorial',
            title: '4.3 计算阶乘',
            description: '计算 N! = 1 × 2 × ... × N',
            kind: 'code',
            difficulty: '基础',
            points: 20,
            prerequisites: ['code_sum_1_to_n']
          },
          {
            id: '03_code2',
            title: '4.4 打印三角形',
            description: '使用嵌套循环输出星号三角形',
            kind: 'code',
            difficulty: '基础',
            points: 25,
            prerequisites: ['code_factorial']
          },
          {
            id: '05_squares',
            title: '4.5 复杂图形',
            description: '挑战：打印更复杂的图案',
            kind: 'code',
            difficulty: '进阶',
            points: 30,
            prerequisites: ['03_code2']
          }
        ]
      },
      {
        id: 'module-5',
        title: '模块 5：函数',
        description: '把代码组织成可复用的模块',
        exercises: [
          {
            id: 'intro_functions',
            title: '5.0 什么是函数？',
            description: '理解函数：一段有名字的代码块',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_function_syntax',
            title: '5.1 函数语法',
            description: '填空题：返回值、函数名、参数的位置',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_functions']
          },
          {
            id: 'code_is_even',
            title: '5.2 判断奇偶',
            description: '写一个函数判断整数是奇数还是偶数',
            kind: 'code',
            difficulty: '基础',
            points: 15,
            prerequisites: ['qz_function_syntax']
          },
          {
            id: 'code_is_prime',
            title: '5.3 判断素数',
            description: '写一个函数判断整数是否为素数',
            kind: 'code',
            difficulty: '基础',
            points: 20,
            prerequisites: ['code_is_even']
          }
        ]
      },
      {
        id: 'module-6',
        title: '模块 6：结构体',
        description: '把相关的数据打包在一起',
        exercises: [
          {
            id: 'intro_struct',
            title: '6.0 为什么需要结构体？',
            description: '理解结构体：组合多种类型的数据',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_struct_syntax',
            title: '6.1 结构体语法',
            description: '选择题：struct 的定义和使用',
            kind: 'quiz',
            difficulty: '入门',
            points: 5,
            prerequisites: ['intro_struct']
          },
          {
            id: '06_rect',
            title: '6.2 矩形计算器',
            description: '用结构体表示矩形，计算面积和周长',
            kind: 'code',
            difficulty: '基础',
            points: 25,
            prerequisites: ['qz_struct_syntax']
          },
          {
            id: '07_retirement',
            title: '6.3 退休储蓄规划',
            description: '综合项目：模拟储蓄增长',
            kind: 'code',
            difficulty: '进阶',
            points: 35,
            prerequisites: ['06_rect']
          }
        ]
      }
    ]
  },
  {
    id: 'stage-2',
    title: '阶段二：内存与指针',
    description: '深入理解计算机底层原理',
    modules: [
      {
        id: 'module-7',
        title: '模块 7：指针入门',
        description: '理解内存地址和指针的概念',
        exercises: [
          {
            id: 'intro_memory',
            title: '7.0 内存是怎么工作的？',
            description: '用"储物柜"的比喻理解内存和地址',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_pointer_basics',
            title: '7.1 指针基础概念',
            description: '选择题：& 和 * 的含义',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['intro_memory']
          },
          {
            id: '11_read_ptr1',
            title: '7.2 指针阅读 (基础)',
            description: '手动推导指针变量的值',
            kind: 'reading',
            difficulty: '基础',
            points: 20,
            prerequisites: ['qz_pointer_basics']
          },
          {
            id: '12_read_ptr2',
            title: '7.3 指针阅读 (进阶)',
            description: '分析更复杂的指针表达式',
            kind: 'reading',
            difficulty: '进阶',
            points: 25,
            prerequisites: ['11_read_ptr1']
          },
          {
            id: 'code_swap_ptr',
            title: '7.4 用指针交换变量',
            description: '写一个函数，通过指针交换两个变量的值',
            kind: 'code',
            difficulty: '基础',
            points: 20,
            prerequisites: ['12_read_ptr2']
          }
        ]
      },
      {
        id: 'module-8',
        title: '模块 8：数组与指针',
        description: '理解数组的本质是连续内存',
        exercises: [
          {
            id: 'intro_array',
            title: '8.0 数组是什么？',
            description: '理解数组：一组连续的"储物柜"',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_array_ptr',
            title: '8.1 数组与指针的关系',
            description: '判断题：arr[i] 等价于 *(arr+i)',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['intro_array']
          },
          {
            id: '13_read_arr1',
            title: '8.2 数组指针阅读',
            description: '分析数组名与指针的关系',
            kind: 'reading',
            difficulty: '基础',
            points: 20,
            prerequisites: ['qz_array_ptr']
          },
          {
            id: '14_array_max',
            title: '8.3 数组最大值',
            description: '遍历数组，找出最大元素',
            kind: 'code',
            difficulty: '基础',
            points: 25,
            prerequisites: ['13_read_arr1']
          },
          {
            id: 'code_array_reverse',
            title: '8.4 数组反转',
            description: '将数组元素倒序排列',
            kind: 'code',
            difficulty: '基础',
            points: 25,
            prerequisites: ['14_array_max']
          },
          {
            id: '16_subseq',
            title: '8.5 最长递增子序列',
            description: '算法挑战：找出最长的连续递增部分',
            kind: 'code',
            difficulty: '进阶',
            points: 40,
            prerequisites: ['code_array_reverse']
          }
        ]
      }
    ]
  },
  {
    id: 'stage-3',
    title: '阶段三：测试与调试',
    description: '学会验证代码正确性',
    modules: [
      {
        id: 'module-9',
        title: '模块 9：软件测试',
        description: '学会设计测试用例',
        exercises: [
          {
            id: 'intro_testing',
            title: '9.0 为什么要测试？',
            description: '理解测试的意义：发现 bug，保证质量',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_test_types',
            title: '9.1 测试类型',
            description: '选择题：黑盒测试 vs 白盒测试',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['intro_testing']
          },
          {
            id: 'qz_boundary_test',
            title: '9.2 边界值测试',
            description: '选择题：应该测试哪些边界值？',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['qz_test_types']
          },
          {
            id: '08_testing',
            title: '9.3 设计测试用例',
            description: '为素数判断函数设计测试输入',
            kind: 'code',
            difficulty: '进阶',
            points: 30,
            prerequisites: ['qz_boundary_test']
          },
          {
            id: '15_tests_subseq',
            title: '9.4 编写单元测试',
            description: '为"最长递增子序列"函数编写测试代码',
            kind: 'code',
            difficulty: '进阶',
            points: 35,
            prerequisites: ['08_testing', '16_subseq']
          }
        ]
      },
      {
        id: 'module-10',
        title: '模块 10：调试技术',
        description: '学会使用调试器',
        exercises: [
          {
            id: 'intro_gdb',
            title: '10.0 什么是调试器？',
            description: '理解调试器的作用：追踪程序执行',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_gdb_commands',
            title: '10.1 GDB 基本命令',
            description: '匹配题：break、run、print 等命令的作用',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['intro_gdb']
          },
          {
            id: '10_gdb',
            title: '10.2 GDB 实战：破解密码',
            description: '使用 GDB 找出程序中隐藏的"密码"',
            kind: 'code',
            difficulty: '有趣',
            points: 30,
            prerequisites: ['qz_gdb_commands']
          }
        ]
      }
    ]
  },
  {
    id: 'stage-4',
    title: '阶段四：综合项目',
    description: '挑战大型项目',
    modules: [
      {
        id: 'module-11',
        title: '模块 11：扑克牌项目',
        description: '综合运用所学知识',
        exercises: [
          {
            id: 'intro_poker_project',
            title: '11.0 项目介绍',
            description: '了解项目目标和整体结构',
            kind: 'intro',
            difficulty: '入门',
            points: 5
          },
          {
            id: 'qz_enum_basics',
            title: '11.1 枚举类型',
            description: '选择题：理解 enum 的使用',
            kind: 'quiz',
            difficulty: '基础',
            points: 5,
            prerequisites: ['intro_poker_project']
          },
          {
            id: 'c2prj1_cards',
            title: '11.2 卡牌基础库',
            description: '实现卡牌结构体和基本操作',
            kind: 'code',
            difficulty: '挑战',
            points: 50,
            prerequisites: ['qz_enum_basics']
          },
          {
            id: 'c2prj2_testing',
            title: '11.3 牌型判断测试',
            description: '为牌型判断函数设计测试用例',
            kind: 'code',
            difficulty: '挑战',
            points: 100,
            prerequisites: ['c2prj1_cards']
          }
        ]
      }
    ]
  }
];
