async function loadProblem(id) {
  const catalogResponse = await fetch("./problems.json", { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error("Could not load problems.");
  const catalog = await catalogResponse.json();
  const problem = catalog.find((item) => item.id === id);
  if (!problem) throw new Error("Unknown problem.");
  const cases = await Promise.all(Array.from({ length: problem.cases }, async (_, index) => {
    const name = String(index + 1).padStart(2, "0");
    const base = "./" + problem.path + "/" + name;
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(base + ".in"), fetch(base + ".out")
    ]);
    if (!inputResponse.ok || !outputResponse.ok) throw new Error("Could not load test case " + name + ".");
    return { input: await inputResponse.text(), expected: await outputResponse.text() };
  }));
  return { problem, cases };
}

function validOutput(checker, output, test) {
  const parts = output.trim() ? output.trim().split(/\s+/) : [];
  if (checker === "exact") {
    const expectedParts = test.expected.trim() ? test.expected.trim().split(/\s+/) : [];
    return parts.length === expectedParts.length &&
      parts.every((part, i) => part === expectedParts[i]);
  }
  if (checker === "two_sum") {
    const [n, target, ...a] = test.input.trim().split(/\s+/).map(Number);
    if (parts.length !== 2 || !parts.every((part) => /^\d+$/.test(part))) return false;
    const i = Number(parts[0]), j = Number(parts[1]);
    return Number.isInteger(i) && Number.isInteger(j) && i >= 1 && i < j &&
      j <= n && a[i - 1] + a[j - 1] === target;
  }
  throw new Error("Unknown checker: " + checker);
}

function buildSubmission(code, cases, checker) {
  const inputs = cases.map((test) => JSON.stringify(test.input)).join(",\n");
  const largeOutput = checker === "binary_string";
  const expected = largeOutput ? `  const char* expected[] = {
${cases.map((test) => JSON.stringify(test.expected.trim())).join(",\n")}
  };` : "";
  return `#include <bits/stdc++.h>
#include <sys/wait.h>
#include <unistd.h>
struct JudgeRunner {
JudgeRunner() {
  const char* inputs[] = {
${inputs}
  };
${expected}
  FILE* input = std::fopen("judge_input.txt", "w+");
  FILE* output = std::fopen("judge_output.txt", "w+");
  if (!input || !output) std::exit(2);
  for (int i = 0; i < ${cases.length}; ++i) {
    std::rewind(input);
    ftruncate(fileno(input), 0);
    std::fputs(inputs[i], input);
    std::fflush(input);
    std::rewind(input);
    std::rewind(output);
    ftruncate(fileno(output), 0);
    std::fflush(stdout);
    pid_t child = fork();
    if (child < 0) std::exit(3);
    if (child == 0) {
      dup2(fileno(input), STDIN_FILENO);
      dup2(fileno(output), STDOUT_FILENO);
      alarm(3);
      return;
    }
    int status = 0;
    waitpid(child, &status, 0);
    std::rewind(output);
    std::string result;
    char buffer[4096];
    size_t size = 0;
    while ((size = std::fread(buffer, 1, sizeof(buffer), output)) > 0) {
      result.append(buffer, size);
      if (result.size() > ${largeOutput ? "std::strlen(expected[i]) + 4096" : "65536"}) break;
    }
    const char* state = WIFSIGNALED(status) && WTERMSIG(status) == SIGALRM
      ? "TLE" : WIFEXITED(status) && WEXITSTATUS(status) == 0 ? "OK" : "RE";
    if (result.size() > ${largeOutput ? "std::strlen(expected[i]) + 4096" : "65536"}) state = "OLE";
${largeOutput ? `    if (std::strcmp(state, "OK") == 0) {
      std::istringstream stream(result);
      std::string answer, extra;
      state = (stream >> answer) && !(stream >> extra) && answer == expected[i] ? "AC" : "WA";
    }` : ""}
    std::printf("CASE %d %s ", i + 1, state);
    for (size_t j = 0; j < (${largeOutput ? "std::strcmp(state, \"AC\") == 0 ? 0 : std::min(result.size(), size_t(240))" : "result.size()"}); ++j)
      std::printf("%02x", static_cast<unsigned char>(result[j]));
    std::printf("\\n");
  }
  std::exit(0);
}
};
static JudgeRunner judge_runner;
${code}
`;
}

