import type { CrewMember } from '../../types';

interface Props {
  crew: CrewMember[];
  activeId: string;
  onChange: (crewId: string) => void;
}

export function CrewSwitcher({ crew, activeId, onChange }: Props) {
  return (
    <label>
      <span className="visually-hidden">Tripulante ativo</span>
      <select className="select" value={activeId} onChange={(event) => onChange(event.target.value)}>
        {crew.map((member) => (
          <option key={member.id} value={member.id}>{member.name} · {member.role}</option>
        ))}
      </select>
    </label>
  );
}
