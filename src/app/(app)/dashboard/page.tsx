export default async function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Home</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Check In', href: '/checkin' },
          { label: 'Plan a Date', href: '/dates' },
          { label: 'Add Memory', href: '/memories' },
          { label: 'Memories', href: '/memories' },
        ].map(action => (
          <a
            key={action.label}
            href={action.href}
            className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {action.label}
          </a>
        ))}
      </div>

      <p className="text-stone-400 text-xs text-center">
        Dashboard widgets load after onboarding is complete.
      </p>
    </div>
  )
}
