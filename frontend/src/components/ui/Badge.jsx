import clsx from 'clsx'

const VARIANTS = {
    active:      { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e',  border: 'rgba(34,197,94,0.25)'  },
    maintenance: { bg: 'rgba(244,162,97,0.12)', color: '#f4a261',  border: 'rgba(244,162,97,0.25)' },
    closed:      { bg: 'rgba(230,57,70,0.12)',  color: '#e63946',  border: 'rgba(230,57,70,0.25)'  },
    fastpass:    { bg: 'rgba(233,196,106,0.12)', color: '#e9c46a', border: 'rgba(233,196,106,0.3)' },
    general:     { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.2)' },
    pending:     { bg: 'rgba(230,57,70,0.12)',  color: '#e63946',  border: 'rgba(230,57,70,0.25)'  },
    resolved:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e',  border: 'rgba(34,197,94,0.25)'  },
    info:        { bg: 'rgba(69,123,157,0.12)', color: '#457b9d',  border: 'rgba(69,123,157,0.25)' },
    purple:      { bg: 'rgba(106,76,147,0.12)', color: '#6a4c93',  border: 'rgba(106,76,147,0.25)' },
}

export default function Badge({ variant = 'info', children, dot, className }) {
    const s = VARIANTS[variant] || VARIANTS.info

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                className
            )}
            style={{
                background: s.bg,
                color: s.color,
                borderColor: s.border,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.03em',
            }}
        >
      {dot && (
          <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }}
          />
      )}
            {children}
    </span>
    )
}

/** Maps backend status strings to badge variants */
export function StatusBadge({ status }) {
    const map = {
        ACTIVA:           'active',
        EN_MANTENIMIENTO: 'maintenance',
        CERRADA:          'closed',
        PENDIENTE:        'pending',
        RESUELTA:         'resolved',
        FASTPASS:         'fastpass',
        GENERAL:          'general',
        FAMILIAR:         'purple',
    }
    const labels = {
        ACTIVA: 'Activa',
        EN_MANTENIMIENTO: 'Mantenimiento',
        CERRADA: 'Cerrada',
        PENDIENTE: 'Pendiente',
        RESUELTA: 'Resuelta',
        FASTPASS: 'FastPass',
        GENERAL: 'General',
        FAMILIAR: 'Familiar',
    }
    return (
        <Badge variant={map[status] || 'info'} dot>
            {labels[status] || status}
        </Badge>
    )
}