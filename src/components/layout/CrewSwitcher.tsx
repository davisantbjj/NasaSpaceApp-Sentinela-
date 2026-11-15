import type { CrewMember } from '../../types';
import i18n from '../../i18n';

interface Props {
  crew: CrewMember[];
  activeId: string;
  onChange: (crewId: string) => void;
}

// Só o nome no seletor, para não cortar no celular; o cargo vai na segunda linha.
export function CrewSwitcher({ crew, activeId, onChange }: Props) {
  const active = crew.find((member) => member.id === activeId);
  return (
    <label className="crew-switcher">
      <span className="visually-hidden">{i18n.t('crewSwitcher.label')}</span>
      <select className="select" value={activeId} aria-describedby="crew-switcher-role" onChange={(event) => onChange(event.target.value)}>
        {crew.map((member) => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>
      {active && <span id="crew-switcher-role" className="crew-switcher-role">{active.role}</span>}
    </label>
  );
}
