export type Priority = "高" | "中" | "低";
export type TaskStatus = "待开始" | "进行中" | "已完成" | "已延期";
export type SubjectTone = "blue" | "green" | "yellow" | "red" | "gray";

export type StudyTask = {
  id: number;
  title: string;
  subject: string;
  chapter: string;
  plannedMinutes: number;
  actualMinutes: number;
  priority: Priority;
  status: TaskStatus;
  overdue?: boolean;
  mastery?: number;
  hasMistake?: boolean;
  delayReason?: string;
};

export type SubjectSummary = {
  id: string;
  name: string;
  stage: string;
  progress: number;
  weekHours: number;
  latestScore: string;
  status: "状态良好" | "需要关注" | "严重落后" | "尚未开始";
  tone: SubjectTone;
  course: number;
  textbook: number;
  practice: number;
  accuracy: number;
  mistakes: number;
  reviews: number;
};

export type ChapterItem = {
  id: string;
  group: string;
  name: string;
  status: "未开始" | "学习中" | "已完成" | "需巩固" | "已掌握" | "已遗忘";
  course: number;
  practice: number;
  accuracy: number;
  lastReview: string;
  mastery: number;
};

export type MistakeItem = {
  id: number;
  subject: string;
  chapter: string;
  source: string;
  difficulty: "基础" | "中等" | "困难";
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  reason: string;
  method: string;
  knowledge: string[];
  reviewCount: number;
  nextReview: string;
  reviewed: boolean;
  corrected: boolean;
};

export const initialTasks: StudyTask[] = [
  {
    id: 1,
    title: "定积分换元法限时训练 24 题",
    subject: "数学",
    chapter: "高等数学 / 定积分",
    plannedMinutes: 120,
    actualMinutes: 0,
    priority: "高",
    status: "进行中",
    mastery: 3,
  },
  {
    id: 2,
    title: "树与二叉树错题回炉",
    subject: "专业课",
    chapter: "数据结构 / 树",
    plannedMinutes: 90,
    actualMinutes: 0,
    priority: "高",
    status: "待开始",
    overdue: true,
    mastery: 2,
  },
  {
    id: 3,
    title: "英语一阅读 Text 2 精读",
    subject: "英语",
    chapter: "阅读理解 / 主旨题",
    plannedMinutes: 70,
    actualMinutes: 0,
    priority: "高",
    status: "待开始",
    mastery: 3,
  },
  {
    id: 4,
    title: "线性代数矩阵秩复盘",
    subject: "数学",
    chapter: "线性代数 / 矩阵",
    plannedMinutes: 50,
    actualMinutes: 54,
    priority: "中",
    status: "已完成",
    mastery: 4,
  },
  {
    id: 5,
    title: "马原基本原理框架速记",
    subject: "政治",
    chapter: "马克思主义基本原理",
    plannedMinutes: 40,
    actualMinutes: 0,
    priority: "低",
    status: "待开始",
    mastery: 2,
  },
  {
    id: 6,
    title: "数学建模：数据清洗脚本",
    subject: "数学建模",
    chapter: "Python / 数据预处理",
    plannedMinutes: 65,
    actualMinutes: 72,
    priority: "中",
    status: "已完成",
    mastery: 4,
  },
];

