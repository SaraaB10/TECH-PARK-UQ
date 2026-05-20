import clsx from 'clsx'

export default function Button({
                                   children,
                                   variant = 'primary',
                                   size = 'md',
                                   loading = false,
                                   disabled,
                                   className,
                                   ...props
                               }) {
    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-7 py-3.5 text-base gap-2.5',
    }

    const variants = {
        primary: 'btn-primary',
        ghost:   'btn-ghost',
        danger:  'btn-danger',
        success: 'btn-success',
    }

    return (
        <button
            className={clsx(
                'btn',
                sizes[size],
                variants[variant],
                (disabled || loading) && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span
                    className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                    style={{ borderTopColor: 'transparent' }}
                />
            )}
            {children}
        </button>
    )
}