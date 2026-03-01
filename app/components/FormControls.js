'use client';

import { useRef, useState } from "react";

const baseIconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-900";

function EyeIcon({ hidden = false }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
        <path d="M9.4 5.5A10.7 10.7 0 0 1 12 5c5.4 0 9.3 5.1 10 7-.3.8-1.3 2.5-3 4" />
        <path d="M6.6 6.7C4.5 8.1 3.2 10 2 12c.5 1.2 2.8 5 7 6.4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function PasswordInput({ className = "", placeholder, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`min-w-0 flex-1 ${className}`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className={baseIconButtonClassName}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}

export function PickerInput({ className = "", type = "date", ...props }) {
  const inputRef = useRef(null);

  const openPicker = () => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus?.();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        {...props}
        ref={inputRef}
        type={type}
        onFocus={(event) => {
          props.onFocus?.(event);
          event.currentTarget.showPicker?.();
        }}
        className={`min-w-0 flex-1 ${className}`}
      />
      <button
        type="button"
        onClick={openPicker}
        className={baseIconButtonClassName}
        aria-label={`Open ${type} picker`}
        title="Open calendar"
      >
        <CalendarIcon />
      </button>
    </div>
  );
}