export const subjects: SubjectSummary[] = [
  {
    id: "math",
    name: "数学",
    stage: "基础强化 · 高数第二轮",
    progress: 52,
    weekHours: 11.5,
    latestScore: "92 / 150",
    status: "需要关注",
    tone: "yellow",
    course: 64,
    textbook: 58,
    practice: 43,
    accuracy: 52,
    mistakes: 37,
    reviews: 8,
  },
  {
    id: "english",
    name: "英语",
    stage: "词汇巩固 · 阅读精练",
    progress: 61,
    weekHours: 6.2,
    latestScore: "71 / 100",
    status: "状态良好",
    tone: "green",
    course: 72,
    textbook: 66,
    practice: 55,
    accuracy: 67,
    mistakes: 21,
    reviews: 5,
  },
  {
    id: "professional",
    name: "专业课",
    stage: "基础学习 · 数据结构",
    progress: 38,
    weekHours: 7.1,
    latestScore: "78 / 150",
    status: "严重落后",
    tone: "red",
    course: 48,
    textbook: 42,
    practice: 31,
    accuracy: 38,
    mistakes: 46,
    reviews: 14,
  },
  {
    id: "politics",
    name: "政治",
    stage: "框架搭建 · 马原",
    progress: 28,
    weekHours: 2.8,
    latestScore: "58 / 100",
    status: "尚未开始",
    tone: "gray",
    course: 36,
    textbook: 31,
    practice: 18,
    accuracy: 45,
    mistakes: 9,
    reviews: 3,
  },
  {
    id: "modeling",
    name: "数学建模",
    stage: "专题训练 · 数据建模",
    progress: 63,
    weekHours: 4.6,
    latestScore: "校赛 A",
    status: "需要关注",
    tone: "blue",
    course: 68,
    textbook: 54,
    practice: 71,
    accuracy: 62,
    mistakes: 12,
    reviews: 4,
  },
];

export const subjectChapters: Record<string, ChapterItem[]> = {
  math: [
    {
      id: "math-1",
      group: "高等数学",
      name: "函数、极限与连续",
      status: "已掌握",
      course: 100,
      practice: 86,
      accuracy: 82,
      lastReview: "07月19日",
      mastery: 5,
    },
    {
      id: "math-2",
      group: "高等数学",
      name: "一元函数微分学",
      status: "已完成",
      course: 100,
      practice: 72,
      accuracy: 74,
      lastReview: "07月21日",
      mastery: 4,
    },
    {
      id: "math-3",
      group: "高等数学",
      name: "一元函数积分学",
      status: "需巩固",
      course: 88,
      practice: 61,
      accuracy: 58,
      lastReview: "07月16日",
      mastery: 3,
    },
    {
      id: "math-4",
      group: "线性代数",
      name: "矩阵与行列式",
      status: "学习中",
      course: 73,
      practice: 49,
      accuracy: 63,
      lastReview: "07月22日",
      mastery: 3,
    },
    {
      id: "math-5",
      group: "线性代数",
      name: "向量组与线性方程组",
      status: "已遗忘",
      course: 62,
      practice: 35,
      accuracy: 41,
      lastReview: "07月03日",
      mastery: 2,
    },
    {
      id: "math-6",
      group: "概率论与数理统计",
      name: "随机事件与概率",
      status: "未开始",
      course: 0,
      practice: 0,
      accuracy: 0,
      lastReview: "暂无",
      mastery: 1,
    },
  ],
  english: [
    {
      id: "english-1",
      group: "词汇",
      name: "核心词汇 5500",
      status: "学习中",
      course: 76,
      practice: 68,
      accuracy: 79,
      lastReview: "今天",
      mastery: 4,
    },
    {
      id: "english-2",
      group: "阅读",
      name: "主旨题与态度题",
      status: "需巩固",
      course: 82,
      practice: 64,
      accuracy: 66,
      lastReview: "07月20日",
      mastery: 3,
    },
    {
      id: "english-3",
      group: "写作",
      name: "小作文功能句",
      status: "未开始",
      course: 0,
      practice: 0,
      accuracy: 0,
      lastReview: "暂无",
      mastery: 1,
    },
  ],
  professional: [
    {
      id: "professional-1",
      group: "数据结构",
      name: "线性表、栈与队列",
      status: "已完成",
      course: 100,
      practice: 69,
      accuracy: 71,
      lastReview: "07月17日",
      mastery: 4,
    },
    {
      id: "professional-2",
      group: "数据结构",
      name: "树与二叉树",
      status: "已遗忘",
      course: 88,
      practice: 42,
      accuracy: 38,
      lastReview: "07月07日",
      mastery: 2,
    },
    {
      id: "professional-3",
      group: "计算机组成原理",
      name: "数据表示与运算",
      status: "学习中",
      course: 46,
      practice: 28,
      accuracy: 51,
      lastReview: "07月21日",
      mastery: 2,
    },
  ],
  politics: [
    {
      id: "politics-1",
      group: "马克思主义基本原理",
      name: "唯物论与辩证法",
      status: "学习中",
      course: 52,
      practice: 31,
      accuracy: 59,
      lastReview: "07月20日",
      mastery: 3,
    },
    {
      id: "politics-2",
      group: "毛中特",
      name: "新民主主义革命理论",
      status: "未开始",
      course: 0,
      practice: 0,
      accuracy: 0,
      lastReview: "暂无",
      mastery: 1,
    },
  ],
  modeling: [
    {
      id: "modeling-1",
      group: "建模方法",
      name: "评价与决策模型",
      status: "已掌握",
      course: 100,
      practice: 82,
      accuracy: 86,
      lastReview: "07月18日",
      mastery: 5,
    },
    {
      id: "modeling-2",
      group: "编程训练",
      name: "Python 数据处理",
      status: "已完成",
      course: 91,
      practice: 76,
      accuracy: 81,
      lastReview: "07月22日",
      mastery: 4,
    },
    {
      id: "modeling-3",
      group: "论文写作",
      name: "摘要与模型假设",
      status: "需巩固",
      course: 68,
      practice: 51,
      accuracy: 62,
      lastReview: "07月15日",
      mastery: 3,
    },
  ],
};

