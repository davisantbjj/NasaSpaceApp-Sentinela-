import type { CrewMember } from '../../types';
import i18n from '../../i18n';

interface Props {
  crew: CrewMember[];
  activeId: string;
  onChange: (crewId: string) => void;
}

export function CrewSwitcher({ crew, activeId, onChange }: Props) {
  return (
    <label>
      <span className="visually-hidden">{i18n.t('crewSwitcher.label')}</span>
      <select className="select" value={activeId} onChange={(event) => onChange(event.target.value)}>
        {crew.map((member) => (
          <option key={member.id} value={member.id}>{member.name} · {member.role}</option>
        ))}
      </select>
    </label>
  );
}
