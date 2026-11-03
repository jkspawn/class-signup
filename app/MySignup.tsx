"use client";

import { useActionState } from "react";
import { cancel, type CancelState } from "./actions";

const initialState: CancelState = { status: "idle", message: "" };

// 내가 이미 신청했을 때 신청 폼 대신 보여 준다
export function MySignup({
  signupId,
  name,
  appliedAt,
}: {
  signupId: string;
  name: string;
  appliedAt: string;
}) {
  const [state, formAction, pending] = useActionState(cancel, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("신청을 취소할까요? 자리는 다른 사람에게 돌아가요.")) e.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="signupId" value={signupId} />
      <h2 className="text-sm text-ink-soft">내 신청</h2>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg text-leaf">{name}님, 신청했어요</p>
          <p className="text-sm text-ink-soft">{appliedAt}</p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="hand-edge shrink-0 border border-ink-soft px-5 py-1.5 font-hand text-[1.625rem] leading-tight text-ink transition-colors enabled:hover:border-red enabled:hover:text-red disabled:cursor-not-allowed disabled:border-line disabled:text-line"
        >
          {pending ? "취소 중" : "신청 취소"}
        </button>
      </div>
      <p aria-live="polite" className="min-h-6 text-sm text-red">
        {state.message}
      </p>
    </form>
  );
}
