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
  textbook: number;
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

export type ScoreRecord = {
  id: number;
  date: string;
  title: string;
  total: number;
  math: number;
  english: number;
  professional: number;
  politics: number;
  note: string;
};

export type WeekPlanDay = {
  id: number;
  day: string;
  date: string;
  planned: number;
  actual: number;
  tasks: string[];
  state: "已完成" | "部分完成" | "进行中" | "待开始";
};

export type LongTermPhase = {
  id: string;
  name: string;
  start: string;
  end: string;
  date: string;
  goal: string;
  weeklyHours: string;
  focus: string[];
  deliverables: string[];
  modelingLimit: string;
};

export type MonthlyRoadmapItem = {
  id: string;
  year: 2026 | 2027;
  label: string;
  range: string;
  phase: string;
  weeklyHours: string;
  headline: string;
  focus: string[];
  deliverable: string;
  weeks: string[];
};

export type ModelingTeamTask = {
  id: number;
  title: string;
  owner: string;
  due: string;
  status: "待开始" | "进行中" | "已排期" | "已完成";
};

export type GoalSettings = {
  school: string;
  direction: string;
  targetScore: number;
  examDate: string;
  stage: string;
  politics: number;
  english: number;
  math: number;
  professional: number;
};

export const initialTasks: StudyTask[] = [];

export const subjects: SubjectSummary[] = [
  {
    id: "math",
    name: "数学",
    stage: "尚未设置",
    progress: 0,
    weekHours: 0,
    latestScore: "暂无",
    status: "尚未开始",
    tone: "gray",
    course: 0,
    textbook: 0,
    practice: 0,
    accuracy: 0,
    mistakes: 0,
    reviews: 0,
  },
  {
    id: "english",
    name: "英语",
    stage: "尚未设置",
    progress: 0,
    weekHours: 0,
    latestScore: "暂无",
    status: "尚未开始",
    tone: "gray",
    course: 0,
    textbook: 0,
    practice: 0,
    accuracy: 0,
    mistakes: 0,
    reviews: 0,
  },
  {
    id: "professional",
    name: "专业课",
    stage: "尚未设置",
    progress: 0,
    weekHours: 0,
    latestScore: "暂无",
    status: "尚未开始",
    tone: "gray",
    course: 0,
    textbook: 0,
    practice: 0,
    accuracy: 0,
    mistakes: 0,
    reviews: 0,
  },
  {
    id: "politics",
    name: "政治",
    stage: "尚未设置",
    progress: 0,
    weekHours: 0,
    latestScore: "暂无",
    status: "尚未开始",
    tone: "gray",
    course: 0,
    textbook: 0,
    practice: 0,
    accuracy: 0,
    mistakes: 0,
    reviews: 0,
  },
  {
    id: "modeling",
    name: "数学建模",
    stage: "尚未设置",
    progress: 0,
    weekHours: 0,
    latestScore: "独立统计",
    status: "尚未开始",
    tone: "gray",
    course: 0,
    textbook: 0,
    practice: 0,
    accuracy: 0,
    mistakes: 0,
    reviews: 0,
  },
];

export const subjectChapters: Record<string, ChapterItem[]> = {
  math: [],
  english: [],
  professional: [],
  politics: [],
  modeling: [],
};

export const mistakes: MistakeItem[] = [];

export const weeklyTrend = [
  { day: "周一", hours: 0, completion: 0 },
  { day: "周二", hours: 0, completion: 0 },
  { day: "周三", hours: 0, completion: 0 },
  { day: "周四", hours: 0, completion: 0 },
  { day: "周五", hours: 0, completion: 0 },
  { day: "周六", hours: 0, completion: 0 },
  { day: "今天", hours: 0, completion: 0 },
];

export const scoreTrend: ScoreRecord[] = [];

