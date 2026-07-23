import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the high-fidelity study dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>研途驾驶舱 \| Kaoyan Study Dashboard<\/title>/i);
  assert.match(html, /首页总览/);
  assert.match(html, /今天该做什么、进度在哪里、风险有多大/);
  assert.match(html, /今日任务完成率/);
  assert.match(html, /本周有效学习/);
  assert.match(html, /学习健康度/);
  assert.match(html, /当前预测分/);
  assert.match(html, /今日关键任务/);
  assert.match(html, /科目进度/);
  assert.match(html, /学习趋势/);
  assert.match(html, /风险提醒/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("wires the complete product workflow and responsive design system", async () => {
  const [page, dashboard, data, layout, styles, packageJson, designSystem] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/KaoyanDashboard.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/study-data.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../DESIGN_SYSTEM.md", import.meta.url), "utf8"),
    ]);

  assert.match(page, /KaoyanDashboard/);
  assert.match(dashboard, /首页总览/);
  assert.match(dashboard, /今日学习/);
  assert.match(dashboard, /学习计划/);
  assert.match(dashboard, /科目进度/);
  assert.match(dashboard, /错题本/);
  assert.match(dashboard, /测试成绩/);
  assert.match(dashboard, /学习报告/);
  assert.match(dashboard, /数学建模/);
  assert.match(dashboard, /专注模式/);
  assert.match(dashboard, /今日错题复习/);
  assert.match(dashboard, /window\.localStorage/);
  assert.match(dashboard, /学习数据已导出/);
  assert.match(data, /树与二叉树错题回炉/);
  assert.match(data, /总体掌握度|accuracy/);
  assert.match(styles, /\[data-theme="dark"\]/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /\.mobile-bottom-nav/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /\/og\.png/);
  assert.match(designSystem, /设计令牌/);
  assert.match(designSystem, /响应式/);
  assert.match(packageJson, /lucide-react/);
  assert.match(packageJson, /recharts/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(dashboard, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(previewRoot));
  await access(new URL("public/og.png", templateRoot));
});
