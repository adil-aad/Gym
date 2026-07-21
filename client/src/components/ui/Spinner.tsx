export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 ${className}`}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
