import clsx from 'clsx'

export function Input({ label, id, className, error, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={id} className="tp-label">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={clsx('tp-input', error && 'border-park-red', className)}
                {...props}
            />
            {error && (
                <span className="text-xs" style={{ color: 'var(--c-red)' }}>
          {error}
        </span>
            )}
        </div>
    )
}

export function Select({ label, id, children, className, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label htmlFor={id} className="tp-label">
                    {label}
                </label>
            )}
            <select
                id={id}
                className={clsx('tp-input tp-select', className)}
                {...props}
            >
                {children}
            </select>
        </div>
    )
}