import { Suspense } from "react";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { SignupForm } from "./SignupForm";

type ClassRow = {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  signups: { count: number }[];
};

const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "full",
  timeStyle: "short",
});

async function ClassCard() {
  await connection(); // 항상 요청 시점의 최신 신청 수를 보여준다

  const { data, error } = await getSupabase()
    .from("classes")
    .select("id, title, starts_at, capacity, signups(count)")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ClassRow>();

  if (error) {
    console.error("load class failed:", error);
    return <p className="text-rose-700">클래스 정보를 불러오지 못했습니다.</p>;
  }
  if (!data) {
    return <p>등록된 클래스가 없습니다.</p>;
  }

  const taken = data.signups[0]?.count ?? 0;
  const remaining = Math.max(data.capacity - taken, 0);
  const closed = remaining === 0;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-snug">{data.title}</h1>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
            closed
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          {closed ? "마감" : "모집 중"}
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">일시</dt>
        <dd>{dateFmt.format(new Date(data.starts_at))}</dd>
        <dt className="text-zinc-500">정원</dt>
        <dd>{data.capacity}명</dd>
        <dt className="text-zinc-500">남은 자리</dt>
        <dd className="font-semibold">
          {closed ? "0석 (마감)" : `${remaining}석`}
        </dd>
      </dl>

      <SignupForm classId={data.id} closed={closed} />
    </>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Suspense fallback={<p className="text-zinc-500">불러오는 중…</p>}>
          <ClassCard />
        </Suspense>
      </section>
    </main>
  );
}