export const longTermPhases: LongTermPhase[] = [
  {
    id: "launch",
    name: "启动校准期",
    start: "2026-07-26",
    end: "2026-08-31",
    date: "2026.07.26 - 2026.08.31",
    goal: "完成择校、科目、资料和能力基线校准，建立可以长期执行的学习节奏。",
    weeklyHours: "18-22h",
    focus: ["目标院校与科目", "数学与英语诊断", "专业课资料", "固定学习时段"],
    deliverables: ["目标院校清单", "四科能力基线", "首轮资料表", "9 月周计划"],
    modelingLimit: "不超过总学习时长 15%",
  },
  {
    id: "foundation-one",
    name: "基础一轮",
    start: "2026-09-01",
    end: "2026-12-31",
    date: "2026.09 - 2026.12",
    goal: "建立数学、英语和专业课的完整知识框架，先求理解完整，再逐步提高速度。",
    weeklyHours: "22-28h",
    focus: ["数学基础一轮", "英语词汇与阅读", "专业课教材一轮", "月度诊断"],
    deliverables: ["数学主干过半", "核心词汇首轮", "专业课框架图", "年末阶段测试"],
    modelingLimit: "不超过总学习时长 15%",
  },
  {
    id: "foundation-close",
    name: "基础收口期",
    start: "2027-01-01",
    end: "2027-03-31",
    date: "2027.01 - 2027.03",
    goal: "完成第一轮学习并通过章节题查漏补缺，形成可进入强化训练的稳定底座。",
    weeklyHours: "25-30h",
    focus: ["数学一轮收口", "英语阅读稳定性", "专业课章节题", "错题回炉"],
    deliverables: ["一轮知识清单", "章节题正确率基线", "高频错因表", "3 月阶段测试"],
    modelingLimit: "不超过总学习时长 12%",
  },
  {
    id: "strengthen",
    name: "强化突破期",
    start: "2027-04-01",
    end: "2027-06-30",
    date: "2027.04 - 2027.06",
    goal: "用专题训练和二轮复习解决薄弱模块，把理解转化为独立解题能力。",
    weeklyHours: "28-34h",
    focus: ["数学专题训练", "专业课二轮", "英语阅读与翻译", "月度模拟"],
    deliverables: ["薄弱专题清单", "二轮笔记", "错题二次作答", "半年模拟基线"],
    modelingLimit: "不超过总学习时长 10%",
  },
  {
    id: "integrate",
    name: "强化整合期",
    start: "2027-07-01",
    end: "2027-08-31",
    date: "2027.07 - 2027.08",
    goal: "完成强化阶段闭环，启动政治，并让四科进入稳定的周循环。",
    weeklyHours: "32-38h",
    focus: ["政治启动", "数学综合题", "专业课强化收口", "英语写作基础"],
    deliverables: ["四科周循环", "强化阶段测试", "写作素材库", "真题阶段排期"],
    modelingLimit: "不超过总学习时长 8%",
  },
  {
    id: "past-one",
    name: "真题一轮",
    start: "2027-09-01",
    end: "2027-10-15",
    date: "2027.09.01 - 2027.10.15",
    goal: "按年份限时完成真题，建立分数基线、时间分配和失分知识点清单。",
    weeklyHours: "35-42h",
    focus: ["全科真题", "限时作答", "错题归因", "报名信息核对"],
    deliverables: ["近年真题一轮", "各科分数基线", "时间分配表", "失分点排行"],
    modelingLimit: "暂停常规训练，仅保留必要赛事任务",
  },
  {
    id: "past-two",
    name: "真题二轮",
    start: "2027-10-16",
    end: "2027-11-15",
    date: "2027.10.16 - 2027.11.15",
    goal: "用全真模拟和错题二刷缩小目标差距，固定答题顺序与考场节奏。",
    weeklyHours: "38-45h",
    focus: ["全真模拟", "高频错题二刷", "政治背诵", "专业课输出训练"],
    deliverables: ["稳定答题顺序", "目标差距表", "高频错题清零", "冲刺背诵清单"],
    modelingLimit: "暂停训练",
  },
  {
    id: "sprint",
    name: "冲刺与初试",
    start: "2027-11-16",
    end: "2027-12-31",
    date: "2027.11.16 - 2027.12 下旬",
    goal: "以模拟、背诵、回顾和作息稳定为主，不再大规模新增学习内容。",
    weeklyHours: "40-48h，考前一周减量",
    focus: ["全真套卷", "政治与专业课背诵", "错题回看", "作息与考试准备"],
    deliverables: ["最终知识清单", "考场时间方案", "证件与路线检查", "稳定参加初试"],
    modelingLimit: "暂停训练",
  },
];

