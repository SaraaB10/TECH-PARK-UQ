import clsx from 'clsx'

/**
 * Card variants:
 *  - default: standard glass card
 *  - accent: left color border
 *  - stat: big stat display
 */
export default function Card({ children, className, accent, variant = 'default', ...props }) {
    return (
        <div
            className={clsx(
                'glass rounded-2xl overflow-hidden',
                accent && 'border-l-2',
                className
            )}
            style={{
                borderLeftColor: accent || undefined,
                ...props.style,
            }}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }) {
    return (
        <div
            className={clsx('px-5 py-4 border-b', className)}
            style={{ borderColor: 'var(--c-border)' }}
        >
            {children}
        </div>
    )
}

export function CardBody({ children, className }) {
    return (
        <div className={clsx('px-5 py-4', className)}>
            {children}
        </div>
    )
}

export function StatCard({ label, value, sub, accent = '#2a9d8f', icon: Icon, className }) {
    return (
        <div
            className={clsx('glass rounded-2xl p-5 relative overflow-hidden group', className)}
        >
            {/* Glow bg */}
            <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: accent, filter: 'blur(20px)' }}
            />
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
          <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}
          >
            {label}
          </span>
                    {Icon && (
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${accent}20`, color: accent }}
                        >
                            <Icon size={15} />
                        </div>
                    )}
                </div>
                <div
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                >
                    {value}
                </div>
                {sub && (
                    <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
                        {sub}
                    </div>
                )}
            </div>
            <div
                className="absolute bottom-0 left-0 h-0.5 w-full"
                style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
            />
        </div>
    )
}