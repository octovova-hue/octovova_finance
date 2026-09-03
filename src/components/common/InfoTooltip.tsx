import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  text: string;
  className?: string;
  /** Kept for backwards compatibility with existing call sites; positioning
   * is now computed dynamically from the trigger's on-screen location, so
   * this is only used as a slight initial bias, not a hard rule. */
  align?: 'left' | 'center' | 'right';
}

const POPOVER_WIDTH = 256; // matches w-64

/**
 * A small "i" info button. Click to reveal a short plain-language
 * explanation in a popover; click outside (or the button again) to
 * close. Used sparingly, only next to terms that are genuinely hard
 * for a non-finance-literate user to parse at a glance.
 *
 * The popover is rendered through a portal directly into document.body
 * and positioned with `fixed` screen coordinates. This is deliberate:
 * several cards in this app use backdrop-filter (the .glass-card /
 * .dash-card-* utilities), which creates a new CSS stacking context.
 * A tooltip nested normally in the DOM can end up rendering *behind*
 * a later sibling card no matter how high its z-index is set, because
 * z-index only resolves within the nearest stacking context. Escaping
 * to document.body sidesteps that entirely.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    // Keep it fully on-screen with an 8px margin on either side
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8));
    const top = rect.bottom + 8;
    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="w-4 h-4 rounded-full bg-surface hover:bg-brand-green/30 text-text-tertiary hover:text-brand-lightGreen flex items-center justify-center text-[9px] font-bold border border-border transition-colors shrink-0"
        aria-label="More information"
        aria-expanded={open}
      >
        i
      </button>

      {open && coords &&
        createPortal(
          <div
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: POPOVER_WIDTH }}
            className="z-[9999] p-3 rounded-xl dash-card-dark text-[11px] leading-relaxed text-text-secondary"
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  );
};
