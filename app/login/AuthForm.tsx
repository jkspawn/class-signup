"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "./actions";

const initialState: AuthState = { status: "idle", message: "" };

const inputClass =
  "border-0 border-b border-line bg-transparent px-1 pb-1.5 text-lg text-ink placeholder:text-line focus:border-ink focus:outline-none";

// 한 폼에서 로그인 / 회원가입: 누른 버튼의 intent 값으로 구분한다
export function AuthForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(authenticate, initialState);

  const message = state.message || notice || "";
  const tone =
    state.status === "info" ? "text-leaf" : message ? "text-red" : "";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-ink-soft">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-ink-soft">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="6자 이상"
          className={inputClass}
        />
      </div>

      {/* 로그인을 DOM에서 먼저 둬서 Enter 키가 로그인으로 제출되게 하고, 화면에선 오른쪽에 둔다 */}
      <div className="flex flex-row-reverse items-center justify-start gap-3 pt-1">
        <button
          type="submit"
          name="intent"
          value="login"
          disabled={pending}
          className="hand-edge shrink-0 border border-ink-soft bg-pencil px-5 py-1.5 font-hand text-[1.625rem] leading-tight text-[#283041] transition-colors enabled:hover:bg-pencil/75 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-line"
        >
          {pending ? "잠시만요" : "로그인"}
        </button>
        <button
          type="submit"
          name="intent"
          value="signup"
          disabled={pending}
          className="px-2 py-1.5 font-hand text-[1.625rem] leading-tight text-ink-soft underline decoration-line underline-offset-4 enabled:hover:text-ink disabled:cursor-not-allowed disabled:text-line"
        >
          회원가입
        </button>
      </div>

      <p aria-live="polite" className={`-mt-2 min-h-6 text-sm ${tone}`}>
        {message}
      </p>
    </form>
  );
}
