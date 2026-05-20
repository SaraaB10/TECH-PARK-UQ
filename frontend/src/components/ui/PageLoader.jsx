export default function PageLoader() {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'var(--c-night)' }}
        >
            <div className="flex flex-col items-center gap-4">
                <div
                    className="w-10 h-10 rounded-full animate-spin"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, #e63946 60deg, #6a4c93 180deg, transparent 360deg)',
                    }}
                />
                <span
                    className="text-xs uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}
                >
          Cargando...
        </span>
            </div>
        </div>
    )
}