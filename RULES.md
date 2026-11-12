# Judge rules

This repository file is the project specification. Update the relevant section when a rule changes. It is not agent memory.

## Shared language and navigation

- English is the source language for visible UI text, titles, topics, statements, and verdict messages. Use short, plain terms.
- The top-left brand mark and name are one link to the problem list on every page.
- On a problem page, the header has one short `Code` link to the editor. Keep the brand as the route back to the list.
- The site works without an account. Code and submission history are not saved.
- A future one-click translation control may translate the displayed statement. The English statement stays the only stored source. Translation does not change judging.

## `docs/index.html`: list page

- Show only the heading, search, column labels, real problem rows, and pagination when needed. Do not show marketing copy, counts of reserved positions, or placeholder rows.
- Place the heading and search on one toolbar at desktop widths and stack them on narrow screens. Keep the column labels attached to the row table.
- Use number, title, and topic columns on desktop. Keep number and title readable on mobile. Rows should be compact enough to scan without squeezing long titles.

## `docs/catalog.js`: list behavior

- Read real problems from `problems.json`. Each row links to `problem.html?id=<id>`.
- Search the displayed number (including its leading zero), title, and topic without renumbering filtered results. Announce the result count to assistive technology without adding visible clutter.
- Render only the current page, with 24 rows per page, so thousands of problems remain usable.
- Show one short English message for an empty search or a load failure.

## `docs/problem.html`: problem-page structure

- Use one vertical column in this order: statement, C++20 editor with progress, then result. The problem title is the page h1 and begins with its displayed number (for example, `01. Title`); statement sections and the editor/result titles are h2. Center the column on wide screens. Do not show the total problem count beside the title or duplicate section labels above headings.
- Keep the complete-program, standard-input, standard-output model. Do not add a separate Run action until its behavior is specified.

## `docs/app.js`: problem-page behavior

- Load one problem by stable URL `id`. Submit runs the full judge; Stop cancels a running submission.
- Show compilation or judging progress and completed case counts. Show AC, WA, CE, RE, TLE, or ERROR with a short English explanation. ERROR means judge or data failure.
- When judging finishes, fails, or is stopped, scroll the Result panel into view below the sticky header so the verdict is immediately visible.
- Do not change the editor layout or judging flow when doing list-only work.

## `docs/problems.json`: catalog data

- This is the only source of problem order and metadata. Array position determines the displayed number, starting at 1. Show numbers above 99 in full.
- Every entry has a unique stable `id`, English `title` and `category`, `path`, `cases`, and `checker`. Keep IDs and paths stable when editing titles.
- Add an entry only when its statement and every numbered test pair exist.

## `docs/problems/<slug>/statement.html`: problem text

- Follow the AtCoder-style order: known time limit and score metadata below the page title, then Problem Statement, Constraints, Input, Output, then numbered Sample Input and Sample Output sections. Omit unknown metadata, including memory limits. Add a short explanation after each sample when the answer needs explanation.
- Define terms and tie-breaking rules in Problem Statement. Put each numeric limit in a Constraints list. Show the exact standard-input format in a code block under Input. Describe the accepted output, including multiple valid outputs or an empty answer, under Output.
- Give a central mathematical condition its own display line when embedding it in a paragraph makes the statement hard to scan. Keep the surrounding sentences short, especially on phones.
- Use short, precise English. Keep the source problem's meaning and numeric limits; do not invent time limits or constraints. Describe this site's actual standard-input and standard-output contract, even when a reference site uses a function signature.
- Define every symbol before using it, including sequence lengths and index ranges. Preserve the source problem's variable names and prime marks; if the source contradicts its samples, resolve the contradiction explicitly in the published statement. Use uppercase letters for sequences and lowercase indexed letters for their elements, such as `S_1` and `s_{1,i}`; use primed symbols for chosen subsequences and their elements. Use conventional uppercase names such as `N` and `X` only for newly named quantities. Write mathematical indices as subscripts, not programming-style bracket expressions. Render mathematical variables with HTML `var`, `sub`, and `sup`; reserve `code` for literal code or input text.
- Match each sample to its `.in` and `.out` pair and check any claim made in the explanation. When a tie-break rule matters, compare concrete valid choices in the sample explanation. Show sample input and output as plain preformatted text, without extra controls. Write original wording; use other judges for structure, not copied text.

## `docs/problems/<slug>/*.in` and `*.out`: tests

- Pair `01.in` with `01.out`, then `02.in` with `02.out`, with no gaps. Use UTF-8 text. `cases` equals the number of pairs.
- Ordinary single-answer problems use `checker: "exact"`. Multiple-answer problems need a named checker in `judge-worker.js`.
- Test files are public on GitHub Pages. This site is for practice, not hidden-test contests.

## `docs/judge-worker.js`: execution and checking

- Keep execution separate from page rendering. Compile each submission once through Judge0 and run each test case in a separate child process.
- Preserve C++20, resource limits, and existing checkers unless the judging task explicitly changes them.
- Keep verdicts and diagnostic messages in English. Never put secrets in client code or test data.

## `docs/style.css`: visual rules

- Use one restrained light visual system. The problem list follows the compact structure of a coding problem list without copying another site's brand or artwork.
- Keep the problem page in one column at every screen width; do not place the editor beside the statement.
- Give statement section headings clear hierarchy. Show constraints as a list, put a divider before samples, and show input format and sample input/output in full-width gray preformatted blocks with readable spacing.
- Keep statement text at a readable size and limit line length on wide screens. Give the problem title visibly greater weight than the Code and Result headings.
- Keep keyboard focus visible on links, buttons, search, and the code editor. Maintain at least 4.5:1 contrast for normal text, including status labels and pagination. Wrap long titles on narrow screens. Remove styles when their elements are removed.

## `README.md`, `.gitignore`, and publishing

- README explains use and how to add a problem; this file holds the detailed rules. `.gitignore` excludes local artifacts while allowing `.in` and `.out` tests.
- `docs/` is the complete site. GitHub Pages publishes `main/docs`; keep `docs/.nojekyll`.
- When a CSS or JavaScript file changes, update its URL version in the HTML page that loads it so browsers receive the new behavior.
- Check JavaScript syntax, the list, and a problem in a browser. Test a real submission when judging code or submission flow changes.
- Commit and push site changes with matching problem files. Verify the public URL before reporting completion.
