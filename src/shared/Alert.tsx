import * as React from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
      destructive: 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-100',
      success: 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-100',
      warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100',
      error: 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-100',
    };
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start">
          <div className="flex-1">{children}</div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-md text-current hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Kapat</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };