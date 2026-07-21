"use client";

import { useEffect, useMemo, useState } from "react";

type View = "overview" | "today" | "plan" | "progress" | "report" | "mine";
type StudyMode = "normal" | "focus" | "review";
type TaskState = "pending" | "active" | "done" | "delayed";
type Priority = "高" | "中" | "低";

type StudyTask = {
  id: number;
  title: string;
  subject: string;
  knowledge: string;
  planMinutes: number;
  weight: number;
  lag: number;
  forgetRisk: number;
  urgency: number;
  priority: Priority;
  state: TaskState;
  actualMinutes?: number;
  mastery?: number;
  hasMistake?: boolean;
  delayReason?: string;
};

type SubjectProgress = {
  subject: string;
  accent: "blue" | "green" | "yellow" | "red" | "gray";
  course: number;
  textbook: number;
  practice: number;
  accuracy: number;
  review: "正常" | "需关注" | "严重落后";
  risk: string;
};

const STORAGE_KEY = "kaoyan-study-cockpit-v2";

const initialTasks: StudyTask[] = [
  {
    id: 1,
    title: "高数：定积分换元法 24 题",
    subject: "数学",
    knowledge: "高等数学 / 积分",
    planMinutes: 120,
    weight: 5,
    lag: 4,
    forgetRisk: 4,
    urgency: 5,
    priority: "高",
    state: "active",
  },
  {
    id: 2,
    title: "数据结构：树与二叉树错题复盘",
    subject: "408",
    knowledge: "数据结构 / 树",
    planMinutes: 90,
    weight: 5,
    lag: 5,
    forgetRisk: 5,
    urgency: 4,
    priority: "高",
    state: "pending",
  },
  {
    id: 3,
    title: "英语：核心词 180 + 阅读一篇",
    subject: "英语",
    knowledge: "词汇 / 阅读",
    planMinutes: 80,
    weight: 4,
    lag: 2,
    forgetRisk: 4,
    urgency: 4,
    priority: "高",
    state: "pending",
  },
  {
    id: 4,
    title: "数学建模：摘要结构复盘",
    subject: "建模",
    knowledge: "论文写作",
    planMinutes: 45,
    weight: 2,
    lag: 1,
    forgetRisk: 2,
    urgency: 3,
    priority: "中",
    state: "pending",
  },
  {
    id: 5,
    title: "政治：马原框架速记",
    subject: "政治",
    knowledge: "马原 / 基础概念",
    planMinutes: 35,
    weight: 2,
    lag: 1,
    forgetRisk: 3,
    urgency: 2,
    priority: "低",
    state: "pending",
  },
];

const subjects: SubjectProgress[] = [
  {
    subject: "数学",
    accent: "yellow",
    course: 58,
    textbook: 47,
    practice: 39,
    accuracy: 42,
    review: "需关注",
    risk: "积分题型正确率没有跟随投入时长上升",
  },
  {
    subject: "英语",
    accent: "green",
    course: 64,
    textbook: 52,
    practice: 55,
    accuracy: 67,
    review: "正常",
    risk: "单词复习连续性比阅读更关键",
  },
  {
    subject: "408 / 专业课",
    accent: "red",
    course: 42,
    textbook: 36,
    practice: 31,
    accuracy: 38,
    review: "严重落后",
    risk: "数据结构 14 天未复习，遗忘风险高",
  },
  {
    subject: "数学建模",
    accent: "blue",
    course: 72,
    textbook: 48,
    practice: 61,
    accuracy: 58,
    review: "需关注",
    risk: "本周占用超过预算，需压缩低收益投入",
  },
];

const weeklyHours = [
  { label: "一", value: 5.2 },
  { label: "二", value: 4.8 },
  { label: "三", value: 6.4 },
  { label: "四", value: 3.5 },
  { label: "五", value: 4.2 },
  { label: "六", value: 1.6 },
  { label: "日", value: 0 },
];

