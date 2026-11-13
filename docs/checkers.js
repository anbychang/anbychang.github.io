export const checkers = {
  exact: {
    declarations: (cases) => `  const char* expected[] = {
${cases.map((test) => JSON.stringify(test.expected.trim())).join(",\n")}
  };`,
    outputLimit: "std::max(size_t(65536), std::strlen(expected[i]) + size_t(4096))",
    check: `
      std::istringstream actual(result), correct(expected[i]);
      std::string got, want;
      bool valid = true;
      while (actual >> got) {
        if (!(correct >> want) || got != want) { valid = false; break; }
      }
      if (correct >> want) valid = false;`
  },
  two_sum: {
    declarations: () => "",
    outputLimit: "65536",
    check: `
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
      }`
  }
};
