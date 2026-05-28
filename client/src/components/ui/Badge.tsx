interface BadgeProps {
  variant?: 'success' | 'warning' | 'neutral' | 'blue';
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  success: 'bg-green-bg text-green border border-green-border',
  warning: 'bg-amber-bg text-amber border border-amber/20',
  neutral: 'bg-bg-elevated text-text-2 border border-border',
  blue:    'bg-blue-bg text-blue border border-blue/20',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        text-xs font-mono rounded-sm font-medium
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}
