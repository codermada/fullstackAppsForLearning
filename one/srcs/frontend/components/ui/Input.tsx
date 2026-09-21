import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const classes = [
      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
      'text-foreground placeholder:text-muted-foreground',
      'focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} type={type} className={classes} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };