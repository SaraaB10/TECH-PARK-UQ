import clsx from 'clsx'

export function Input({ label, id, className, error, ...props }) {
// Para inputs numéricos: impedir valores negativos por defecto
    const extraNumProps = props.type === 'number'
        ? {
            min: props.min !== undefined ? props.min : '0',
            onKeyDown: (e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault()
                props.onKeyDown?.(e)
            },
        }
        : {}
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
                {...extraNumProps}
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