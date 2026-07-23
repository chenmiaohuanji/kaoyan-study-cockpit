"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Flag,
  Flame,
  Focus,
  GripVertical,
  Home,
  ListChecks,
  Menu,
  Moon,
  MoreHorizontal,
  NotebookTabs,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TimerReset,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import {
  initialTasks,
  initialGoalSettings,
  mistakes as initialMistakes,
  modelingTasks as initialModelingTasks,
  scoreTrend as initialScoreRecords,
  stages,
  subjectChapters as initialSubjectChapters,
  subjects,
  weekPlan as initialWeekPlan,
  weeklyTrend,
  type ChapterItem,
  type GoalSettings,
  type MistakeItem,
  type ModelingTeamTask,
  type Priority,
  type ScoreRecord,
  type StudyTask,
  type SubjectSummary,
  type WeekPlanDay,
} from "./study-data";

type ViewId =
  | "overview"
  | "today"
  | "plan"
  | "subjects"
  | "mistakes"
  | "scores"
  | "reports"
  | "modeling"
  | "settings";
type Theme = "light" | "dark";
type PlanView = "stage" | "month" | "week" | "day";
type ReportPeriod = "日报" | "周报" | "月报" | "阶段报告";
type TaskFilter = "全部" | "待完成" | "进行中" | "已完成";
type EntryDialog = "plan" | "study-log" | "mistake" | "score" | "modeling" | null;
type TaskAction = { type: "complete" | "delay"; taskId: number } | null;
type ConfirmAction =
  | { type: "delete-task"; taskId: number }
  | { type: "delete-mistake"; mistakeId: number }
  | { type: "delete-score"; scoreId: number }
  | { type: "reset-data" }
  | null;

const STORAGE_KEY = "yantu-dashboard-v3";
const THEME_KEY = "yantu-dashboard-theme";

const navItems: Array<{
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "首页总览", shortLabel: "首页", icon: Home },
  { id: "today", label: "今日学习", shortLabel: "今日", icon: Focus },
  { id: "plan", label: "学习计划", shortLabel: "计划", icon: CalendarRange },
  { id: "subjects", label: "科目进度", shortLabel: "进度", icon: BookOpenCheck },
  { id: "mistakes", label: "错题本", shortLabel: "错题", icon: NotebookTabs },
  { id: "scores", label: "测试成绩", shortLabel: "成绩", icon: BarChart3 },
  { id: "reports", label: "学习报告", shortLabel: "报告", icon: FileText },
  { id: "modeling", label: "数学建模", shortLabel: "建模", icon: BrainCircuit },
  { id: "settings", label: "设置", shortLabel: "我的", icon: Settings },
];

const mobileNavIds: ViewId[] = ["overview", "today", "plan", "subjects", "settings"];

const pageDescriptions: Record<ViewId, string> = {
  overview: "今天该做什么、进度在哪里、风险有多大",
  today: "把计划转化为一次清晰、安静的专注行动",
  plan: "阶段、月份、周与日任务保持同一条节奏线",
  subjects: "从内容、练习、正确率与复习状态判断掌握度",
  mistakes: "让每一次错误都进入可回收的复习周期",
  scores: "从分数、题型和时间分配中找到有效提分路径",
  reports: "用周期复盘决定下一步增加什么、减少什么",
  modeling: "独立管理训练投入，避免挤压考研主线",
  settings: "维护目标、数据与长期使用偏好",
};

const chartColors = {
  light: {
    brand: "#476CFF",
    green: "#2E9D72",
    yellow: "#D89A2B",
    red: "#D95C5C",
    muted: "#98A1B2",
    grid: "#EEF1F5",
    tooltip: "#FFFFFF",
    text: "#172033",
  },
  dark: {
    brand: "#6F8BFF",
    green: "#4DB78B",
    yellow: "#E3AD4D",
    red: "#E77979",
    muted: "#7F8999",
    grid: "#2A3342",
    tooltip: "#202734",
    text: "#F4F6FA",
  },
};

