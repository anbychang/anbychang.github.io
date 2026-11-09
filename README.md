# Anby's Judge

網站：[https://anbychang.github.io/](https://anbychang.github.io/)

公開的 C++20 練習判題網站。選題、貼上程式、送出即可使用；不需要帳號。程式由 Judge0 編譯一次，再逐筆執行測資。程式碼與提交紀錄不會保存。

## 檔案規則

- `docs/` 是完整網站，也是 GitHub Pages 的發布來源。
- `docs/problems.json` 是唯一的題目總表。陣列順序就是顯示題號，題號從 `01` 開始，超過 99 題仍會顯示完整數字。題目 `id` 應固定且唯一。
- 每題一個 `docs/problems/<slug>/` 資料夾，內含 `statement.html` 與從 `01.in`、`01.out` 開始連續編號的 UTF-8 測資。
- 總目錄的 `03` 至 `22` 是 20 個排版預留位置，沒有題目檔案，也不能點擊。新增真題會依序取代預留位置；題數沒有 22 題上限。搜尋與分頁只顯示當前頁的卡片。
- 一般題目使用 `"checker": "exact"`，會按空白切分後比對輸出；多解題須在 `docs/judge-worker.js` 加入專用驗證規則。

## 新增題目

1. 建立 `docs/problems/<slug>/statement.html` 與 `01.in`、`01.out` 等測資。
2. 在 `docs/problems.json` 最後加入一筆：

```json
{
  "id": "my_problem",
  "title": "我的新題目",
  "category": "動態規劃",
  "path": "problems/my-problem",
  "cases": 1,
  "checker": "exact"
}
```

3. 在專案根目錄執行 `python -m http.server 8000 --directory docs`，開啟 `http://localhost:8000/` 檢查題目與判題。直接開啟 HTML 檔無法載入測資。
4. 將變更推送到 `main`。GitHub Pages 直接從 `main/docs` 自動發布，不需另外同步網站。

測資是公開網站檔案，因此這個網站適合個人練習，不適合需要保密測資的正式競賽。
