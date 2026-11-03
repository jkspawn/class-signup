import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase-server";
import { CopyId, Probe } from "./Probe";
import { selectMine } from "./probes";

export const metadata: Metadata = { title: "권한 테스트 · 원데이 클래스 신청" };

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

type Row = { id: string; class_id: string; user_id: string; name: string; created_at: string };

// 일반 사용자 권한 테스트: 이 화면의 모든 요청은 로그인한 사용자의 세션으로만 보낸다 (서버 키 없음)
async function Checker() {
  await connection(); // 요청 때마다 최신 세션·신청으로 그린다
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const mine = await selectMine();
  const rows = (Array.isArray(mine.data) ? mine.data : []) as Row[];

  return (
    <>
      <section className="flex flex-col gap-1 text-sm">
        <h2 className="text-ink-soft">지금 로그인한 계정</h2>
        <p className="text-lg text-ink">{user.email}</p>
        <p className="font-mono text-xs break-all text-ink-soft">user_id: {user.id}</p>
      </section>

      <section aria-labelledby="mine-title" className="flex flex-col gap-2">
        <h2 id="mine-title" className="text-sm text-ink-soft">
          내 신청 목록 — 이 계정 세션으로 조건 없이 조회한 결과 ({rows.length}건
          {mine.error ? `, 오류 ${mine.error.code}` : ""})
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-line">
            보이는 신청이 없어요. 신청 화면에서 먼저 신청하면 여기에 ID가 나와요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
                <div className="min-w-0">
                  <p className="text-ink">
                    {r.name} <span className="text-xs text-ink-soft">· {dateFmt.format(new Date(r.created_at))}</span>
                  </p>
                  <p className="font-mono text-xs break-all text-ink-soft">신청 ID: {r.id}</p>
                </div>
                <CopyId id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="probe-title" className="flex flex-col gap-2">
        <h2 id="probe-title" className="text-sm text-ink-soft">
          이 계정 세션으로 요청 보내기
        </h2>
        <Probe />
      </section>
    </>
  );
}

export default function RlsCheckPage() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <section className="flex w-full max-w-2xl flex-col gap-8 rounded-[3px] bg-sheet px-6 pt-9 pb-6 shadow-[0_1px_0_var(--line),0_14px_32px_-26px_rgba(40,48,65,0.4)] sm:px-9">
        <header className="flex flex-col gap-3">
          <h1 className="font-hand text-[2.75rem] leading-none text-ink sm:text-5xl">권한 테스트</h1>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
            <li>A 계정으로 로그인해 신청한 뒤, 이 화면의 내 신청 목록에서 신청 ID를 복사해요.</li>
            <li>다른 창(시크릿 창)에서 B 계정으로 로그인해 이 화면을 열고, A의 ID로 조회·취소를 눌러요.</li>
            <li>
              정상이라면 B의 요청은 <b>응답 행 0건, DB 변경 0건</b>이에요.
            </li>
            <li>A 창에서 &lsquo;내 신청 목록 다시 조회&rsquo;를 눌러 A의 신청이 그대로 남았는지 확인해요.</li>
          </ol>
          <p className="text-xs text-ink-soft">
            요청은 서버 키 없이 로그인 세션으로만 보내요. 인증 토큰은 화면과 로그에 나오지 않아요.{" "}
            <Link href="/" className="underline decoration-line underline-offset-4 hover:text-ink">
              신청 화면으로
            </Link>
          </p>
        </header>
        <Suspense fallback={<p className="text-ink-soft">계정 확인 중…</p>}>
          <Checker />
        </Suspense>
      </section>
    </main>
  );
}
