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

test("server-renders the postgraduate study cockpit", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>考研学习驾驶舱<\/title>/i);
  assert.match(html, /目标-计划-执行-反馈-调整/);
  assert.match(html, /今日最重要/);
  assert.match(html, /三项任务/);
  assert.match(html, /科目推进/);
  assert.match(html, /当前最大风险/);
  assert.match(html, /学习健康度/);
  assert.match(html, /408 数据结构复习间隔过长/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("wires product interactions and removes starter preview code", async () => {
  const [page, cockpit, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/StudyCockpit.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /StudyCockpit/);
  assert.match(cockpit, /普通模式/);
  assert.match(cockpit, /专注模式/);
  assert.match(cockpit, /复盘模式/);
  assert.match(cockpit, /weight \* task\.lag \* task\.forgetRisk \* task\.urgency/);
  assert.match(cockpit, /window\.localStorage/);
  assert.match(cockpit, /导出学习记录/);
  assert.match(cockpit, /课程进度/);
  assert.match(cockpit, /综合掌握度/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(cockpit, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(previewRoot));
  await access(new URL("public/og.png", templateRoot));
});
