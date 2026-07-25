import { describe, expect, it } from "vitest";
import { formatAxisDate, formatDate, formatDays, formatPercent } from "./format";

describe("formatPercent", () => {
  it("小数第 2 位まで符号付きで表示する", () => {
    expect(formatPercent(-12.3)).toBe("-12.30%");
  });

  it("高値更新中は 0.00% と表示する", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("null は横棒にする", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatDate", () => {
  it("ISO 日付をスラッシュ区切りにする", () => {
    expect(formatDate("2024-01-02")).toBe("2024/01/02");
  });

  it("null は横棒にする", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatAxisDate", () => {
  it("年と月だけにする", () => {
    expect(formatAxisDate("2024-01-02")).toBe("2024/01");
  });
});

describe("formatDays", () => {
  it("桁区切りを入れる", () => {
    expect(formatDays(1234)).toBe("1,234日");
  });

  it("0 日も表示する", () => {
    expect(formatDays(0)).toBe("0日");
  });
});
