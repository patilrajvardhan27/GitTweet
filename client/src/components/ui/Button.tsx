import { Spinner } from './Spinner';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-green text-bg-base font-semibold',
    'shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_8px_rgba(0,240,122,0.2)]',
    'hover:brightness-110 hover:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_14px_rgba(0,240,122,0.3)]',
    'active:scale-[0.97] active:brightness-100',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
  ].join(' '),
  ghost: [
    'border border-border text-text-2',
    'hover:border-border-hover hover:text-text-1 hover:bg-bg-elevated',
    'active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'border border-red/25 bg-red-bg text-red',
    'hover:border-red/50 hover:bg-red/10',
    'active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-4 py-2 rounded-lg gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-body font-medium tracking-[-0.01em]
        transition-all duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size={13} />}
      {children}
    </button>
  );
}
