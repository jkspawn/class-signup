"use client";

import { useActionState } from "react";
import { apply, type ApplyState } from "./actions";

const initialState: ApplyState = { status: "idle", message: "" };

export function SignupForm({
  classId,
  closed,
}: {
  classId: string;
  closed: boolean;
}) {
  const [state, formAction, pending] = useActionState(apply, initialState);

  const tone =
    state.status === "success"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-rose-700 dark:text-rose-400";

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="classId" value={classId} />
      <label htmlFor="name" className="text-sm font-medium">
        이름
      </label>
      <div className="flex gap-2">
        <input
          id="name"
          name="name"
          required
          maxLength={30}
          disabled={closed}
          placeholder={closed ? "마감되었습니다" : "이름을 입력하세요"}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 dark:disabled:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={closed || pending}
          className="rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:disabled:bg-zinc-600"
        >
          {closed ? "마감" : pending ? "신청 중…" : "신청"}
        </button>
      </div>
      <p aria-live="polite" className={`min-h-5 text-sm ${tone}`}>
        {state.message}
      </p>
    </form>
  );
}