export function KaoyanDashboard() {
  const [view, setView] = useState<ViewId>("overview");
  const [theme, setTheme] = useState<Theme>("light");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [mistakeItems, setMistakeItems] = useState<MistakeItem[]>(initialMistakes);
  const [chapterData, setChapterData] = useState<Record<string, ChapterItem[]>>(
    cloneChapterData(initialSubjectChapters),
  );
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>(initialScoreRecords);
  const [weekPlanData, setWeekPlanData] = useState<WeekPlanDay[]>(
    cloneWeekPlan(initialWeekPlan),
  );
  const [modelingTeamTasks, setModelingTeamTasks] = useState<ModelingTeamTask[]>(
    initialModelingTasks,
  );
  const [goalSettings, setGoalSettings] = useState<GoalSettings>(initialGoalSettings);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0].id);
  const [taskAction, setTaskAction] = useState<TaskAction>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [entryDialog, setEntryDialog] = useState<EntryDialog>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusNoteOpen, setFocusNoteOpen] = useState(false);
  const [planView, setPlanView] = useState<PlanView>("week");
  const [activeSubjectId, setActiveSubjectId] = useState("math");
  const [expandedGroup, setExpandedGroup] = useState("高等数学");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("周报");
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(savedTheme ?? (prefersDark ? "dark" : "light"));

      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            tasks?: StudyTask[];
            mistakes?: MistakeItem[];
            chapters?: Record<string, ChapterItem[]>;
            scores?: ScoreRecord[];
            weekPlan?: WeekPlanDay[];
            modelingTasks?: ModelingTeamTask[];
            goal?: GoalSettings;
            notificationsEnabled?: boolean;
            selectedTaskId?: number;
            reducedMotion?: boolean;
          };
          if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
          if (Array.isArray(parsed.mistakes)) setMistakeItems(parsed.mistakes);
          if (parsed.chapters) setChapterData(parsed.chapters);
          if (Array.isArray(parsed.scores)) setScoreRecords(parsed.scores);
          if (Array.isArray(parsed.weekPlan)) setWeekPlanData(parsed.weekPlan);
          if (Array.isArray(parsed.modelingTasks)) {
            setModelingTeamTasks(parsed.modelingTasks);
          }
          if (parsed.goal) setGoalSettings(parsed.goal);
          if (typeof parsed.notificationsEnabled === "boolean") {
            setNotificationsEnabled(parsed.notificationsEnabled);
          }
          if (parsed.selectedTaskId) setSelectedTaskId(parsed.selectedTaskId);
          if (typeof parsed.reducedMotion === "boolean") {
            setReducedMotion(parsed.reducedMotion);
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks,
        mistakes: mistakeItems,
        chapters: chapterData,
        scores: scoreRecords,
        weekPlan: weekPlanData,
        modelingTasks: modelingTeamTasks,
        goal: goalSettings,
        notificationsEnabled,
        selectedTaskId,
        reducedMotion,
      }),
    );
  }, [
    chapterData,
    goalSettings,
    hydrated,
    mistakeItems,
    modelingTeamTasks,
    notificationsEnabled,
    reducedMotion,
    scoreRecords,
    selectedTaskId,
    tasks,
    weekPlanData,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [hydrated, theme]);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => {
      setFocusSeconds((seconds) => {
        if (seconds <= 1) {
          setFocusRunning(false);
          setToast("本轮专注完成，记得记录掌握程度");
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setTaskAction(null);
      setConfirmAction(null);
      setEntryDialog(null);
      setQuickAddOpen(false);
      setNotificationsOpen(false);
      setMobileMenuOpen(false);
      if (focusMode) {
        setFocusMode(false);
        setFocusRunning(false);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [focusMode]);

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? initialTasks[0];
  const completedTasks = tasks.filter((task) => task.status === "已完成");
  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;
  const plannedMinutes = tasks.reduce((sum, task) => sum + task.plannedMinutes, 0);
  const completedMinutes = completedTasks.reduce(
    (sum, task) => sum + (task.actualMinutes || task.plannedMinutes),
    0,
  );
  const latestScore = scoreRecords.at(-1) ?? initialScoreRecords.at(-1)!;
  const previousScore =
    scoreRecords.at(-2) ?? scoreRecords.at(-1) ?? initialScoreRecords.at(-1)!;
  const liveSubjects = useMemo(
    () =>
      subjects.map((subject) => {
        const chapters = chapterData[subject.id] ?? [];
        if (!chapters.length) return subject;
        const average = (field: "course" | "practice" | "accuracy") =>
          Math.round(
            chapters.reduce((sum, chapter) => sum + chapter[field], 0) /
              chapters.length,
          );
        const course = average("course");
        const practice = average("practice");
        const accuracy = average("accuracy");
        const progress = Math.round(course * 0.35 + practice * 0.35 + accuracy * 0.3);
        const status: SubjectSummary["status"] =
          progress < 40
            ? "严重落后"
            : progress < 55
              ? "需要关注"
              : "状态良好";
        const tone: SubjectSummary["tone"] =
          status === "严重落后" ? "red" : status === "需要关注" ? "yellow" : "green";
        return {
          ...subject,
          progress,
          course,
          practice,
          accuracy,
          status,
          tone,
          latestScore: scoreLabelForSubject(subject.id, latestScore),
          mistakes: mistakeItems.filter((item) => item.subject === subject.name).length,
          reviews: mistakeItems.filter(
            (item) => item.subject === subject.name && !item.reviewed,
          ).length,
        };
      }),
    [chapterData, latestScore, mistakeItems],
  );
  const liveWeeklyTrend = useMemo(
    () =>
      weeklyTrend.map((item, index) =>
        index === weeklyTrend.length - 1
          ? {
              ...item,
              hours: Number((completedMinutes / 60).toFixed(1)),
              completion: completionRate,
            }
          : item,
      ),
    [completedMinutes, completionRate],
  );
  const currentPage = navItems.find((item) => item.id === view) ?? navItems[0];
  const currentColors = chartColors[theme];
  const countdown = daysUntilExam(goalSettings.examDate);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const taskResults = tasks
      .filter((task) =>
        `${task.title}${task.subject}${task.chapter}`.toLowerCase().includes(query),
      )
      .slice(0, 4)
      .map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        meta: `${task.subject} · ${task.chapter}`,
        view: "today" as ViewId,
        taskId: task.id,
      }));
    const subjectResults = liveSubjects
      .filter((subject) =>
        `${subject.name}${subject.stage}`.toLowerCase().includes(query),
      )
      .slice(0, 3)
      .map((subject) => ({
        id: `subject-${subject.id}`,
        label: subject.name,
        meta: subject.stage,
        view: "subjects" as ViewId,
        subjectId: subject.id,
      }));
    return [...taskResults, ...subjectResults];
  }, [liveSubjects, searchQuery, tasks]);

  function navigate(nextView: ViewId) {
    setView(nextView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  function updateTask(taskId: number, patch: Partial<StudyTask>) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
  }

  function completeTask(
    taskId: number,
    values: { actualMinutes: number; mastery: number; hasMistake: boolean },
  ) {
    const completedTask = tasks.find((task) => task.id === taskId);
    if (values.hasMistake && completedTask && !completedTask.hasMistake) {
      setMistakeItems((current) => [
        {
          id: Math.max(0, ...current.map((item) => item.id)) + 1,
          subject: completedTask.subject,
          chapter: completedTask.chapter,
          source: `今日任务 · ${completedTask.title}`,
          difficulty: "中等",
          question: `待整理：${completedTask.title} 中产生的错题`,
          wrongAnswer: "待补充",
          correctAnswer: "待补充",
          reason: "完成任务时标记为产生错题",
          method: "进入错题本补充题干、答案与方法",
          knowledge: [completedTask.chapter],
          reviewCount: 0,
          nextReview: "明天",
          reviewed: false,
          corrected: false,
        },
        ...current,
      ]);
    }
    updateTask(taskId, {
      status: "已完成",
      actualMinutes: values.actualMinutes,
      mastery: values.mastery,
      hasMistake: values.hasMistake,
      overdue: false,
    });
    setTaskAction(null);
    setFocusRunning(false);
    setToast("任务已完成，记录已进入今日复盘");
  }

  function delayTask(taskId: number, reason: string) {
    updateTask(taskId, { status: "已延期", delayReason: reason });
    setTaskAction(null);
    setToast("延期原因已记录，将在周报中统计");
  }

  function deleteTask(taskId: number) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setConfirmAction(null);
    setToast("任务已删除");
  }

  function addTask(task: Omit<StudyTask, "id" | "actualMinutes" | "status">) {
    const newTask: StudyTask = {
      ...task,
      id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
      actualMinutes: 0,
      status: "待开始",
    };
    setTasks((current) => [...current, newTask]);
    setSelectedTaskId(newTask.id);
    setQuickAddOpen(false);
    setToast("任务已加入今日计划");
  }

  function reorderTasks(sourceId: number, targetId: number) {
    if (sourceId === targetId) return;
    setTasks((current) => {
      const sourceIndex = current.findIndex((task) => task.id === sourceId);
      const targetIndex = current.findIndex((task) => task.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function moveTask(taskId: number, direction: -1 | 1) {
    setTasks((current) => {
      const index = current.findIndex((task) => task.id === taskId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function startFocus(taskId: number) {
    setSelectedTaskId(taskId);
    updateTask(taskId, { status: "进行中" });
    setFocusSeconds(25 * 60);
    setFocusRunning(false);
    setFocusMode(true);
  }

  function addPlanItem(values: {
    dayId: number;
    title: string;
    subject: string;
    minutes: number;
    addToToday: boolean;
  }) {
    setWeekPlanData((current) =>
      current.map((day) =>
        day.id === values.dayId
          ? {
              ...day,
              planned: Number((day.planned + values.minutes / 60).toFixed(1)),
              tasks: [...day.tasks, values.title],
              state: day.actual ? "进行中" : "待开始",
            }
          : day,
      ),
    );
    if (values.addToToday) {
      const newTask: StudyTask = {
        id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
        title: values.title,
        subject: values.subject,
        chapter: "来自周计划",
        plannedMinutes: values.minutes,
        actualMinutes: 0,
        priority: "中",
        status: "待开始",
      };
      setTasks((current) => [...current, newTask]);
      setSelectedTaskId(newTask.id);
    }
    setEntryDialog(null);
    setToast(values.addToToday ? "计划已创建，并同步到今日任务" : "计划已加入本周");
  }

  function addStudyRecord(values: {
    subjectId: string;
    chapterId: string;
    minutes: number;
    course: number;
    practice: number;
    accuracy: number;
    mastery: number;
  }) {
    const chapter = chapterData[values.subjectId]?.find(
      (item) => item.id === values.chapterId,
    );
    const subject = subjects.find((item) => item.id === values.subjectId);
    if (!chapter || !subject) return;
    setChapterData((current) => ({
      ...current,
      [values.subjectId]: current[values.subjectId].map((item) =>
        item.id === values.chapterId
          ? {
              ...item,
              course: values.course,
              practice: values.practice,
              accuracy: values.accuracy,
              mastery: values.mastery,
              lastReview: "今天",
              status: chapterStatus(values.mastery, values.practice),
            }
          : item,
      ),
    }));
    const logTask: StudyTask = {
      id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
      title: `学习记录：${chapter.name}`,
      subject: subject.name,
      chapter: `${chapter.group} / ${chapter.name}`,
      plannedMinutes: values.minutes,
      actualMinutes: values.minutes,
      priority: "中",
      status: "已完成",
      mastery: values.mastery,
    };
    setTasks((current) => [...current, logTask]);
    setEntryDialog(null);
    setToast("学习记录已保存，科目进度和今日时长已更新");
  }

  function addMistake(values: Omit<MistakeItem, "id" | "reviewCount" | "reviewed" | "corrected">) {
    const newMistake: MistakeItem = {
      ...values,
      id: Math.max(0, ...mistakeItems.map((item) => item.id)) + 1,
      reviewCount: 0,
      reviewed: false,
      corrected: false,
    };
    setMistakeItems((current) => [newMistake, ...current]);
    setEntryDialog(null);
    setToast("错题已录入，并安排首次复习");
  }

  function reviewMistake(mistakeId: number, rating: 1 | 2 | 3) {
    setMistakeItems((current) =>
      current.map((item) =>
        item.id === mistakeId
          ? {
              ...item,
              reviewCount: item.reviewCount + 1,
              reviewed: rating === 3,
              corrected: rating >= 2,
              nextReview: nextReviewLabel(rating),
            }
          : item,
      ),
    );
    setToast(
      rating === 3
        ? "已记录为掌握，下次复习安排在 7 天后"
        : "已保留在复习队列，并缩短复习间隔",
    );
  }

  function deleteMistake(mistakeId: number) {
    setMistakeItems((current) => current.filter((item) => item.id !== mistakeId));
    setConfirmAction(null);
    setToast("错题已删除");
  }

  function addScore(values: Omit<ScoreRecord, "id" | "total">) {
    const total =
      values.math + values.english + values.professional + values.politics;
    setScoreRecords((current) => [
      ...current,
      {
        ...values,
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        total,
      },
    ]);
    setEntryDialog(null);
    setToast(`成绩已录入，总分 ${total} 分`);
  }

  function deleteScore(scoreId: number) {
    setScoreRecords((current) => current.filter((item) => item.id !== scoreId));
    setConfirmAction(null);
    setToast("测试记录已删除");
  }

  function addModelingTask(values: Omit<ModelingTeamTask, "id" | "status">) {
    setModelingTeamTasks((current) => [
      ...current,
      {
        ...values,
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        status: "待开始",
      },
    ]);
    setEntryDialog(null);
    setToast("团队任务已添加");
  }

  function advanceModelingTask(taskId: number) {
    const order: ModelingTeamTask["status"][] = [
      "待开始",
      "已排期",
      "进行中",
      "已完成",
    ];
    setModelingTeamTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const next = order[(order.indexOf(task.status) + 1) % order.length];
        return { ...task, status: next };
      }),
    );
    setToast("团队任务状态已推进");
  }

  function saveGoal(values: GoalSettings) {
    setGoalSettings(values);
    setToast("目标设置已保存，分数差距已重新计算");
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as {
        tasks?: StudyTask[];
        mistakes?: MistakeItem[];
        chapters?: Record<string, ChapterItem[]>;
        scores?: ScoreRecord[];
        weekPlan?: WeekPlanDay[];
        modelingTasks?: ModelingTeamTask[];
        goal?: GoalSettings;
      };
      if (!parsed.tasks || !parsed.goal) {
        throw new Error("missing fields");
      }
      setTasks(parsed.tasks);
      if (parsed.mistakes) setMistakeItems(parsed.mistakes);
      if (parsed.chapters) setChapterData(parsed.chapters);
      if (parsed.scores) setScoreRecords(parsed.scores);
      if (parsed.weekPlan) setWeekPlanData(parsed.weekPlan);
      if (parsed.modelingTasks) setModelingTeamTasks(parsed.modelingTasks);
      setGoalSettings(parsed.goal);
      setSelectedTaskId(parsed.tasks[0]?.id ?? initialTasks[0].id);
      setToast("备份已导入，所有页面数据已同步");
    } catch {
      setToast("导入失败：请选择由研途驾驶舱导出的 JSON 文件");
    }
  }

  function exportReport(period: ReportPeriod) {
    const latest = scoreRecords.at(-1);
    const content = [
      `# 研途驾驶舱 ${period}`,
      "",
      `导出时间：${new Date().toLocaleString("zh-CN")}`,
      `目标：${goalSettings.school} · ${goalSettings.targetScore} 分`,
      "",
      "## 核心指标",
      `- 今日任务完成率：${completionRate}%`,
      `- 今日有效学习：${formatMinutes(completedMinutes)}`,
      `- 最近测试总分：${latest?.total ?? "暂无"}`,
      `- 待复习错题：${mistakeItems.filter((item) => !item.reviewed).length} 道`,
      "",
      "## 下一步",
      "- 优先修复专业课复习连续性",
      "- 保持数学限时训练",
      "- 控制数学建模时间占比",
    ].join("\n");
    downloadText(`研途驾驶舱-${period}.md`, content, "text/markdown");
    setToast(`${period}已导出`);
  }

  function exportData() {
    const payload = {
      product: "研途驾驶舱",
      exportedAt: new Date().toISOString(),
      goal: goalSettings,
      tasks,
      mistakes: mistakeItems,
      chapters: chapterData,
      scores: scoreRecords,
      weekPlan: weekPlanData,
      modelingTasks: modelingTeamTasks,
    };
    downloadText(
      "yantu-study-data.json",
      JSON.stringify(payload, null, 2),
      "application/json",
    );
    setToast("学习数据已导出");
  }

  function resetData() {
    setTasks(initialTasks);
    setMistakeItems(initialMistakes);
    setChapterData(cloneChapterData(initialSubjectChapters));
    setScoreRecords(initialScoreRecords);
    setWeekPlanData(cloneWeekPlan(initialWeekPlan));
    setModelingTeamTasks(initialModelingTasks);
    setGoalSettings(initialGoalSettings);
    setNotificationsEnabled(true);
    setSelectedTaskId(initialTasks[0].id);
    window.localStorage.removeItem(STORAGE_KEY);
    setConfirmAction(null);
    setToast("本机学习记录已恢复为示例数据");
  }

  return (
    <main
      className={`study-app ${reducedMotion ? "reduce-motion" : ""}`}
      data-theme={theme}
    >
      <div className={`app-frame ${focusMode ? "focus-active" : ""}`}>
        <Sidebar
          activeView={view}
          countdown={countdown}
          direction={goalSettings.direction}
          mistakeCount={mistakeItems.filter((item) => !item.reviewed).length}
          onNavigate={navigate}
          onToggleTheme={toggleTheme}
          targetScore={goalSettings.targetScore}
          theme={theme}
        />

        <section className="workspace">
          <Topbar
            currentPage={currentPage}
            description={pageDescriptions[view]}
            mobileMenuOpen={mobileMenuOpen}
            notificationsEnabled={notificationsEnabled}
            notificationsOpen={notificationsOpen}
            onAdd={() => setQuickAddOpen(true)}
            onMobileMenu={() => setMobileMenuOpen((current) => !current)}
            onNotification={() => setNotificationsOpen((current) => !current)}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSelectResult={(result) => {
              navigate(result.view);
              if ("taskId" in result && result.taskId) setSelectedTaskId(result.taskId);
              if ("subjectId" in result && result.subjectId) {
                setActiveSubjectId(result.subjectId);
              }
              setSearchQuery("");
            }}
          />

          {mobileMenuOpen ? (
            <MobileMenu activeView={view} onNavigate={navigate} />
          ) : null}

          <div className="page-canvas">
            {view === "overview" ? (
              <OverviewPage
                chartColors={currentColors}
                completedMinutes={completedMinutes}
                completionRate={completionRate}
                countdown={countdown}
                onNavigate={navigate}
                onSelectTask={(taskId) => {
                  setSelectedTaskId(taskId);
                  navigate("today");
                }}
                onStartFocus={startFocus}
                plannedMinutes={plannedMinutes}
                scoreDelta={latestScore.total - previousScore.total}
                subjectData={liveSubjects}
                tasks={tasks}
                targetScore={goalSettings.targetScore}
                theme={theme}
                trendData={liveWeeklyTrend}
                predictedScore={latestScore.total}
              />
            ) : null}

            {view === "today" ? (
              <TodayPage
                onAdd={() => setQuickAddOpen(true)}
                onComplete={(taskId) => setTaskAction({ type: "complete", taskId })}
                onDelay={(taskId) => setTaskAction({ type: "delay", taskId })}
                onDelete={(taskId) =>
                  setConfirmAction({ type: "delete-task", taskId })
                }
                onDrag={reorderTasks}
                onMove={moveTask}
                onSelect={setSelectedTaskId}
                onStartFocus={startFocus}
                selectedTask={selectedTask}
                tasks={tasks}
              />
            ) : null}

            {view === "plan" ? (
              <PlanPage
                activeView={planView}
                days={weekPlanData}
                onAdd={() => setEntryDialog("plan")}
                onViewChange={setPlanView}
              />
            ) : null}

            {view === "subjects" ? (
              <SubjectsPage
                activeSubjectId={activeSubjectId}
                chapters={chapterData}
                expandedGroup={expandedGroup}
                onAddRecord={() => setEntryDialog("study-log")}
                onSelectSubject={setActiveSubjectId}
                onToggleGroup={(group) =>
                  setExpandedGroup((current) => (current === group ? "" : group))
                }
                subjectData={liveSubjects}
              />
            ) : null}

            {view === "mistakes" ? (
              <MistakesPage
                items={mistakeItems}
                onAdd={() => setEntryDialog("mistake")}
                onDelete={(mistakeId) =>
                  setConfirmAction({ type: "delete-mistake", mistakeId })
                }
                onReview={reviewMistake}
              />
            ) : null}

            {view === "scores" ? (
              <ScoresPage
                chartColors={currentColors}
                goal={goalSettings}
                onAdd={() => setEntryDialog("score")}
                onDelete={(scoreId) =>
                  setConfirmAction({ type: "delete-score", scoreId })
                }
                records={scoreRecords}
                theme={theme}
              />
            ) : null}

            {view === "reports" ? (
              <ReportsPage
                chartColors={currentColors}
                completedMinutes={completedMinutes}
                completionRate={completionRate}
                mistakeCount={mistakeItems.filter((item) => !item.reviewed).length}
                onPeriodChange={setReportPeriod}
                onExport={() => exportReport(reportPeriod)}
                period={reportPeriod}
                scoreDelta={latestScore.total - previousScore.total}
                theme={theme}
                trendData={liveWeeklyTrend}
              />
            ) : null}

            {view === "modeling" ? (
              <ModelingPage
                onAdd={() => setEntryDialog("modeling")}
                onAdvance={advanceModelingTask}
                tasks={modelingTeamTasks}
              />
            ) : null}

            {view === "settings" ? (
              <SettingsPage
                goal={goalSettings}
                onExport={exportData}
                onImport={importData}
                onNavigate={navigate}
                onReset={() => setConfirmAction({ type: "reset-data" })}
                onSaveGoal={saveGoal}
                onToggleMotion={() => setReducedMotion((current) => !current)}
                onToggleTheme={toggleTheme}
                onToggleNotifications={() =>
                  setNotificationsEnabled((current) => !current)
                }
                notificationsEnabled={notificationsEnabled}
                reducedMotion={reducedMotion}
                theme={theme}
              />
            ) : null}
          </div>
        </section>

        <MobileBottomNav activeView={view} onNavigate={navigate} />
      </div>

      {focusMode ? (
        <FocusOverlay
          focusNoteOpen={focusNoteOpen}
          onClose={() => {
            setFocusMode(false);
            setFocusRunning(false);
          }}
          onComplete={() => {
            setFocusMode(false);
            setTaskAction({ type: "complete", taskId: selectedTask.id });
          }}
          onReset={() => setFocusSeconds(25 * 60)}
          onToggleNote={() => setFocusNoteOpen((current) => !current)}
          onToggleRunning={() => setFocusRunning((current) => !current)}
          running={focusRunning}
          seconds={focusSeconds}
          task={selectedTask}
        />
      ) : null}

      {quickAddOpen ? (
        <QuickAddDialog onClose={() => setQuickAddOpen(false)} onSubmit={addTask} />
      ) : null}

      {taskAction ? (
        <TaskActionDialog
          action={taskAction.type}
          onClose={() => setTaskAction(null)}
          onComplete={(values) => completeTask(taskAction.taskId, values)}
          onDelay={(reason) => delayTask(taskAction.taskId, reason)}
          task={
            tasks.find((task) => task.id === taskAction.taskId) ?? selectedTask
          }
        />
      ) : null}

      {entryDialog === "plan" ? (
        <PlanEntryDialog
          days={weekPlanData}
          onClose={() => setEntryDialog(null)}
          onSubmit={addPlanItem}
        />
      ) : null}

      {entryDialog === "study-log" ? (
        <StudyRecordDialog
          activeSubjectId={activeSubjectId}
          chapters={chapterData}
          onClose={() => setEntryDialog(null)}
          onSubmit={addStudyRecord}
          subjectData={liveSubjects}
        />
      ) : null}

      {entryDialog === "mistake" ? (
        <MistakeEntryDialog
          onClose={() => setEntryDialog(null)}
          onSubmit={addMistake}
        />
      ) : null}

      {entryDialog === "score" ? (
        <ScoreEntryDialog
          onClose={() => setEntryDialog(null)}
          onSubmit={addScore}
        />
      ) : null}

      {entryDialog === "modeling" ? (
        <ModelingTaskDialog
          onClose={() => setEntryDialog(null)}
          onSubmit={addModelingTask}
        />
      ) : null}

      {confirmAction ? (
        <ConfirmDialog
          description={
            confirmAction.type === "delete-task"
              ? "删除后，该任务的今日记录也会一并移除。"
              : confirmAction.type === "delete-mistake"
                ? "删除后，该题的复习次数与间隔安排也会一并移除。"
                : confirmAction.type === "delete-score"
                  ? "删除后，成绩趋势、预测分与报告指标会立即重新计算。"
                  : "这会清除当前浏览器中的学习记录，并恢复示例数据。"
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === "delete-task") {
              deleteTask(confirmAction.taskId);
            } else if (confirmAction.type === "delete-mistake") {
              deleteMistake(confirmAction.mistakeId);
            } else if (confirmAction.type === "delete-score") {
              deleteScore(confirmAction.scoreId);
            } else {
              resetData();
            }
          }}
          title={
            confirmAction.type === "delete-task"
              ? "确认删除任务？"
              : confirmAction.type === "delete-mistake"
                ? "确认删除错题？"
                : confirmAction.type === "delete-score"
                  ? "确认删除成绩？"
                  : "确认重置数据？"
          }
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      ) : null}
    </main>
  );
}

function Sidebar({
  activeView,
  countdown,
  direction,
  mistakeCount,
  onNavigate,
  onToggleTheme,
  targetScore,
  theme,
}: {
  activeView: ViewId;
  countdown: number;
  direction: string;
  mistakeCount: number;
  onNavigate: (view: ViewId) => void;
  onToggleTheme: () => void;
  targetScore: number;
  theme: Theme;
}) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand-lockup">
        <div className="brand-mark">研</div>
        <div className="brand-copy">
          <strong>研途驾驶舱</strong>
          <span>KAOYAN DASHBOARD</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activeView === item.id ? "active" : ""}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              type="button"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === "mistakes" && mistakeCount ? <small>{mistakeCount}</small> : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="goal-summary">
          <div className="avatar">王</div>
          <div>
            <strong>王进宇</strong>
            <span>{direction} · 目标 {targetScore}</span>
          </div>
        </div>
        <div className="countdown-line">
          <Target size={16} />
          <span>距离初试</span>
          <strong>{countdown} 天</strong>
        </div>
        <button className="theme-toggle" onClick={onToggleTheme} type="button">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          <span>{theme === "light" ? "切换深色模式" : "切换浅色模式"}</span>
        </button>
      </div>
    </aside>
  );
}

