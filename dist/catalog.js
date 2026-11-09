const list = document.getElementById("problem-list");
const count = document.getElementById("problem-count");

try {
  const response = await fetch("./problems.json");
  if (!response.ok) throw new Error("無法讀取題目總目錄。");
  const problems = await response.json();
  count.textContent = problems.length + " 題";
  list.replaceChildren();

  problems.forEach((problem, index) => {
    const link = document.createElement("a");
    link.className = "catalog-item";
    link.href = "./problem.html?id=" + encodeURIComponent(problem.id);

    const number = document.createElement("span");
    number.className = "catalog-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const details = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = problem.title;
    const category = document.createElement("small");
    category.textContent = problem.category;
    details.append(title, category);

    const arrow = document.createElement("span");
    arrow.className = "catalog-arrow";
    arrow.textContent = "→";
    link.append(number, details, arrow);
    list.append(link);
  });
} catch (error) {
  list.textContent = "題目總目錄載入失敗，請重新整理。";
}
