import type { CSSProperties } from "react";

type Subject = {
  name: string;
  short: string;
  progress: number;
  target: number;
  hours: number;
  color: string;
  status: string;
};

type Task = {
  name: string;
  subject: string;
  duration: string;
  priority: "高" | "中";
  state: "done" | "active" | "pending";
};

const subjects: Subject[] = [
  {
    name: "数学",
    short: "Math",
    progress: 46,
    target: 120,
    hours: 14.5,
    color: "#24786f",
    status: "积分与级数需要回炉",
  },
  {
    name: "英语",
    short: "EN",
    progress: 58,
    target: 75,
    hours: 7.2,
    color: "#c6522f",
    status: "阅读正确率稳定上升",
  },
  {
    name: "408 / 专业课",
    short: "408",
    progress: 38,
    target: 115,
    hours: 11.8,
    color: "#305b93",
    status: "数据结构 14 天未复习",
  },
  {
    name: "政治",
    short: "POL",
    progress: 12,
    target: 70,
    hours: 2.5,
    color: "#8f5a12",
    status: "低频维护即可",
  },
  {
    name: "数学建模",
    short: "MCM",
    progress: 64,
    target: 0,
    hours: 9.5,
    color: "#6d537d",
    status: "本周占用偏高",
  },
];

const dailyTasks: Task[] = [
  {
    name: "高数：定积分换元法 24 题",
    subject: "数学",
    duration: "2h 10m",
    priority: "高",
    state: "active",
  },
  {
    name: "英语：核心词 180 + 阅读一篇",
    subject: "英语",
    duration: "1h 20m",
    priority: "高",
    state: "pending",
  },
  {
    name: "数据结构：树与二叉树错题复盘",
    subject: "408",
    duration: "1h 40m",
    priority: "高",
    state: "pending",
  },
  {
    name: "数学建模：论文摘要改写",
    subject: "建模",
    duration: "45m",
    priority: "中",
    state: "done",
  },
];

const weeklyHours = [
  { day: "周一", plan: 6, done: 5.2 },
  { day: "周二", plan: 6, done: 4.8 },
  { day: "周三", plan: 7, done: 6.4 },
  { day: "周四", plan: 6, done: 3.5 },
  { day: "周五", plan: 7, done: 0 },
  { day: "周六", plan: 8, done: 0 },
  { day: "周日", plan: 6, done: 0 },
];

const mastery = [
  { label: "高数", value: 62 },
  { label: "线代", value: 54 },
  { label: "概率", value: 41 },
  { label: "数据结构", value: 48 },
  { label: "计组", value: 35 },
  { label: "英语阅读", value: 66 },
];

const schools = [
  { level: "冲刺", name: "电子科技大学", major: "083900 网络空间安全", line: 365, gap: 42 },
  { level: "主目标", name: "网络空间安全方向", major: "085412 网络与信息安全", line: 350, gap: 27 },
  { level: "稳妥", name: "区域强校", major: "计算机技术 / 网安", line: 330, gap: 7 },
];

const scoreBreakdown = [
  { subject: "政治", target: 70, current: 54 },
  { subject: "英语", target: 75, current: 63 },
  { subject: "数学", target: 120, current: 86 },
  { subject: "专业课", target: 115, current: 97 },
];

