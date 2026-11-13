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

function buildSubmission(code, cases, checker) {
  const inputs = cases.map((test) => JSON.stringify(test.input)).join(",\n");
  if (checker !== "exact" && checker !== "two_sum") throw new Error("Unknown checker: " + checker);
  const expected = checker === "exact" ? `  const char* expected[] = {
${cases.map((test) => JSON.stringify(test.expected.trim())).join(",\n")}
  };` : "";
  const check = checker === "exact" ? `
      std::istringstream actual(result), correct(expected[i]);
      std::string got, want;
      bool valid = true;
      while (actual >> got) {
        if (!(correct >> want) || got != want) { valid = false; break; }
      }
      if (correct >> want) valid = false;` : `
      std::istringstream answer(result), test(inputs[i]);
      int n;
      long long target;
      test >> n >> target;
      std::vector<long long> values(n + 1);
      for (int j = 1; j <= n; ++j) test >> values[j];
      std::string first, second, extra;
      bool valid = bool(answer >> first) && bool(answer >> second) && !(answer >> extra);
      auto index = [n](const std::string& token) {
        if (token.empty()) return -1;
        int value = 0;
        for (char digit : token) {
          if (digit < '0' || digit > '9') return -1;
          value = value * 10 + digit - '0';
          if (value > n) return -1;
        }
        return value;
      };
      if (valid) {
        int left = index(first), right = index(second);
        valid = left >= 1 && left < right && right <= n &&
          values[left] + values[right] == target;
      }`;
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
    const size_t output_limit = ${checker === "exact" ? "std::max(size_t(65536), std::strlen(expected[i]) + size_t(4096))" : "65536"};
    while ((size = std::fread(buffer, 1, sizeof(buffer), output)) > 0) {
      result.append(buffer, size);
      if (result.size() > output_limit) break;
    }
    const char* state = WIFSIGNALED(status) && WTERMSIG(status) == SIGALRM
      ? "TLE" : WIFEXITED(status) && WEXITSTATUS(status) == 0 ? "OK" : "RE";
    if (result.size() > output_limit) state = "OLE";
    if (std::strcmp(state, "OK") == 0) {${check}
      state = valid ? "AC" : "WA";
    }
    std::printf("CASE %d %s ", i + 1, state);
    for (size_t j = 0; j < (std::strcmp(state, "AC") == 0 ? 0 : std::min(result.size(), size_t(240))); ++j)
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
    const match = /^CASE (\d+) (AC|WA|TLE|RE|OLE) ([0-9a-f]*)$/.exec(line);
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
      if (outputs[k].state !== "AC") {
        self.postMessage({
          type: "result", verdict: "RE",
          message: outputs[k].state === "OLE" ? `Test case ${k + 1} produced too much output.` : `Test case ${k + 1} failed to run.`
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
