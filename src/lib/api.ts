export interface Player {
  id: string;
  name: string;
  position: string;
  shirt_number: string;
  date_of_birth: string;
  phone: string;
  photo_file: string;
  team_start_date: string;
  level?: number;
}

export interface GameStat {
  date?: string;
  game_date: string;
  player_name: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  craque_do_jogo: boolean | number;
  goleiro_do_jogo: boolean | number;
  gol_do_jogo: boolean | number;
}

export interface Match {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  password?: string;
  role: 'Diretoria' | 'Membro';
  permissions?: string[];
  photo_file?: string;
}

export interface AppData {
  players: Player[];
  monthly_payments: Record<string, Record<string, Record<string, string>>>;
  game_stats: GameStat[];
  transactions?: Transaction[];
  users?: User[];
  matches?: Match[];
}

export const api = {
  async getData(): Promise<AppData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Falha ao carregar dados do servidor');
    return res.json();
  },

  async restoreData(data: AppData): Promise<void> {
    const res = await fetch('/api/data/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao restaurar backup');
    }
  },

  async savePlayer(player: Player): Promise<void> {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    if (!res.ok) throw new Error('Erro ao salvar jogador');
  },

  async deletePlayer(id: string): Promise<void> {
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir jogador');
  },

  async savePayments(year: string, payments: Record<string, Record<string, string>>): Promise<void> {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, payments }),
    });
    if (!res.ok) throw new Error('Erro ao salvar pagamentos');
  },

  async saveSinglePayment(year: string, playerId: string, month: string, status: string): Promise<any> {
    const res = await fetch('/api/payments/single', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, playerId, month, status }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar pagamento');
    return res.json();
  },

  async saveStats(stats: GameStat[]): Promise<void> {
    const res = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    if (!res.ok) throw new Error('Erro ao salvar estatísticas');
  },

  async saveMatch(match: Match): Promise<void> {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match),
    });
    if (!res.ok) throw new Error('Erro ao salvar partida');
  },

  async deleteMatch(id: string): Promise<void> {
    const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir partida');
  },

  async clearStats(): Promise<void> {
    const res = await fetch('/api/stats', { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao limpar ranking');
  },

  async updatePlayerStats(stats: any): Promise<void> {
    const res = await fetch('/api/stats/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    if (!res.ok) throw new Error('Erro ao atualizar estatísticas');
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    if (!res.ok) throw new Error('Erro ao salvar transação');
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir transação');
  },

  async saveUser(user: User): Promise<void> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Erro ao salvar usuário');
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir usuário');
  }
};