import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "./AuthForm";

export const metadata: Metadata = { title: "로그인 · 원데이 클래스 신청" };

// 확인 메일 링크가 실패하면 /auth/callback 이 ?error=confirm 으로 보낸다
async function FormWithNotice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthForm
      notice={
        error === "confirm"
          ? "메일 링크가 만료됐거나 이미 사용됐어요. 다시 로그인해 주세요."
          : undefined
      }
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
      <section className="flex w-full max-w-[26rem] flex-col gap-8 rounded-[3px] bg-sheet px-6 pt-9 pb-6 shadow-[0_1px_0_var(--line),0_14px_32px_-26px_rgba(40,48,65,0.4)] sm:px-9">
        <header>
          <h1 className="font-hand text-[2.75rem] leading-none text-ink sm:text-5xl">
            로그인
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            로그인하면 클래스를 신청할 수 있어요. 처음이면 같은 칸에 적고
            회원가입을 눌러 주세요.
          </p>
        </header>
        <Suspense fallback={<AuthForm />}>
          <FormWithNotice
            searchParams={searchParams as Promise<{ error?: string }>}
          />
        </Suspense>
      </section>
    </main>
  );
}