function parseCaseResults(output, count) {
  const lines = output.replace(/\r?\n$/, "").split(/\r?\n/);
  if (lines.length !== count) throw new Error("Wrong number of judge results.");
  return lines.map((line, index) => {
    const match = /^CASE (\d+) (OK|AC|WA|TLE|RE|OLE) ([0-9a-f]*)$/.exec(line);
    if (!match || Number(match[1]) !== index + 1) {
      throw new Error("Invalid judge result format.");
    }
    const bytes = new Uint8Array(match[3].length / 2);
    for (let i = 0; i < bytes.length; ++i) {
      bytes[i] = parseInt(match[3].slice(i * 2, i * 2 + 2), 16);
    }
    return { state: match[2], output: new TextDecoder().decode(bytes) };
  });
}

async function runRemote(code, cases, checker) {
  const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_id: 105,
      source_code: buildSubmission(code, cases, checker),
      compiler_options: "-std=c++20 -O2 -DONLINE_JUDGE"
    })
  });
  if (!response.ok) throw new Error("Judge0 returned HTTP " + response.status);
  return response.json();
}

self.onmessage = async ({ data }) => {
  try {
    const { problem, cases } = await loadProblem(data.problem);
    self.postMessage({ type: "batch", total: cases.length });
    const result = await runRemote(data.code, cases, problem.checker);
    const statusId = result.status?.id;
    if (statusId === 6) {
      self.postMessage({
        type: "result", verdict: "CE", message: "Compilation error.",
        detail: (result.compile_output || "No compiler message was returned.").slice(-4000)
      });
      return;
    }
    if (statusId === 5) {
      self.postMessage({ type: "result", verdict: "TLE", message: "Submission timed out." });
      return;
    }
    if (statusId !== 3) {
      const serviceError = statusId == null || statusId === 1 || statusId === 2 || statusId === 13 || statusId === 14;
      self.postMessage({
        type: "result", verdict: serviceError ? "ERROR" : "RE",
        message: serviceError ? "Judge0 could not finish the submission." : "Runtime error.",
        detail: (result.stderr || result.message || result.status?.description || "Program exited unexpectedly.").slice(0, 1000)
      });
      return;
    }
    const outputs = parseCaseResults(result.stdout || "", cases.length);
    for (let k = 0; k < cases.length; ++k) {
      self.postMessage({ type: "case", index: k + 1, total: cases.length });
      if (outputs[k].state === "TLE") {
        self.postMessage({ type: "result", verdict: "TLE", message: `Test case ${k + 1} timed out.` });
        return;
      }
      if (outputs[k].state === "WA") {
        self.postMessage({
          type: "result", verdict: "WA", message: `Wrong answer on test case ${k + 1}.`,
          detail: `Input:\n${cases[k].input.slice(0, 240)}\nYour output:\n${outputs[k].output || "(empty)"}`
        });
        return;
      }
      if (outputs[k].state !== "OK" && outputs[k].state !== "AC") {
        self.postMessage({
          type: "result", verdict: "RE",
          message: outputs[k].state === "OLE" ? `Test case ${k + 1} produced too much output.` : `Test case ${k + 1} failed to run.`
        });
        return;
      }
      if (outputs[k].state !== "AC" && !validOutput(problem.checker, outputs[k].output, cases[k])) {
        self.postMessage({
          type: "result", verdict: "WA", message: `Wrong answer on test case ${k + 1}.`,
          detail: `Input:\n${cases[k].input.slice(0, 240)}\nYour output:\n${outputs[k].output.slice(0, 240) || "(empty)"}`
        });
        return;
      }
      self.postMessage({ type: "case-done", index: k + 1, total: cases.length });
    }
    self.postMessage({ type: "result", verdict: "AC", message: `Passed all ${cases.length} test cases.` });
  } catch (error) {
    self.postMessage({
      type: "result", verdict: "ERROR", message: "Judge or test data error.",
      detail: String(error).slice(0, 1000)
    });
  }
};

self.postMessage({ type: "ready" });
