'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = '', label, disabled, ...props }, ref) => {
    return (
      <label
        className={`inline-flex cursor-pointer items-center gap-3 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        } ${className}`}
      >
        <span className="relative inline-flex">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />

          {/* Track */}
          <span
            className="
              block h-6 w-11 rounded-full bg-muted
              ring-1 ring-inset ring-border
              transition-colors duration-200 ease-in-out
              peer-checked:bg-primary peer-checked:ring-primary
              peer-focus-visible:ring-2 peer-focus-visible:ring-ring
              peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
            "
          />

          {/* Thumb */}
          <span
            className="
              pointer-events-none absolute left-0.5 top-0.5
              flex h-5 w-5 items-center justify-center
              rounded-full bg-background shadow-sm
              transition-transform duration-200 ease-in-out
              peer-checked:translate-x-5
            "
          >
            {/* Check icon — fades in when checked */}
            <svg
              viewBox="0 0 12 12"
              fill="none"
              className="
                h-3 w-3 text-primary opacity-0
                transition-opacity duration-150
                peer-checked:opacity-100
              "
              aria-hidden="true"
            >
              <path
                d="M2.5 6.5L5 9L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>

        {label && (
          <span className="text-sm text-foreground select-none">{label}</span>
        )}
      </label>
    );
  },
);

Toggle.displayName = 'Toggle';

export { Toggle };