const template = "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n}";

const statement = document.getElementById("statement");
const code = document.getElementById("source-code");
const title = document.getElementById("problem-title");
const badge = document.getElementById("problem-badge");
const verdict = document.getElementById("verdict");
const status = document.getElementById("status");
const detail = document.getElementById("detail");
const runButton = document.getElementById("run-button");
const stopButton = document.getElementById("stop-button");
const progress = document.getElementById("run-progress");
const progressLabel = document.getElementById("progress-label");
const progressCount = document.getElementById("progress-count");
const progressTrack = document.getElementById("progress-track");
const progressFill = document.getElementById("progress-fill");
const progressStage = document.getElementById("progress-stage");
const progressElapsed = document.getElementById("progress-elapsed");
let activeProblem = null;
let worker = null;
let timeout = null;
let clock = null;
let startedAt = 0;
let totalCases = 0;

code.value = template;
const formatNumber = (number) => String(number).padStart(2, "0");
runButton.disabled = true;

function setResult(label, message, extra = "", kind = "neutral") {
  verdict.textContent = label;
  verdict.className = "verdict " + kind;
  status.textContent = message;
  detail.textContent = extra;
  detail.hidden = !extra;
}

function updateElapsed() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  progressElapsed.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" + String(seconds % 60).padStart(2, "0");
}

function setProgress(completed, total, label, stage) {
  totalCases = total;
  progress.hidden = false;
  progressLabel.textContent = label;
  progressCount.textContent = total ? completed + " / " + total : "準備中";
  progressStage.textContent = stage;
  progressTrack.setAttribute("aria-valuemax", String(total || 1));
  progressTrack.setAttribute("aria-valuenow", String(completed));
  progressFill.style.width = total ? (completed / total * 100) + "%" : "0%";
}

function finishProgress(label, stage) {
  progress.classList.remove("running");
  progressLabel.textContent = label;
  progressStage.textContent = stage;
}

function stopWorker() {
  clearTimeout(timeout);
  clearInterval(clock);
  if (worker) worker.terminate();
  worker = null;
  runButton.disabled = false;
  stopButton.hidden = true;
}

function fail(label, message, extra = "") {
  stopWorker();
  finishProgress("判題中斷", message);
  setResult(label, message, extra, "fail");
}

async function selectProblem(problem, number, total) {
  activeProblem = problem;
  title.textContent = problem.title;
  document.title = problem.title + " · Anby's Judge";
  badge.textContent = formatNumber(number) + " / " + formatNumber(total);
  progress.hidden = true;
  statement.textContent = "正在載入題目...";
  setResult("尚未送出", "送出程式碼後，結果會顯示在這裡。");

  try {
    const response = await fetch("./" + problem.path + "/statement.html");
    if (!response.ok) throw new Error("題目內容讀取失敗。");
    const html = await response.text();
    if (activeProblem === problem) statement.innerHTML = html;
  } catch (error) {
    if (activeProblem === problem) statement.textContent = "題目內容載入失敗，請重新整理。";
  }
}

async function loadProblems() {
  try {
    const response = await fetch("./problems.json");
    if (!response.ok) throw new Error("題目總目錄讀取失敗。");
    const problems = await response.json();
    if (!problems.length) throw new Error("尚無題目。");
    const requestedId = new URLSearchParams(location.search).get("id");
    const index = requestedId === null ? 0 : problems.findIndex((item) => item.id === requestedId);
    if (index < 0) throw new Error("找不到指定的題目。請返回總目錄。");
    await selectProblem(problems[index], index + 1, problems.length);
    runButton.disabled = false;
  } catch (error) {
    title.textContent = "題目載入失敗";
    statement.textContent = String(error);
  }
}

loadProblems();

runButton.addEventListener("click", () => {
  if (worker) return;
  if (!code.value.trim()) {
    setResult("尚未送出", "請先貼上完整的 C++ 程式。", "", "fail");
    code.focus();
    return;
  }

  const submittedCode = code.value;
  startedAt = Date.now();
  progressElapsed.textContent = "00:00";
  progress.classList.add("running");
  setProgress(0, 0, "準備判題", "正在啟動判題程式");
  clock = setInterval(updateElapsed, 1000);
  setResult("處理中", "正在準備遠端判題。", "", "pending");
  runButton.disabled = true;
  stopButton.hidden = false;
  progress.scrollIntoView({ behavior: "smooth", block: "nearest" });

  worker = new Worker("./judge-worker.js", { type: "module" });
  timeout = setTimeout(() => fail("ERROR", "遠端服務等待超過 60 秒，請重試。"), 60000);

  worker.onmessage = ({ data }) => {
    if (!worker) return;
    if (data.type === "ready") {
      setProgress(0, 0, "連線中", "正在準備測資");
      worker.postMessage({ problem: activeProblem.id, code: submittedCode });
    } else if (data.type === "batch") {
      setProgress(0, data.total, "遠端判題中", "正在編譯一次並執行全部測資");
      setResult("判題中", "正在等待 Judge0 回傳結果。", "", "pending");
    } else if (data.type === "case") {
      setProgress(data.index - 1, data.total, "正在核對測資 " + data.index + " / " + data.total, "遠端執行已完成");
    } else if (data.type === "case-done") {
      setProgress(data.index, data.total, "已通過 " + data.index + " / " + data.total, "正在核對輸出");
    } else if (data.type === "result") {
      if (data.verdict === "AC") setProgress(totalCases, totalCases, "判題完成", "全部測資通過");
      stopWorker();
      finishProgress(data.verdict === "AC" ? "判題完成" : "判題結束", data.message);
      setResult(data.verdict, data.message, data.detail || "", data.verdict === "AC" ? "ac" : "fail");
    }
  };
  worker.onerror = () => fail("ERROR", "判題程式載入失敗。請確認網路連線後重試。");
});

stopButton.addEventListener("click", () => {
  stopWorker();
  finishProgress("已停止", "你已停止這次判題");
  setResult("已停止", "判題已由你停止。");
});
