const template = "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n}";

const statement = document.getElementById("statement");
const code = document.getElementById("source-code");
const title = document.getElementById("problem-title");
const verdict = document.getElementById("verdict");
const status = document.getElementById("status");
const detail = document.getElementById("detail");
const resultPanel = document.querySelector(".result-panel");
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
  progressCount.textContent = total ? completed + " / " + total : "Starting";
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
  finishProgress(label === "ERROR" ? "Error" : "Stopped", message);
  setResult(label, message, extra, "fail");
  resultPanel.scrollIntoView({ block: "start" });
}

async function selectProblem(problem, number) {
  activeProblem = problem;
  title.textContent = formatNumber(number) + ". " + problem.title;
  document.title = problem.title + " · Anby's Judge";
  progress.hidden = true;
  statement.textContent = "Loading problem...";
  setResult("Not submitted", "Submit code to see the result.");

  try {
    const response = await fetch("./" + problem.path + "/statement.html", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load the problem.");
    const html = await response.text();
    if (activeProblem === problem) statement.innerHTML = html;
  } catch (error) {
    if (activeProblem === problem) statement.textContent = "Could not load the problem. Please refresh the page.";
  }
}

async function loadProblems() {
  try {
    const response = await fetch("./problems.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load problems.");
    const problems = await response.json();
    if (!problems.length) throw new Error("No problems are available.");
    const requestedId = new URLSearchParams(location.search).get("id");
    const index = requestedId === null ? 0 : problems.findIndex((item) => item.id === requestedId);
    if (index < 0) throw new Error("Problem not found. Return to the problem list.");
    await selectProblem(problems[index], index + 1);
    runButton.disabled = false;
  } catch (error) {
    title.textContent = "Could not load problem";
    statement.textContent = String(error);
  }
}

loadProblems();

runButton.addEventListener("click", () => {
  if (worker) return;
  if (!code.value.trim()) {
    setResult("Not submitted", "Enter your C++ code first.", "", "fail");
    code.focus();
    return;
  }

  const submittedCode = code.value;
  startedAt = Date.now();
  progressElapsed.textContent = "00:00";
  progress.classList.add("running");
  setProgress(0, 0, "Preparing", "Starting judge");
  clock = setInterval(updateElapsed, 1000);
  setResult("Pending", "Preparing your submission.", "", "pending");
  runButton.disabled = true;
  stopButton.hidden = false;
  progress.scrollIntoView({ behavior: "smooth", block: "nearest" });

  worker = new Worker("./judge-worker.js?v=bulk-rng-1", { type: "module" });
  timeout = setTimeout(() => fail("ERROR", "The judge took over 60 seconds. Please retry."), 60000);

  worker.onmessage = ({ data }) => {
    if (!worker) return;
    if (data.type === "ready") {
      setProgress(0, 0, "Connecting", "Loading test cases");
      worker.postMessage({ problem: activeProblem.id, code: submittedCode });
    } else if (data.type === "batch") {
      setProgress(0, data.total, "Judging", "Compiling and running test cases");
      setResult("Judging", "Waiting for Judge0.", "", "pending");
    } else if (data.type === "case") {
      setProgress(data.index - 1, data.total, "Checking case " + data.index + " / " + data.total, "Run complete");
    } else if (data.type === "case-done") {
      setProgress(data.index, data.total, "Passed " + data.index + " / " + data.total, "Checking output");
    } else if (data.type === "result") {
      if (data.verdict === "AC") setProgress(totalCases, totalCases, "Complete", "All test cases passed");
      stopWorker();
      finishProgress(data.verdict === "AC" ? "Complete" : "Finished", data.message);
      setResult(data.verdict, data.message, data.detail || "", data.verdict === "AC" ? "ac" : "fail");
      resultPanel.scrollIntoView({ block: "start" });
    }
  };
  worker.onerror = () => fail("ERROR", "Could not start the judge. Check your connection and retry.");
});

stopButton.addEventListener("click", () => {
  stopWorker();
  finishProgress("Stopped", "Submission stopped");
  setResult("Stopped", "You stopped this submission.");
  resultPanel.scrollIntoView({ block: "start" });
});
