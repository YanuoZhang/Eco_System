"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type InfoTooltipProps = {
  title?: string;
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
};

export default function InfoTooltip({ title, content, position = "bottom" }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // 80 * 4 (w-80 in pixels)
      const spacing = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case "bottom":
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "top":
          top = rect.top - spacing;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - tooltipWidth - spacing;
          break;
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + spacing;
          break;
      }

      // Keep tooltip within viewport
      const maxLeft = window.innerWidth - tooltipWidth - 16;
      left = Math.max(16, Math.min(left, maxLeft));

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const tooltip = isVisible && mounted && (
    <div
      className="fixed z-[99999] w-80 bg-slate-800 text-white text-sm rounded-lg shadow-2xl border border-slate-600 p-4"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {title && <div className="font-semibold text-blue-300 mb-2">{title}</div>}
      <div className="text-slate-200 leading-relaxed text-sm">{content}</div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <span className="font-bold">i</span>
      </button>

      {mounted && createPortal(tooltip, document.body)}
    </>
  );
}
