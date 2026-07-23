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
  launchWeekPlan,
  longTermPhases,
  mistakes as initialMistakes,
  modelingTasks as initialModelingTasks,
  monthlyRoadmap,
  scoreTrend as initialScoreRecords,
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
  | { type: "apply-launch-week" }
  | { type: "reset-data" }
  | null;
type NotificationNotice = {
  id: string;
  meta: string;
  text: string;
  tone: "blue" | "yellow" | "red";
};

const STORAGE_KEY = "yantu-dashboard-v5-manual";
const THEME_KEY = "yantu-dashboard-theme";
const LEGACY_STORAGE_KEYS = ["yantu-dashboard-v3", "yantu-dashboard-v4"];
const EMPTY_TASK: StudyTask = {
  id: 0,
  title: "尚未选择任务",
  subject: "未设置",
  chapter: "请先添加今日任务",
  plannedMinutes: 0,
  actualMinutes: 0,
  priority: "中",
  status: "待开始",
};

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
  scores: "从手工录入的分数与复盘中找到有效提分路径",
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
  const [selectedTaskId, setSelectedTaskId] = useState(0);
  const [taskAction, setTaskAction] = useState<TaskAction>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [entryDialog, setEntryDialog] = useState<EntryDialog>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusNoteOpen, setFocusNoteOpen] = useState(false);
  const [planView, setPlanView] = useState<PlanView>("stage");
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

      LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
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
          if (parsed.chapters) setChapterData(cloneChapterData(parsed.chapters));
          if (Array.isArray(parsed.scores)) setScoreRecords(parsed.scores);
          if (Array.isArray(parsed.weekPlan)) {
            setWeekPlanData(cloneWeekPlan(parsed.weekPlan));
          }
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
    tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? EMPTY_TASK;
  const completedTasks = tasks.filter((task) => task.status === "已完成");
  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;
  const plannedMinutes = tasks.reduce((sum, task) => sum + task.plannedMinutes, 0);
  const completedMinutes = completedTasks.reduce(
    (sum, task) => sum + (task.actualMinutes || task.plannedMinutes),
    0,
  );
  const latestScore = scoreRecords.at(-1) ?? null;
  const previousScore = scoreRecords.at(-2) ?? latestScore;
  const liveSubjects = useMemo(
    () =>
      subjects.map((subject) => {
        const chapters = chapterData[subject.id] ?? [];
        if (!chapters.length) return subject;
        const average = (
          field: "course" | "textbook" | "practice" | "accuracy",
        ) =>
          Math.round(
            chapters.reduce(
              (sum, chapter) => sum + Number(chapter[field] ?? 0),
              0,
            ) /
              chapters.length,
          );
        const course = average("course");
        const textbook = average("textbook");
        const practice = average("practice");
        const accuracy = average("accuracy");
        const progress = Math.round(
          course * 0.25 +
            textbook * 0.2 +
            practice * 0.3 +
            accuracy * 0.25,
        );
        const status: SubjectSummary["status"] =
          progress === 0
            ? "尚未开始"
            : progress < 40
            ? "严重落后"
            : progress < 55
              ? "需要关注"
              : "状态良好";
        const tone: SubjectSummary["tone"] =
          status === "尚未开始"
            ? "gray"
            : status === "严重落后"
              ? "red"
              : status === "需要关注"
                ? "yellow"
                : "green";
        const subjectMinutes = tasks
          .filter(
            (task) =>
              task.subject === subject.name && task.status === "已完成",
          )
          .reduce(
            (sum, task) => sum + (task.actualMinutes || task.plannedMinutes),
            0,
          );
        return {
          ...subject,
          stage: goalSettings.stage || subject.stage,
          progress,
          course,
          textbook,
          practice,
          accuracy,
          status,
          tone,
          weekHours: Number((subjectMinutes / 60).toFixed(1)),
          latestScore: scoreLabelForSubject(subject.id, latestScore),
          mistakes: mistakeItems.filter((item) => item.subject === subject.name).length,
          reviews: mistakeItems.filter(
            (item) => item.subject === subject.name && !item.reviewed,
          ).length,
        };
      }),
    [chapterData, goalSettings.stage, latestScore, mistakeItems, tasks],
  );
  const liveWeeklyTrend = weeklyTrend.map((item, index) =>
    index === weeklyTrend.length - 1
      ? {
          ...item,
          hours: Number((completedMinutes / 60).toFixed(1)),
          completion: completionRate,
        }
      : item,
  );
  const currentPage = navItems.find((item) => item.id === view) ?? navItems[0];
  const currentColors = chartColors[theme];
  const countdown = daysUntilExam(goalSettings.examDate);
  const notificationNotices = useMemo<NotificationNotice[]>(() => {
    const notices: NotificationNotice[] = [];
    const overdueCount = tasks.filter((task) => task.overdue).length;
    const pendingMistakes = mistakeItems.filter((item) => !item.reviewed).length;
    if (!goalSettings.examDate || !goalSettings.targetScore) {
      notices.push({
        id: "goal",
        meta: "完成后生成目标差距",
        text: "考研目标尚未设置完整",
        tone: "blue",
      });
    }
    if (overdueCount) {
      notices.push({
        id: "overdue",
        meta: `${overdueCount} 项任务待处理`,
        text: "今日任务存在逾期",
        tone: "red",
      });
    }
    if (pendingMistakes) {
      notices.push({
        id: "mistakes",
        meta: `${pendingMistakes} 道待复习`,
        text: "错题复习队列需要处理",
        tone: "yellow",
      });
    }
    if (
      latestScore &&
      previousScore &&
      latestScore.id !== previousScore.id &&
      latestScore.total < previousScore.total
    ) {
      notices.push({
        id: "score",
        meta: `较上次下降 ${previousScore.total - latestScore.total} 分`,
        text: "最近一次测试成绩下降",
        tone: "yellow",
      });
    }
    return notices;
  }, [
    goalSettings.examDate,
    goalSettings.targetScore,
    latestScore,
    mistakeItems,
    previousScore,
    tasks,
  ]);

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

  function applyLaunchWeekPlan() {
    setWeekPlanData(cloneWeekPlan(launchWeekPlan));
    setPlanView("week");
    setConfirmAction(null);
    setToast("7 月 26 日启动周已载入，实际完成数据仍为 0");
  }

  function requestLaunchWeekPlan() {
    const hasExistingPlan = weekPlanData.some(
      (day) => day.tasks.length || day.planned || day.actual,
    );
    if (hasExistingPlan) {
      setConfirmAction({ type: "apply-launch-week" });
      return;
    }
    applyLaunchWeekPlan();
  }

  function addStudyRecord(values: {
    subjectId: string;
    chapterId: string;
    group: string;
    chapterName: string;
    minutes: number;
    course: number;
    textbook: number;
    practice: number;
    accuracy: number;
    mastery: number;
  }) {
    const existingChapter = chapterData[values.subjectId]?.find(
      (item) => item.id === values.chapterId,
    );
    const subject = subjects.find((item) => item.id === values.subjectId);
    if (!subject) return;
    const chapterName = existingChapter?.name ?? values.chapterName.trim();
    const group = existingChapter?.group ?? values.group.trim();
    if (!chapterName || !group) return;
    const chapterId = existingChapter?.id ?? `${values.subjectId}-${Date.now()}`;
    setChapterData((current) => {
      const currentChapters = current[values.subjectId] ?? [];
      const nextChapter: ChapterItem = {
        id: chapterId,
        group,
        name: chapterName,
        course: values.course,
        textbook: values.textbook,
        practice: values.practice,
        accuracy: values.accuracy,
        mastery: values.mastery,
        lastReview: "今天",
        status: chapterStatus(values.mastery, values.practice),
      };
      return {
        ...current,
        [values.subjectId]: existingChapter
          ? currentChapters.map((item) =>
              item.id === chapterId ? { ...item, ...nextChapter } : item,
            )
          : [...currentChapters, nextChapter],
      };
    });
    const logTask: StudyTask = {
      id: Math.max(0, ...tasks.map((item) => item.id)) + 1,
      title: `学习记录：${chapterName}`,
      subject: subject.name,
      chapter: `${group} / ${chapterName}`,
      plannedMinutes: values.minutes,
      actualMinutes: values.minutes,
      priority: "中",
      status: "已完成",
      mastery: values.mastery,
    };
    setTasks((current) => [...current, logTask]);
    setActiveSubjectId(values.subjectId);
    setExpandedGroup(group);
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
      if (parsed.chapters) setChapterData(cloneChapterData(parsed.chapters));
      if (parsed.scores) setScoreRecords(parsed.scores);
      if (parsed.weekPlan) setWeekPlanData(cloneWeekPlan(parsed.weekPlan));
      if (parsed.modelingTasks) setModelingTeamTasks(parsed.modelingTasks);
      setGoalSettings(parsed.goal);
      setSelectedTaskId(parsed.tasks[0]?.id ?? 0);
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
      `目标：${goalSettings.school || "未设置院校"} · ${
        goalSettings.targetScore
          ? `${goalSettings.targetScore} 分`
          : "未设置目标分"
      }`,
      "",
      "## 核心指标",
      `- 今日任务完成率：${completionRate}%`,
      `- 今日有效学习：${formatMinutes(completedMinutes)}`,
      `- 最近测试总分：${latest?.total ?? "暂无"}`,
      `- 待复习错题：${mistakeItems.filter((item) => !item.reviewed).length} 道`,
      "",
      "## 下一步",
      tasks.find((task) => task.status !== "已完成")
        ? `- 优先完成：${tasks.find((task) => task.status !== "已完成")?.title}`
        : "- 暂无待完成任务",
      mistakeItems.some((item) => !item.reviewed)
        ? `- 复习 ${mistakeItems.filter((item) => !item.reviewed).length} 道到期错题`
        : "- 暂无待复习错题",
      latest
        ? "- 根据最近一次测试备注安排下一轮任务"
        : "- 录入第一次测试成绩，建立成绩基线",
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
    setSelectedTaskId(0);
    window.localStorage.removeItem(STORAGE_KEY);
    setConfirmAction(null);
    setToast("本机学习记录已全部清空");
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
            notices={notificationNotices}
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
                mistakeCount={mistakeItems.filter((item) => !item.reviewed).length}
                onNavigate={navigate}
                onSelectTask={(taskId) => {
                  setSelectedTaskId(taskId);
                  navigate("today");
                }}
                onStartFocus={startFocus}
                plannedMinutes={plannedMinutes}
                hasScore={Boolean(latestScore)}
                scoreDelta={
                  latestScore && previousScore
                    ? latestScore.total - previousScore.total
                    : 0
                }
                subjectData={liveSubjects}
                tasks={tasks}
                targetScore={goalSettings.targetScore}
                theme={theme}
                trendData={liveWeeklyTrend}
                predictedScore={latestScore?.total ?? 0}
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
                currentStage={goalSettings.stage}
                days={weekPlanData}
                onAdd={() => setEntryDialog("plan")}
                onApplyLaunchWeek={requestLaunchWeekPlan}
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
                onOpenSettings={() => navigate("settings")}
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
                onStart={() => navigate("today")}
                period={reportPeriod}
                scoreCount={scoreRecords.length}
                scoreDelta={
                  latestScore && previousScore
                    ? latestScore.total - previousScore.total
                    : 0
                }
                theme={theme}
                trendData={liveWeeklyTrend}
                tasks={tasks}
              />
            ) : null}

            {view === "modeling" ? (
              <ModelingPage
                chapters={chapterData.modeling ?? []}
                onAdd={() => setEntryDialog("modeling")}
                onAdvance={advanceModelingTask}
                studyMinutes={completedTasks
                  .filter((task) => task.subject === "数学建模")
                  .reduce(
                    (sum, task) =>
                      sum + (task.actualMinutes || task.plannedMinutes),
                    0,
                  )}
                summary={
                  liveSubjects.find((subject) => subject.id === "modeling") ??
                  subjects[4]
                }
                tasks={modelingTeamTasks}
                totalStudyMinutes={completedMinutes}
              />
            ) : null}

            {view === "settings" ? (
              <SettingsPage
                goal={goalSettings}
                key={`${goalSettings.school}-${goalSettings.direction}-${goalSettings.targetScore}-${goalSettings.examDate}-${goalSettings.stage}`}
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
                  : confirmAction.type === "apply-launch-week"
                    ? "这会用 7 月 26 日启动周替换当前周计划。计划时长会写入，实际时长与完成状态仍保持为 0。"
                  : "这会清除当前浏览器中的全部学习记录，操作不可撤销。"
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === "delete-task") {
              deleteTask(confirmAction.taskId);
            } else if (confirmAction.type === "delete-mistake") {
              deleteMistake(confirmAction.mistakeId);
            } else if (confirmAction.type === "delete-score") {
              deleteScore(confirmAction.scoreId);
            } else if (confirmAction.type === "apply-launch-week") {
              applyLaunchWeekPlan();
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
                : confirmAction.type === "apply-launch-week"
                  ? "载入 7 月 26 日启动周？"
                  : "确认清空数据？"
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
            <span>
              {direction || "方向未设置"} ·{" "}
              {targetScore ? `目标 ${targetScore}` : "目标未设置"}
            </span>
          </div>
        </div>
        <div className="countdown-line">
          <Target size={16} />
          <span>距离初试</span>
          <strong>{countdown ? `${countdown} 天` : "未设置"}</strong>
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
  notices,
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
  notices: NotificationNotice[];
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
        <button
          aria-label="添加任务"
          className="primary-button quick-add"
          onClick={onAdd}
          type="button"
        >
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
            {notificationsEnabled && notices.length ? (
              <span className="notification-dot" />
            ) : null}
          </button>
          {notificationsOpen ? (
            <div className="notification-panel">
              <div className="popover-heading">
                <strong>学习提醒</strong>
                <span>
                  {notificationsEnabled ? `${notices.length} 条` : "已关闭"}
                </span>
              </div>
              {notificationsEnabled ? (
                notices.length ? (
                  notices.map((notice) => (
                    <NotificationItem
                      key={notice.id}
                      meta={notice.meta}
                      text={notice.text}
                      tone={notice.tone}
                    />
                  ))
                ) : (
                  <div className="notification-empty">
                    当前没有提醒。录入任务、错题或成绩后会自动检查。
                  </div>
                )
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
  hasScore,
  mistakeCount,
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
  hasScore: boolean;
  mistakeCount: number;
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
  const completedTaskCount = tasks.filter(
    (task) => task.status === "已完成",
  ).length;
  const topTasks = activeTasks.slice(0, 4);
  const currentTask = topTasks[0] ?? tasks[0];
  const weeklyHours = Number(
    trendData.reduce((sum, item) => sum + item.hours, 0).toFixed(1),
  );
  const weakestSubject = subjectData
    .filter((subject) => subject.progress > 0)
    .sort((a, b) => a.progress - b.progress)[0];
  const overdueCount = tasks.filter((task) => task.overdue).length;
  const hasRisk = overdueCount > 0 || mistakeCount > 0 || Boolean(weakestSubject);

  return (
    <div className="page-stack page-enter overview-page">
      <section className="welcome-band">
        <div>
          <span className="eyebrow">
            {targetScore > 0 ? "目标已设置 · 今天从最重要的一项开始" : "首次使用 · 先设置考研目标"}
          </span>
          <h2>{greeting()}，王进宇。</h2>
          <p>
            {tasks.length
              ? `今天有 ${activeTasks.length} 项任务待完成，所有指标都来自你的实际记录。`
              : "当前没有学习数据。设置目标并添加第一个任务后，这里会生成你的真实进度。"}
          </p>
        </div>
        <div className="welcome-status">
          <div>
            <span>距离初试</span>
            <strong>{countdown || "--"}</strong>
            <small>{countdown ? "天" : "未设置"}</small>
          </div>
          <div>
            <span>连续学习</span>
            <strong>--</strong>
            <small>等待记录</small>
          </div>
          <div className="welcome-date">
            <CalendarDays size={19} />
            <span>{formatShortDate(new Date())}</span>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="核心学习指标">
        <MetricCard
          delta={tasks.length ? `${completedTaskCount} 项完成` : "暂无"}
          icon={ListChecks}
          label="今日任务完成率"
          note={`${tasks.filter((task) => task.status === "已完成").length}/${tasks.length} 项已完成`}
          progress={completionRate}
          tone="blue"
          value={`${completionRate}%`}
        />
        <MetricCard
          delta="本周"
          icon={Clock3}
          label="本周有效学习"
          note={weeklyHours ? "来自任务完成记录" : "完成任务后开始统计"}
          progress={0}
          tone="blue"
          value={`${weeklyHours}h`}
        />
        <MetricCard
          delta="待生成"
          icon={Activity}
          label="学习健康度"
          note="积累任务、成绩和复习数据后生成"
          progress={0}
          tone="blue"
          value="--"
        />
        <MetricCard
          delta={hasScore ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}` : "暂无"}
          icon={TrendingUp}
          label="当前预测分"
          note={
            hasScore && targetScore
              ? `距离目标还差 ${Math.max(0, targetScore - predictedScore)} 分`
              : "录入第一次测试成绩后生成"
          }
          progress={
            hasScore && targetScore > 0
              ? Math.round((predictedScore / Math.max(1, targetScore)) * 100)
              : 0
          }
          tone="green"
          value={hasScore ? `${predictedScore}` : "--"}
        />
        <MetricCard
          delta="暂无"
          icon={Flame}
          label="连续学习"
          note="完成第一个任务后开始记录"
          progress={0}
          tone="blue"
          value="--"
        />
        <MetricCard
          delta="暂无"
          icon={Target}
          label="本月目标达成"
          note="添加月计划后开始计算"
          progress={0}
          tone="blue"
          value="--"
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
            {topTasks.length ? topTasks.map((task, index) => (
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
            )) : (
              <EmptyState
                action="添加今日任务"
                icon={ListChecks}
                onAction={() => onNavigate("today")}
                text="这里会按优先级展示你人工录入的任务。"
                title="还没有今日任务"
              />
            )}
          </div>
          <div className="mobile-current-task">
            <span>当前任务</span>
            <strong>{currentTask?.title ?? "尚未添加任务"}</strong>
            <p>
              今日还剩 {activeTasks.length} 项 · 预计{" "}
              {formatMinutes(Math.max(0, plannedMinutes - completedMinutes))}
            </p>
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
            {weeklyHours
              ? "趋势只统计已完成任务的实际时长。继续记录后，可用于周报复盘。"
              : "暂无学习时长数据。完成第一个任务后，这里会生成真实趋势。"}
          </div>
        </article>

        <article className="panel span-4 risk-panel">
          <PanelHeader
            eyebrow="风险提醒"
            title={hasRisk ? "根据当前记录生成" : "暂无风险数据"}
          />
          {overdueCount ? (
            <RiskItem
              label="逾期"
              meta={`${overdueCount} 项任务需要处理`}
              text="今日任务存在逾期"
              tone="red"
            />
          ) : null}
          {mistakeCount ? (
            <RiskItem
              label="复习"
              meta={`${mistakeCount} 道待复习`}
              text="错题复习队列"
              tone="yellow"
            />
          ) : null}
          {weakestSubject ? (
            <RiskItem
              label="关注"
              meta={`当前进度 ${weakestSubject.progress}%`}
              text={`${weakestSubject.name}进度最低`}
              tone="yellow"
            />
          ) : null}
          {!hasRisk ? (
            <div className="risk-empty">
              <CheckCircle2 size={20} />
              <strong>等待真实数据</strong>
              <span>录入任务、错题或章节进度后自动识别风险。</span>
            </div>
          ) : null}
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
          {selectedTask.id ? (
            <>
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
                  <strong>
                    {selectedTask.mastery
                      ? `${selectedTask.mastery} / 5`
                      : "待记录"}
                  </strong>
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
            </>
          ) : (
            <EmptyState
              action="添加第一个任务"
              icon={Focus}
              onAction={onAdd}
              text="选择任务后，这里会显示计时器和完成记录入口。"
              title="尚未选择专注任务"
            />
          )}
        </aside>
      </section>
    </div>
  );
}

function PlanPage({
  activeView,
  currentStage,
  days,
  onAdd,
  onApplyLaunchWeek,
  onViewChange,
}: {
  activeView: PlanView;
  currentStage: string;
  days: WeekPlanDay[];
  onAdd: () => void;
  onApplyLaunchWeek: () => void;
  onViewChange: (view: PlanView) => void;
}) {
  const currentDay =
    days.find((day) => day.date === formatMonthDay(new Date())) ??
    days[0] ??
    createCurrentWeekPlan()[0];

  return (
    <div className="page-stack page-enter">
      <section className="toolbar-row plan-toolbar">
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
          <span className="plan-range-label">
            <CalendarRange size={16} />
            2026.07.26 - 2027.12
          </span>
          <button className="secondary-button" onClick={onApplyLaunchWeek} type="button">
            <CalendarDays size={16} />
            载入启动周
          </button>
          <button className="primary-button" onClick={onAdd} type="button">
            <Plus size={16} />
            新建计划
          </button>
        </div>
      </section>

      {activeView === "stage" ? <StagePlan currentStage={currentStage} /> : null}
      {activeView === "month" ? <MonthPlan /> : null}
      {activeView === "week" ? <WeekPlan days={days} onAdd={onAdd} /> : null}
      {activeView === "day" ? <DayPlan day={currentDay} onAdd={onAdd} /> : null}
    </div>
  );
}

function StagePlan({ currentStage }: { currentStage: string }) {
  const today = new Date();
  const activePhase =
    longTermPhases.find(
      (phase) =>
        today >= new Date(`${phase.start}T00:00:00+08:00`) &&
        today <= new Date(`${phase.end}T23:59:59+08:00`),
    ) ??
    longTermPhases.find(
      (phase) => today < new Date(`${phase.start}T00:00:00+08:00`),
    ) ??
    longTermPhases.at(-1);
  const [selectedPhaseId, setSelectedPhaseId] = useState(
    activePhase?.id ?? longTermPhases[0].id,
  );
  const selectedPhase =
    longTermPhases.find((phase) => phase.id === selectedPhaseId) ??
    longTermPhases[0];

  return (
    <section className="plan-stage-layout">
      <article className="panel stage-timeline">
        <PanelHeader
          eyebrow="28 届全过程路线"
          title="2026 年 7 月 26 日起步 · 2027 年 12 月下旬初试"
        />
        <div className="plan-template-note">
          <CalendarRange size={17} />
          <div>
            <strong>这是一条可执行的计划路线，不是完成记录</strong>
            <span>初试具体日期待教育部公布；所有实际时长、正确率和完成率仍由你手工录入。</span>
          </div>
        </div>
        <div className="stage-list">
          {longTermPhases.map((phase, index) => {
            const phaseStatus = getPhaseStatus(phase.start, phase.end);
            return (
              <button
                aria-pressed={selectedPhase.id === phase.id}
                className={`stage-item ${
                  selectedPhase.id === phase.id ? "active" : ""
                }`}
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                type="button"
              >
                <div className="stage-marker">
                  <span>{index + 1}</span>
                </div>
                <div className="stage-copy">
                  <div className="stage-head">
                    <div>
                      <strong>{phase.name}</strong>
                      <span>{phase.date} · 每周 {phase.weeklyHours}</span>
                    </div>
                    <StatusTag
                      label={phaseStatus.label}
                      tone={phaseStatus.tone}
                    />
                  </div>
                  <p>{phase.goal}</p>
                  <div className="stage-focus">
                    {phase.focus.map((focus) => (
                      <span key={focus}>{focus}</span>
                    ))}
                  </div>
                  <div className="stage-milestone">
                    <Flag size={13} />
                    阶段验收：{phase.deliverables.join("、")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </article>
      <aside className="panel stage-overview">
        <span className="eyebrow">已选计划阶段</span>
        <h2>{selectedPhase.name}</h2>
        <div className="stage-date-line">
          <CalendarDays size={15} />
          {selectedPhase.date}
        </div>
        <p>{selectedPhase.goal}</p>
        <div className="stage-stat-grid">
          <div>
            <span>建议周投入</span>
            <strong>{selectedPhase.weeklyHours}</strong>
          </div>
          <div>
            <span>核心方向</span>
            <strong>{selectedPhase.focus.length} 项</strong>
          </div>
          <div>
            <span>阶段验收</span>
            <strong>{selectedPhase.deliverables.length} 项</strong>
          </div>
          <div>
            <span>数据来源</span>
            <strong>手工记录</strong>
          </div>
        </div>
        <div className="stage-deliverables">
          <strong>完成本阶段时应拿到</strong>
          {selectedPhase.deliverables.map((item) => (
            <span key={item}>
              <Check size={13} />
              {item}
            </span>
          ))}
        </div>
        <div className="quality-note">
          <BrainCircuit size={17} />
          <div>
            <strong>数学建模时间边界</strong>
            <span>{selectedPhase.modelingLimit}</span>
          </div>
        </div>
        <div className="current-stage-setting">
          设置中的当前阶段：{currentStage || "尚未手工标记"}
        </div>
      </aside>
    </section>
  );
}

function MonthPlan() {
  const [roadmapYear, setRoadmapYear] = useState<2026 | 2027>(2026);
  const [selectedMonthId, setSelectedMonthId] = useState("2026-07");
  const visibleMonths = monthlyRoadmap.filter((month) => month.year === roadmapYear);
  const selectedMonth =
    monthlyRoadmap.find((month) => month.id === selectedMonthId) ??
    visibleMonths[0];

  function selectYear(year: 2026 | 2027) {
    setRoadmapYear(year);
    setSelectedMonthId(
      monthlyRoadmap.find((month) => month.year === year)?.id ?? monthlyRoadmap[0].id,
    );
  }

  return (
    <section className="month-roadmap-layout">
      <article className="panel roadmap-panel">
        <div className="roadmap-heading">
          <PanelHeader
            eyebrow="18 个月月度路线"
            title="每月只保留一个主目标和一次验收"
          />
          <div className="segmented-control compact-control" aria-label="路线年份">
            {([2026, 2027] as const).map((year) => (
              <button
                className={roadmapYear === year ? "active" : ""}
                key={year}
                onClick={() => selectYear(year)}
                type="button"
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="month-roadmap-list">
          {visibleMonths.map((month) => (
            <button
              aria-pressed={selectedMonth.id === month.id}
              className={`month-roadmap-row ${
                selectedMonth.id === month.id ? "active" : ""
              }`}
              key={month.id}
              onClick={() => setSelectedMonthId(month.id)}
              type="button"
            >
              <div className="roadmap-month">
                <strong>{month.label.replace(`${month.year} 年 `, "")}</strong>
                <span>{month.range}</span>
              </div>
              <div className="roadmap-summary">
                <span>{month.phase}</span>
                <strong>{month.headline}</strong>
              </div>
              <div className="roadmap-hours">
                <Clock3 size={14} />
                {month.weeklyHours}
              </div>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </article>

      <aside className="panel roadmap-detail">
        <span className="eyebrow">月度执行单</span>
        <h2>{selectedMonth.label}</h2>
        <StatusTag label={selectedMonth.phase} tone="blue" />
        <p>{selectedMonth.headline}</p>
        <div className="roadmap-detail-meta">
          <span>
            <CalendarDays size={14} />
            {selectedMonth.range}
          </span>
          <span>
            <Clock3 size={14} />
            每周 {selectedMonth.weeklyHours}
          </span>
        </div>
        <div className="roadmap-focus-list">
          <strong>本月重点</strong>
          {selectedMonth.focus.map((item) => (
            <span key={item}>
              <Check size={13} />
              {item}
            </span>
          ))}
        </div>
        <div className="roadmap-weeks">
          <strong>按周推进</strong>
          {selectedMonth.weeks.map((week, index) => (
            <div key={week}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{week}</p>
            </div>
          ))}
        </div>
        <div className="roadmap-deliverable">
          <Flag size={16} />
          <div>
            <strong>月底验收</strong>
            <span>{selectedMonth.deliverable}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}

function WeekPlan({ days, onAdd }: { days: WeekPlanDay[]; onAdd: () => void }) {
  const dateRange = days.length
    ? `${days[0].date} - ${days.at(-1)?.date}`
    : "本周";
  return (
    <article className="panel week-plan">
      <PanelHeader
        action="添加本周任务"
        eyebrow="周计划"
        onAction={onAdd}
        title={`${dateRange} · 计划 ${days.reduce((sum, day) => sum + day.planned, 0).toFixed(1)} 小时`}
      />
      <div className="week-calendar">
        {days.map((day) => (
          <div
            className={`week-day ${day.date === formatMonthDay(new Date()) ? "today" : ""}`}
            key={day.id}
          >
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
              {day.tasks.length ? (
                day.tasks.map((task, index) => (
                  <div key={`${task}-${index}`}>
                    <Circle size={11} />
                    {task}
                  </div>
                ))
              ) : (
                <span className="week-empty-copy">暂无计划</span>
              )}
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
          title={`今天 · ${day.date}`}
        />
        {day.tasks.length ? (
          day.tasks.map((task, index) => (
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
          ))
        ) : (
          <EmptyState
            action="添加今日计划"
            icon={CalendarDays}
            onAction={onAdd}
            text="今日时间轴会按你录入的计划逐项展开。"
            title="今天还没有计划"
          />
        )}
      </article>
      <aside className="panel day-balance">
        <span className="eyebrow">时间预算</span>
        <h2>{formatHours(day.planned)}</h2>
        <p>
          {day.tasks.length
            ? `已安排 ${day.tasks.length} 项任务，完成后将显示实际投入与偏差。`
            : "录入计划后，这里会汇总计划时长、实际时长和完成偏差。"}
        </p>
        <ProgressLine
          label="已完成时长"
          tone={day.actual >= day.planned && day.planned ? "green" : "blue"}
          value={
            day.planned
              ? Math.min(100, Math.round((day.actual / day.planned) * 100))
              : 0
          }
        />
        <div className="stage-stat-grid compact">
          <div><span>计划</span><strong>{formatHours(day.planned)}</strong></div>
          <div><span>实际</span><strong>{formatHours(day.actual)}</strong></div>
        </div>
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
  const reviewLevel = Math.min(3, subjectChapterList.length);

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
          <CompactMetric label="总体掌握度" value={`${activeSubject.progress}%`} />
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
          {Object.keys(grouped).length ? (
            Object.entries(grouped).map(([group, items]) => {
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
                        <span>教材</span>
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
                          <span>{chapter.textbook ?? 0}%</span>
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
            })
          ) : (
            <EmptyState
              action="添加学习记录"
              icon={BookOpenCheck}
              onAction={onAddRecord}
              text="手工填写章节、完成度、正确率和掌握等级后生成科目进度。"
              title={`${activeSubject.name}还没有章节记录`}
            />
          )}
        </article>

        <aside className="panel review-calendar">
          <PanelHeader eyebrow="复习日历" title="近 28 天复习强度" />
          <div className="heatmap" aria-label="近二十八天复习热力图">
            {Array.from({ length: 28 }, (_, index) => (
              <span
                className={`level-${index === 27 ? reviewLevel : 0}`}
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
            {subjectChapterList.length ? (
              <CheckCircle2 size={17} />
            ) : (
              <CalendarDays size={17} />
            )}
            <div>
              <strong>
                {subjectChapterList.length ? "已记录本次学习" : "暂无复习记录"}
              </strong>
              <span>
                {subjectChapterList.length
                  ? `当前共有 ${subjectChapterList.length} 个章节记录，继续录入可形成复习轨迹。`
                  : "添加第一条学习记录后，复习日历会从当天开始累积。"}
              </span>
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
    null;

  function rateCurrent(rating: 1 | 2 | 3) {
    if (!current) return;
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

      {reviewMode && current ? (
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
  onOpenSettings,
  records,
  theme,
}: {
  chartColors: (typeof chartColors)[Theme];
  goal: GoalSettings;
  onAdd: () => void;
  onDelete: (scoreId: number) => void;
  onOpenSettings: () => void;
  records: ScoreRecord[];
  theme: Theme;
}) {
  const latest = records.at(-1) ?? null;
  if (!latest) {
    return (
      <div className="page-stack page-enter">
        <section className="toolbar-row">
          <div>
            <span className="eyebrow">成绩档案</span>
            <h2 className="toolbar-title">已记录 0 次测试</h2>
          </div>
          <button className="primary-button" onClick={onAdd} type="button">
            <Plus size={16} />
            录入测试成绩
          </button>
        </section>
        <article className="panel">
          <EmptyState
            action="录入第一次成绩"
            icon={BarChart3}
            onAction={onAdd}
            text="手工填写各科分数后，这里会生成成绩趋势与目标差距。"
            title="暂无测试成绩"
          />
        </article>
      </div>
    );
  }

  const previous = records.at(-2) ?? latest;
  const change = latest.total - previous.total;
  const targetEntries = [
    { label: "数学", score: latest.math, target: goal.math },
    { label: "英语", score: latest.english, target: goal.english },
    {
      label: "专业课",
      score: latest.professional,
      target: goal.professional,
    },
    { label: "政治", score: latest.politics, target: goal.politics },
  ];
  const hasTargets = targetEntries.every((entry) => entry.target > 0);
  const scoreRatios = hasTargets
    ? targetEntries
        .map((entry) => ({
          ...entry,
          value: entry.score / entry.target,
        }))
        .sort((a, b) => b.value - a.value)
    : [];
  const closest = scoreRatios[0];
  const weakest = scoreRatios.at(-1);
  const largestGap = hasTargets
    ? [...targetEntries].sort(
        (a, b) => b.target - b.score - (a.target - a.score),
      )[0]
    : null;
  const hasGoal = goal.targetScore > 0;
  const totalGap = hasGoal ? goal.targetScore - latest.total : 0;

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
        <MetricCard
          delta={records.length > 1 ? `${change >= 0 ? "+" : ""}${change}` : "首次记录"}
          icon={Trophy}
          label="最近一次总分"
          note={`${latest.date} · ${latest.title}`}
          tone="green"
          value={`${latest.total}`}
        />
        <MetricCard
          delta={hasGoal ? "已设置" : "待设置"}
          icon={Target}
          label="目标分"
          note={goal.direction || "请先填写报考方向"}
          tone="blue"
          value={hasGoal ? `${goal.targetScore}` : "--"}
        />
        <MetricCard
          delta={hasGoal ? (totalGap > 0 ? "仍需提升" : "已达到") : "暂无目标"}
          icon={Flag}
          label="当前差距"
          note={hasGoal ? "录入新成绩后自动重算" : "在设置中填写目标分"}
          tone={hasGoal && totalGap > 0 ? "yellow" : "green"}
          value={hasGoal ? `${Math.max(0, totalGap)}` : "--"}
        />
        <MetricCard
          delta={records.length > 1 ? `${change >= 0 ? "+" : ""}${change}` : "暂无对比"}
          icon={TrendingUp}
          label="最近一次变化"
          note={records.length > 1 ? "与上一次测试对比" : "再录入一次成绩后生成"}
          tone={change >= 0 ? "green" : "red"}
          value={records.length > 1 ? `${change >= 0 ? "+" : ""}${change}` : "--"}
        />
        <MetricCard
          delta={closest ? `${Math.round(closest.value * 100)}%` : "待设置目标"}
          icon={BookOpenCheck}
          label="最接近目标"
          note="按目标达成率判断"
          tone="green"
          value={closest?.label ?? "--"}
        />
        <MetricCard
          delta={weakest ? `${Math.round(weakest.value * 100)}%` : "待设置目标"}
          icon={AlertTriangle}
          label="最需提升"
          note="按目标达成率判断"
          tone="red"
          value={weakest?.label ?? "--"}
        />
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
                  domain={[0, "auto"]}
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
          <PanelHeader
            eyebrow="目标差距"
            title={hasTargets ? "各科目标达成情况" : "尚未设置各科目标"}
          />
          {hasTargets ? (
            <>
              <ScoreGapRow label="数学" target={goal.math} value={latest.math} />
              <ScoreGapRow label="英语" target={goal.english} value={latest.english} />
              <ScoreGapRow label="专业课" target={goal.professional} value={latest.professional} />
              <ScoreGapRow label="政治" target={goal.politics} value={latest.politics} />
              <div className="score-gap-note">
                {largestGap
                  ? `${largestGap.label}与目标相差 ${Math.max(0, largestGap.target - largestGap.score)} 分，可优先拆分下一轮任务。`
                  : "继续录入成绩后生成差距建议。"}
              </div>
            </>
          ) : (
            <EmptyState
              action="设置各科目标"
              icon={Target}
              onAction={onOpenSettings}
              text="填写政治、英语、数学和专业课目标分后再计算差距。"
              title="缺少目标分"
            />
          )}
        </aside>
      </section>

      <section className="score-secondary dashboard-grid">
        <article className="panel span-5">
          <PanelHeader eyebrow="本次复盘" title="手工记录的测试备注" />
          {latest.note ? (
            <div className="score-note-content">
              <FileText size={18} />
              <p>{latest.note}</p>
            </div>
          ) : (
            <EmptyState
              action="录入下一次成绩"
              icon={FileText}
              onAction={onAdd}
              text="本次没有填写复盘备注；下一次可记录失分点与时间分配。"
              title="暂无复盘备注"
            />
          )}
        </article>
        <article className="panel span-4">
          <PanelHeader eyebrow="各科表现" title="本次卷面得分率" />
          <ProgressLine label="数学" tone="blue" value={Math.round((latest.math / 150) * 100)} />
          <ProgressLine label="英语" tone="green" value={latest.english} />
          <ProgressLine label="专业课" tone="yellow" value={Math.round((latest.professional / 150) * 100)} />
          <ProgressLine label="政治" tone="red" value={latest.politics} />
        </article>
        <article className="panel span-3">
          <PanelHeader eyebrow="数据完整度" title="后续可继续补充" />
          <div className="time-warning">
            <Clock3 size={16} />
            当前只记录各科分数与复盘备注，不推测题型、失分点或答题用时。
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
  onStart,
  period,
  scoreCount,
  scoreDelta,
  tasks,
  theme,
  trendData,
}: {
  chartColors: (typeof chartColors)[Theme];
  completedMinutes: number;
  completionRate: number;
  mistakeCount: number;
  onExport: () => void;
  onPeriodChange: (period: ReportPeriod) => void;
  onStart: () => void;
  period: ReportPeriod;
  scoreCount: number;
  scoreDelta: number;
  tasks: StudyTask[];
  theme: Theme;
  trendData: typeof weeklyTrend;
}) {
  const hasData = tasks.length > 0 || scoreCount > 0 || mistakeCount > 0;
  const completed = tasks.filter((task) => task.status === "已完成");
  const pending = tasks.find((task) => task.status !== "已完成");
  const overdueCount = tasks.filter((task) => task.overdue).length;
  const subjectBreakdown = [
    { label: "数学", tone: "blue", minutes: 0 },
    { label: "专业课", tone: "red", minutes: 0 },
    { label: "英语", tone: "green", minutes: 0 },
    { label: "数学建模", tone: "yellow", minutes: 0 },
    { label: "政治", tone: "gray", minutes: 0 },
  ].map((entry) => ({
    ...entry,
    minutes: completed
      .filter((task) => task.subject === entry.label)
      .reduce(
        (sum, task) => sum + (task.actualMinutes || task.plannedMinutes),
        0,
      ),
  }));
  const recordedBreakdown = subjectBreakdown.filter((entry) => entry.minutes > 0);
  const donutColors: Record<string, string> = {
    blue: "var(--brand)",
    red: "var(--danger)",
    green: "var(--success)",
    yellow: "var(--warning)",
    gray: "var(--weak)",
  };
  let donutCursor = 0;
  const donutStops = recordedBreakdown.map((entry) => {
    const start = donutCursor;
    const value = (entry.minutes / Math.max(1, completedMinutes)) * 100;
    donutCursor += value;
    return `${donutColors[entry.tone]} ${start}% ${donutCursor}%`;
  });
  const summaryTitle = completed.length
    ? "学习记录已开始累积，建议继续保持连续录入"
    : scoreCount
      ? "已有成绩基线，补充任务记录后可分析投入产出"
      : mistakeCount
        ? "错题已进入复习队列，完成任务后将形成完整反馈"
        : "暂无可分析的学习记录";

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
        <button
          className="secondary-button"
          disabled={!hasData}
          onClick={onExport}
          type="button"
        >
          <Download size={16} />
          导出 {period}
        </button>
      </section>

      {!hasData ? (
        <article className="panel">
          <EmptyState
            action="添加第一项任务"
            icon={FileText}
            onAction={onStart}
            text="完成任务、录入成绩或整理错题后，报告会根据真实记录自动生成。"
            title="暂无报告数据"
          />
        </article>
      ) : (
        <>
          <section className="report-summary-band">
            <div>
              <span className="eyebrow">{period}自动总结</span>
              <h2>{summaryTitle}</h2>
              <p>
                当前已记录 {tasks.length} 项任务、{scoreCount} 次测试和{" "}
                {mistakeCount} 道待复习错题。结论会随手工记录持续更新。
              </p>
            </div>
            <Sparkles size={28} />
          </section>

          <section className="report-metrics metric-grid four">
            <MetricCard delta="当前记录" icon={Clock3} label="有效学习" note="来自任务完成记录" tone="green" value={formatMinutes(completedMinutes)} />
            <MetricCard delta={`${completed.length} 项完成`} icon={ListChecks} label="任务完成率" note="随任务打卡实时更新" tone="green" value={`${completionRate}%`} />
            <MetricCard
              delta={scoreCount > 1 ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}` : "暂无对比"}
              icon={TrendingUp}
              label="成绩变化"
              note={scoreCount > 1 ? "来自最近两次测试" : "至少录入两次成绩后生成"}
              tone="blue"
              value={scoreCount > 1 ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta}` : "--"}
            />
            <MetricCard delta={`${mistakeCount} 道`} icon={NotebookTabs} label="错题到期" note="完成复习后自动减少" tone="yellow" value={`${mistakeCount}`} />
          </section>

          <section className="report-layout dashboard-grid">
            <article className="panel span-7">
              <PanelHeader eyebrow="学习时长分布" title="已完成任务的实际投入" />
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
              {completedMinutes ? (
                <div className="report-donut-row">
                  <div
                    className="report-donut"
                    aria-label="科目投入时间占比"
                    style={{
                      background: `conic-gradient(${donutStops.join(", ")})`,
                    }}
                  >
                    <div>
                      <strong>{(completedMinutes / 60).toFixed(1)}h</strong>
                      <span>总投入</span>
                    </div>
                  </div>
                  <div className="donut-legend">
                    {recordedBreakdown.map((entry) => (
                      <LegendRow
                        color={entry.tone}
                        key={entry.label}
                        label={entry.label}
                        value={`${Math.round((entry.minutes / completedMinutes) * 100)}%`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="panel-empty-copy">
                  完成任务并填写实际用时后生成科目占比。
                </div>
              )}
            </article>
          </section>

          <section className="insight-grid">
            <InsightCard
              icon={TrendingUp}
              label="已完成"
              text={
                completed.length
                  ? `当前完成 ${completed.length} 项任务，累计 ${formatMinutes(completedMinutes)}。`
                  : "尚无已完成任务，暂无进步结论。"
              }
              tone="green"
            />
            <InsightCard
              icon={AlertTriangle}
              label="当前问题"
              text={
                overdueCount
                  ? `${overdueCount} 项任务已逾期，需要重新安排。`
                  : mistakeCount
                    ? `${mistakeCount} 道错题仍在复习队列。`
                    : "当前记录中尚未识别明显风险。"
              }
              tone={overdueCount || mistakeCount ? "red" : "green"}
            />
            <InsightCard
              icon={Target}
              label="下一步优先"
              text={pending ? `优先处理：${pending.title}` : "添加下一项重要任务。"}
              tone="blue"
            />
            <InsightCard
              icon={ArrowDown}
              label="建议削减"
              text="记录至少一周的任务延期原因后，再判断哪些安排需要减少。"
              tone="yellow"
            />
          </section>
        </>
      )}
    </div>
  );
}

function ModelingPage({
  chapters,
  onAdd,
  onAdvance,
  studyMinutes,
  summary,
  tasks,
  totalStudyMinutes,
}: {
  chapters: ChapterItem[];
  onAdd: () => void;
  onAdvance: (taskId: number) => void;
  studyMinutes: number;
  summary: SubjectSummary;
  tasks: ModelingTeamTask[];
  totalStudyMinutes: number;
}) {
  const ratio = totalStudyMinutes
    ? Math.round((studyMinutes / totalStudyMinutes) * 100)
    : 0;
  const completedCount = tasks.filter(
    (task) => task.status === "已完成",
  ).length;
  const activeCount = tasks.filter(
    (task) => task.status === "进行中",
  ).length;

  return (
    <div className="page-stack page-enter">
      <section className="modeling-banner">
        <div>
          <span className="eyebrow">独立训练线</span>
          <h2>数学建模训练</h2>
          <p>保留方法、编程与论文训练，同时守住考研主线时间预算。</p>
        </div>
        <div className="competition-countdown">
          <CalendarDays size={20} />
          <span>比赛日期</span>
          <strong>尚未设置</strong>
        </div>
      </section>

      <section className="modeling-metrics metric-grid">
        <MetricCard
          delta={studyMinutes ? "来自完成记录" : "暂无记录"}
          icon={Clock3}
          label="训练时长"
          note="仅统计数学建模任务的实际用时"
          tone="yellow"
          value={studyMinutes ? formatMinutes(studyMinutes) : "--"}
        />
        <MetricCard
          delta={chapters.length ? `${chapters.length} 个章节` : "暂无记录"}
          icon={BrainCircuit}
          label="综合掌握度"
          note="来自章节正确率"
          tone="green"
          value={chapters.length ? `${summary.accuracy}%` : "--"}
        />
        <MetricCard
          delta={chapters.length ? "手工录入" : "暂无记录"}
          icon={BookOpenCheck}
          label="资料学习进度"
          note="来自课程完成度"
          tone="blue"
          value={chapters.length ? `${summary.course}%` : "--"}
        />
        <MetricCard
          delta={chapters.length ? "手工录入" : "暂无记录"}
          icon={ListChecks}
          label="训练进度"
          note="来自习题完成度"
          tone="blue"
          value={chapters.length ? `${summary.practice}%` : "--"}
        />
        <MetricCard
          delta={chapters.length ? "持续累积" : "暂无记录"}
          icon={NotebookTabs}
          label="专题记录"
          note="章节与知识点数量"
          tone="green"
          value={`${chapters.length}`}
        />
        <MetricCard
          delta={`${completedCount} 项完成`}
          icon={Target}
          label="团队任务"
          note={`${activeCount} 项正在进行`}
          tone="blue"
          value={`${tasks.length}`}
        />
      </section>

      <section className="modeling-layout dashboard-grid">
        <article className="panel span-4 modeling-ratio">
          <PanelHeader eyebrow="时间占比" title="当前有效学习时间" />
          <div
            className="modeling-donut"
            style={{
              background: totalStudyMinutes
                ? `conic-gradient(var(--warning) 0 ${Math.min(100, ratio)}%, var(--panel-secondary) ${Math.min(100, ratio)}% 100%)`
                : undefined,
            }}
          >
            <div>
              <strong>{totalStudyMinutes ? `${ratio}%` : "--"}</strong>
              <span>数学建模</span>
            </div>
          </div>
          <div className="ratio-budget">
            <span>建议上限 15%</span>
            <strong>
              {totalStudyMinutes
                ? ratio > 15
                  ? `超出 ${ratio - 15}%`
                  : `剩余 ${15 - ratio}%`
                : "等待记录"}
            </strong>
          </div>
          <div className="gentle-warning">
            {ratio > 15 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            {totalStudyMinutes
              ? ratio > 15
                ? "当前建模投入超过建议比例，可检查是否挤压考研主线。"
                : "当前建模投入处于建议比例内。"
              : "完成学习任务并填写实际用时后生成占比。"}
          </div>
        </article>

        <article className="panel span-4 modeling-progress">
          <PanelHeader eyebrow="能力构成" title="人工录入的学习维度" />
          {chapters.length ? (
            <>
              <ProgressLine label="课程完成度" tone="blue" value={summary.course} />
              <ProgressLine label="教材完成度" tone="green" value={summary.textbook} />
              <ProgressLine label="习题完成度" tone="yellow" value={summary.practice} />
              <ProgressLine label="正确率" tone="green" value={summary.accuracy} />
              <div className="progress-note">所有数值均来自章节学习记录。</div>
            </>
          ) : (
            <div className="panel-empty-copy">
              在科目进度页选择数学建模，添加第一条学习记录后生成能力数据。
            </div>
          )}
        </article>

        <article className="panel span-4 modeling-topic">
          <PanelHeader eyebrow="专题记录" title="最近录入的知识点" />
          {chapters.length ? (
            <div className="topic-list">
              {chapters.slice(-4).reverse().map((chapter) => (
                <div key={chapter.id}>
                  {chapter.status === "已掌握" || chapter.status === "已完成" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                  <span>{chapter.group} · {chapter.name}</span>
                  <StatusTag label={chapter.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-empty-copy">
              暂无专题记录。章节会按手工录入顺序显示。
            </div>
          )}
        </article>
      </section>

      <article className="panel team-task-panel">
        <PanelHeader
          action="添加团队任务"
          eyebrow="协作任务"
          onAction={onAdd}
          title="团队推进"
        />
        <div className="team-task-table">
          {tasks.length ? (
            <>
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
            </>
          ) : (
            <div className="team-empty">
              <EmptyState
                action="添加团队任务"
                icon={Target}
                onAction={onAdd}
                text="任务名称、负责人和截止日期均由你手工填写。"
                title="暂无团队任务"
              />
            </div>
          )}
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
        <PanelHeader
          eyebrow="目标设置"
          title={
            draft.school
              ? `${draft.school} · ${draft.direction || "方向待填写"}`
              : "填写你的考研目标"
          }
        />
        <div className="form-grid">
          <label className="field">
            <span>目标院校</span>
            <input
              onChange={(event) => updateGoal("school", event.target.value)}
              placeholder="请输入目标院校"
              value={draft.school}
            />
          </label>
          <label className="field">
            <span>报考方向</span>
            <input
              onChange={(event) => updateGoal("direction", event.target.value)}
              placeholder="请输入专业或研究方向"
              value={draft.direction}
            />
          </label>
          <label className="field">
            <span>初试目标分</span>
            <input
              onChange={(event) => updateGoal("targetScore", Number(event.target.value))}
              placeholder="请输入总目标分"
              value={draft.targetScore || ""}
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
              <option value="">请选择阶段</option>
              <option>基础准备期</option>
              <option>基础学习期</option>
              <option>强化期</option>
              <option>真题期</option>
              <option>冲刺期</option>
            </select>
          </label>
        </div>
        <div className="target-score-grid">
          <label><span>政治</span><input max="100" min="0" onChange={(event) => updateGoal("politics", Number(event.target.value))} value={draft.politics || ""} type="number" /></label>
          <label><span>英语</span><input max="100" min="0" onChange={(event) => updateGoal("english", Number(event.target.value))} value={draft.english || ""} type="number" /></label>
          <label><span>数学</span><input max="150" min="0" onChange={(event) => updateGoal("math", Number(event.target.value))} value={draft.math || ""} type="number" /></label>
          <label><span>专业课</span><input max="150" min="0" onChange={(event) => updateGoal("professional", Number(event.target.value))} value={draft.professional || ""} type="number" /></label>
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
            清空本机数据
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
  const [plannedMinutes, setPlannedMinutes] = useState(0);
  const [priority, setPriority] = useState<Priority>("中");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || plannedMinutes <= 0) return;
    onSubmit({
      title: title.trim(),
      subject,
      chapter: chapter.trim() || "未填写章节",
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
            placeholder="请输入计划分钟数"
            step="5"
            type="number"
            value={plannedMinutes || ""}
          />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button
            className="primary-button"
            disabled={!title.trim() || plannedMinutes <= 0}
            type="submit"
          >
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
  const [minutes, setMinutes] = useState(0);
  const [addToToday, setAddToToday] = useState(true);

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim() || minutes <= 0) return;
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
            placeholder="请输入计划分钟数"
            step="5"
            type="number"
            value={minutes || ""}
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
          <button
            className="primary-button"
            disabled={!title.trim() || minutes <= 0}
            type="submit"
          >
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
    group: string;
    chapterName: string;
    minutes: number;
    course: number;
    textbook: number;
    practice: number;
    accuracy: number;
    mastery: number;
  }) => void;
  subjectData: SubjectSummary[];
}) {
  const [subjectId, setSubjectId] = useState(activeSubjectId);
  const [chapterId, setChapterId] = useState("");
  const [group, setGroup] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [course, setCourse] = useState(0);
  const [textbook, setTextbook] = useState(0);
  const [practice, setPractice] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [mastery, setMastery] = useState(1);
  const isNewChapter = !chapterId;

  function resetChapter() {
    setChapterId("");
    setGroup("");
    setChapterName("");
    setCourse(0);
    setTextbook(0);
    setPractice(0);
    setAccuracy(0);
    setMastery(1);
  }

  function loadChapter(nextSubjectId: string, nextChapterId: string) {
    if (!nextChapterId) {
      resetChapter();
      return;
    }
    const chapter = chapters[nextSubjectId]?.find((item) => item.id === nextChapterId);
    if (!chapter) return;
    setChapterId(chapter.id);
    setGroup(chapter.group);
    setChapterName(chapter.name);
    setCourse(chapter.course);
    setTextbook(chapter.textbook ?? 0);
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
          if (
            minutes <= 0 ||
            (isNewChapter && (!group.trim() || !chapterName.trim()))
          ) {
            return;
          }
          onSubmit({
            subjectId,
            chapterId,
            group,
            chapterName,
            minutes,
            course,
            textbook,
            practice,
            accuracy,
            mastery,
          });
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
                setSubjectId(nextSubjectId);
                resetChapter();
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
              <option value="">新增章节 / 知识点</option>
              {(chapters[subjectId] ?? []).map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.group} · {chapter.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>章节分组</span>
            <input
              disabled={!isNewChapter}
              onChange={(event) => setGroup(event.target.value)}
              placeholder="例如：高等数学"
              value={group}
            />
          </label>
          <label className="field">
            <span>章节 / 知识点名称</span>
            <input
              disabled={!isNewChapter}
              onChange={(event) => setChapterName(event.target.value)}
              placeholder="例如：定积分"
              value={chapterName}
            />
          </label>
        </div>
        <label className="field">
          <span>本次有效学习时长（分钟）</span>
          <input
            min="5"
            onChange={(event) => setMinutes(Number(event.target.value))}
            placeholder="请输入实际分钟数"
            step="5"
            type="number"
            value={minutes || ""}
          />
        </label>
        <div className="record-metrics-grid four">
          <PercentField label="课程完成度" onChange={setCourse} value={course} />
          <PercentField label="教材完成度" onChange={setTextbook} value={textbook} />
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
          <button
            className="success-button"
            disabled={
              minutes <= 0 ||
              (isNewChapter && (!group.trim() || !chapterName.trim()))
            }
            type="submit"
          >
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
  const [title, setTitle] = useState("");
  const [math, setMath] = useState(0);
  const [english, setEnglish] = useState(0);
  const [professional, setProfessional] = useState(0);
  const [politics, setPolitics] = useState(0);
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
            title: title.trim(),
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
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder="请输入测试名称"
              value={title}
            />
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
          <button className="primary-button" disabled={!title.trim()} type="submit">
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
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");

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
            <input
              onChange={(event) => setOwner(event.target.value)}
              placeholder="请输入负责人"
              value={owner}
            />
          </label>
          <label className="field">
            <span>截止日期</span>
            <input onChange={(event) => setDue(event.target.value)} type="date" value={due} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button
            className="primary-button"
            disabled={!title.trim() || !owner.trim()}
            type="submit"
          >
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
          placeholder="0"
          type="number"
          value={value || ""}
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
          placeholder="0"
          type="number"
          value={value || ""}
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

function getPhaseStatus(
  start: string,
  end: string,
): { label: string; tone: SubjectSummary["tone"] } {
  const now = new Date();
  const startDate = new Date(`${start}T00:00:00+08:00`);
  const endDate = new Date(`${end}T23:59:59+08:00`);
  if (now > endDate) return { label: "计划期已结束", tone: "gray" };
  if (now >= startDate) return { label: "当前计划期", tone: "blue" };
  const days = Math.ceil((startDate.getTime() - now.getTime()) / 86_400_000);
  if (days <= 14) {
    return {
      label: `${startDate.getMonth() + 1}月${startDate.getDate()}日启动`,
      tone: "blue",
    };
  }
  return { label: "待开始", tone: "gray" };
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
      chapters.map((chapter) => ({
        ...chapter,
        textbook: Number(chapter.textbook ?? 0),
      })),
    ]),
  );
}

function cloneWeekPlan(source: WeekPlanDay[]) {
  if (!source.length) return createCurrentWeekPlan();
  return source.map((day) => ({ ...day, tasks: [...day.tasks] }));
}

function createCurrentWeekPlan(): WeekPlanDay[] {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return labels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      id: index + 1,
      day: label,
      date: formatMonthDay(date),
      planned: 0,
      actual: 0,
      tasks: [],
      state: "待开始",
    };
  });
}

function scoreLabelForSubject(subjectId: string, score: ScoreRecord | null) {
  if (!score) return subjectId === "modeling" ? "独立统计" : "暂无";
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
  if (!examDate) return 0;
  const exam = new Date(`${examDate}T00:00:00+08:00`).getTime();
  if (!Number.isFinite(exam)) return 0;
  return Math.max(0, Math.ceil((exam - Date.now()) / 86_400_000));
}

function formatInputDate(date: string) {
  if (!date) return "未设置";
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function formatChineseDate(date: string) {
  if (!date) return "未设置";
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Shanghai",
    }).format(new Date()),
  );
  if (hour < 6) return "夜深了";
  if (hour < 12) return "上午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(date);
}