export const monthlyRoadmap: MonthlyRoadmapItem[] = [
  {
    id: "2026-07",
    year: 2026,
    label: "2026 年 7 月",
    range: "07/26 - 07/31",
    phase: "启动校准期",
    weeklyHours: "12-15h",
    headline: "先完成校准，再开始堆学习量",
    focus: ["目标院校与考试科目", "参考书与考试大纲", "数学、英语、专业课诊断"],
    deliverable: "形成目标清单、资料清单和第一版周作息。",
    weeks: ["启动周：目标与资料盘点，完成三科诊断并安排 8 月节奏。"],
  },
  {
    id: "2026-08",
    year: 2026,
    label: "2026 年 8 月",
    range: "08/01 - 08/31",
    phase: "启动校准期",
    weeklyHours: "18-22h",
    headline: "建立每天能重复的基础学习节奏",
    focus: ["高数预备与基本概念", "核心词汇与语法", "专业课目录与先修知识"],
    deliverable: "连续执行 4 周，完成一次月末诊断并修订课表。",
    weeks: ["第 1 周：固定学习时段", "第 2 周：数学与英语基础启动", "第 3 周：专业课进入教材", "第 4 周：月末诊断与调整"],
  },
  {
    id: "2026-09",
    year: 2026,
    label: "2026 年 9 月",
    range: "09/01 - 09/30",
    phase: "基础一轮",
    weeklyHours: "22-25h",
    headline: "正式进入三科基础一轮",
    focus: ["高数极限、连续与导数", "核心词汇首轮", "专业课模块 1"],
    deliverable: "完成高数第一单元、词汇首轮约 25%、专业课首个模块。",
    weeks: ["第 1 周：极限与词汇", "第 2 周：连续与长难句", "第 3 周：导数与专业课", "第 4 周：章节题与复盘"],
  },
  {
    id: "2026-10",
    year: 2026,
    label: "2026 年 10 月",
    range: "10/01 - 10/31",
    phase: "基础一轮",
    weeklyHours: "23-26h",
    headline: "保持输入，也开始低强度输出",
    focus: ["微分与积分基础", "长难句和阅读精读", "专业课模块 2"],
    deliverable: "每周完成一次章节自测，开始记录稳定错因。",
    weeks: ["第 1 周：微分基础", "第 2 周：不定积分", "第 3 周：定积分与阅读", "第 4 周：专业课自测"],
  },
  {
    id: "2026-11",
    year: 2026,
    label: "2026 年 11 月",
    range: "11/01 - 11/30",
    phase: "基础一轮",
    weeklyHours: "24-27h",
    headline: "把基础知识连成完整框架",
    focus: ["多元微积分与线代基础", "阅读方法稳定", "专业课模块 3"],
    deliverable: "绘制三科知识框架，完成一次闭卷章节测试。",
    weeks: ["第 1 周：多元函数", "第 2 周：线代概念", "第 3 周：阅读与专业课", "第 4 周：框架整理与测试"],
  },
  {
    id: "2026-12",
    year: 2026,
    label: "2026 年 12 月",
    range: "12/01 - 12/31",
    phase: "基础一轮",
    weeklyHours: "24-28h",
    headline: "年末验收，不带着模糊问题跨年",
    focus: ["线代收口与概率论预备", "词汇首轮收口", "专业课一轮过半"],
    deliverable: "完成年末阶段测试，输出 2027 年第一季度补缺清单。",
    weeks: ["第 1 周：线代强化", "第 2 周：概率预备或数二补缺", "第 3 周：专业课推进", "第 4 周：阶段测试与年终复盘"],
  },
  {
    id: "2027-01",
    year: 2027,
    label: "2027 年 1 月",
    range: "01/01 - 01/31",
    phase: "基础收口期",
    weeklyHours: "25-28h",
    headline: "沿着测试结果补齐一轮缺口",
    focus: ["数学薄弱章节", "英语阅读连续性", "专业课未完模块"],
    deliverable: "清除一轮遗漏章节，形成第一版高频错题表。",
    weeks: ["第 1 周：测试归因", "第 2 周：数学补缺", "第 3 周：专业课补缺", "第 4 周：英语稳定性检查"],
  },
  {
    id: "2027-02",
    year: 2027,
    label: "2027 年 2 月",
    range: "02/01 - 02/28",
    phase: "基础收口期",
    weeklyHours: "26-30h",
    headline: "用章节题验证是否真正理解",
    focus: ["数学章节题", "英语精读与翻译", "专业课章节输出"],
    deliverable: "建立各章节正确率基线，低于 60% 的内容进入补强列表。",
    weeks: ["第 1 周：数学章节题", "第 2 周：专业课章节题", "第 3 周：英语翻译", "第 4 周：错题回炉"],
  },
  {
    id: "2027-03",
    year: 2027,
    label: "2027 年 3 月",
    range: "03/01 - 03/31",
    phase: "基础收口期",
    weeklyHours: "27-30h",
    headline: "完成一轮验收，拿到强化入口资格",
    focus: ["一轮总复习", "综合章节测试", "强化资料筛选"],
    deliverable: "完成三科阶段测试并确定 4 至 6 月专题优先级。",
    weeks: ["第 1 周：数学总复习", "第 2 周：英语与专业课复习", "第 3 周：阶段测试", "第 4 周：归因与强化排期"],
  },
  {
    id: "2027-04",
    year: 2027,
    label: "2027 年 4 月",
    range: "04/01 - 04/30",
    phase: "强化突破期",
    weeklyHours: "28-32h",
    headline: "从章节理解切换到专题解题",
    focus: ["数学专题 1", "专业课二轮模块 1", "英语阅读限时"],
    deliverable: "完成第一批薄弱专题二次作答，记录速度与正确率。",
    weeks: ["第 1 周：专题诊断", "第 2 周：数学专题", "第 3 周：专业课二轮", "第 4 周：限时测验"],
  },
  {
    id: "2027-05",
    year: 2027,
    label: "2027 年 5 月",
    range: "05/01 - 05/31",
    phase: "强化突破期",
    weeklyHours: "30-33h",
    headline: "持续做题，但每道错题都要完成归因",
    focus: ["数学专题 2", "专业课二轮模块 2", "英语翻译与新题型"],
    deliverable: "高频错误按概念、计算、审题和方法分类，完成一次月考。",
    weeks: ["第 1 周：数学专题", "第 2 周：专业课输出", "第 3 周：英语专项", "第 4 周：月考与错因统计"],
  },
  {
    id: "2027-06",
    year: 2027,
    label: "2027 年 6 月",
    range: "06/01 - 06/30",
    phase: "强化突破期",
    weeklyHours: "31-34h",
    headline: "用半年模拟检查投入是否真的转化为分数",
    focus: ["综合题训练", "专业课二轮收口", "英语阅读稳定性", "半年模拟"],
    deliverable: "完成一次全科基线模拟，输出目标分差距与暑期任务表。",
    weeks: ["第 1 周：综合训练", "第 2 周：二轮收口", "第 3 周：全科模拟", "第 4 周：差距分析与暑期排期"],
  },
  {
    id: "2027-07",
    year: 2027,
    label: "2027 年 7 月",
    range: "07/01 - 07/31",
    phase: "强化整合期",
    weeklyHours: "32-36h",
    headline: "四科进入同一条周循环",
    focus: ["政治基础启动", "数学综合题", "专业课强化", "英语写作素材"],
    deliverable: "政治完成首轮框架，四科都拥有固定周复习时段。",
    weeks: ["第 1 周：政治启动", "第 2 周：数学综合", "第 3 周：专业课强化", "第 4 周：四科月测"],
  },
  {
    id: "2027-08",
    year: 2027,
    label: "2027 年 8 月",
    range: "08/01 - 08/31",
    phase: "强化整合期",
    weeklyHours: "34-38h",
    headline: "强化收口，为真题阶段腾出完整时间",
    focus: ["综合套题", "政治选择题", "英语写作基础", "真题排期"],
    deliverable: "完成强化阶段测试，列出真题年份顺序与每周模拟日。",
    weeks: ["第 1 周：综合套题", "第 2 周：政治选择题", "第 3 周：写作与专业课", "第 4 周：强化验收"],
  },
  {
    id: "2027-09",
    year: 2027,
    label: "2027 年 9 月",
    range: "09/01 - 09/30",
    phase: "真题一轮",
    weeklyHours: "35-40h",
    headline: "按年份限时做真题，第一次建立真实分数基线",
    focus: ["数学与专业课真题", "英语真题精读", "政治选择题", "报名准备"],
    deliverable: "完成首批真题，形成各科时间分配和失分知识点排行。",
    weeks: ["第 1 周：真题规则校准", "第 2 周：限时训练", "第 3 周：错题二刷", "第 4 周：月度全真模拟"],
  },
  {
    id: "2027-10",
    year: 2027,
    label: "2027 年 10 月",
    range: "10/01 - 10/31",
    phase: "真题一轮 / 二轮",
    weeklyHours: "38-43h",
    headline: "从会做走向按时、稳定地做对",
    focus: ["真题二刷", "整套模拟", "政治背诵启动", "报名信息核对"],
    deliverable: "固定答题顺序，目标分差距缩小到可追踪的知识点清单。",
    weeks: ["第 1 周：真题一轮收口", "第 2 周：报名信息核对", "第 3 周：整套模拟", "第 4 周：高频错题二刷"],
  },
  {
    id: "2027-11",
    year: 2027,
    label: "2027 年 11 月",
    range: "11/01 - 11/30",
    phase: "真题二轮 / 冲刺",
    weeklyHours: "40-46h",
    headline: "把知识、速度和考场节奏合并训练",
    focus: ["全真模拟", "政治与专业课背诵", "英语作文", "高频错题"],
    deliverable: "形成最终背诵清单、考场时间方案和最后一个月减法清单。",
    weeks: ["第 1 周：全真模拟", "第 2 周：错题清零", "第 3 周：冲刺切换", "第 4 周：背诵与稳定输出"],
  },
  {
    id: "2027-12",
    year: 2027,
    label: "2027 年 12 月",
    range: "12/01 - 初试",
    phase: "冲刺与初试",
    weeklyHours: "40-48h，考前减量",
    headline: "只做最有价值的回顾，稳定抵达考场",
    focus: ["高质量套卷", "背诵回顾", "错题清单", "作息与考试物品"],
    deliverable: "稳定完成初试；具体考试日期以教育部正式公告为准。",
    weeks: ["上旬：套卷与背诵", "中旬：重点回看", "考前周：减量并调整作息", "初试：按既定时间方案执行"],
  },
];