const stages = [
  {
    name: "基础准备期",
    time: "2026.07 - 2027.02",
    plan: "数学基础、英语词汇、408 基础框架",
    done: "完成 61%",
    quality: "B",
    delay: "408 复习间隔偏长",
  },
  {
    name: "基础学习期",
    time: "2027.03 - 2027.08",
    plan: "完成第一轮系统学习与章节测试",
    done: "待开始",
    quality: "-",
    delay: "无",
  },
  {
    name: "强化冲刺期",
    time: "2027.09 - 初试",
    plan: "真题、套卷、错题回炉、预测分修正",
    done: "待开始",
    quality: "-",
    delay: "无",
  },
];

function taskScore(task: StudyTask) {
  return task.weight * task.lag * task.forgetRisk * task.urgency;
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function daysUntilExam() {
  const examDate = new Date("2027-12-25T00:00:00+08:00");
  const today = new Date();
  return Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000));
}

export function StudyCockpit() {
  const [view, setView] = useState<View>("overview");
  const [mode, setMode] = useState<StudyMode>("normal");
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState(1);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [actualMinutes, setActualMinutes] = useState(120);
  const [mastery, setMastery] = useState(3);
  const [hasMistake, setHasMistake] = useState(false);
  const [delayReason, setDelayReason] = useState("时间不足");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { tasks?: StudyTask[]; selectedTaskId?: number };
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.selectedTaskId) setSelectedTaskId(parsed.selectedTaskId);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, selectedTaskId }));
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setFocusSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.state === "done" && b.state !== "done") return 1;
        if (b.state === "done" && a.state !== "done") return -1;
        return taskScore(b) - taskScore(a);
      }),
    [tasks],
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const doneTasks = tasks.filter((task) => task.state === "done");
  const delayedTasks = tasks.filter((task) => task.state === "delayed");
  const pendingTasks = tasks.filter((task) => task.state !== "done");
  const plannedMinutes = tasks.reduce((sum, task) => sum + task.planMinutes, 0);
  const completedMinutes = doneTasks.reduce((sum, task) => sum + (task.actualMinutes ?? task.planMinutes), 0);
  const completionRate = Math.round((doneTasks.length / tasks.length) * 100);
  const forecastScore = 323;
  const health = completionRate >= 60 ? 82 : 74;
  const focusMinute = String(Math.floor(focusSeconds / 60)).padStart(2, "0");
  const focusSecond = String(focusSeconds % 60).padStart(2, "0");
  const biggestRisk = "408 数据结构复习间隔过长，且练习正确率低于 40%";

  function updateTask(id: number, patch: Partial<StudyTask>) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function completeTask() {
    updateTask(selectedTask.id, {
      state: "done",
      actualMinutes,
      mastery,
      hasMistake,
    });
    setRunning(false);
    setMode("review");
  }

  function delayTask() {
    updateTask(selectedTask.id, {
      state: "delayed",
      delayReason,
    });
  }

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      target: "2028 考研 / 网络安全方向 / 目标 380",
      tasks,
      subjects,
      weeklyHours,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kaoyan-study-record.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={`product-shell mode-${mode}`}>
      <aside className="side-nav" aria-label="主导航">
        <div className="brand">
          <span>研</span>
          <div>
            <strong>学习驾驶舱</strong>
            <small>2028 网络安全</small>
          </div>
        </div>
        <nav>
          {[
            ["overview", "首页"],
            ["today", "今日"],
            ["plan", "计划"],
            ["progress", "进度"],
            ["report", "报告"],
            ["mine", "我的"],
          ].map(([key, label]) => (
            <button
              className={view === key ? "active" : ""}
              key={key}
              onClick={() => setView(key as View)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="app-area">
        <header className="status-bar">
          <div>
            <p className="kicker">目标-计划-执行-反馈-调整</p>
            <h1>考研学习驾驶舱</h1>
          </div>
          <div className="status-actions">
            <span>初试倒计时 {daysUntilExam()} 天</span>
            <button onClick={exportData} type="button">
              导出数据
            </button>
          </div>
        </header>

        {view === "overview" && (
          <section className="view-stack overview-view">
            <section className="overview-grid">
              <article className="summary-card primary">
                <span>今日完成率</span>
                <strong>{completionRate}%</strong>
                <p>
                  {doneTasks.length}/{tasks.length} 项，已记录 {formatMinutes(completedMinutes)}
                </p>
              </article>
              <article className="summary-card">
                <span>本周学习时长</span>
                <strong>25.7h</strong>
                <p>计划 42h，当前进度正常偏低</p>
              </article>
              <article className="summary-card">
                <span>连续学习</span>
                <strong>23 天</strong>
                <p>近 7 天平均专注 5.1h</p>
              </article>
              <article className="summary-card">
                <span>学习健康度</span>
                <strong>{health}</strong>
                <p>注意专业课复习间隔</p>
              </article>
              <article className="summary-card">
                <span>目标预测分</span>
                <strong>{forecastScore}</strong>
                <p>距 380 目标差 57 分</p>
              </article>
            </section>

            <section className="action-grid">
              <article className="panel today-core">
                <div className="panel-title">
                  <div>
                    <span>今日最重要</span>
                    <h2>三项任务</h2>
                  </div>
                  <button onClick={() => setView("today")} type="button">
                    进入今日
                  </button>
                </div>
                <div className="compact-tasks">
                  {sortedTasks.slice(0, 3).map((task, index) => (
                    <button
                      className={`compact-task ${task.state}`}
                      key={task.id}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setView("today");
                      }}
                      type="button"
                    >
                      <b>{index + 1}</b>
                      <span>
                        <strong>{task.title}</strong>
                        <small>
                          {task.subject} · 优先级分 {taskScore(task)}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel subject-core">
                <div className="panel-title">
                  <div>
                    <span>科目推进</span>
                    <h2>只看需要行动的进度</h2>
                  </div>
                </div>
                {subjects.slice(0, 3).map((subject) => (
                  <ProgressLine
                    key={subject.subject}
                    label={subject.subject}
                    value={subject.accuracy}
                    tone={subject.accent}
                    meta={`${subject.review} · ${subject.risk}`}
                  />
                ))}
              </article>

              <article className="panel risk-core">
                <div className="risk-label">当前最大风险</div>
                <h2>{biggestRisk}</h2>
                <p>建议今天优先完成树与二叉树错题复盘，晚上只复盘错因，不追加新内容。</p>
              </article>
            </section>
          </section>
        )}

        {view === "today" && (
          <section className="view-stack">
            <div className="mode-switch" aria-label="今日学习模式">
              {[
                ["normal", "普通模式"],
                ["focus", "专注模式"],
                ["review", "复盘模式"],
              ].map(([key, label]) => (
                <button
                  className={mode === key ? "active" : ""}
                  key={key}
                  onClick={() => setMode(key as StudyMode)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "focus" ? (
              <section className="focus-layout">
                <article className="focus-card">
                  <span>当前任务</span>
                  <h2>{selectedTask.title}</h2>
                  <p>{selectedTask.knowledge}</p>
                  <div className="timer" aria-label="番茄钟">
                    {focusMinute}:{focusSecond}
                  </div>
                  <div className="button-row">
                    <button onClick={() => setRunning((value) => !value)} type="button">
                      {running ? "暂停" : "开始"}
                    </button>
                    <button onClick={() => setFocusSeconds(25 * 60)} type="button">
                      重置
                    </button>
                    <button className="success" onClick={completeTask} type="button">
                      完成并复盘
                    </button>
                  </div>
                </article>
              </section>
            ) : mode === "review" ? (
              <section className="review-grid">
                <article className="panel review-card">
                  <span>学习结束复盘</span>
                  <h2>今天完成 {completionRate}%</h2>
                  <p>完成 {formatMinutes(completedMinutes)}，未完成 {pendingTasks.length} 项。</p>
                  <label>
                    今日最大问题
                    <textarea defaultValue="专业课复盘启动太晚，导致后半段注意力下降。" />
                  </label>
                  <label>
                    明日优先事项
                    <textarea defaultValue="先做数据结构错题，再进入英语阅读，不临时追加建模任务。" />
                  </label>
                </article>
                <article className="panel">
                  <div className="panel-title">
                    <div>
                      <span>未完成与延期</span>
                      <h2>原因要被记录</h2>
                    </div>
                  </div>
                  <div className="reason-list">
                    {delayedTasks.length === 0 ? (
                      <p className="empty-note">暂无延期任务。出现延期后，会在周报里统计原因。</p>
                    ) : (
                      delayedTasks.map((task) => (
                        <div key={task.id}>
                          <strong>{task.title}</strong>
                          <span>{task.delayReason}</span>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>
            ) : (
              <section className="today-grid">
                <article className="panel task-board">
                  <div className="panel-title">
                    <div>
                      <span>自动排序</span>
                      <h2>今日任务清单</h2>
                    </div>
                    <small>权重 × 落后 × 遗忘 × 紧迫</small>
                  </div>
                  <div className="task-board-list">
                    {sortedTasks.map((task) => (
                      <button
                        className={`task-card ${task.state} ${selectedTask.id === task.id ? "selected" : ""}`}
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        type="button"
                      >
                        <span className="state-dot" />
                        <div>
                          <strong>{task.title}</strong>
                          <small>
                            {task.knowledge} · {formatMinutes(task.planMinutes)} · 分值 {taskScore(task)}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="panel current-task">
                  <div className="panel-title">
                    <div>
                      <span>当前专注任务</span>
                      <h2>{selectedTask.title}</h2>
                    </div>
                  </div>
                  <div className="focus-mini">
                    <div>
                      <span>番茄钟</span>
                      <strong>{focusMinute}:{focusSecond}</strong>
                    </div>
                    <button onClick={() => setMode("focus")} type="button">
                      进入专注
                    </button>
                  </div>
                  <div className="record-form">
                    <label>
                      实际用时
                      <input
                        min="0"
                        onChange={(event) => setActualMinutes(Number(event.target.value))}
                        type="number"
                        value={actualMinutes}
                      />
                    </label>
                    <label>
                      掌握程度
                      <input
                        max="5"
                        min="1"
                        onChange={(event) => setMastery(Number(event.target.value))}
                        type="range"
                        value={mastery}
                      />
                      <span>{mastery} / 5</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        checked={hasMistake}
                        onChange={(event) => setHasMistake(event.target.checked)}
                        type="checkbox"
                      />
                      产生错题，需要再次复习
                    </label>
                    <div className="button-row">
                      <button className="success" onClick={completeTask} type="button">
                        完成记录
                      </button>
                      <button onClick={delayTask} type="button">
                        延期
                      </button>
                    </div>
                    <label>
                      延期原因
                      <select onChange={(event) => setDelayReason(event.target.value)} value={delayReason}>
                        <option>时间不足</option>
                        <option>临时事务</option>
                        <option>难度超出预期</option>
                        <option>状态不佳</option>
                        <option>计划安排不合理</option>
                      </select>
                    </label>
                  </div>
                </article>
              </section>
            )}
          </section>
        )}

        {view === "plan" && (
          <section className="plan-layout">
            <aside className="timeline-nav">
              {stages.map((stage, index) => (
                <button className={index === 0 ? "active" : ""} key={stage.name} type="button">
                  <span>{stage.time}</span>
                  <strong>{stage.name}</strong>
                </button>
              ))}
            </aside>
            <article className="panel plan-detail">
              <span>四级计划</span>
              <h2>阶段计划 → 月计划 → 周计划 → 日任务</h2>
              <div className="plan-table">
                {stages.map((stage) => (
                  <div key={stage.name}>
                    <strong>{stage.name}</strong>
                    <p>{stage.plan}</p>
                    <span>实际完成：{stage.done}</span>
                    <span>完成质量：{stage.quality}</span>
                    <span>延期原因：{stage.delay}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {view === "progress" && (
          <section className="view-stack">
            <article className="panel">
              <div className="panel-title">
                <div>
                  <span>能力层</span>
                  <h2>科目进度拆成四个维度</h2>
                </div>
              </div>
              <div className="subject-matrix">
                {subjects.map((subject) => (
                  <div className={`subject-card tone-${subject.accent}`} key={subject.subject}>
                    <div>
                      <h3>{subject.subject}</h3>
                      <span>{subject.review}</span>
                    </div>
                    <ProgressLine label="课程进度" value={subject.course} tone={subject.accent} />
                    <ProgressLine label="教材进度" value={subject.textbook} tone={subject.accent} />
                    <ProgressLine label="习题进度" value={subject.practice} tone={subject.accent} />
                    <ProgressLine label="综合掌握度" value={subject.accuracy} tone={subject.accent} meta={subject.risk} />
                  </div>
                ))}
              </div>
            </article>
            <article className="panel mistakes">
              <span>错题本</span>
              <h2>今日复习错题模式</h2>
              <p className="empty-note">暂无错题截图。完成第一次错题录入后，这里会一次只展示一道题，并自动关联知识点、复习次数和下次复习日期。</p>
            </article>
          </section>
        )}

        {view === "report" && (
          <section className="report-layout">
            <article className="panel main-chart">
              <div className="panel-title">
                <div>
                  <span>周报</span>
                  <h2>时间花在哪里</h2>
                </div>
              </div>
              <div className="line-chart">
                {weeklyHours.map((day) => (
                  <div key={day.label}>
                    <span style={{ height: `${day.value * 24}px` }} />
                    <small>{day.label}</small>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel report-card">
              <span>反馈层</span>
              <h2>投入产出判断</h2>
              <p>数学投入时间增加 18%，但章节测试正确率只提升 2%。学习方式可能低效，建议减少重复看课，增加限时做题和错因复述。</p>
              <ul>
                <li>最大进步：英语阅读平均用时下降 4 分钟</li>
                <li>最大问题：408 复习间隔过长</li>
                <li>下周优先：数据结构错题、积分题型、英语词汇连续性</li>
                <li>建议削减：低收益建模润色时长</li>
              </ul>
            </article>
          </section>
        )}

        {view === "mine" && (
          <section className="view-stack">
            <article className="panel settings-panel">
              <span>用户目标设置</span>
              <h2>目标 380 分 · 网络安全方向</h2>
              <div className="target-grid">
                <div><strong>政治</strong><span>70</span></div>
                <div><strong>英语</strong><span>75</span></div>
                <div><strong>数学</strong><span>120</span></div>
                <div><strong>专业课</strong><span>115</span></div>
              </div>
              <button onClick={exportData} type="button">导出学习记录</button>
            </article>
          </section>
        )}
      </section>

      <nav className="bottom-nav" aria-label="移动端导航">
        {[
          ["overview", "首页"],
          ["today", "今日"],
          ["plan", "计划"],
          ["progress", "进度"],
          ["mine", "我的"],
        ].map(([key, label]) => (
          <button
            className={view === key ? "active" : ""}
            key={key}
            onClick={() => setView(key as View)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  );
}

function ProgressLine({
  label,
  value,
  tone,
  meta,
}: {
  label: string;
  value: number;
  tone: SubjectProgress["accent"];
  meta?: string;
}) {
  return (
    <div className={`progress-line tone-${tone}`}>
      <div>
        <strong>{label}</strong>
        <span>{value}%</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${value}%` }} />
      </div>
      {meta ? <p>{meta}</p> : null}
    </div>
  );
}
