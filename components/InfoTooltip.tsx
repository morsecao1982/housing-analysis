"use client";

import { useState, useRef } from "react";

interface Props {
  content: string;
  isLive?: boolean;
  children: React.ReactNode;
  width?: string;
}

export default function InfoTooltip({ content, isLive = false, children, width = "w-72" }: Props) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-baseline gap-1 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className={`border-b border-dashed ${isLive ? "border-blue-400" : "border-amber-400"}`}>
        {children}
      </span>
      <span className={`text-xs leading-none ${isLive ? "text-blue-400" : "text-amber-500"}`}>ⓘ</span>

      {show && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${width} z-50 pointer-events-none`}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-left">
            <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${isLive ? "text-blue-600" : "text-amber-600"}`}>
              <span>{isLive ? "⚡" : "📌"}</span>
              <span>{isLive ? "Live Data" : "Hardcoded Estimate"}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
          </div>
          {/* Arrow */}
          <div className="flex justify-center -mt-px">
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 -mt-1.5" />
          </div>
        </div>
      )}
    </span>
  );
}