function daysUntilExam() {
  const examDate = new Date("2027-12-25T00:00:00+08:00");
  const now = new Date();
  const diff = examDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export default function Home() {
  const countdown = daysUntilExam();
  const completedTasks = dailyTasks.filter((task) => task.state === "done").length;
  const totalCurrentScore = scoreBreakdown.reduce((sum, item) => sum + item.current, 0);
  const totalTargetScore = scoreBreakdown.reduce((sum, item) => sum + item.target, 0);

  return (
    <main className="dashboard-shell">
      <aside className="rail" aria-label="学习驾驶舱导航">
        <div className="brand-mark" aria-hidden="true">
          研
        </div>
        <nav className="rail-nav">
          <a href="#overview" aria-label="总览">
            仪
          </a>
          <a href="#tasks" aria-label="今日任务">
            任
          </a>
          <a href="#subjects" aria-label="科目进度">
            科
          </a>
          <a href="#goals" aria-label="目标院校">
            标
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar" id="overview">
          <div>
            <p className="eyebrow">2028 考研 · 网络安全方向</p>
            <h1>考研学习驾驶舱</h1>
            <p className="topbar-copy">
              目标、计划、执行、反馈和调整集中到一张屏幕，优先处理今天最影响上岸概率的任务。
            </p>
          </div>
          <div className="exam-pill">
            <span>初试倒计时</span>
            <strong>{countdown}</strong>
            <span>天</span>
          </div>
        </header>

        <section className="metric-grid" aria-label="核心指标">
          <article className="metric-card urgent">
            <span>今日完成率</span>
            <strong>
              {completedTasks}/{dailyTasks.length}
            </strong>
            <p>下一件：高数定积分训练</p>
          </article>
          <article className="metric-card">
            <span>本周学习时长</span>
            <strong>25.8h</strong>
            <p>计划 42h，当前达成 61%</p>
          </article>
          <article className="metric-card">
            <span>连续学习</span>
            <strong>23 天</strong>
            <p>近 7 天平均专注 5.1h</p>
          </article>
          <article className="metric-card">
            <span>预测总分</span>
            <strong>{totalCurrentScore}</strong>
            <p>距离目标 {totalTargetScore - totalCurrentScore} 分</p>
          </article>
          <article className="metric-card health">
            <span>学习健康度</span>
            <strong>78</strong>
            <p>节奏可控，专业课需补复习间隔</p>
          </article>
        </section>

        <section className="main-grid">
          <article className="panel today-panel" id="tasks">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Today</p>
                <h2>今日任务队列</h2>
              </div>
              <span className="panel-badge">4 项 · 5h55m</span>
            </div>
            <div className="task-list">
              {dailyTasks.map((task) => (
                <div className={`task-row ${task.state}`} key={task.name}>
                  <span className="task-state" aria-hidden="true" />
                  <div>
                    <strong>{task.name}</strong>
                    <p>
                      {task.subject} · {task.duration} · {task.priority}优先级
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">7 Days</p>
                <h2>学习时长趋势</h2>
              </div>
              <span className="panel-badge">实际 / 计划</span>
            </div>
            <div className="bar-chart" aria-label="最近七天学习时长">
              {weeklyHours.map((item) => (
                <div className="bar-column" key={item.day}>
                  <div className="bar-track">
                    <span
                      className="bar-plan"
                      style={{ height: `${(item.plan / 8) * 100}%` }}
                    />
                    <span
                      className="bar-done"
                      style={{ height: `${(item.done / 8) * 100}%` }}
                    />
                  </div>
                  <small>{item.day}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel subjects-panel" id="subjects">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Subjects</p>
                <h2>各科进度与状态</h2>
              </div>
              <span className="panel-badge">周配额追踪</span>
            </div>
            <div className="subject-grid">
              {subjects.map((subject) => (
                <div className="subject-item" key={subject.name}>
                  <div
                    className="progress-ring"
                    style={{
                      "--progress": `${subject.progress}%`,
                      "--ring-color": subject.color,
                    } as CSSProperties}
                    aria-label={`${subject.name}进度 ${subject.progress}%`}
                  >
                    <span>{subject.progress}%</span>
                  </div>
                  <div>
                    <strong>{subject.name}</strong>
                    <p>{subject.status}</p>
                    <small>{subject.hours}h / 本周</small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel mastery-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Mastery</p>
                <h2>知识掌握雷达</h2>
              </div>
              <span className="panel-badge">薄弱点优先</span>
            </div>
            <div className="radar-wrap">
              <div className="radar">
                {mastery.map((item, index) => (
                  <span
                    key={item.label}
                    className={`radar-point point-${index + 1}`}
                    style={{ "--power": `${item.value}%` } as CSSProperties}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
              <ul className="risk-list">
                <li>
                  <strong>高数积分</strong>
                  <span>进度落后 12%</span>
                </li>
                <li>
                  <strong>数据结构</strong>
                  <span>复习间隔 14 天</span>
                </li>
                <li>
                  <strong>英语单词</strong>
                  <span>连续 3 天未达标</span>
                </li>
              </ul>
            </div>
          </article>

          <article className="panel goals-panel" id="goals">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Targets</p>
                <h2>目标院校差距</h2>
              </div>
              <span className="panel-badge">总目标 380</span>
            </div>
            <div className="school-list">
              {schools.map((school) => (
                <div className="school-row" key={school.name + school.level}>
                  <span>{school.level}</span>
                  <div>
                    <strong>{school.name}</strong>
                    <p>{school.major}</p>
                  </div>
                  <b>差 {school.gap} 分</b>
                </div>
              ))}
            </div>
          </article>

          <article className="panel score-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Score</p>
                <h2>目标分数拆解</h2>
              </div>
              <span className="panel-badge">{totalCurrentScore} / {totalTargetScore}</span>
            </div>
            <div className="score-list">
              {scoreBreakdown.map((item) => (
                <div className="score-row" key={item.subject}>
                  <div>
                    <strong>{item.subject}</strong>
                    <span>
                      {item.current} / {item.target}
                    </span>
                  </div>
                  <div className="score-track">
                    <span style={{ width: `${(item.current / item.target) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel timeline-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Roadmap</p>
                <h2>阶段计划</h2>
              </div>
              <span className="panel-badge">目标-计划-反馈</span>
            </div>
            <div className="timeline">
              <div className="phase active">
                <span>2026.07 - 2027.02</span>
                <strong>基础准备期</strong>
                <p>数学基础、英语词汇、408 基础框架，兼顾建模训练。</p>
              </div>
              <div className="phase">
                <span>2027.03 - 2027.08</span>
                <strong>基础学习期</strong>
                <p>完成第一轮系统学习，形成章节级正确率记录。</p>
              </div>
              <div className="phase">
                <span>2027.09 - 2027.12</span>
                <strong>强化冲刺期</strong>
                <p>真题、套卷、错题回炉，按预测分数动态调整。</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
