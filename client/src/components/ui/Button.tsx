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
  primary:
    'bg-green text-bg-base font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'border border-border text-text-2 hover:border-border-hover hover:text-text-1 disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'border border-red/30 bg-red-bg text-red hover:border-red/60 disabled:opacity-40 disabled:cursor-not-allowed',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-sm',
  md: 'text-sm px-4 py-2 rounded-md',
  lg: 'text-base px-6 py-3 rounded-lg',
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
        inline-flex items-center justify-center gap-2
        font-body transition-all duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
