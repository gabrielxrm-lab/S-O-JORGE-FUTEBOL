export interface Player {
  id: string;
  name: string;
  position: string;
  shirt_number: string;
  date_of_birth: string;
  phone: string;
  photo_file: string;
  team_start_date: string;
}

export interface GameStat {
  game_date: string;
  player_name: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  craque_do_jogo: boolean | number;
  goleiro_do_jogo: boolean | number;
  gol_do_jogo: boolean | number;
}

export interface AppData {
  players: Player[];
  monthly_payments: Record<string, Record<string, Record<string, string>>>;
  game_stats: GameStat[];
}

export const api = {
  async getData(): Promise<AppData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  },

  async savePlayer(player: Player): Promise<void> {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    if (!res.ok) throw new Error('Failed to save player');
  },

  async deletePlayer(id: string): Promise<void> {
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete player');
  },

  async savePayments(year: string, payments: Record<string, Record<string, string>>): Promise<void> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, payments }),
    });
    if (!res.ok) throw new Error('Failed to save payments');
  },

  async saveStats(stats: GameStat[]): Promise<void> {
    const res = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    if (!res.ok) throw new Error('Failed to save stats');
  },

  async clearStats(): Promise<void> {
    const res = await fetch('/api/stats', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear stats');
  },

  async updatePlayerStats(stats: any): Promise<void> {
    const res = await fetch('/api/stats/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    if (!res.ok) throw new Error('Failed to update stats');
  }
};
