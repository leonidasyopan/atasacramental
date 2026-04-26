const OPTIONS = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
  { label: 'Todos', value: null },
];

export default function PeriodFilter({ value, onChange }) {
  return (
    <div className="period-filter">
      {OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={`mode-btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
