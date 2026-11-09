const list = document.getElementById("problem-list");
const search = document.getElementById("problem-search");
const previous = document.getElementById("previous-page");
const next = document.getElementById("next-page");
const pageStatus = document.getElementById("page-status");
const pagination = document.getElementById("pagination");

const pageSize = 24;
let problems = [];
let page = 0;

function makeRow(problem, number) {
  const row = document.createElement("li");
  const link = document.createElement("a");
  link.className = "problem-row";
  link.href = "./problem.html?id=" + encodeURIComponent(problem.id);

  const index = document.createElement("span");
  index.className = "problem-index";
  index.textContent = String(number).padStart(2, "0");
  const title = document.createElement("strong");
  title.textContent = problem.title;
  const topic = document.createElement("span");
  topic.className = "problem-topic";
  topic.textContent = problem.category;
  link.append(index, title, topic);
  row.append(link);
  return row;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const matches = problems.map((problem, index) => ({ problem, number: index + 1 }))
    .filter(({ problem, number }) => !query || (number + " " + problem.title + " " + problem.category)
      .toLowerCase().includes(query));
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  page = Math.min(page, totalPages - 1);
  list.replaceChildren(...matches.slice(page * pageSize, (page + 1) * pageSize)
    .map(({ problem, number }) => makeRow(problem, number)));
  if (!matches.length) {
    const empty = document.createElement("li");
    empty.className = "empty-list";
    empty.textContent = "No problems found.";
    list.append(empty);
  }
  pagination.hidden = totalPages === 1;
  pageStatus.textContent = (page + 1) + " / " + totalPages;
  previous.disabled = page === 0;
  next.disabled = page === totalPages - 1;
}

search.addEventListener("input", () => { page = 0; render(); });
previous.addEventListener("click", () => { page--; render(); });
next.addEventListener("click", () => { page++; render(); });

try {
  const response = await fetch("./problems.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load problems.");
  problems = await response.json();
  render();
} catch (error) {
  const message = document.createElement("li");
  message.className = "empty-list";
  message.textContent = "Could not load problems. Please refresh the page.";
  list.replaceChildren(message);
}
