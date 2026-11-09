# Anby's Judge

公開網站：[https://judge.lilac-sky-7383.chatgpt.site](https://judge.lilac-sky-7383.chatgpt.site)

這是練習用 C++20 線上判題網站。朋友拿到連結即可選題、貼程式、看判題結果，不需要帳號或安裝編譯器。網站使用 Judge0 執行程式；每次提交編譯一次，同次提交的測資以獨立子行程執行。

## 使用網站

1. 開啟首頁的題目總目錄。
2. 選一題，貼上完整的 C++20 程式。
3. 按「送出判題」，查看 AC、WA、CE、RE、TLE 或 ERROR。
4. 離開或重新整理前，複製需要保留的程式碼。網站不儲存提交紀錄。

ERROR 表示服務或判題流程有問題，不能當作答案錯誤。測資會隨靜態網站提供給瀏覽器，因此這是練習網站，不適合保密測資的正式競賽。

## 專案結構

```text
dist/
  index.html              題目總目錄
  problem.html            題目與提交頁
  problems.json           題目順序、名稱、測資數量與驗證方式
  catalog.js              總目錄畫面
  app.js                  題目切換、提交與進度
  judge-worker.js         載入測資、呼叫 Judge0、驗證答案
  style.css               網頁樣式
  problems/
    lacs/
      statement.html
      01.in
      01.out
      ...
    two-sum/
      statement.html
      01.in
      01.out
      ...
.openai/hosting.json      既有 Sites 專案設定
```

每個題目有自己的資料夾。`01.in` 是第一筆測資的標準輸入，`01.out` 是對應的參考輸出；第二筆用 `02.in`、`02.out`，依此類推。題號由 `problems.json` 的順序自動產生，從 `01` 起算；題數超過 99 時會顯示完整數字。調整題目順序會改變顯示題號，但題目 ID 和資料夾名稱應保持穩定。

## 新增題目

1. 在 `dist/problems/` 建立新資料夾，例如 `my-problem`。
2. 放入 `statement.html`，以及從 `01.in`、`01.out` 開始連續編號的測資。輸入與輸出都使用 UTF-8 文字檔。
3. 在 `dist/problems.json` 陣列最後加一筆，填入唯一的 `id`、`title`、`category`、`path`、`cases` 與 `checker`。`path` 例如 `problems/my-problem`；`cases` 是測資筆數。
4. 一般只有一組標準答案的題目，使用 `"checker": "exact"`。它會按空白分割後逐項比對 `.out`。若答案不唯一，需在 `dist/judge-worker.js` 的 `validOutput` 加入專用驗證規則；Two Sum 的 `two_sum` 是現成例子。
5. 在本機預覽並測試 AC、WA、CE，接著同步到 GitHub 與既有 Sites 網站。

範例題目設定：

```json
{
  "id": "my_problem",
  "title": "我的新題目",
  "category": "動態規劃",
  "path": "problems/my-problem",
  "cases": 3,
  "checker": "exact"
}
```

## 本機檢查與預覽

在專案根目錄執行：

```powershell
node --check dist/catalog.js
node --check dist/app.js
node --check dist/judge-worker.js
python -m http.server 8000 --directory dist
```

瀏覽器開啟 `http://localhost:8000`。判題仍需連線到 Judge0。直接雙擊 HTML 檔無法正常載入題目與測資，請用本機 HTTP 伺服器預覽。

## 發布

目前公開網址由 Sites 提供，Sites 的來源儲存在其管理的 Git 儲存庫，並非 GitHub Pages。更新網站時需將來源同步到既有 Sites 專案，儲存版本並發布；`.openai/hosting.json` 中的 `project_id` 不可改成新值。若也要在 GitHub 保留檔案，需另外推送同一份專案；單純推到 GitHub 不會自動更新目前的網站。
