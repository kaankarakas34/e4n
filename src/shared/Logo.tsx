import * as React from 'react';
import { cn } from '../lib/utils';
import logoSrc from '../assets/e4n-logo.png';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'icon';
}

export function Logo({ className, variant = 'default', ...props }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center justify-center', className)} {...props}>
        <img src={logoSrc} alt="E4N" width={48} height={48} className="h-8 w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <img src={logoSrc} alt="Event4Network" width={48} height={48} className="h-12 w-auto object-contain" />
      <div className="text-left hidden sm:block">
        <span className="block text-xl font-bold text-gray-900 leading-tight">Event4Network</span>
        <p className="text-[10px] text-gray-500 font-medium">Networking Platform</p>
      </div>
    </div>
  );
}