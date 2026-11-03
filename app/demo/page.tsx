import type { Metadata } from "next";
import { ClassInfo } from "../ClassInfo";
import { SignupForm } from "../SignupForm";

export const metadata: Metadata = { title: "원데이 클래스 신청 (예시)" };

// 저장 없이 예시 값으로만 채운 화면
const EXAMPLE = {
  title: "초보 손그림 원데이",
  when: "이번 주 토요일 14시",
  capacity: 10,
  taken: 3,
};

export default function DemoPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <section className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="-mb-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          예시 화면 · 신청 내용은 저장되지 않습니다
        </p>
        <ClassInfo {...EXAMPLE} />
        <SignupForm classId="demo" closed={false} demo />
      </section>
    </main>
  );
}
