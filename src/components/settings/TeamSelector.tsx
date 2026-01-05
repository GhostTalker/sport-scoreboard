import { useSettingsStore } from '../../stores/settingsStore';
import { getAllTeams, getTeamById } from '../../constants/teams';

export function TeamSelector() {
  const primaryTeamId = useSettingsStore((state) => state.primaryTeamId);
  const setPrimaryTeam = useSettingsStore((state) => state.setPrimaryTeam);
  
  const teams = getAllTeams();
  const currentTeam = getTeamById(primaryTeamId);

  return (
    <div className="space-y-3">
      {/* Current Selection */}
      {currentTeam && (
        <div 
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ backgroundColor: `#${currentTeam.color}20` }}
        >
          <img 
            src={currentTeam.logo} 
            alt={currentTeam.displayName}
            className="w-12 h-12 object-contain"
          />
          <div>
            <p className="font-semibold text-white">{currentTeam.displayName}</p>
            <p className="text-sm text-white/50">Currently selected</p>
          </div>
        </div>
      )}

      {/* Team Dropdown */}
      <select
        value={primaryTeamId}
        onChange={(e) => setPrimaryTeam(e.target.value)}
        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none cursor-pointer"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
