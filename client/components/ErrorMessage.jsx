export default function ErrorMessage({ title = 'Error', message, onRetry }) {
  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-destructive">{title}</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-destructive hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

