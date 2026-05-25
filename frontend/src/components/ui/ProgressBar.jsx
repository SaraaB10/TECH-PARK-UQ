export default function ProgressBar({ value = 0, max = 100, showLabel = false, color }) {
    const pctExact = Math.min(100, (value / max) * 100)
    const pct      = Math.round(pctExact)

    return (
        <div className="flex items-center gap-3">
            <div className="progress-bar flex-1">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${pctExact}%`,
                        background: color || undefined,
                        minWidth: pctExact > 0 ? '3px' : '0px',
                    }}
                />
            </div>
            {showLabel && (
                <span
                    className="text-xs font-mono w-9 text-right flex-shrink-0"
                    style={{ color: 'var(--c-muted)' }}
                >
                {pct}%
            </span>
            )}
        </div>
    )
}