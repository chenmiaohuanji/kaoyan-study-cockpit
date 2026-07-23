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

export const stages = [
  {
    id: "foundation",
    name: "基础准备期",
    date: "待设置",
    progress: 0,
    status: "未开始",
    goal: "设置目标后，再填写该阶段的学习重点。",
    focus: [] as string[],
  },
  {
    id: "system",
    name: "基础学习期",
    date: "待设置",
    progress: 0,
    status: "未开始",
    goal: "尚未填写阶段目标。",
    focus: [] as string[],
  },
  {
    id: "enhance",
    name: "强化期",
    date: "待设置",
    progress: 0,
    status: "未开始",
    goal: "尚未填写阶段目标。",
    focus: [] as string[],
  },
  {
    id: "past",
    name: "真题期",
    date: "待设置",
    progress: 0,
    status: "未开始",
    goal: "尚未填写阶段目标。",
    focus: [] as string[],
  },
  {
    id: "sprint",
    name: "冲刺期",
    date: "待设置",
    progress: 0,
    status: "未开始",
    goal: "尚未填写阶段目标。",
    focus: [] as string[],
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
