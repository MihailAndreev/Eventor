"use client";

import { useRouter } from "next/navigation";

type GroupFilterOption = {
  href: string;
  key: string;
  label: string;
};

type GroupFilterSelectProps = {
  options: GroupFilterOption[];
  selectedHref: string;
};

export function GroupFilterSelect({
  options,
  selectedHref,
}: GroupFilterSelectProps) {
  const router = useRouter();

  return (
    <select
      aria-label="Dashboard group filter"
      value={selectedHref}
      onChange={(event) => router.push(event.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[#0B6B8A] focus:ring-2 focus:ring-[#D5E8EF]"
    >
      {options.map((option) => (
        <option key={option.key} value={option.href}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
