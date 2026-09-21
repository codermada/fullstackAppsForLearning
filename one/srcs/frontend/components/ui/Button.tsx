import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-ring ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  outline: 'border border-input bg-background text-foreground hover:bg-muted',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10 p-0',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const classes = [base, variants[variant], sizes[size], className]
      .filter(Boolean)
      .join(' ');
    return <button ref={ref} type={type} className={classes} {...props} />;
  },
);

Button.displayName = 'Button';
export { Button };
export type { Variant as ButtonVariant, Size as ButtonSize };