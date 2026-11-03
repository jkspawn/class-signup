import { Suspense } from "react";
import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { ClassInfo } from "./ClassInfo";
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
    return <p className="text-red">클래스 정보를 불러오지 못했어요. 새로고침해 주세요.</p>;
  }
  if (!data) {
    return <p className="text-ink-soft">아직 열린 클래스가 없어요.</p>;
  }

  const taken = data.signups[0]?.count ?? 0;

  return (
    <>
      <ClassInfo
        title={data.title}
        when={dateFmt.format(new Date(data.starts_at))}
        capacity={data.capacity}
        taken={taken}
      />
      <SignupForm classId={data.id} closed={taken >= data.capacity} />
    </>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <section className="flex w-full max-w-[26rem] flex-col gap-8 rounded-[3px] bg-sheet px-6 pt-9 pb-6 shadow-[0_1px_0_var(--line),0_14px_32px_-26px_rgba(40,48,65,0.4)] sm:px-9">
        <Suspense fallback={<p className="text-ink-soft">자리를 세는 중…</p>}>
          <ClassCard />
        </Suspense>
      </section>
    </main>
  );
}