export const mistakes: MistakeItem[] = [
  {
    id: 1,
    subject: "数学",
    chapter: "高等数学 / 定积分",
    source: "张宇基础 30 讲 · P186",
    difficulty: "中等",
    question: "设 f(x) 连续，求 ∫₀¹ x f(x²) dx 的换元结果。",
    wrongAnswer: "直接令 t=x，遗漏了复合变量的微分关系。",
    correctAnswer: "令 t=x²，dt=2x dx，原式化为 1/2∫₀¹ f(t)dt。",
    reason: "换元后没有同步处理微分项",
    method: "先圈出复合结构，再同时替换变量、上下限与微分。",
    knowledge: ["定积分换元", "复合函数", "积分上下限"],
    reviewCount: 2,
    nextReview: "今天",
    reviewed: false,
    corrected: true,
  },
  {
    id: 2,
    subject: "专业课",
    chapter: "数据结构 / 树",
    source: "王道数据结构 · 第 5 章",
    difficulty: "困难",
    question: "一棵完全二叉树共有 1001 个结点，叶结点数是多少？",
    wrongAnswer: "将满二叉树公式直接套用，得到 501。",
    correctAnswer: "完全二叉树中 n₀=n₂+1，结合 n=n₀+n₁+n₂，叶结点为 501。",
    reason: "混淆满二叉树与完全二叉树性质",
    method: "先判断树类型，再写结点度数关系，最后代入总数。",
    knowledge: ["完全二叉树", "结点度数", "叶结点"],
    reviewCount: 1,
    nextReview: "已逾期 2 天",
    reviewed: false,
    corrected: false,
  },
  {
    id: 3,
    subject: "英语",
    chapter: "阅读理解 / 态度题",
    source: "英语一 2018 Text 3",
    difficulty: "中等",
    question: "作者对文中自动化就业趋势持何种态度？",
    wrongAnswer: "Optimistic",
    correctAnswer: "Cautiously concerned",
    reason: "只看结尾正向词，忽略全文转折结构",
    method: "标注态度词与转折词，先判断总体语气，再排除绝对选项。",
    knowledge: ["作者态度", "转折结构", "语气判断"],
    reviewCount: 3,
    nextReview: "07月25日",
    reviewed: true,
    corrected: true,
  },
  {
    id: 4,
    subject: "数学",
    chapter: "线性代数 / 矩阵",
    source: "李永乐线代辅导讲义 · 例 42",
    difficulty: "基础",
    question: "若 A 可逆，证明 A 的伴随矩阵也可逆。",
    wrongAnswer: "只写出 AA*=|A|E，未说明行列式非零。",
    correctAnswer: "由 |A|≠0 且 AA*=|A|E，可得 A* 的逆为 A/|A|。",
    reason: "证明链条不完整",
    method: "结论型证明必须落到可逆的充分条件或显式逆矩阵。",
    knowledge: ["伴随矩阵", "可逆矩阵", "行列式"],
    reviewCount: 1,
    nextReview: "07月26日",
    reviewed: true,
    corrected: true,
  },
];

