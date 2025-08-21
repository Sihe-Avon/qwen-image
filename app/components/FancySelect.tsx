"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { label: string; value: string };

export default function FancySelect({
  options,
  value,
  onChange,
  className = "",
  placeholder,
  size = "md",
}: {
  options: Option[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
  placeholder?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const opt = options[activeIndex];
        onChange?.(opt.value);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, activeIndex, onChange]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`ui-input w-full flex items-center justify-between ${size === "sm" ? "ui-input--sm" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${size === "sm" ? "text-[13px]" : "text-[14px]"}`}>{selected?.label ?? placeholder ?? "Select"}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 z-50 glass-card overflow-hidden">
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
            {options.map((opt, i) => {
              const isActive = i === activeIndex;
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                  className={`px-3 ${size === "sm" ? "h-9 text-[13px]" : "h-10 text-[14px]"} flex items-center cursor-pointer ${
                    isActive ? "bg-[#eef2ff]" : "bg-transparent"
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}


