"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** テーマは DOM 属性と OS 設定が持つ外部状態なので、React 側に複製せず読みに行く */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Theme {
  const saved = document.documentElement.dataset.theme;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** サーバーでは OS 設定を知りようがないので、確定するまでラベルを出さない */
function getServerSnapshot(): null {
  return null;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // プライベートモード等で保存できなくても、その場の切り替えは効かせる
    }
    for (const listener of listeners) listener();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"
      }
      className="rounded-md border border-hairline px-3 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
    >
      {theme === null ? "テーマ" : theme === "dark" ? "☀ ライト" : "☾ ダーク"}
    </button>
  );
}