export const weeklyTrend = [
  { day: "周一", hours: 5.2, completion: 82 },
  { day: "周二", hours: 4.8, completion: 76 },
  { day: "周三", hours: 6.4, completion: 91 },
  { day: "周四", hours: 5.7, completion: 86 },
  { day: "周五", hours: 4.2, completion: 68 },
  { day: "周六", hours: 6.1, completion: 88 },
  { day: "今天", hours: 3.6, completion: 58 },
];

export const scoreTrend = [
  { date: "04/18", total: 298, math: 78, english: 64, professional: 96, politics: 60 },
  { date: "05/09", total: 306, math: 84, english: 67, professional: 96, politics: 59 },
  { date: "05/30", total: 312, math: 88, english: 68, professional: 98, politics: 58 },
  { date: "06/20", total: 318, math: 91, english: 70, professional: 99, politics: 58 },
  { date: "07/11", total: 323, math: 92, english: 71, professional: 102, politics: 58 },
];

export const stages = [
  {
    id: "foundation",
    name: "基础准备期",
    date: "2026.07 - 2027.02",
    progress: 61,
    status: "进行中",
    goal: "数学与 408 建立知识框架，英语核心词汇完成第一轮。",
    focus: ["高等数学", "数据结构", "核心词汇"],
  },
  {
    id: "system",
    name: "基础学习期",
    date: "2027.03 - 2027.06",
    progress: 0,
    status: "未开始",
    goal: "完成全科第一轮系统学习与章节测试。",
    focus: ["线性代数", "计组", "阅读理解"],
  },
  {
    id: "enhance",
    name: "强化期",
    date: "2027.07 - 2027.09",
    progress: 0,
    status: "未开始",
    goal: "形成题型方法库，提高限时正确率。",
    focus: ["强化题", "专题训练", "错题回炉"],
  },
  {
    id: "past",
    name: "真题期",
    date: "2027.10 - 2027.11",
    progress: 0,
    status: "未开始",
    goal: "真题套卷、时间分配与预测分修正。",
    focus: ["历年真题", "全科套卷", "复盘报告"],
  },
  {
    id: "sprint",
    name: "冲刺期",
    date: "2027.12 - 初试",
    progress: 0,
    status: "未开始",
    goal: "稳定输出、查缺补漏，控制波动。",
    focus: ["模拟考试", "高频错题", "作息管理"],
  },
];

export const weekPlan = [
  {
    day: "周一",
    date: "07/20",
    planned: 6,
    actual: 5.2,
    tasks: ["高数定积分", "英语阅读", "数据结构"],
    state: "已完成",
  },
  {
    day: "周二",
    date: "07/21",
    planned: 6,
    actual: 4.8,
    tasks: ["线代矩阵", "英语词汇", "马原"],
    state: "部分完成",
  },
  {
    day: "周三",
    date: "07/22",
    planned: 6.5,
    actual: 6.4,
    tasks: ["高数积分", "计组", "建模编程"],
    state: "已完成",
  },
  {
    day: "周四",
    date: "07/23",
    planned: 6,
    actual: 3.6,
    tasks: ["二叉树错题", "英语阅读", "马原框架"],
    state: "进行中",
  },
  {
    day: "周五",
    date: "07/24",
    planned: 6,
    actual: 0,
    tasks: ["高数综合题", "操作系统", "英语词汇"],
    state: "待开始",
  },
  {
    day: "周六",
    date: "07/25",
    planned: 7,
    actual: 0,
    tasks: ["章节测试", "错题复习", "建模论文"],
    state: "待开始",
  },
  {
    day: "周日",
    date: "07/26",
    planned: 3,
    actual: 0,
    tasks: ["周复盘", "下周排期"],
    state: "待开始",
  },
];

export const modelingTasks = [
  { title: "完成 TOPSIS 模型代码模板", owner: "王进宇", due: "07月24日", status: "进行中" },
  { title: "整理历年国赛 C 题数据源", owner: "陈同学", due: "07月25日", status: "待开始" },
  { title: "论文摘要与假设互审", owner: "团队", due: "07月27日", status: "待开始" },
  { title: "完成一次 8 小时模拟赛", owner: "团队", due: "08月02日", status: "已排期" },
];
