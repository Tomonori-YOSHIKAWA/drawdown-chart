import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ドローダウンチャート | 主要インデックスの最高値からの下落率",
  description:
    "S&P 500・NASDAQ 100・ACWI・SCHD など主要インデックスと ETF の日次ドローダウン（過去最高値からの下落率）を比較できるチャート。",
};

/**
 * 描画前に保存済みテーマを適用するスクリプト。
 * React のマウントを待つと、一瞬だけ逆のテーマが見えてしまうため。
 */
const THEME_INIT = `
try {
  var t = localStorage.getItem("theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
