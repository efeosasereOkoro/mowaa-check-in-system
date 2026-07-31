'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export type DayOption = { value: string; label: string };

/** Day picker for the reports view — navigates to /reports?day=<value>. */
export default function ReportDaySelect({ options, value }: { options: DayOption[]; value: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        startTransition(() => router.push(`/reports?day=${v}`));
      }}
      style={{
        height: 40,
        minWidth: 220,
        padding: '0 12px',
        background: '#fff',
        border: '1px solid #E0E0E0',
        borderBottom: '1px solid #8D8D8D',
        fontSize: 14,
        cursor: pending ? 'wait' : 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
