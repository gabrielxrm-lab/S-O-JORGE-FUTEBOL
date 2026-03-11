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

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
}

export interface AppData {
  players: Player[];
  monthly_payments: Record<string, Record<string, Record<string, string>>>;
  game_stats: GameStat[];
  transactions?: Transaction[];
}

export const api = {
  async getData(): Promise<AppData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  },

  async savePlayer(player: Player): Promise<void> {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error Response:', res.status, errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON
        }
        throw new Error((errorData as any).error || `Failed to save player: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      console.error('Network or parsing error in savePlayer:', error);
      throw error;
    }
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
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!res.ok) throw new Error('Failed to save transaction');
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete transaction');
  }
};
