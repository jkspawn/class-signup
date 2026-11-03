"use client";

import { useActionState } from "react";
import { apply, type ApplyState } from "./actions";

const initialState: ApplyState = { status: "idle", message: "" };

// demo 모드: 서버로 보내지 않고 화면에 안내만 띄운다 (저장 없음)
async function demoApply(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "이름을 적어 주세요." };
  return {
    status: "success",
    message: `${name}님, 신청 버튼이 눌렸어요. 예시 화면이라 저장되지는 않아요.`,
  };
}

export function SignupForm({
  classId,
  closed,
  demo = false,
}: {
  classId: string;
  closed: boolean;
  demo?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    demo ? demoApply : apply,
    initialState,
  );

  const tone = state.status === "success" ? "text-leaf" : "text-red";

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="classId" value={classId} />
      <label htmlFor="name" className="text-sm text-ink-soft">
        이름
      </label>
      <div className="flex items-end gap-3">
        <input
          id="name"
          name="name"
          required
          maxLength={30}
          disabled={closed}
          autoComplete="name"
          placeholder={closed ? "신청을 받지 않아요" : "이름을 적어 주세요"}
          className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-1 pb-1.5 text-lg text-ink placeholder:text-line focus:border-ink focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={closed || pending}
          className="hand-edge shrink-0 border border-ink-soft bg-pencil px-5 py-1.5 font-hand text-[1.625rem] leading-tight text-[#283041] transition-colors enabled:hover:bg-pencil/75 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-line"
        >
          {closed ? "마감" : pending ? "신청 중" : "신청"}
        </button>
      </div>
      <p aria-live="polite" className={`min-h-6 text-sm ${tone}`}>
        {state.message}
      </p>
    </form>
  );
}
