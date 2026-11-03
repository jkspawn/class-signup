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
    return <p className="text-rose-700">클래스 정보를 불러오지 못했습니다.</p>;
  }
  if (!data) {
    return <p>등록된 클래스가 없습니다.</p>;
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
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Suspense fallback={<p className="text-zinc-500">불러오는 중…</p>}>
          <ClassCard />
        </Suspense>
      </section>
    </main>
  );
}
