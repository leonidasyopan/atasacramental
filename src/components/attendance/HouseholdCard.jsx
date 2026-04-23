import { useEffect, useMemo, useRef } from 'react';

function TriStateCheckbox({ state, onChange, ariaLabel }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === 'some';
    }
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="attendance-checkbox-tri"
      checked={state === 'all'}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
    />
  );
}

export default function HouseholdCard({
  household,
  members,
  checkedMemberIds,
  onToggleHousehold,
  onToggleMember,
}) {
  const checkedSet = useMemo(
    () => new Set(checkedMemberIds || []),
    [checkedMemberIds],
  );

  const presentCount = members.reduce(
    (sum, m) => sum + (checkedSet.has(m.id) ? 1 : 0),
    0,
  );

  const triState =
    members.length === 0
      ? 'none'
      : presentCount === 0
        ? 'none'
        : presentCount === members.length
          ? 'all'
          : 'some';

  const title =
    household.displayName ||
    household.name ||
    household.headNames ||
    'Família sem nome';

  return (
    <div className="attendance-household-card" data-state={triState}>
      <label className="attendance-household-header">
        <TriStateCheckbox
          state={triState}
          onChange={(checked) => onToggleHousehold(checked)}
          ariaLabel={`Marcar família ${title}`}
        />
        <span className="attendance-household-title">{title}</span>
        <span className="attendance-household-count">
          {presentCount}/{members.length}
        </span>
      </label>

      {members.length > 0 && (
        <ul className="attendance-member-list">
          {members.map((member) => (
            <li key={member.id}>
              <label className="attendance-member-row">
                <input
                  type="checkbox"
                  checked={checkedSet.has(member.id)}
                  onChange={(e) => onToggleMember(member.id, e.target.checked)}
                />
                <span>{member.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
