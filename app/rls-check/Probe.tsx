"use client";

import { useActionState, useState } from "react";
import { probe, type ProbeState } from "./actions";
import type { ProbeResult } from "./probes";

const initialState: ProbeState = { history: [], notice: "" };

const timeFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  timeStyle: "medium",
});

export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
    >
      {copied ? "복사됨" : "ID 복사"}
    </button>
  );
}

export function Probe() {
  const [state, formAction, pending] = useActionState(probe, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="target" className="text-sm text-ink-soft">
          신청 ID (다른 계정의 신청 ID를 붙여 넣기)
        </label>
        <input
          id="target"
          name="target"
          autoComplete="off"
          spellCheck={false}
          placeholder="예: 3f2b…-…"
          className="border-0 border-b border-line bg-transparent px-1 pb-1.5 font-mono text-sm text-ink placeholder:text-line focus:border-ink focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" name="intent" value="select" disabled={pending} className={btn}>
            이 ID 조회
          </button>
          <button
            type="submit"
            name="intent"
            value="delete"
            disabled={pending}
            className={`${btn} enabled:hover:border-red enabled:hover:text-red`}
          >
            이 ID 취소(삭제)
          </button>
          <button type="submit" name="intent" value="mine" disabled={pending} className={btn}>
            내 신청 목록 다시 조회
          </button>
        </div>
        <p aria-live="polite" className="min-h-5 text-sm text-red">
          {pending ? <span className="text-ink-soft">요청 보내는 중…</span> : state.notice}
        </p>
      </form>

      <section aria-labelledby="log-title" className="flex flex-col gap-3">
        <h2 id="log-title" className="text-sm text-ink-soft">
          요청 기록 (최근 것이 위)
        </h2>
        {state.history.length === 0 ? (
          <p className="text-sm text-line">아직 보낸 요청이 없어요.</p>
        ) : (
          state.history.map((r) => <ResultCard key={r.key} r={r} />)
        )}
      </section>
    </div>
  );
}

const btn =
  "hand-edge border border-ink-soft px-3 py-1 text-sm text-ink transition-colors enabled:hover:bg-pencil/40 disabled:cursor-not-allowed disabled:border-line disabled:text-line";

function ResultCard({ r }: { r: ProbeResult }) {
  return (
    <article className="flex flex-col gap-2 border border-line/60 p-3 text-sm">
      <header className="flex items-baseline justify-between gap-2">
        <strong className="text-ink">{r.label}</strong>
        <span className="text-xs text-ink-soft">{timeFmt.format(new Date(r.at))}</span>
      </header>
      <code className="break-all text-xs text-ink-soft">{r.request}</code>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-ink-soft">HTTP 상태</dt>
        <dd className="font-mono">
          {r.status} {r.statusText}
        </dd>
        <dt className="text-ink-soft">응답 행 수</dt>
        <dd className="font-mono">{r.rows}건</dd>
        <dt className="text-ink-soft">DB 변경 건수</dt>
        <dd className={`font-mono ${r.changed > 0 ? "text-red" : ""}`}>{r.changed}건</dd>
        <dt className="text-ink-soft">오류</dt>
        <dd className="font-mono break-all">
          {r.error ? `${r.error.code} ${r.error.message}` : "없음"}
        </dd>
      </dl>
      <details>
        <summary className="cursor-pointer text-xs text-ink-soft">응답 본문(JSON)</summary>
        <pre className="mt-1 overflow-x-auto bg-paper p-2 text-xs">
          {JSON.stringify({ error: r.error, data: r.data }, null, 2)}
        </pre>
      </details>
    </article>
  );
}
