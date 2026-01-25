// src/components/MisTurnosSkeleton.jsx
import React from "react";

function SkeletonLine({ w = "w-full", h = "h-3" }) {
  return (
    <div
      className={`${w} ${h} rounded-lg bg-slate-800/70 animate-pulse`}
    />
  );
}

export default function MisTurnosSkeleton({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 w-full">
              <div className="flex gap-2">
                <SkeletonLine w="w-24" h="h-5" />
                <SkeletonLine w="w-20" h="h-5" />
              </div>

              <SkeletonLine w="w-36" h="h-5" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <SkeletonLine w="w-56" h="h-4" />
                <SkeletonLine w="w-40" h="h-4" />
              </div>
            </div>

            <div className="hidden sm:block">
              <SkeletonLine w="w-28" h="h-9" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-800 pt-3 space-y-2">
            <SkeletonLine w="w-40" h="h-4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <SkeletonLine w="w-20" h="h-3" />
                <SkeletonLine w="w-24" h="h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <SkeletonLine w="w-24" h="h-3" />
                <SkeletonLine w="w-24" h="h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <SkeletonLine w="w-24" h="h-3" />
                <SkeletonLine w="w-24" h="h-4" />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <SkeletonLine w="w-28" h="h-9" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
