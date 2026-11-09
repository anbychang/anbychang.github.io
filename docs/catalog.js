const list = document.getElementById("problem-list");
const count = document.getElementById("problem-count");
const search = document.getElementById("problem-search");
const previous = document.getElementById("previous-page");
const next = document.getElementById("next-page");
const pageStatus = document.getElementById("page-status");
const pagination = document.getElementById("pagination");

const pageSize = 24;
const previewSlots = 20;
let problems = [];
let page = 0;

function makeItem(problem, number) {
  const item = document.createElement(problem ? "a" : "div");
  item.className = problem ? "catalog-item" : "catalog-item catalog-placeholder";
  if (problem) item.href = "./problem.html?id=" + encodeURIComponent(problem.id);

  const index = document.createElement("span");
  index.className = "catalog-number";
  index.textContent = String(number).padStart(2, "0");

  const details = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = problem ? problem.title : "預留題目";
  const category = document.createElement("small");
  category.textContent = problem ? problem.category : "尚未建立";
  details.append(title, category);
  item.append(index, details);
  return item;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const matches = problems.map((problem, index) => ({ problem, number: index + 1 }))
    .filter(({ problem, number }) => !query || (number + " " + problem.title + " " + problem.category)
      .toLocaleLowerCase().includes(query));
  if (!query) {
    for (let number = problems.length + 1; number <= Math.max(problems.length, previewSlots + 2); number++) {
      matches.push({ problem: null, number });
    }
  }

  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, totalPages - 1);
  list.replaceChildren(...matches.slice(page * pageSize, (page + 1) * pageSize)
    .map(({ problem, number }) => makeItem(problem, number)));
  if (!matches.length) list.textContent = "找不到符合的題目。";

  count.textContent = query ? "找到 " + matches.length + " 題" : problems.length + " 題已建立 · " +
    Math.max(0, previewSlots + 2 - problems.length) + " 個預留位置";
  pagination.hidden = totalPages === 1;
  pageStatus.textContent = (page + 1) + " / " + totalPages;
  previous.disabled = page === 0;
  next.disabled = page === totalPages - 1;
}

search.addEventListener("input", () => { page = 0; render(); });
previous.addEventListener("click", () => { page--; render(); });
next.addEventListener("click", () => { page++; render(); });

try {
  const response = await fetch("./problems.json");
  if (!response.ok) throw new Error("無法讀取題目總目錄。");
  problems = await response.json();
  render();
} catch (error) {
  list.textContent = "題目總目錄載入失敗，請重新整理。";
}
