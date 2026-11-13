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

- Follow the AtCoder-style order: known time limit and score metadata below the page title, then Problem Statement, Constraints, Input, Output, and numbered Sample Input and Sample Output sections. Add Notes only when a standard term needs a separate definition. Omit unknown metadata, including memory limits. Add a short explanation after a sample when it clarifies the answer.
- State the given data, allowed choices or operations, the condition for a valid answer, and the objective in Problem Statement. Keep essential definitions and tie-breaking there; use Notes only for supporting terminology. Put numeric input limits in Constraints. Show the exact standard-input format in a code block under Input. Describe the accepted output, including multiple valid outputs or an empty answer, under Output.
- Use short paragraphs for distinct ideas. Use a list when it makes several operations or conditions easier to scan. Do not shorten the statement by moving rules needed to solve the problem into Notes.
- Use contest-style mathematical notation: uppercase letters for input sequences and scalar inputs, subscripts for elements, and lowercase letters for indices. Define every symbol when first used, and use it consistently through constraints, input, output, and examples. State the index base wherever indices are introduced. Do not write an entire sequence tuple in the opening when its name and length suffice.
- Give a central mathematical condition its own display line when embedding it in a paragraph makes the statement hard to scan. Keep the surrounding sentences short, especially on phones.
- Use short, precise English. Keep the source problem's meaning and numeric limits unless this judge deliberately defines a local variant. Do not invent time limits or constraints. Describe this site's actual standard-input and standard-output contract, even when a reference site uses a function signature.
- In LACS, use `A` and `B` for input sequences and `C` and `D` for chosen subsequences; write corresponding elements as `C_i` and `D_i`. In Two Sum, use `A` for the sequence, `N` for its length, `X` for the target sum, and `i,j` for the answer. Do not mix code-style brackets, numeric suffixes, and prime marks into these mathematical names.
- Introduce a symbol only when it identifies an input, an output, an essential quantity, or an indexed element. If a source uses different labels, preserve its meaning while using the published statement's chosen notation consistently. Resolve any conflict between source wording and examples explicitly.
- If this judge intentionally changes a source problem's input format, index base, or limits, state the local contract plainly in the problem text and tests. Do not imply that the local variant is an exact copy of the source problem.
- Keep each short mathematical expression together across line wraps; place separate `<var>` elements around expressions so no variable becomes wider than a phone screen.
- Define the position index before using it in a condition. Use a sequence tuple such as `A=(A_1,...,A_N)` only when it clarifies the length and element notation.
- Match each sample to its `.in` and `.out` pair and check any claim made in the explanation. When a tie-break rule matters, compare concrete valid choices in the sample explanation. Show sample input and output as plain preformatted text, without extra controls. Write original wording; use other judges for structure, not copied text.
- Give a single-case problem three numbered sample input/output pairs by default, choosing cases that illustrate different behaviors. For a problem whose input contains multiple test cases, decide the sample count from that format instead of forcing three pairs.

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
- Use AtCoder's Lato font for page text, loaded from Google Fonts, with `Helvetica Neue`, Arial, and sans-serif fallbacks. Set statement body text to 16px. Keep monospace for code and input/output blocks.
- Keep the problem page in one column at every screen width; do not place the editor beside the statement. Give the statement an AtCoder-like wide reading area rather than a narrow rounded card.
- Give statement section headings an AtCoder-like 23px desktop hierarchy. Show constraints as a list, put dividers before Input and each sample pair, and show input format and sample input/output in full-width gray preformatted blocks with readable spacing.
- Keep statement text at 16px with generous line spacing. Give the problem title visibly greater weight than the Code and Result headings.
- On phones, use a full-width white problem page with roughly 40px side padding for the statement and 23px statement headings. Render mathematical variables upright, without italics. Keep the editor controls usable at narrow widths.
- Keep keyboard focus visible on links, buttons, search, and the code editor. Maintain at least 4.5:1 contrast for normal text, including status labels and pagination. Wrap long titles on narrow screens. Remove styles when their elements are removed.

## `README.md`, `.gitignore`, and publishing

- README explains use and how to add a problem; this file holds the detailed rules. `.gitignore` excludes local artifacts while allowing `.in` and `.out` tests.
- `docs/` is the complete site. GitHub Pages publishes `main/docs`; keep `docs/.nojekyll`.
- When a CSS or JavaScript file changes, update its URL version in the HTML page that loads it so browsers receive the new behavior.
- Check JavaScript syntax, the list, and a problem in a browser. Test a real submission when judging code or submission flow changes.
- Commit and push site changes with matching problem files. Verify the public URL before reporting completion.
