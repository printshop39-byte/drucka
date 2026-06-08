"use client";

import type { ReactNode } from "react";

// Responsive editor layout:
// Desktop: [tool rail | canvas + tabs | right panel]
// Mobile: canvas first, then tools, then right panel — stacked, no overflow.
export default function EditorShell({
  topBar,
  toolRail,
  canvas,
  areaTabs,
  rightPanel,
}: {
  topBar: ReactNode;
  toolRail: ReactNode;
  canvas: ReactNode;
  areaTabs: ReactNode;
  rightPanel: ReactNode;
}) {
  return (
    <div className="wrap py-5">
      {/* Top editor bar */}
      <div className="bg-white border border-brand-border rounded-premium shadow-soft p-3 mb-4">
        {topBar}
      </div>

      <div className="grid gap-4 [grid-template-columns:88px_1fr_300px] max-[1100px]:[grid-template-columns:76px_1fr] max-[760px]:grid-cols-1">
        {/* Tool rail */}
        <div className="max-[760px]:order-2">{toolRail}</div>

        {/* Canvas + area tabs */}
        <div className="max-[760px]:order-1 min-w-0">
          <div className="bg-white border border-brand-border rounded-premium shadow-soft p-4">
            {canvas}
            <div className="mt-3">{areaTabs}</div>
          </div>
        </div>

        {/* Right panel — full width below canvas on <=1100px */}
        <div className="max-[1100px]:col-span-2 max-[760px]:col-span-1 max-[760px]:order-3">
          <div className="bg-white border border-brand-border rounded-premium shadow-soft p-4 md:sticky md:top-[88px]">
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
