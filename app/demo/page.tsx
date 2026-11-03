import type { Metadata } from "next";
import { ClassInfo } from "../ClassInfo";
import { SignupForm } from "../SignupForm";

export const metadata: Metadata = { title: "원데이 클래스 신청 (예시)" };

// 저장 없이 예시 값으로만 채운 화면
const EXAMPLE = {
  title: "원데이 클래스",
  when: "이번 주 토요일 14시",
  capacity: 10,
  taken: 3,
};

export default function DemoPage() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <section className="flex w-full max-w-[26rem] flex-col gap-8 rounded-[3px] bg-sheet px-6 pt-9 pb-6 shadow-[0_1px_0_var(--line),0_14px_32px_-26px_rgba(40,48,65,0.4)] sm:px-9">
        <p className="-mt-4 -mb-4 text-sm text-ink-soft">
          예시 화면이에요. 신청해도 저장되지 않아요.
        </p>
        <ClassInfo {...EXAMPLE} />
        <SignupForm classId="demo" closed={false} demo />
      </section>
    </main>
  );
}
