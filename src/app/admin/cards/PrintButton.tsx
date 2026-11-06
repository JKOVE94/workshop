'use client';
export function PrintButton() {
  return <button onClick={() => window.print()} className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white">🖨 인쇄</button>;
}
