import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAuthClient, getCurrentUser, getSupabase } from "@/lib/supabase-server";
import { signOut } from "./login/actions";
import { MySignup } from "./MySignup";
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

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <UserBar email={user.email} />
      <ClassDetails />
    </>
  );
}

function UserBar({ email }: { email: string }) {
  return (
    <div className="-mt-4 -mb-2 flex items-center justify-between gap-3 text-sm text-ink-soft">
      <span className="min-w-0 truncate">{email}</span>
      <form action={signOut}>
        <button
          type="submit"
          className="shrink-0 underline decoration-line underline-offset-4 hover:text-ink"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}

async function ClassDetails() {
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

  // 내 신청은 로그인한 사용자 권한으로 읽는다 (RLS: 자기 행만 보인다)
  const { data: mine, error: mineError } = await (await getAuthClient())
    .from("signups")
    .select("id, name, created_at")
    .eq("class_id", data.id)
    .maybeSingle<{ id: string; name: string; created_at: string }>();
  if (mineError) console.error("load my signup failed:", mineError);

  return (
    <>
      <ClassInfo
        title={data.title}
        when={dateFmt.format(new Date(data.starts_at))}
        capacity={data.capacity}
        taken={taken}
      />
      {mine ? (
        <MySignup
          signupId={mine.id}
          name={mine.name}
          appliedAt={dateFmt.format(new Date(mine.created_at))}
        />
      ) : (
        <SignupForm classId={data.id} closed={taken >= data.capacity} />
      )}
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
