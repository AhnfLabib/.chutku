export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-6">Settings</h1>
      <a
        href="/api/export"
        className="block bg-surface rounded-neu shadow-raised p-4.5 text-sm font-medium text-ink active:shadow-inset transition-all"
      >
        Export my data (JSON)
      </a>
    </div>
  )
}
