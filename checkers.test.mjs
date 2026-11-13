import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { checkers } from "./docs/checkers.js";

function runChecker(name, cases, outputs) {
  const method = checkers[name];
  const source = `#include <bits/stdc++.h>
int main() {
  const char* inputs[] = {${cases.map((test) => JSON.stringify(test.input)).join(",")}};
  ${method.declarations(cases)}
  const char* outputs[] = {${outputs.map((output) => JSON.stringify(output)).join(",")}};
  for (int i = 0; i < ${cases.length}; ++i) {
    std::string result(outputs[i]);
    const size_t output_limit = ${method.outputLimit};
    if (output_limit < result.size()) { std::cout << "OLE "; continue; }
    ${method.check}
    std::cout << (valid ? "AC " : "WA ");
  }
}`;
  writeFileSync(".checker-probe.cpp", source);
  execFileSync("g++", ["-std=c++20", "-O2", ".checker-probe.cpp", "-o", ".checker-probe.exe"]);
  return execFileSync(".checker-probe.exe", [], { encoding: "utf8" }).trim();
}

try {
  const exact = [
    { input: "", expected: "1 2\n" },
    { input: "", expected: "1 2\n" },
    { input: "", expected: "\n" },
    { input: "", expected: "01".repeat(100000) + "\n" }
  ];
  assert.equal(runChecker("exact", exact, ["1   2\n", "1 3\n", "\n", "01".repeat(100000) + "\n"]), "AC WA AC AC");
  const pairs = Array.from({ length: 5 }, () => ({ input: "4 9\n2 7 6 3\n", expected: "1 2\n" }));
  assert.equal(runChecker("two_sum", pairs, ["3 4\n", "1 1\n", "1 2 3\n", "01 02\n", "999999999999 2\n"]), "AC WA WA AC WA");

  const context = { self: { postMessage() {} }, TextDecoder, checkers };
  const worker = readFileSync("docs/judge-worker.js", "utf8").replace(/^import[^\r\n]*\r?\n/, "");
  vm.runInNewContext(worker + "\nglobalThis.build = buildSubmission; globalThis.parse = parseCaseResults;", context);
  for (const name of Object.keys(checkers)) {
    const generated = context.build("int main() {}", pairs, name);
    assert.match(generated, /state = valid \? "AC" : "WA"/);
  }
  assert.equal(context.parse("CASE 1 AC \n", 1)[0].state, "AC");
  console.log("Checker registry, compiled methods, and worker protocol passed.");
} finally {
  rmSync(".checker-probe.cpp", { force: true });
  rmSync(".checker-probe.exe", { force: true });
}
