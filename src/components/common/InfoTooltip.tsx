import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  text: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * A small "i" info button. Click to reveal a short plain-language
 * explanation in a popover; click outside (or the button again) to
 * close. Used sparingly, only next to terms that are genuinely hard
 * for a non-finance-literate user to parse at a glance.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, className = '', align = 'center' }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div className={`relative inline-flex ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="w-4 h-4 rounded-full bg-white/10 hover:bg-brand-green/30 text-text-tertiary hover:text-brand-lightGreen flex items-center justify-center text-[9px] font-bold border border-white/15 transition-colors shrink-0"
        aria-label="More information"
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 top-full ${alignClass} mt-2 w-64 p-3 rounded-xl dash-card-dark text-[11px] leading-relaxed text-text-secondary`}
        >
          {text}
        </div>
      )}
    </div>
  );
};