type SearchResult = {
  id: string;
  label: string;
  meta: string;
  view: ViewId;
  taskId?: number;
  subjectId?: string;
};

function Topbar({
  currentPage,
  description,
  mobileMenuOpen,
  notificationsEnabled,
  notificationsOpen,
  onAdd,
  onMobileMenu,
  onNotification,
  onSearch,
  onSelectResult,
  searchQuery,
  searchResults,
}: {
  currentPage: (typeof navItems)[number];
  description: string;
  mobileMenuOpen: boolean;
  notificationsEnabled: boolean;
  notificationsOpen: boolean;
  onAdd: () => void;
  onMobileMenu: () => void;
  onNotification: () => void;
  onSearch: (query: string) => void;
  onSelectResult: (result: SearchResult) => void;
  searchQuery: string;
  searchResults: SearchResult[];
}) {
  return (
    <header className="topbar">
      <button
        aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
        className="mobile-menu-button"
        onClick={onMobileMenu}
        type="button"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="page-heading">
        <h1>{currentPage.label}</h1>
        <p>{description}</p>
      </div>
      <div className="topbar-actions">
        <div className="global-search">
          <Search aria-hidden="true" size={17} />
          <input
            aria-label="搜索任务、科目或知识点"
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索任务、科目或知识点"
            value={searchQuery}
          />
          {searchQuery ? (
            <button aria-label="清除搜索" onClick={() => onSearch("")} type="button">
              <X size={15} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
          {searchQuery ? (
            <div className="search-results">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => onSelectResult(result)}
                    type="button"
                  >
                    <span>{result.label}</span>
                    <small>{result.meta}</small>
                  </button>
                ))
              ) : (
                <div className="search-empty">没有匹配的内容</div>
              )}
            </div>
          ) : null}
        </div>
        <span className="today-date">{formatFullDate(new Date())}</span>
        <button className="primary-button quick-add" onClick={onAdd} type="button">
          <Plus size={17} />
          <span>添加任务</span>
        </button>
        <div className="notification-anchor">
          <button
            aria-label="通知提醒"
            className="icon-button"
            onClick={onNotification}
            type="button"
          >
            <Bell size={18} />
            {notificationsEnabled ? <span className="notification-dot" /> : null}
          </button>
          {notificationsOpen ? (
            <div className="notification-panel">
              <div className="popover-heading">
                <strong>学习提醒</strong>
                <span>{notificationsEnabled ? "4 条" : "已关闭"}</span>
              </div>
              {notificationsEnabled ? (
                <>
                  <NotificationItem
                    meta="需要今天处理"
                    text="数据结构连续 6 天未复习"
                    tone="red"
                  />
                  <NotificationItem
                    meta="近两次测试"
                    text="英语阅读正确率下降 6%"
                    tone="yellow"
                  />
                  <NotificationItem
                    meta="时间分配"
                    text="数学建模超过本周预算 20%"
                    tone="yellow"
                  />
                  <NotificationItem
                    meta="间隔复习"
                    text="错题已到复习日期"
                    tone="blue"
                  />
                </>
              ) : (
                <div className="notification-empty">
                  学习提醒已关闭，可在“设置”中重新开启。
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="top-avatar" aria-label="当前用户王进宇">
          王
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  activeView,
  onNavigate,
}: {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <nav className="mobile-menu-panel" aria-label="移动端完整导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={activeView === item.id ? "active" : ""}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({
  activeView,
  onNavigate,
}: {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="移动端快捷导航">
      {navItems
        .filter((item) => mobileNavIds.includes(item.id))
        .map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activeView === item.id ? "active" : ""}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <Icon size={19} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
    </nav>
  );
}

function OverviewPage({
  chartColors: colors,
  completedMinutes,
  completionRate,
  countdown,
  onNavigate,
  onSelectTask,
  onStartFocus,
  plannedMinutes,
  predictedScore,
  scoreDelta,
  subjectData,
  tasks,
  targetScore,
  theme,
  trendData,
}: {
  chartColors: (typeof chartColors)[Theme];
  completedMinutes: number;
  completionRate: number;
  countdown: number;
  onNavigate: (view: ViewId) => void;
  onSelectTask: (taskId: number) => void;
  onStartFocus: (taskId: number) => void;
  plannedMinutes: number;
  predictedScore: number;
  scoreDelta: number;
  subjectData: SubjectSummary[];
  tasks: StudyTask[];
  targetScore: number;
  theme: Theme;
  trendData: typeof weeklyTrend;
}) {
  const activeTasks = tasks.filter((task) => task.status !== "已完成");
  const topTasks = activeTasks.slice(0, 4);
  const currentTask = topTasks[0] ?? tasks[0];

  return (
    <div className="page-stack page-enter overview-page">
      <section className="welcome-band">
        <div>
          <span className="eyebrow">基础准备期 · 第 18 天</span>
          <h2>{greeting()}，王进宇。</h2>
          <p>先完成数据结构错题回炉，再进入高数训练。今天不临时追加新内容。</p>
        </div>
        <div className="welcome-status">
          <div>
            <span>距离 2028 初试</span>
            <strong>{countdown}</strong>
            <small>天</small>
          </div>
          <div>
            <span>连续学习</span>
            <strong>23</strong>
            <small>天</small>
          </div>
          <div className="welcome-date">
            <CalendarDays size={19} />
            <span>{formatShortDate(new Date())}</span>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="核心学习指标">
        <MetricCard
          delta="+12%"
          icon={ListChecks}
          label="今日任务完成率"
          note={`${tasks.filter((task) => task.status === "已完成").length}/${tasks.length} 项已完成`}
          progress={completionRate}
          tone="blue"
          value={`${completionRate}%`}
        />
        <MetricCard
          delta="+2.4h"
          icon={Clock3}
          label="本周有效学习"
          note="计划 42 小时"
          progress={61}
          tone="blue"
          value="25.7h"
        />
        <MetricCard
          delta="-3"
          icon={Activity}
          label="学习健康度"
          note="专业课连续性偏低"
          progress={74}
          tone="yellow"
          value="74"
        />
        <MetricCard
          delta={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`}
          icon={TrendingUp}
          label="当前预测分"
          note={`距离目标还差 ${Math.max(0, targetScore - predictedScore)} 分`}
          progress={Math.round((predictedScore / Math.max(1, targetScore)) * 100)}
          tone="green"
          value={`${predictedScore}`}
        />
        <MetricCard
          delta="+4 天"
          icon={Flame}
          label="连续学习"
          note="近 7 天平均 5.1h"
          progress={77}
          tone="green"
          value="23 天"
        />
        <MetricCard
          delta="+8%"
          icon={Target}
          label="本月目标达成"
          note="还需完成 6 个章节"
          progress={68}
          tone="blue"
          value="68%"
        />
      </section>

      <section className="overview-main dashboard-grid">
        <article className="panel span-7 priority-panel">
          <PanelHeader
            action="查看全部"
            eyebrow="今日关键任务"
            onAction={() => onNavigate("today")}
            title="按学习风险自动排序"
          />
          <div className="home-task-list">
            {topTasks.map((task, index) => (
              <div className={`home-task tone-${priorityTone(task.priority)}`} key={task.id}>
                <button
                  aria-label={`查看任务：${task.title}`}
                  className="task-check"
                  onClick={() => onSelectTask(task.id)}
                  type="button"
                >
                  <Circle size={18} />
                </button>
                <div className="task-index">{String(index + 1).padStart(2, "0")}</div>
                <button
                  className="task-copy-button"
                  onClick={() => onSelectTask(task.id)}
                  type="button"
                >
                  <strong>{task.title}</strong>
                  <span>
                    {task.subject} · {task.chapter} · {formatMinutes(task.plannedMinutes)}
                  </span>
                </button>
                <StatusTag label={task.priority === "高" ? "高优先级" : task.priority} />
                <button
                  aria-label={`开始专注：${task.title}`}
                  className="start-focus-button"
                  onClick={() => onStartFocus(task.id)}
                  title="开始专注"
                  type="button"
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
          <div className="mobile-current-task">
            <span>当前任务</span>
            <strong>{currentTask?.title}</strong>
            <p>今日还剩 {activeTasks.length} 项 · 预计 {formatMinutes(plannedMinutes - completedMinutes)}</p>
            {currentTask ? (
              <button
                className="primary-button"
                onClick={() => onStartFocus(currentTask.id)}
                type="button"
              >
                <Play size={16} fill="currentColor" />
                开始专注
              </button>
            ) : null}
          </div>
        </article>

        <article className="panel span-5 subject-progress-panel">
          <PanelHeader
            action="科目详情"
            eyebrow="科目进度"
            onAction={() => onNavigate("subjects")}
            title="找到最落后的那一科"
          />
          <div className="subject-progress-list">
            {subjectData.map((subject) => (
              <div className="subject-progress-row" key={subject.id}>
                <div className="subject-row-head">
                  <div>
                    <strong>{subject.name}</strong>
                    <span>{subject.stage}</span>
                  </div>
                  <StatusTag label={subject.status} tone={subject.tone} />
                </div>
                <ProgressBar tone={subject.tone} value={subject.progress} />
                <div className="subject-row-foot">
                  <span>{subject.progress}%</span>
                  <span>近 7 天 {subject.weekHours}h</span>
                  <span>测试 {subject.latestScore}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-secondary dashboard-grid">
        <article className="panel span-8 trend-panel">
          <PanelHeader eyebrow="学习趋势" title="最近 7 天有效学习时长" />
          <div className="chart-frame" aria-label="最近七天学习时长折线图">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trendData} margin={{ left: -18, right: 8, top: 14 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 8]}
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltip,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: 8,
                    color: colors.text,
                    boxShadow: theme === "dark" ? "none" : "0 8px 24px rgba(23,32,51,.08)",
                  }}
                />
                <Line
                  activeDot={{ r: 5, strokeWidth: 3, fill: colors.tooltip }}
                  dataKey="hours"
                  dot={{ r: 3, fill: colors.brand, strokeWidth: 0 }}
                  name="有效学习时长"
                  stroke={colors.brand}
                  strokeWidth={2.5}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-summary">
            <Sparkles size={16} />
            本周学习节奏整体稳定，周五出现低谷；建议把专业课固定在每天第一个时段。
          </div>
        </article>

        <article className="panel span-4 risk-panel">
          <PanelHeader eyebrow="风险提醒" title="今天优先处理 4 项" />
          <RiskItem
            label="严重"
            meta="连续 6 天未复习"
            text="数据结构：树与二叉树"
            tone="red"
          />
          <RiskItem
            label="关注"
            meta="连续两次下降"
            text="英语阅读正确率"
            tone="yellow"
          />
          <RiskItem
            label="关注"
            meta="超出计划 20%"
            text="数学建模时间占比"
            tone="yellow"
          />
          <RiskItem
            label="复习"
            meta="8 道已到期"
            text="间隔复习错题"
            tone="blue"
          />
          <button className="secondary-button full-width" onClick={() => onNavigate("reports")} type="button">
            查看调整建议
            <ChevronRight size={16} />
          </button>
        </article>
      </section>
    </div>
  );
}

function TodayPage({
  onAdd,
  onComplete,
  onDelay,
  onDelete,
  onDrag,
  onMove,
  onSelect,
  onStartFocus,
  selectedTask,
  tasks,
}: {
  onAdd: () => void;
  onComplete: (taskId: number) => void;
  onDelay: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onDrag: (sourceId: number, targetId: number) => void;
  onMove: (taskId: number, direction: -1 | 1) => void;
  onSelect: (taskId: number) => void;
  onStartFocus: (taskId: number) => void;
  selectedTask: StudyTask;
  tasks: StudyTask[];
}) {
  const [filter, setFilter] = useState<TaskFilter>("待完成");
  const [subject, setSubject] = useState("全部科目");
  const [priorityOrder, setPriorityOrder] = useState("优先级");
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const visibleTasks = useMemo(() => {
    let next = [...tasks];
    if (filter === "待完成") next = next.filter((task) => task.status !== "已完成");
    if (filter === "进行中") next = next.filter((task) => task.status === "进行中");
    if (filter === "已完成") next = next.filter((task) => task.status === "已完成");
    if (subject !== "全部科目") next = next.filter((task) => task.subject === subject);
    if (priorityOrder === "优先级") {
      const weight: Record<Priority, number> = { 高: 3, 中: 2, 低: 1 };
      next.sort((a, b) => weight[b.priority] - weight[a.priority]);
    }
    if (priorityOrder === "预计时长") {
      next.sort((a, b) => b.plannedMinutes - a.plannedMinutes);
    }
    return next;
  }, [filter, priorityOrder, subject, tasks]);

  function handleDrop(event: DragEvent<HTMLElement>, targetId: number) {
    event.preventDefault();
    if (draggedTaskId) onDrag(draggedTaskId, targetId);
    setDraggedTaskId(null);
  }

  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row">
        <div className="segmented-control" aria-label="任务状态筛选">
          {(["全部", "待完成", "进行中", "已完成"] as TaskFilter[]).map((item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <label className="select-control">
            <Filter size={15} />
            <select
              aria-label="按科目筛选"
              onChange={(event) => setSubject(event.target.value)}
              value={subject}
            >
              <option>全部科目</option>
              <option>数学</option>
              <option>英语</option>
              <option>专业课</option>
              <option>政治</option>
              <option>数学建模</option>
            </select>
          </label>
          <label className="select-control">
            <SlidersHorizontal size={15} />
            <select
              aria-label="任务排序"
              onChange={(event) => setPriorityOrder(event.target.value)}
              value={priorityOrder}
            >
              <option>优先级</option>
              <option>预计时长</option>
              <option>手动排序</option>
            </select>
          </label>
          <button className="secondary-button" onClick={onAdd} type="button">
            <Plus size={16} />
            临时任务
          </button>
        </div>
      </section>

      <section className="today-layout">
        <article className="panel task-list-panel">
          <div className="task-list-summary">
            <div>
              <span className="eyebrow">今日任务</span>
              <h2>{visibleTasks.length} 项待处理</h2>
            </div>
            <div className="planned-time">
              <Clock3 size={16} />
              计划 {formatMinutes(tasks.reduce((sum, task) => sum + task.plannedMinutes, 0))}
            </div>
          </div>
          <div className="detailed-task-list">
            {visibleTasks.length ? (
              visibleTasks.map((task, index) => (
                <article
                  className={`detailed-task ${selectedTask.id === task.id ? "selected" : ""} ${task.status === "已完成" ? "completed" : ""}`}
                  draggable
                  key={task.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDrop={(event) => handleDrop(event, task.id)}
                >
                  <button
                    aria-label={task.status === "已完成" ? "查看完成记录" : "完成任务"}
                    className="task-checkbox"
                    onClick={() => onComplete(task.id)}
                    type="button"
                  >
                    {task.status === "已完成" ? <Check size={15} /> : null}
                  </button>
                  <GripVertical className="drag-handle" size={17} />
                  <button className="detailed-task-copy" onClick={() => onSelect(task.id)} type="button">
                    <div>
                      <strong>{task.title}</strong>
                      {task.overdue ? <StatusTag label="已逾期" tone="red" /> : null}
                    </div>
                    <span>
                      {task.subject} · {task.chapter}
                    </span>
                  </button>
                  <div className="task-duration">
                    <span>计划</span>
                    <strong>{formatMinutes(task.plannedMinutes)}</strong>
                  </div>
                  <StatusTag label={task.priority === "高" ? "高优先级" : `${task.priority}优先级`} />
                  <StatusTag label={task.status} />
                  <div className="task-row-actions">
                    {task.status !== "已完成" ? (
                      <button
                        aria-label="开始专注"
                        className="icon-button primary-icon"
                        onClick={() => onStartFocus(task.id)}
                        title="开始专注"
                        type="button"
                      >
                        <Play size={15} fill="currentColor" />
                      </button>
                    ) : null}
                    <button
                      aria-label="上移任务"
                      className="icon-button subtle-icon"
                      disabled={index === 0}
                      onClick={() => onMove(task.id, -1)}
                      title="上移"
                      type="button"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      aria-label="下移任务"
                      className="icon-button subtle-icon"
                      disabled={index === visibleTasks.length - 1}
                      onClick={() => onMove(task.id, 1)}
                      title="下移"
                      type="button"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      aria-label="延期任务"
                      className="icon-button subtle-icon"
                      onClick={() => onDelay(task.id)}
                      title="延期"
                      type="button"
                    >
                      <CalendarDays size={15} />
                    </button>
                    <button
                      aria-label="删除任务"
                      className="icon-button subtle-icon danger-icon"
                      onClick={() => onDelete(task.id)}
                      title="删除"
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                action="添加一个任务"
                icon={ListChecks}
                onAction={onAdd}
                text="当前筛选条件下没有任务。先添加一个最重要的任务吧。"
                title="今天还很安静"
              />
            )}
          </div>
        </article>

        <aside className="panel focus-sidebar">
          <span className="eyebrow">当前专注</span>
          <h2>{selectedTask.title}</h2>
          <p>{selectedTask.chapter}</p>
          <div className="focus-context">
            <div>
              <span>计划时长</span>
              <strong>{formatMinutes(selectedTask.plannedMinutes)}</strong>
            </div>
            <div>
              <span>掌握程度</span>
              <strong>{selectedTask.mastery ?? 3} / 5</strong>
            </div>
          </div>
          <div className="timer-preview">
            <span>专注计时</span>
            <strong>25:00</strong>
            <div className="timer-ring" aria-hidden="true">
              <Play size={20} fill="currentColor" />
            </div>
          </div>
          <button
            className="primary-button full-width large-button"
            onClick={() => onStartFocus(selectedTask.id)}
            type="button"
          >
            <Focus size={17} />
            进入专注模式
          </button>
          <button
            className="secondary-button full-width"
            onClick={() => onComplete(selectedTask.id)}
            type="button"
          >
            <CheckCircle2 size={17} />
            直接记录完成
          </button>
          <div className="focus-tip">
            <AlertCircle size={16} />
            专注模式会隐藏成绩、倒计时和风险提醒。
          </div>
        </aside>
      </section>
    </div>
  );
}

function PlanPage({
  activeView,
  days,
  onAdd,
  onViewChange,
}: {
  activeView: PlanView;
  days: WeekPlanDay[];
  onAdd: () => void;
  onViewChange: (view: PlanView) => void;
}) {
  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row">
        <div className="segmented-control" aria-label="计划视图">
          {(["stage", "month", "week", "day"] as PlanView[]).map((item) => (
            <button
              className={activeView === item ? "active" : ""}
              key={item}
              onClick={() => onViewChange(item)}
              type="button"
            >
              {{ stage: "阶段", month: "月", week: "周", day: "日" }[item]}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            onClick={() => onViewChange("month")}
            type="button"
          >
            <CalendarDays size={16} />
            2026 年 7 月
          </button>
          <button className="primary-button" onClick={onAdd} type="button">
            <Plus size={16} />
            新建计划
          </button>
        </div>
      </section>

      {activeView === "stage" ? <StagePlan /> : null}
      {activeView === "month" ? <MonthPlan /> : null}
      {activeView === "week" ? <WeekPlan days={days} onAdd={onAdd} /> : null}
      {activeView === "day" ? <DayPlan day={days[3] ?? days[0]} onAdd={onAdd} /> : null}
    </div>
  );
}

function StagePlan() {
  return (
    <section className="plan-stage-layout">
      <article className="panel stage-timeline">
        <PanelHeader eyebrow="全过程时间轴" title="从基础准备到考前冲刺" />
        <div className="stage-list">
          {stages.map((stage, index) => (
            <div className={`stage-item ${index === 0 ? "active" : ""}`} key={stage.id}>
              <div className="stage-marker">
                <span>{index + 1}</span>
              </div>
              <div className="stage-copy">
                <div className="stage-head">
                  <div>
                    <strong>{stage.name}</strong>
                    <span>{stage.date}</span>
                  </div>
                  <StatusTag label={stage.status} tone={index === 0 ? "blue" : "gray"} />
                </div>
                <p>{stage.goal}</p>
                <div className="stage-focus">
                  {stage.focus.map((focus) => (
                    <span key={focus}>{focus}</span>
                  ))}
                </div>
                <ProgressBar tone={index === 0 ? "blue" : "gray"} value={stage.progress} />
              </div>
            </div>
          ))}
        </div>
      </article>
      <aside className="panel stage-overview">
        <span className="eyebrow">当前阶段</span>
        <h2>基础准备期</h2>
        <p>阶段目标完成 61%，整体进度比计划慢 4 天。</p>
        <div className="stage-stat-grid">
          <div>
            <span>计划任务量</span>
            <strong>86</strong>
          </div>
          <div>
            <span>实际完成量</span>
            <strong>52</strong>
          </div>
          <div>
            <span>计划时长</span>
            <strong>188h</strong>
          </div>
          <div>
            <span>实际时长</span>
            <strong>172h</strong>
          </div>
        </div>
        <div className="quality-note">
          <AlertTriangle size={17} />
          <div>
            <strong>当前主要偏差</strong>
            <span>专业课复习间隔过长，并非单纯时长不足。</span>
          </div>
        </div>
      </aside>
    </section>
  );
}

function MonthPlan() {
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  return (
    <article className="panel month-plan">
      <PanelHeader eyebrow="月计划" title="2026 年 7 月 · 基础准备期" />
      <div className="month-week-labels">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <span key={day}>周{day}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => (
          <div className={day === 23 ? "today" : ""} key={day}>
            <span>{day}</span>
            {day % 5 === 0 ? <small>章节测试</small> : null}
            {day % 3 === 0 ? <i /> : null}
          </div>
        ))}
      </div>
      <div className="month-legend">
        <span><i className="legend-dot done" />已完成</span>
        <span><i className="legend-dot planned" />已计划</span>
        <span><i className="legend-dot review" />复习日</span>
      </div>
    </article>
  );
}

function WeekPlan({ days, onAdd }: { days: WeekPlanDay[]; onAdd: () => void }) {
  return (
    <article className="panel week-plan">
      <PanelHeader
        action="添加本周任务"
        eyebrow="周计划"
        onAction={onAdd}
        title={`7月20日 - 7月26日 · 计划 ${days.reduce((sum, day) => sum + day.planned, 0).toFixed(1)} 小时`}
      />
      <div className="week-calendar">
        {days.map((day, index) => (
          <div className={`week-day ${index === 3 ? "today" : ""}`} key={day.day}>
            <div className="week-day-head">
              <div>
                <strong>{day.day}</strong>
                <span>{day.date}</span>
              </div>
              <StatusTag label={day.state} />
            </div>
            <div className="week-time">
              <span>计划 {day.planned}h</span>
              <span>实际 {day.actual || "-"}h</span>
            </div>
            <div className="week-tasks">
              {day.tasks.map((task) => (
                <div key={task}>
                  <Circle size={11} />
                  {task}
                </div>
              ))}
            </div>
            <ProgressBar
              tone={day.actual >= day.planned * 0.9 ? "green" : day.actual ? "yellow" : "gray"}
              value={day.actual ? Math.min(100, Math.round((day.actual / day.planned) * 100)) : 0}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function DayPlan({ day, onAdd }: { day: WeekPlanDay; onAdd: () => void }) {
  const times = ["08:00", "10:10", "14:30", "17:00", "20:00", "21:30"];
  return (
    <section className="day-plan-layout">
      <article className="panel day-schedule">
        <PanelHeader
          action="添加任务"
          eyebrow="日计划"
          onAction={onAdd}
          title={`今天 · ${day?.date ?? "07/23"}`}
        />
        {(day?.tasks ?? []).map((task, index) => (
          <div className="schedule-row" key={`${task}-${index}`}>
            <span>{times[index] ?? `${21 + index}:00`}</span>
            <i />
            <div>
              <strong>{task}</strong>
              <small>本周计划 · 待执行</small>
            </div>
            <button
              aria-label="继续添加计划任务"
              className="icon-button"
              onClick={onAdd}
              title="添加任务"
              type="button"
            >
              <Plus size={17} />
            </button>
          </div>
        ))}
      </article>
      <aside className="panel day-balance">
        <span className="eyebrow">时间预算</span>
        <h2>{formatHours(day?.planned ?? 0)}</h2>
        <p>高认知任务占 68%，建议午后保留一次 20 分钟休息。</p>
        <ProgressLine label="数学" tone="blue" value={33} />
        <ProgressLine label="专业课" tone="red" value={25} />
        <ProgressLine label="英语" tone="green" value={19} />
        <ProgressLine label="政治" tone="yellow" value={11} />
        <ProgressLine label="复盘" tone="gray" value={12} />
      </aside>
    </section>
  );
}

function SubjectsPage({
  activeSubjectId,
  chapters,
  expandedGroup,
  onAddRecord,
  onSelectSubject,
  onToggleGroup,
  subjectData,
}: {
  activeSubjectId: string;
  chapters: Record<string, ChapterItem[]>;
  expandedGroup: string;
  onAddRecord: () => void;
  onSelectSubject: (subjectId: string) => void;
  onToggleGroup: (group: string) => void;
  subjectData: SubjectSummary[];
}) {
  const activeSubject =
    subjectData.find((subject) => subject.id === activeSubjectId) ?? subjectData[0];
  const subjectChapterList = chapters[activeSubject.id] ?? [];
  const grouped = subjectChapterList.reduce<Record<string, ChapterItem[]>>((result, chapter) => {
    result[chapter.group] = [...(result[chapter.group] ?? []), chapter];
    return result;
  }, {});

  return (
    <div className="page-stack page-enter">
      <section className="subject-overview-grid">
        {subjectData.map((subject) => (
          <button
            className={`subject-overview-card ${activeSubjectId === subject.id ? "active" : ""}`}
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            type="button"
          >
            <div>
              <strong>{subject.name}</strong>
              <StatusTag label={subject.status} tone={subject.tone} />
            </div>
            <span>{subject.stage}</span>
            <b>{subject.progress}%</b>
            <ProgressBar tone={subject.tone} value={subject.progress} />
          </button>
        ))}
      </section>

      <section className="panel subject-detail">
        <div className="subject-detail-heading">
          <div>
            <span className="eyebrow">科目详情</span>
            <h2>{activeSubject.name}</h2>
            <p>{activeSubject.stage}</p>
          </div>
          <button className="primary-button" onClick={onAddRecord} type="button">
            <Plus size={16} />
            添加学习记录
          </button>
        </div>
        <div className="subject-detail-metrics">
          <CompactMetric label="总体掌握度" value={`${activeSubject.accuracy}%`} />
          <CompactMetric label="课程完成度" value={`${activeSubject.course}%`} />
          <CompactMetric label="教材完成度" value={`${activeSubject.textbook}%`} />
          <CompactMetric label="习题完成度" value={`${activeSubject.practice}%`} />
          <CompactMetric label="最近测试" value={activeSubject.latestScore} />
          <CompactMetric label="错题数量" value={`${activeSubject.mistakes} 道`} />
          <CompactMetric label="待复习知识点" value={`${activeSubject.reviews} 个`} />
        </div>
      </section>

      <section className="subject-content-layout">
        <article className="panel chapter-tree">
          <PanelHeader eyebrow="章节树" title="学习状态与掌握质量" />
          {Object.entries(grouped).map(([group, items]) => {
            const open = expandedGroup === group;
            const groupProgress = Math.round(
              items.reduce((sum, item) => sum + item.accuracy, 0) / items.length,
            );
            return (
              <div className="chapter-group" key={group}>
                <button className="chapter-group-head" onClick={() => onToggleGroup(group)} type="button">
                  <div>
                    <ChevronDown className={open ? "open" : ""} size={17} />
                    <strong>{group}</strong>
                    <span>{items.length} 个章节</span>
                  </div>
                  <b>{groupProgress}%</b>
                </button>
                {open ? (
                  <div className="chapter-table">
                    <div className="chapter-table-head">
                      <span>章节</span>
                      <span>课程</span>
                      <span>习题</span>
                      <span>正确率</span>
                      <span>最近复习</span>
                      <span>掌握等级</span>
                    </div>
                    {items.map((chapter) => (
                      <div className="chapter-row" key={chapter.id}>
                        <div>
                          <strong>{chapter.name}</strong>
                          <StatusTag label={chapter.status} />
                        </div>
                        <span>{chapter.course}%</span>
                        <span>{chapter.practice}%</span>
                        <span>{chapter.accuracy}%</span>
                        <span>{chapter.lastReview}</span>
                        <div className="mastery-dots" aria-label={`掌握等级 ${chapter.mastery} / 5`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <i className={index < chapter.mastery ? "filled" : ""} key={index} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </article>

        <aside className="panel review-calendar">
          <PanelHeader eyebrow="复习日历" title="近 28 天复习强度" />
          <div className="heatmap" aria-label="近二十八天复习热力图">
            {Array.from({ length: 28 }, (_, index) => (
              <span
                className={`level-${[0, 1, 2, 1, 3, 0, 2][index % 7]}`}
                key={index}
                title={`第 ${index + 1} 天复习强度`}
              />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>少</span>
            {[0, 1, 2, 3].map((level) => (
              <i className={`level-${level}`} key={level} />
            ))}
            <span>多</span>
          </div>
          <div className="review-callout">
            <AlertTriangle size={17} />
            <div>
              <strong>需要恢复连续性</strong>
              <span>该科最近 14 天有 5 个空档，优先缩短复习间隔。</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MistakesPage({
  items,
  onAdd,
  onDelete,
  onReview,
}: {
  items: MistakeItem[];
  onAdd: () => void;
  onDelete: (mistakeId: number) => void;
  onReview: (mistakeId: number, rating: 1 | 2 | 3) => void;
}) {
  const [subjectFilter, setSubjectFilter] = useState("全部科目");
  const [reviewFilter, setReviewFilter] = useState("全部状态");
  const [difficultyFilter, setDifficultyFilter] = useState("全部难度");
  const [sortAscending, setSortAscending] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (subjectFilter !== "全部科目" && item.subject !== subjectFilter) return false;
        if (difficultyFilter !== "全部难度" && item.difficulty !== difficultyFilter) return false;
        if (reviewFilter === "待复习" && item.reviewed) return false;
        if (reviewFilter === "已复习" && !item.reviewed) return false;
        if (reviewFilter === "再次做错" && item.corrected) return false;
        return true;
      }).sort((a, b) =>
        sortAscending
          ? a.reviewCount - b.reviewCount
          : b.reviewCount - a.reviewCount,
      ),
    [difficultyFilter, items, reviewFilter, sortAscending, subjectFilter],
  );
  const current =
    filtered[reviewIndex % Math.max(filtered.length, 1)] ??
    items[0] ??
    initialMistakes[0];

  function rateCurrent(rating: 1 | 2 | 3) {
    onReview(current.id, rating);
    setReviewIndex((index) => (index + 1) % Math.max(filtered.length, 1));
    setAnswerVisible(false);
  }

  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row">
        <div>
          <span className="eyebrow">间隔复习</span>
          <h2 className="toolbar-title">
            今天有 {items.filter((item) => !item.reviewed).length} 道错题到期
          </h2>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button" onClick={onAdd} type="button">
            <Plus size={16} />
            录入错题
          </button>
          <button
            className="primary-button"
            disabled={!filtered.length}
            onClick={() => {
              setReviewIndex(0);
              setAnswerVisible(false);
              setReviewMode(true);
            }}
            type="button"
          >
            <RotateCcw size={16} />
            今日复习模式
          </button>
        </div>
      </section>

      <section className="mistake-layout">
        <aside className="panel mistake-filters">
          <div className="filter-heading">
            <Filter size={17} />
            <strong>筛选错题</strong>
          </div>
          <FilterSelect
            label="科目"
            onChange={setSubjectFilter}
            options={["全部科目", "数学", "英语", "专业课"]}
            value={subjectFilter}
          />
          <FilterSelect
            label="难度"
            onChange={setDifficultyFilter}
            options={["全部难度", "基础", "中等", "困难"]}
            value={difficultyFilter}
          />
          <FilterSelect
            label="复习状态"
            onChange={setReviewFilter}
            options={["全部状态", "待复习", "已复习", "再次做错"]}
            value={reviewFilter}
          />
          <label className="field">
            <span>下次复习日期</span>
            <input type="date" />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setSubjectFilter("全部科目");
              setDifficultyFilter("全部难度");
              setReviewFilter("全部状态");
            }}
            type="button"
          >
            <RotateCcw size={15} />
            重置筛选
          </button>
        </aside>

        <section className="mistake-results">
          <div className="result-header">
            <span>共 {filtered.length} 道错题</span>
            <button
              className="text-button"
              onClick={() => setSortAscending((current) => !current)}
              type="button"
            >
              {sortAscending ? "复习次数少的优先" : "复习次数多的优先"}
              <ChevronDown size={15} />
            </button>
          </div>
          {filtered.length ? (
            filtered.map((item) => (
              <MistakeCard item={item} key={item.id} onDelete={onDelete} />
            ))
          ) : (
            <div className="panel">
              <EmptyState
                action="重置筛选"
                icon={NotebookTabs}
                onAction={() => {
                  setSubjectFilter("全部科目");
                  setDifficultyFilter("全部难度");
                  setReviewFilter("全部状态");
                }}
                text="当前条件下没有错题，调整筛选后再看看。"
                title="暂无匹配的错题"
              />
            </div>
          )}
        </section>
      </section>

      {reviewMode ? (
        <section className="review-mode" role="dialog" aria-modal="true" aria-label="今日错题复习">
          <div className="review-mode-top">
            <div>
              <span>今日错题复习</span>
              <strong>
                {reviewIndex + 1} / {filtered.length || 1}
              </strong>
            </div>
            <button
              aria-label="退出复习模式"
              className="icon-button"
              onClick={() => setReviewMode(false)}
              type="button"
            >
              <X size={19} />
            </button>
          </div>
          <div className="review-question-card">
            <div className="review-question-meta">
              <StatusTag label={current.subject} tone="blue" />
              <span>{current.chapter}</span>
              <span>{current.source}</span>
            </div>
            <h2>{current.question}</h2>
            <textarea aria-label="输入你的答案" placeholder="先独立写下思路或答案，再展开解析…" />
            <button
              className="secondary-button"
              onClick={() => setAnswerVisible((visible) => !visible)}
              type="button"
            >
              {answerVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              {answerVisible ? "收起答案" : "展开答案"}
            </button>
            {answerVisible ? (
              <div className="answer-panel">
                <span>正确答案</span>
                <p>{current.correctAnswer}</p>
                <span>解题方法</span>
                <p>{current.method}</p>
              </div>
            ) : null}
          </div>
          <div className="review-rating">
            <button onClick={() => rateCurrent(1)} type="button">完全不会</button>
            <button onClick={() => rateCurrent(2)} type="button">有些模糊</button>
            <button onClick={() => rateCurrent(3)} type="button">已经掌握</button>
            <button
              className="primary-button"
              onClick={() => {
                setReviewIndex((index) => (index + 1) % Math.max(filtered.length, 1));
                setAnswerVisible(false);
              }}
              type="button"
            >
              下一题
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MistakeCard({
  item,
  onDelete,
}: {
  item: MistakeItem;
  onDelete: (mistakeId: number) => void;
}) {
  return (
    <article className="panel mistake-card">
      <div className="mistake-card-head">
        <div>
          <StatusTag label={item.subject} tone="blue" />
          <StatusTag label={item.difficulty} />
          {!item.reviewed ? <StatusTag label="待复习" tone="yellow" /> : null}
        </div>
        <button
          aria-label={`删除错题：${item.question}`}
          className="icon-button danger-icon"
          onClick={() => onDelete(item.id)}
          title="删除错题"
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <span className="mistake-source">{item.source} · {item.chapter}</span>
      <h3>{item.question}</h3>
      <div className="mistake-answer-grid">
        <div>
          <span>错误原因</span>
          <p>{item.reason}</p>
        </div>
        <div>
          <span>解题思路</span>
          <p>{item.method}</p>
        </div>
      </div>
      <div className="knowledge-tags">
        {item.knowledge.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <footer>
        <span>已复习 {item.reviewCount} 次</span>
        <span>下次复习：{item.nextReview}</span>
        <span>{item.corrected ? "再次作答正确" : "仍需巩固"}</span>
      </footer>
    </article>
  );
}

function ScoresPage({
  chartColors: colors,
  goal,
  onAdd,
  onDelete,
  records,
  theme,
}: {
  chartColors: (typeof chartColors)[Theme];
  goal: GoalSettings;
  onAdd: () => void;
  onDelete: (scoreId: number) => void;
  records: ScoreRecord[];
  theme: Theme;
}) {
  const latest = records.at(-1) ?? initialScoreRecords.at(-1)!;
  const previous = records.at(-2) ?? latest;
  const change = latest.total - previous.total;
  const scoreRatios = [
    { label: "数学", value: latest.math / goal.math },
    { label: "英语", value: latest.english / goal.english },
    { label: "专业课", value: latest.professional / goal.professional },
    { label: "政治", value: latest.politics / goal.politics },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row">
        <div>
          <span className="eyebrow">成绩档案</span>
          <h2 className="toolbar-title">已记录 {records.length} 次测试</h2>
        </div>
        <button className="primary-button" onClick={onAdd} type="button">
          <Plus size={16} />
          录入测试成绩
        </button>
      </section>

      <section className="score-metrics metric-grid">
        <MetricCard delta={`${change >= 0 ? "+" : ""}${change}`} icon={Trophy} label="最近一次总分" note={`${latest.date} · ${latest.title}`} tone="green" value={`${latest.total}`} />
        <MetricCard delta="目标" icon={Target} label="目标分" note={goal.direction} tone="blue" value={`${goal.targetScore}`} />
        <MetricCard delta={`${latest.total - goal.targetScore}`} icon={Flag} label="当前差距" note="录入新成绩后自动重算" tone="yellow" value={`${Math.max(0, goal.targetScore - latest.total)}`} />
        <MetricCard delta={`${change >= 0 ? "+" : ""}${change}`} icon={TrendingUp} label="最近一次变化" note={change >= 0 ? "继续保持当前节奏" : "需要复盘失分原因"} tone={change >= 0 ? "green" : "red"} value={`${change >= 0 ? "+" : ""}${change}`} />
        <MetricCard delta={`${Math.round(scoreRatios[0].value * 100)}%`} icon={BookOpenCheck} label="最接近目标" note="按目标达成率判断" tone="green" value={scoreRatios[0].label} />
        <MetricCard delta={`${Math.round(scoreRatios.at(-1)!.value * 100)}%`} icon={AlertTriangle} label="最需提升" note="优先拆解失分知识点" tone="red" value={scoreRatios.at(-1)!.label} />
      </section>

      <section className="score-layout dashboard-grid">
        <article className="panel span-8 score-trend">
          <PanelHeader eyebrow="核心图表" title="总分与各科成绩趋势" />
          <div className="chart-frame large-chart" aria-label="近五次模拟考试成绩趋势">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={records} margin={{ left: -14, right: 10, top: 18 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[40, 340]}
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltip,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: 8,
                    color: colors.text,
                    boxShadow: theme === "dark" ? "none" : "0 8px 24px rgba(23,32,51,.08)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="total" dot={false} name="总分" stroke={colors.brand} strokeWidth={3} type="monotone" />
                <Line dataKey="math" dot={false} name="数学" stroke={colors.yellow} strokeWidth={1.8} type="monotone" />
                <Line dataKey="english" dot={false} name="英语" stroke={colors.green} strokeWidth={1.8} type="monotone" />
                <Line dataKey="professional" dot={false} name="专业课" stroke={colors.red} strokeWidth={1.8} type="monotone" />
                <Line dataKey="politics" dot={false} name="政治" stroke={colors.muted} strokeWidth={1.8} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="panel span-4 score-gap">
          <PanelHeader eyebrow="目标差距" title="57 分如何拆解" />
          <ScoreGapRow label="数学" target={goal.math} value={latest.math} />
          <ScoreGapRow label="英语" target={goal.english} value={latest.english} />
          <ScoreGapRow label="专业课" target={goal.professional} value={latest.professional} />
          <ScoreGapRow label="政治" target={goal.politics} value={latest.politics} />
          <div className="score-gap-note">
            专业课与数学承担 72% 的提分任务，优先修复高频失分知识点。
          </div>
        </aside>
      </section>

      <section className="score-secondary dashboard-grid">
        <article className="panel span-5">
          <PanelHeader eyebrow="失分知识点" title="本月薄弱点排行" />
          <WeakPoint label="树与二叉树" lost={14} tone="red" />
          <WeakPoint label="定积分应用" lost={11} tone="yellow" />
          <WeakPoint label="计算机存储系统" lost={9} tone="yellow" />
          <WeakPoint label="阅读态度题" lost={6} tone="blue" />
          <WeakPoint label="马原辩证法" lost={5} tone="gray" />
        </article>
        <article className="panel span-4">
          <PanelHeader eyebrow="题型正确率" title="限时作答表现" />
          <ProgressLine label="基础题" tone="green" value={83} />
          <ProgressLine label="综合题" tone="blue" value={67} />
          <ProgressLine label="计算题" tone="yellow" value={59} />
          <ProgressLine label="概念辨析" tone="red" value={48} />
        </article>
        <article className="panel span-3">
          <PanelHeader eyebrow="考试时间" title="时间分配" />
          <TimeAllocation label="数学" minutes={165} total={540} />
          <TimeAllocation label="英语" minutes={150} total={540} />
          <TimeAllocation label="专业课" minutes={175} total={540} />
          <TimeAllocation label="政治" minutes={50} total={540} />
          <div className="time-warning">
            <Clock3 size={16} />
            政治用时偏短，检查是否存在匆忙失分。
          </div>
        </article>
      </section>

      <article className="panel score-history">
        <PanelHeader
          action="继续录入"
          eyebrow="测试记录"
          onAction={onAdd}
          title="每次分数都保留可追溯的复盘"
        />
        <div className="score-history-head">
          <span>测试</span>
          <span>总分</span>
          <span>数学</span>
          <span>英语</span>
          <span>专业课</span>
          <span>政治</span>
          <span />
        </div>
        {[...records].reverse().map((record) => (
          <div className="score-history-row" key={record.id}>
            <div>
              <strong>{record.title}</strong>
              <span>{record.date} · {record.note || "暂无复盘备注"}</span>
            </div>
            <strong>{record.total}</strong>
            <span>{record.math}</span>
            <span>{record.english}</span>
            <span>{record.professional}</span>
            <span>{record.politics}</span>
            <button
              aria-label={`删除成绩：${record.title}`}
              className="icon-button danger-icon"
              onClick={() => onDelete(record.id)}
              title="删除成绩"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </article>
    </div>
  );
}

function ReportsPage({
  chartColors: colors,
  completedMinutes,
  completionRate,
  mistakeCount,
  onExport,
  onPeriodChange,
  period,
  scoreDelta,
  theme,
  trendData,
}: {
  chartColors: (typeof chartColors)[Theme];
  completedMinutes: number;
  completionRate: number;
  mistakeCount: number;
  onExport: () => void;
  onPeriodChange: (period: ReportPeriod) => void;
  period: ReportPeriod;
  scoreDelta: number;
  theme: Theme;
  trendData: typeof weeklyTrend;
}) {
  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row">
        <div className="segmented-control" aria-label="报告周期">
          {(["日报", "周报", "月报", "阶段报告"] as ReportPeriod[]).map((item) => (
            <button
              className={period === item ? "active" : ""}
              key={item}
              onClick={() => onPeriodChange(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <button className="secondary-button" onClick={onExport} type="button">
          <Download size={16} />
          导出 {period}
        </button>
      </section>

      <section className="report-summary-band">
        <div>
          <span className="eyebrow">{period}自动总结</span>
          <h2>学习节奏稳定，但专业课连续性不足</h2>
          <p>
            本周数学任务完成度较高，英语阅读速度改善明显。建议下周将专业课固定在每天第一个学习时段，并削减低收益的建模润色时长。
          </p>
        </div>
        <Sparkles size={28} />
      </section>

      <section className="report-metrics metric-grid four">
        <MetricCard delta="今日" icon={Clock3} label="有效学习" note="来自任务完成记录" tone="green" value={formatMinutes(completedMinutes)} />
        <MetricCard delta={`${completionRate}%`} icon={ListChecks} label="任务完成率" note="随今日打卡实时更新" tone="green" value={`${completionRate}%`} />
        <MetricCard delta={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`} icon={TrendingUp} label="预测分变化" note="来自最近两次测试" tone="blue" value={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta}`} />
        <MetricCard delta={`${mistakeCount} 道`} icon={NotebookTabs} label="错题到期" note="完成复习后自动减少" tone="yellow" value={`${mistakeCount}`} />
      </section>

      <section className="report-layout dashboard-grid">
        <article className="panel span-7">
          <PanelHeader eyebrow="学习时长分布" title="每天投入与计划对比" />
          <div className="chart-frame" aria-label="本周每日学习时长柱状图">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={trendData} margin={{ left: -18, right: 8, top: 14 }}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 4" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: colors.muted, fontSize: 12 }}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    background: colors.tooltip,
                    border: `1px solid ${colors.grid}`,
                    borderRadius: 8,
                    color: colors.text,
                    boxShadow: theme === "dark" ? "none" : "0 8px 24px rgba(23,32,51,.08)",
                  }}
                />
                <Bar dataKey="hours" fill={colors.brand} name="有效学习时长" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel span-5 subject-time-panel">
          <PanelHeader eyebrow="时间去向" title="各科投入占比" />
          <div className="report-donut-row">
            <div className="report-donut" aria-label="科目投入时间占比">
              <div>
                <strong>35.7h</strong>
                <span>总投入</span>
              </div>
            </div>
            <div className="donut-legend">
              <LegendRow color="blue" label="数学" value="32%" />
              <LegendRow color="red" label="专业课" value="24%" />
              <LegendRow color="green" label="英语" value="19%" />
              <LegendRow color="yellow" label="数学建模" value="17%" />
              <LegendRow color="gray" label="政治" value="8%" />
            </div>
          </div>
        </article>
      </section>

      <section className="insight-grid">
        <InsightCard
          icon={TrendingUp}
          label="最大进步"
          text="英语阅读平均用时下降 4 分钟，正确率保持在 71%。"
          tone="green"
        />
        <InsightCard
          icon={AlertTriangle}
          label="最大问题"
          text="专业课出现 5 个复习空档，树与二叉树正确率跌至 38%。"
          tone="red"
        />
        <InsightCard
          icon={Target}
          label="下周优先"
          text="数据结构错题、定积分应用、英语词汇连续性。"
          tone="blue"
        />
        <InsightCard
          icon={ArrowDown}
          label="建议削减"
          text="减少建模论文低收益润色，控制在总时长 15% 内。"
          tone="yellow"
        />
      </section>
    </div>
  );
}

function ModelingPage({
  onAdd,
  onAdvance,
  tasks,
}: {
  onAdd: () => void;
  onAdvance: (taskId: number) => void;
  tasks: ModelingTeamTask[];
}) {
  return (
    <div className="page-stack page-enter">
      <section className="modeling-banner">
        <div>
          <span className="eyebrow">独立训练线</span>
          <h2>数学建模训练</h2>
          <p>保留方法、编程与论文训练，同时守住考研主线时间预算。</p>
        </div>
        <div className="competition-countdown">
          <Trophy size={20} />
          <span>距离模拟赛</span>
          <strong>41 天</strong>
        </div>
      </section>

      <section className="modeling-metrics metric-grid">
        <MetricCard delta="+1.2h" icon={Clock3} label="本周训练时长" note="预算 5 小时" tone="yellow" value="6.1h" />
        <MetricCard delta="+4%" icon={BrainCircuit} label="建模知识掌握" note="评价模型较稳定" tone="green" value="68%" />
        <MetricCard delta="+9%" icon={ListChecks} label="编程训练进度" note="Python 数据处理" tone="blue" value="74%" />
        <MetricCard delta="+3%" icon={FileText} label="论文写作进度" note="摘要仍需巩固" tone="yellow" value="51%" />
        <MetricCard delta="+2" icon={RotateCcw} label="历年赛题训练" note="本月完成 2 次" tone="green" value="7 次" />
        <MetricCard delta={`${tasks.filter((task) => task.status === "已完成").length} 项完成`} icon={Target} label="团队任务" note={`${tasks.filter((task) => task.status === "进行中").length} 项正在进行`} tone="blue" value={`${tasks.length}`} />
      </section>

      <section className="modeling-layout dashboard-grid">
        <article className="panel span-4 modeling-ratio">
          <PanelHeader eyebrow="时间占比" title="本周总学习时间" />
          <div className="modeling-donut">
            <div>
              <strong>17%</strong>
              <span>数学建模</span>
            </div>
          </div>
          <div className="ratio-budget">
            <span>建议上限 15%</span>
            <strong>超出 2%</strong>
          </div>
          <div className="gentle-warning">
            <AlertTriangle size={17} />
            本周建模投入略高，建议周末不再追加论文润色任务。
          </div>
        </article>

        <article className="panel span-4 modeling-progress">
          <PanelHeader eyebrow="能力构成" title="四条训练线" />
          <ProgressLine label="问题分析" tone="green" value={72} />
          <ProgressLine label="模型建立" tone="blue" value={68} />
          <ProgressLine label="编程实现" tone="blue" value={74} />
          <ProgressLine label="论文表达" tone="yellow" value={51} />
          <div className="progress-note">论文表达是当前最明显短板。</div>
        </article>

        <article className="panel span-4 modeling-topic">
          <PanelHeader eyebrow="本周专题" title="评价与决策模型" />
          <div className="topic-list">
            <div><CheckCircle2 size={16} /><span>层次分析法 AHP</span><StatusTag label="已掌握" tone="green" /></div>
            <div><CheckCircle2 size={16} /><span>TOPSIS 综合评价</span><StatusTag label="已完成" tone="blue" /></div>
            <div><Circle size={16} /><span>熵权法组合赋权</span><StatusTag label="学习中" tone="yellow" /></div>
            <div><Circle size={16} /><span>模糊综合评价</span><StatusTag label="未开始" tone="gray" /></div>
          </div>
        </article>
      </section>

      <article className="panel team-task-panel">
        <PanelHeader
          action="添加团队任务"
          eyebrow="协作任务"
          onAction={onAdd}
          title="本周团队推进"
        />
        <div className="team-task-table">
          <div className="team-table-head">
            <span>任务</span>
            <span>负责人</span>
            <span>截止日期</span>
            <span>状态</span>
            <span />
          </div>
          {tasks.map((task) => (
            <div className="team-task-row" key={task.id}>
              <strong>{task.title}</strong>
              <span>{task.owner}</span>
              <span>{task.due}</span>
              <StatusTag label={task.status} />
              <button
                aria-label={`推进团队任务状态：${task.title}`}
                className="icon-button"
                onClick={() => onAdvance(task.id)}
                title="推进状态"
                type="button"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function SettingsPage({
  goal,
  onExport,
  onImport,
  onNavigate,
  onReset,
  onSaveGoal,
  onToggleMotion,
  onToggleNotifications,
  onToggleTheme,
  notificationsEnabled,
  reducedMotion,
  theme,
}: {
  goal: GoalSettings;
  onExport: () => void;
  onImport: (file: File) => void;
  onNavigate: (view: ViewId) => void;
  onReset: () => void;
  onSaveGoal: (goal: GoalSettings) => void;
  onToggleMotion: () => void;
  onToggleNotifications: () => void;
  onToggleTheme: () => void;
  notificationsEnabled: boolean;
  reducedMotion: boolean;
  theme: Theme;
}) {
  const [draft, setDraft] = useState(goal);

  function updateGoal<K extends keyof GoalSettings>(key: K, value: GoalSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="settings-layout page-enter">
      <section className="panel settings-section">
        <PanelHeader eyebrow="目标设置" title="2028 考研 · 网络安全方向" />
        <div className="form-grid">
          <label className="field">
            <span>目标院校</span>
            <input
              onChange={(event) => updateGoal("school", event.target.value)}
              value={draft.school}
            />
          </label>
          <label className="field">
            <span>初试目标分</span>
            <input
              onChange={(event) => updateGoal("targetScore", Number(event.target.value))}
              value={draft.targetScore}
              type="number"
            />
          </label>
          <label className="field">
            <span>考试日期</span>
            <input
              onChange={(event) => updateGoal("examDate", event.target.value)}
              value={draft.examDate}
              type="date"
            />
          </label>
          <label className="field">
            <span>当前阶段</span>
            <select
              onChange={(event) => updateGoal("stage", event.target.value)}
              value={draft.stage}
            >
              <option>基础准备期</option>
              <option>基础学习期</option>
              <option>强化期</option>
              <option>真题期</option>
              <option>冲刺期</option>
            </select>
          </label>
        </div>
        <div className="target-score-grid">
          <label><span>政治</span><input onChange={(event) => updateGoal("politics", Number(event.target.value))} value={draft.politics} type="number" /></label>
          <label><span>英语</span><input onChange={(event) => updateGoal("english", Number(event.target.value))} value={draft.english} type="number" /></label>
          <label><span>数学</span><input onChange={(event) => updateGoal("math", Number(event.target.value))} value={draft.math} type="number" /></label>
          <label><span>专业课</span><input onChange={(event) => updateGoal("professional", Number(event.target.value))} value={draft.professional} type="number" /></label>
        </div>
        <button className="primary-button" onClick={() => onSaveGoal(draft)} type="button">
          <Check size={16} />
          保存目标设置
        </button>
      </section>

      <section className="panel settings-section">
        <PanelHeader eyebrow="界面偏好" title="保持长期使用的舒适度" />
        <SettingRow
          description="跟随你的阅读环境切换完整色彩系统"
          icon={theme === "light" ? Moon : Sun}
          label={theme === "light" ? "深色模式" : "浅色模式"}
        >
          <Toggle checked={theme === "dark"} label="切换主题" onChange={onToggleTheme} />
        </SettingRow>
        <SettingRow
          description="关闭卡片上浮、页面淡入和进度过渡"
          icon={Activity}
          label="减少动画"
        >
          <Toggle checked={reducedMotion} label="减少动画" onChange={onToggleMotion} />
        </SettingRow>
        <SettingRow
          description="任务到期、错题复习和周报生成时提醒"
          icon={Bell}
          label="学习提醒"
        >
          <Toggle
            checked={notificationsEnabled}
            label="学习提醒"
            onChange={onToggleNotifications}
          />
        </SettingRow>
      </section>

      <section className="panel settings-section">
        <PanelHeader eyebrow="数据管理" title="数据只保存在当前浏览器" />
        <p className="settings-description">
          GitHub Pages 版本不会上传个人学习记录。建议每周导出一次 JSON 备份。
        </p>
        <div className="settings-button-row">
          <button className="secondary-button" onClick={onExport} type="button">
            <Download size={16} />
            导出全部数据
          </button>
          <label className="secondary-button file-button">
            <Upload size={16} />
            导入数据备份
            <input
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          <button className="danger-button" onClick={onReset} type="button">
            <Trash2 size={16} />
            重置本机数据
          </button>
        </div>
      </section>

      <section className="panel settings-section mobile-module-links">
        <PanelHeader eyebrow="更多模块" title="继续查看完整学习闭环" />
        <div className="module-link-grid">
          {navItems
            .filter((item) => ["mistakes", "scores", "reports", "modeling"].includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)} type="button">
                  <Icon size={18} />
                  <span>{item.label}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function FocusOverlay({
  focusNoteOpen,
  onClose,
  onComplete,
  onReset,
  onToggleNote,
  onToggleRunning,
  running,
  seconds,
  task,
}: {
  focusNoteOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onReset: () => void;
  onToggleNote: () => void;
  onToggleRunning: () => void;
  running: boolean;
  seconds: number;
  task: StudyTask;
}) {
  return (
    <section className="focus-overlay" role="dialog" aria-modal="true" aria-label="专注学习模式">
      <header>
        <div className="focus-brand">
          <div className="brand-mark">研</div>
          <span>专注模式</span>
        </div>
        <button className="secondary-button" onClick={onClose} type="button">
          <X size={16} />
          退出专注
        </button>
      </header>
      <div className="focus-stage">
        <span className="eyebrow">当前任务</span>
        <h2>{task.title}</h2>
        <p>{task.chapter}</p>
        <div className="focus-time" aria-live="polite">
          {formatClock(seconds)}
        </div>
        <span className="focus-cycle">第 1 个专注周期 · 目标 25 分钟</span>
        <div className="focus-controls">
          <button className="secondary-button focus-control" onClick={onReset} title="重置计时器" type="button">
            <TimerReset size={19} />
          </button>
          <button className="primary-button focus-main-control" onClick={onToggleRunning} type="button">
            {running ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
            {running ? "暂停" : "开始专注"}
          </button>
          <button className="secondary-button focus-control" onClick={onToggleNote} title="记录问题" type="button">
            <NotebookTabs size={19} />
          </button>
        </div>
        {focusNoteOpen ? (
          <textarea className="focus-note" aria-label="记录当前问题" placeholder="记录卡住的问题或需要回看的知识点…" />
        ) : null}
        <button className="text-button finish-focus" onClick={onComplete} type="button">
          <CheckCircle2 size={17} />
          完成任务并记录
        </button>
      </div>
    </section>
  );
}

function QuickAddDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (task: Omit<StudyTask, "id" | "actualMinutes" | "status">) => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("数学");
  const [chapter, setChapter] = useState("");
  const [plannedMinutes, setPlannedMinutes] = useState(60);
  const [priority, setPriority] = useState<Priority>("中");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      subject,
      chapter: chapter.trim() || "临时任务",
      plannedMinutes,
      priority,
    });
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={handleSubmit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">快速添加</span>
            <h2>新建今日任务</h2>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <label className="field">
          <span>任务名称</span>
          <input
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：定积分换元法训练 20 题"
            value={title}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>所属科目</span>
            <select onChange={(event) => setSubject(event.target.value)} value={subject}>
              <option>数学</option>
              <option>英语</option>
              <option>专业课</option>
              <option>政治</option>
              <option>数学建模</option>
            </select>
          </label>
          <label className="field">
            <span>优先级</span>
            <select onChange={(event) => setPriority(event.target.value as Priority)} value={priority}>
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>章节 / 知识点</span>
          <input
            onChange={(event) => setChapter(event.target.value)}
            placeholder="例如：高等数学 / 定积分"
            value={chapter}
          />
        </label>
        <label className="field">
          <span>计划时长（分钟）</span>
          <input
            min="10"
            onChange={(event) => setPlannedMinutes(Number(event.target.value))}
            step="5"
            type="number"
            value={plannedMinutes}
          />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="primary-button" disabled={!title.trim()} type="submit">
            <Plus size={16} />
            添加任务
          </button>
        </div>
      </form>
    </div>
  );
}

function PlanEntryDialog({
  days,
  onClose,
  onSubmit,
}: {
  days: WeekPlanDay[];
  onClose: () => void;
  onSubmit: (values: {
    dayId: number;
    title: string;
    subject: string;
    minutes: number;
    addToToday: boolean;
  }) => void;
}) {
  const [dayId, setDayId] = useState(days[3]?.id ?? days[0]?.id ?? 1);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("数学");
  const [minutes, setMinutes] = useState(60);
  const [addToToday, setAddToToday] = useState(true);

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSubmit({ dayId, title: title.trim(), subject, minutes, addToToday });
        }}
      >
        <ModalHeading eyebrow="计划编排" onClose={onClose} title="新建本周任务" />
        <div className="form-grid">
          <label className="field">
            <span>安排日期</span>
            <select
              onChange={(event) => setDayId(Number(event.target.value))}
              value={dayId}
            >
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.day} · {day.date}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>所属科目</span>
            <select onChange={(event) => setSubject(event.target.value)} value={subject}>
              {["数学", "英语", "专业课", "政治", "数学建模", "复盘"].map(
                (item) => <option key={item}>{item}</option>,
              )}
            </select>
          </label>
        </div>
        <label className="field">
          <span>计划任务</span>
          <input
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：完成定积分应用题 20 题"
            value={title}
          />
        </label>
        <label className="field">
          <span>计划时长（分钟）</span>
          <input
            min="10"
            onChange={(event) => setMinutes(Number(event.target.value))}
            step="5"
            type="number"
            value={minutes}
          />
        </label>
        <label className="check-field">
          <input
            checked={addToToday}
            onChange={(event) => setAddToToday(event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>同时加入今日任务</strong>
            <small>加入后可立即进入专注模式并记录完成质量</small>
          </span>
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="primary-button" disabled={!title.trim()} type="submit">
            <Plus size={16} />
            创建计划
          </button>
        </div>
      </form>
    </div>
  );
}

function StudyRecordDialog({
  activeSubjectId,
  chapters,
  onClose,
  onSubmit,
  subjectData,
}: {
  activeSubjectId: string;
  chapters: Record<string, ChapterItem[]>;
  onClose: () => void;
  onSubmit: (values: {
    subjectId: string;
    chapterId: string;
    minutes: number;
    course: number;
    practice: number;
    accuracy: number;
    mastery: number;
  }) => void;
  subjectData: SubjectSummary[];
}) {
  const firstChapter =
    chapters[activeSubjectId]?.[0] ?? Object.values(chapters).flat()[0];
  const [subjectId, setSubjectId] = useState(activeSubjectId);
  const [chapterId, setChapterId] = useState(firstChapter.id);
  const [minutes, setMinutes] = useState(60);
  const [course, setCourse] = useState(firstChapter.course);
  const [practice, setPractice] = useState(firstChapter.practice);
  const [accuracy, setAccuracy] = useState(firstChapter.accuracy);
  const [mastery, setMastery] = useState(firstChapter.mastery);

  function loadChapter(nextSubjectId: string, nextChapterId: string) {
    const chapter = chapters[nextSubjectId]?.find((item) => item.id === nextChapterId);
    if (!chapter) return;
    setChapterId(chapter.id);
    setCourse(chapter.course);
    setPractice(chapter.practice);
    setAccuracy(chapter.accuracy);
    setMastery(chapter.mastery);
  }

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card modal-wide"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ subjectId, chapterId, minutes, course, practice, accuracy, mastery });
        }}
      >
        <ModalHeading eyebrow="能力更新" onClose={onClose} title="记录一次真实学习" />
        <p className="modal-description">
          填写学习后的状态；保存后会同时更新章节掌握度、科目进度和今日有效时长。
        </p>
        <div className="form-grid">
          <label className="field">
            <span>科目</span>
            <select
              onChange={(event) => {
                const nextSubjectId = event.target.value;
                const nextChapter = chapters[nextSubjectId]?.[0];
                setSubjectId(nextSubjectId);
                if (nextChapter) loadChapter(nextSubjectId, nextChapter.id);
              }}
              value={subjectId}
            >
              {subjectData.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>章节 / 知识点</span>
            <select
              onChange={(event) => loadChapter(subjectId, event.target.value)}
              value={chapterId}
            >
              {(chapters[subjectId] ?? []).map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.group} · {chapter.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>本次有效学习时长（分钟）</span>
          <input
            min="5"
            onChange={(event) => setMinutes(Number(event.target.value))}
            step="5"
            type="number"
            value={minutes}
          />
        </label>
        <div className="record-metrics-grid">
          <PercentField label="课程完成度" onChange={setCourse} value={course} />
          <PercentField label="习题完成度" onChange={setPractice} value={practice} />
          <PercentField label="本次正确率" onChange={setAccuracy} value={accuracy} />
        </div>
        <div className="mastery-input">
          <div>
            <span>掌握程度</span>
            <strong>{mastery} / 5</strong>
          </div>
          <input
            aria-label="掌握程度"
            max="5"
            min="1"
            onChange={(event) => setMastery(Number(event.target.value))}
            type="range"
            value={mastery}
          />
          <div className="mastery-labels">
            <span>完全不会</span>
            <span>熟练掌握</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="success-button" type="submit">
            <Check size={16} />
            保存学习记录
          </button>
        </div>
      </form>
    </div>
  );
}

function MistakeEntryDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    values: Omit<MistakeItem, "id" | "reviewCount" | "reviewed" | "corrected">,
  ) => void;
}) {
  const [subject, setSubject] = useState("数学");
  const [chapter, setChapter] = useState("");
  const [source, setSource] = useState("");
  const [difficulty, setDifficulty] = useState<MistakeItem["difficulty"]>("中等");
  const [question, setQuestion] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("");
  const [knowledge, setKnowledge] = useState("");

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card modal-wide"
        onSubmit={(event) => {
          event.preventDefault();
          if (!question.trim() || !correctAnswer.trim()) return;
          onSubmit({
            subject,
            chapter: chapter.trim() || "待归类",
            source: source.trim() || "手动录入",
            difficulty,
            question: question.trim(),
            wrongAnswer: wrongAnswer.trim() || "未记录",
            correctAnswer: correctAnswer.trim(),
            reason: reason.trim() || "待复盘",
            method: method.trim() || "待整理",
            knowledge: knowledge.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
            nextReview: "明天",
          });
        }}
      >
        <ModalHeading eyebrow="错题录入" onClose={onClose} title="把错误转成下一次得分" />
        <div className="form-grid three">
          <label className="field">
            <span>科目</span>
            <select onChange={(event) => setSubject(event.target.value)} value={subject}>
              {["数学", "英语", "专业课", "政治", "数学建模"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>难度</span>
            <select
              onChange={(event) => setDifficulty(event.target.value as MistakeItem["difficulty"])}
              value={difficulty}
            >
              <option>基础</option>
              <option>中等</option>
              <option>困难</option>
            </select>
          </label>
          <label className="field">
            <span>来源</span>
            <input onChange={(event) => setSource(event.target.value)} placeholder="试卷 / 讲义 / 页码" value={source} />
          </label>
        </div>
        <label className="field">
          <span>章节 / 知识点</span>
          <input onChange={(event) => setChapter(event.target.value)} placeholder="例如：高等数学 / 定积分" value={chapter} />
        </label>
        <label className="field">
          <span>题目</span>
          <textarea autoFocus onChange={(event) => setQuestion(event.target.value)} placeholder="录入题干或关键条件" value={question} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>我的错误答案</span>
            <textarea onChange={(event) => setWrongAnswer(event.target.value)} value={wrongAnswer} />
          </label>
          <label className="field">
            <span>正确答案</span>
            <textarea onChange={(event) => setCorrectAnswer(event.target.value)} value={correctAnswer} />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>错误原因</span>
            <input onChange={(event) => setReason(event.target.value)} placeholder="概念混淆、计算失误…" value={reason} />
          </label>
          <label className="field">
            <span>解题方法</span>
            <input onChange={(event) => setMethod(event.target.value)} placeholder="下次应怎样判断与作答" value={method} />
          </label>
        </div>
        <label className="field">
          <span>关联知识点（逗号分隔）</span>
          <input onChange={(event) => setKnowledge(event.target.value)} placeholder="定积分换元, 复合函数" value={knowledge} />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="primary-button" disabled={!question.trim() || !correctAnswer.trim()} type="submit">
            <Plus size={16} />
            录入并安排复习
          </button>
        </div>
      </form>
    </div>
  );
}

function ScoreEntryDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: Omit<ScoreRecord, "id" | "total">) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("全科模拟");
  const [math, setMath] = useState(90);
  const [english, setEnglish] = useState(65);
  const [professional, setProfessional] = useState(95);
  const [politics, setPolitics] = useState(60);
  const [note, setNote] = useState("");
  const total = math + english + professional + politics;

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            date: formatInputDate(date),
            title: title.trim() || "未命名测试",
            math,
            english,
            professional,
            politics,
            note: note.trim(),
          });
        }}
      >
        <ModalHeading eyebrow="成绩反馈" onClose={onClose} title="录入一次测试成绩" />
        <div className="score-total-preview">
          <span>本次总分</span>
          <strong>{total}</strong>
          <small>保存后会更新预测分与目标差距</small>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>测试名称</span>
            <input onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>
          <label className="field">
            <span>测试日期</span>
            <input onChange={(event) => setDate(event.target.value)} type="date" value={date} />
          </label>
        </div>
        <div className="record-metrics-grid four">
          <NumberField label="数学" max={150} onChange={setMath} value={math} />
          <NumberField label="英语" max={100} onChange={setEnglish} value={english} />
          <NumberField label="专业课" max={150} onChange={setProfessional} value={professional} />
          <NumberField label="政治" max={100} onChange={setPolitics} value={politics} />
        </div>
        <label className="field">
          <span>复盘备注</span>
          <textarea onChange={(event) => setNote(event.target.value)} placeholder="最大失分点、时间分配或下一次调整" value={note} />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="primary-button" type="submit">
            <Check size={16} />
            保存成绩
          </button>
        </div>
      </form>
    </div>
  );
}

function ModelingTaskDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: Omit<ModelingTeamTask, "id" | "status">) => void;
}) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("王进宇");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSubmit({ title: title.trim(), owner: owner.trim() || "待分配", due: formatChineseDate(due) });
        }}
      >
        <ModalHeading eyebrow="建模协作" onClose={onClose} title="添加团队任务" />
        <label className="field">
          <span>任务名称</span>
          <input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="例如：整理评价模型实验结果" value={title} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>负责人</span>
            <input onChange={(event) => setOwner(event.target.value)} value={owner} />
          </label>
          <label className="field">
            <span>截止日期</span>
            <input onChange={(event) => setDue(event.target.value)} type="date" value={due} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="primary-button" disabled={!title.trim()} type="submit">
            <Plus size={16} />
            添加任务
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskActionDialog({
  action,
  onClose,
  onComplete,
  onDelay,
  task,
}: {
  action: "complete" | "delay";
  onClose: () => void;
  onComplete: (values: { actualMinutes: number; mastery: number; hasMistake: boolean }) => void;
  onDelay: (reason: string) => void;
  task: StudyTask;
}) {
  const [actualMinutes, setActualMinutes] = useState(task.actualMinutes || task.plannedMinutes);
  const [mastery, setMastery] = useState(task.mastery ?? 3);
  const [hasMistake, setHasMistake] = useState(task.hasMistake ?? false);
  const [delayReason, setDelayReason] = useState("时间不足");

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (action === "complete") {
            onComplete({ actualMinutes, mastery, hasMistake });
          } else {
            onDelay(delayReason);
          }
        }}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{action === "complete" ? "完成记录" : "任务延期"}</span>
            <h2>{task.title}</h2>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        {action === "complete" ? (
          <>
            <label className="field">
              <span>实际用时（分钟）</span>
              <input
                min="0"
                onChange={(event) => setActualMinutes(Number(event.target.value))}
                type="number"
                value={actualMinutes}
              />
            </label>
            <div className="mastery-input">
              <div>
                <span>掌握程度</span>
                <strong>{mastery} / 5</strong>
              </div>
              <input
                aria-label="掌握程度"
                max="5"
                min="1"
                onChange={(event) => setMastery(Number(event.target.value))}
                type="range"
                value={mastery}
              />
              <div className="mastery-labels">
                <span>完全不会</span>
                <span>熟练掌握</span>
              </div>
            </div>
            <label className="check-field">
              <input
                checked={hasMistake}
                onChange={(event) => setHasMistake(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>产生错题，需要再次复习</strong>
                <small>保存后会进入错题本待整理列表</small>
              </span>
            </label>
          </>
        ) : (
          <>
            <p className="modal-description">
              选择真实原因，系统会在周报中区分执行问题与计划问题。
            </p>
            <label className="field">
              <span>延期原因</span>
              <select onChange={(event) => setDelayReason(event.target.value)} value={delayReason}>
                <option>时间不足</option>
                <option>临时事务</option>
                <option>难度超出预期</option>
                <option>状态不佳</option>
                <option>计划安排不合理</option>
              </select>
            </label>
          </>
        )}
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className={action === "complete" ? "success-button" : "primary-button"} type="submit">
            {action === "complete" ? <Check size={16} /> : <CalendarDays size={16} />}
            {action === "complete" ? "保存完成记录" : "确认延期"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  description,
  onCancel,
  onConfirm,
  title,
}: {
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card compact-modal" role="alertdialog" aria-modal="true">
        <div className="confirm-icon">
          <AlertTriangle size={22} />
        </div>
        <h2>{title}</h2>
        <p className="modal-description">{description}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">取消</button>
          <button className="danger-button filled" onClick={onConfirm} type="button">
            确认操作
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalHeading({
  eyebrow,
  onClose,
  title,
}: {
  eyebrow: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="modal-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <button aria-label="关闭" className="icon-button" onClick={onClose} type="button">
        <X size={18} />
      </button>
    </div>
  );
}

function PercentField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="field metric-field">
      <span>{label}</span>
      <div>
        <input
          max="100"
          min="0"
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <b>%</b>
      </div>
    </label>
  );
}

function NumberField({
  label,
  max,
  onChange,
  value,
}: {
  label: string;
  max: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="field metric-field">
      <span>{label}</span>
      <div>
        <input
          max={max}
          min="0"
          onChange={(event) =>
            onChange(Math.min(max, Math.max(0, Number(event.target.value))))
          }
          type="number"
          value={value}
        />
        <b>/ {max}</b>
      </div>
    </label>
  );
}

function MetricCard({
  delta,
  icon: Icon,
  label,
  note,
  progress,
  tone,
  value,
}: {
  delta: string;
  icon: LucideIcon;
  label: string;
  note: string;
  progress?: number;
  tone: "blue" | "green" | "yellow" | "red";
  value: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-top">
        <span>{label}</span>
        <div className="metric-icon">
          <Icon size={17} />
        </div>
      </div>
      <div className="metric-value-row">
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>
      <p>{note}</p>
      {typeof progress === "number" ? <ProgressBar tone={tone} value={progress} /> : <MiniTrend tone={tone} />}
    </article>
  );
}

function PanelHeader({
  action,
  eyebrow,
  onAction,
  title,
}: {
  action?: string;
  eyebrow: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action ? (
        <button className="text-button" onClick={onAction} type="button">
          {action}
          <ChevronRight size={15} />
        </button>
      ) : null}
    </div>
  );
}

function ProgressBar({
  tone,
  value,
}: {
  tone: string;
  value: number;
}) {
  return (
    <div className={`progress-bar tone-${tone}`} aria-label={`进度 ${value}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function ProgressLine({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <div className="progress-line">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <ProgressBar tone={tone} value={value} />
    </div>
  );
}

function MiniTrend({ tone }: { tone: string }) {
  return (
    <div className={`mini-trend tone-${tone}`} aria-hidden="true">
      {[28, 36, 31, 48, 45, 62, 68].map((height, index) => (
        <span key={index} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function StatusTag({ label, tone }: { label: string; tone?: SubjectSummary["tone"] }) {
  return <span className={`status-tag tone-${tone ?? statusTone(label)}`}>{label}</span>;
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NotificationItem({
  meta,
  text,
  tone,
}: {
  meta: string;
  text: string;
  tone: string;
}) {
  return (
    <div className={`notification-item tone-${tone}`}>
      <i />
      <div>
        <strong>{text}</strong>
        <span>{meta}</span>
      </div>
    </div>
  );
}

function RiskItem({
  label,
  meta,
  text,
  tone,
}: {
  label: string;
  meta: string;
  text: string;
  tone: SubjectSummary["tone"];
}) {
  return (
    <div className={`risk-item tone-${tone}`}>
      <i />
      <div>
        <strong>{text}</strong>
        <span>{meta}</span>
      </div>
      <StatusTag label={label} tone={tone} />
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({
  action,
  icon: Icon,
  onAction,
  text,
  title,
}: {
  action: string;
  icon: LucideIcon;
  onAction: () => void;
  text: string;
  title: string;
}) {
  return (
    <div className="empty-state">
      <div><Icon size={24} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="primary-button" onClick={onAction} type="button">{action}</button>
    </div>
  );
}

function ScoreGapRow({
  label,
  target,
  value,
}: {
  label: string;
  target: number;
  value: number;
}) {
  const gap = target - value;
  return (
    <div className="score-gap-row">
      <div>
        <strong>{label}</strong>
        <span>{value} / {target}</span>
      </div>
      <ProgressBar
        tone={gap > 20 ? "red" : gap > 8 ? "yellow" : "green"}
        value={(value / Math.max(1, target)) * 100}
      />
      <small>差 {gap} 分</small>
    </div>
  );
}

function WeakPoint({
  label,
  lost,
  tone,
}: {
  label: string;
  lost: number;
  tone: string;
}) {
  return (
    <div className="weak-point">
      <div>
        <span>{label}</span>
        <strong>失 {lost} 分</strong>
      </div>
      <ProgressBar tone={tone} value={(lost / 15) * 100} />
    </div>
  );
}

function TimeAllocation({
  label,
  minutes,
  total,
}: {
  label: string;
  minutes: number;
  total: number;
}) {
  return (
    <div className="time-allocation">
      <div>
        <span>{label}</span>
        <strong>{minutes}m</strong>
      </div>
      <ProgressBar tone="blue" value={(minutes / total) * 100} />
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="legend-row">
      <i className={`tone-${color}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
  tone: string;
}) {
  return (
    <article className={`insight-card tone-${tone}`}>
      <div><Icon size={18} /></div>
      <span>{label}</span>
      <p>{text}</p>
    </article>
  );
}

function SettingRow({
  children,
  description,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  description: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="setting-row">
      <div className="setting-icon"><Icon size={18} /></div>
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "checked" : ""}`}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span />
    </button>
  );
}

function statusTone(status: string): SubjectSummary["tone"] {
  if (["已完成", "已掌握", "状态良好", "再次作答正确"].includes(status)) return "green";
  if (["进行中", "学习中", "已排期", "复习"].includes(status)) return "blue";
  if (["需巩固", "需要关注", "部分完成", "待复习", "中优先级"].includes(status)) return "yellow";
  if (["严重落后", "已延期", "已逾期", "已遗忘", "高优先级", "严重"].includes(status)) return "red";
  return "gray";
}

function priorityTone(priority: Priority) {
  if (priority === "高") return "red";
  if (priority === "中") return "yellow";
  return "gray";
}

function cloneChapterData(source: Record<string, ChapterItem[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([subjectId, chapters]) => [
      subjectId,
      chapters.map((chapter) => ({ ...chapter })),
    ]),
  );
}

function cloneWeekPlan(source: WeekPlanDay[]) {
  return source.map((day) => ({ ...day, tasks: [...day.tasks] }));
}

function scoreLabelForSubject(subjectId: string, score: ScoreRecord) {
  if (subjectId === "math") return `${score.math} / 150`;
  if (subjectId === "english") return `${score.english} / 100`;
  if (subjectId === "professional") return `${score.professional} / 150`;
  if (subjectId === "politics") return `${score.politics} / 100`;
  return "独立统计";
}

function chapterStatus(
  mastery: number,
  practice: number,
): ChapterItem["status"] {
  if (mastery >= 5 && practice >= 80) return "已掌握";
  if (mastery >= 4 && practice >= 60) return "已完成";
  if (mastery <= 1 && practice > 0) return "已遗忘";
  if (mastery <= 2 && practice >= 30) return "需巩固";
  if (practice > 0) return "学习中";
  return "未开始";
}

function nextReviewLabel(rating: 1 | 2 | 3) {
  if (rating === 1) return "明天";
  if (rating === 2) return "3 天后";
  return "7 天后";
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} 分钟`;
  if (!rest) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分`;
}

function formatHours(hours: number) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (!whole) return `${minutes} 分钟`;
  if (!minutes) return `${whole} 小时`;
  return `${whole} 小时 ${minutes} 分`;
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function daysUntilExam(examDate: string) {
  const exam = new Date(`${examDate}T00:00:00+08:00`).getTime();
  return Math.max(0, Math.ceil((exam - Date.now()) / 86_400_000));
}

function formatInputDate(date: string) {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function formatChineseDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "上午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(date);
}
