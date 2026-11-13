# Anby's Judge

Website: [anbychang.github.io](https://anbychang.github.io/)

A small C++20 practice judge. Open a problem, paste a complete program, and submit it. The site does not save code or submissions.

## Add a problem

1. Add `docs/problems/<slug>/statement.html` and numbered input/output files such as `01.in` and `01.out`.
2. Add one entry to `docs/problems.json` with a stable `id`, English `title` and `category`, `path`, `cases`, and a checker from `docs/checkers.js`. Add a reusable checker there only if none fits.
3. Run `node checkers.test.mjs` if a checker changed. Preview with `python -m http.server 8000 --directory docs` and test the submission.
4. Push to `main`. GitHub Pages publishes `main/docs` automatically.

See [RULES.md](RULES.md) for the rules for each page and file type.

This is a practice site. Test case files are public and are not suitable for a contest that needs hidden tests.