export const launchWeekPlan: WeekPlanDay[] = [
  {
    id: 1,
    day: "周日",
    date: "07/26",
    planned: 2,
    actual: 0,
    tasks: ["确定目标院校、方向与考试科目", "整理考试大纲和参考书清单"],
    state: "待开始",
  },
  {
    id: 2,
    day: "周一",
    date: "07/27",
    planned: 3,
    actual: 0,
    tasks: ["完成数学基础诊断", "整理不会、模糊、熟练三类知识点"],
    state: "待开始",
  },
  {
    id: 3,
    day: "周二",
    date: "07/28",
    planned: 2.5,
    actual: 0,
    tasks: ["完成英语词汇与阅读诊断", "建立首批核心词汇复习清单"],
    state: "待开始",
  },
  {
    id: 4,
    day: "周三",
    date: "07/29",
    planned: 3,
    actual: 0,
    tasks: ["梳理专业课目录和分值结构", "完成专业课基础诊断"],
    state: "待开始",
  },
  {
    id: 5,
    day: "周四",
    date: "07/30",
    planned: 3,
    actual: 0,
    tasks: ["开始高数预备与基本概念", "完成一组基础练习并记录错因"],
    state: "待开始",
  },
  {
    id: 6,
    day: "周五",
    date: "07/31",
    planned: 2.5,
    actual: 0,
    tasks: ["英语长难句入门与精读", "补齐资料并确定固定学习时段"],
    state: "待开始",
  },
  {
    id: 7,
    day: "周六",
    date: "08/01",
    planned: 2,
    actual: 0,
    tasks: ["复盘启动周的时间与难度", "生成 8 月第一周计划"],
    state: "待开始",
  },
];

export const weekPlan: WeekPlanDay[] = [];

export const modelingTasks: ModelingTeamTask[] = [];

export const initialGoalSettings: GoalSettings = {
  school: "",
  direction: "",
  targetScore: 0,
  examDate: "",
  stage: "",
  politics: 0,
  english: 0,
  math: 0,
  professional: 0,
};
