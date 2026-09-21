import { forwardRef, type FormHTMLAttributes } from 'react';

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className = '', ...props }, ref) => {
    const classes = ['space-y-4', className].filter(Boolean).join(' ');
    return <form ref={ref} className={classes} {...props} />;
  },
);

Form.displayName = 'Form';

export { Form };