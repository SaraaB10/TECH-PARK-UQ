export default function ProgressBar({ value = 0, max = 100, showLabel = false, color }) {
    const pct = Math.min(100, Math.round((value / max) * 100))

    return (
        <div className="flex items-center gap-3">
            <div className="progress-bar flex-1">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${pct}%`,
                        background: color || undefined,
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