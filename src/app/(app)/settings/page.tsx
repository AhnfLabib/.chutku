export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Settings</h1>
      <div className="space-y-3">
        <a
          href="/api/export"
          className="block p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-sm text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Export my data (JSON)
        </a>
      </div>
    </div>
  )
}
