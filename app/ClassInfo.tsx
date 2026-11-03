// 클래스 제목·일시·남은 자리 표시 (메인과 /demo가 함께 사용)
export function ClassInfo({
  title,
  when,
  capacity,
  taken,
}: {
  title: string;
  when: string;
  capacity: number;
  taken: number;
}) {
  const remaining = Math.max(capacity - taken, 0);
  const closed = remaining === 0;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-snug">{title}</h1>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
            closed
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          {closed ? "마감" : "모집 중"}
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zinc-500">일시</dt>
        <dd>{when}</dd>
        <dt className="text-zinc-500">남은 자리</dt>
        <dd className="font-semibold tabular-nums">
          {remaining} / {capacity}
          {closed && " (마감)"}
        </dd>
      </dl>
    </>
  );
}
