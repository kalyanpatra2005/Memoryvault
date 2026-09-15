const gradients = {
  violet: 'from-violet-600 to-purple-700',
  green:  'from-emerald-500 to-teal-600',
  amber:  'from-amber-500 to-orange-600',
  blue:   'from-sky-500 to-indigo-600',
  pink:   'from-pink-500 to-rose-600',
  indigo: 'from-indigo-500 to-blue-700',
};

export default function StatCard({ icon, label, value, color = 'violet', sub }) {
  const gradient = gradients[color] || gradients.violet;
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-xl animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {sub && <p className="text-white/50 text-xs mt-1">{sub}</p>}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}
