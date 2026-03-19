import express from 'express';
import path from 'path';
import { Buffer } from 'buffer';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import { google } from 'googleapis';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Configurações do Google Drive
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const auth = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  GOOGLE_PRIVATE_KEY,
  ['https://www.googleapis.com/auth/drive']
);

const drive = google.drive({ version: 'v3', auth });

const defaultData = { 
  players: [], 
  monthly_payments: {}, 
  game_stats: [], 
  transactions: [], 
  users: [], 
  matches: [] 
};

const LOCAL_DATA_FILE = path.join(process.cwd(), 'data.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const LOG_FILE = path.join(process.cwd(), 'activity.log');

let writeQueue = Promise.resolve();

// Garante que as pastas necessárias existam
async function ensureDirectories() {
  try { await fs.mkdir(BACKUP_DIR, { recursive: true }); } catch (e) {}
}

async function logActivity(message: string) {
  const entry = `[${new Date().toLocaleString('pt-BR')}] ${message}\n`;
  try { await fs.appendFile(LOG_FILE, entry); } catch (e) {}
}

async function findFileId() {
  if (!GOOGLE_DRIVE_FOLDER_ID) return null;
  try {
    const res = await drive.files.list({
      q: `name='data.json' and '${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });
    return res.data.files?.[0]?.id;
  } catch (e) {
    return null;
  }
}

async function readData() {
  try {
    const localContent = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(localContent);
    return { 
      players: parsed.players || [],
      monthly_payments: parsed.monthly_payments || {},
      game_stats: parsed.game_stats || [],
      transactions: parsed.transactions || [],
      users: parsed.users || [],
      matches: parsed.matches || []
    };
  } catch (err) {
    if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
      try {
        const fileId = await findFileId();
        if (fileId) {
          const res = await drive.files.get({ fileId, alt: 'media' });
          const data = res.data as any;
          await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
          return { ...defaultData, ...data };
        }
      } catch (error) {
        console.error('[Drive] Erro na leitura:', error);
      }
    }
    return { ...defaultData };
  }
}

async function rotateBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files.filter(f => f.startsWith('data_')).sort();
    if (backups.length >= 15) { // Aumentado para 15 backups
      for (let i = 0; i <= backups.length - 15; i++) {
        await fs.unlink(path.join(BACKUP_DIR, backups[i]));
      }
    }
  } catch (e) {}
}

async function writeData(newData: any) {
  return writeQueue = writeQueue.then(async () => {
    await ensureDirectories();
    try {
      const currentData = await readData();
      const updatedData = { ...currentData, ...newData };

      // --- TRAVA DE SEGURANÇA (ANTI-WIPE) ---
      // Impede que dados críticos sejam zerados se já existiam
      if (currentData.players.length > 0 && updatedData.players.length === 0) {
        throw new Error('BLOQUEIO: Tentativa de salvar lista de jogadores vazia.');
      }
      if (currentData.users.length > 0 && updatedData.users.length === 0) {
        throw new Error('BLOQUEIO: Tentativa de salvar lista de usuários vazia.');
      }

      const jsonString = JSON.stringify(updatedData, null, 2);
      
      // 1. Cria Backup com Timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await fs.writeFile(path.join(BACKUP_DIR, `data_${timestamp}.json`), jsonString);
      await rotateBackups();

      // 2. Gravação Atômica Local (Temp -> Rename)
      const tempFile = `${LOCAL_DATA_FILE}.tmp`;
      await fs.writeFile(tempFile, jsonString);
      await fs.rename(tempFile, LOCAL_DATA_FILE);

      await logActivity(`Sucesso: Dados atualizados (${Object.keys(newData).join(', ')})`);

      // 3. Sincroniza com Google Drive (Assíncrono)
      if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
        performDriveWrite(updatedData).catch(err => console.error('[Drive] Erro na sincronização:', err));
      }
      
      return updatedData;
    } catch (err) {
      const errorMsg = `ERRO CRÍTICO: ${err instanceof Error ? err.message : String(err)}`;
      await logActivity(errorMsg);
      console.error('[Storage]', errorMsg);
      throw err;
    }
  });
}

async function performDriveWrite(data: any) {
  const fileId = await findFileId();
  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(data, null, 2),
  };

  if (fileId) {
    await drive.files.update({ fileId, media });
  } else if (GOOGLE_DRIVE_FOLDER_ID) {
    await drive.files.create({
      requestBody: { name: 'data.json', parents: [GOOGLE_DRIVE_FOLDER_ID] },
      media,
    });
  }
}

// --- Rotas da API ---

app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    const safeData = {
      ...data,
      users: data.users ? data.users.map((u: any) => {
        const { password, ...safeUser } = u;
        return safeUser;
      }) : []
    };
    res.json(safeData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler dados' });
  }
});

app.post('/api/data/restore', async (req, res) => {
  try {
    await writeData(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao restaurar' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const data = await readData();
    const newPlayer = req.body;
    const players = [...data.players];
    const idx = players.findIndex((p: any) => p.id === newPlayer.id);
    if (idx >= 0) players[idx] = newPlayer;
    else players.push(newPlayer);
    await writeData({ players });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar jogador' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const data = await readData();
    const players = data.players.filter((p: any) => p.id !== req.params.id);
    const monthly_payments = { ...data.monthly_payments };
    for (const year in monthly_payments) {
      if (monthly_payments[year][req.params.id]) delete monthly_payments[year][req.params.id];
    }
    await writeData({ players, monthly_payments });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir jogador' });
  }
});

app.put('/api/payments/single', async (req, res) => {
  try {
    const data = await readData();
    const { year, playerId, month, status } = req.body;
    const monthly_payments = { ...data.monthly_payments };
    if (!monthly_payments[year]) monthly_payments[year] = {};
    if (!monthly_payments[year][playerId]) monthly_payments[year][playerId] = {};
    monthly_payments[year][playerId][month] = status;
    await writeData({ monthly_payments });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar pagamento' });
  }
});

app.post('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    const game_stats = [...data.game_stats, ...req.body];
    await writeData({ game_stats });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar estatísticas' });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const data = await readData();
    const matches = [...data.matches, req.body];
    await writeData({ matches });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar partida' });
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  try {
    const data = await readData();
    const matchToDelete = data.matches.find((m: any) => m.id === req.params.id);
    if (matchToDelete) {
      const game_stats = data.game_stats.filter((s: any) => s.date !== matchToDelete.date);
      const matches = data.matches.filter((m: any) => m.id !== req.params.id);
      await writeData({ game_stats, matches });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir partida' });
  }
});

app.delete('/api/stats', async (req, res) => {
  try {
    await writeData({ game_stats: [], matches: [] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar estatísticas' });
  }
});

app.put('/api/stats/player', async (req, res) => {
  try {
    const data = await readData();
    const { player_name, goals, yellow_cards, red_cards, craque, goleiro, gol } = req.body;
    const game_stats = data.game_stats.filter((s: any) => s.player_name !== player_name);
    game_stats.push({
      game_date: new Date().toISOString().split('T')[0],
      player_name,
      goals: Number(goals || 0),
      yellow_cards: Number(yellow_cards || 0),
      red_cards: Number(red_cards || 0),
      craque_do_jogo: Number(craque || 0),
      goleiro_do_jogo: Number(goleiro || 0),
      gol_do_jogo: Number(gol || 0)
    });
    await writeData({ game_stats });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar estatísticas' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const data = await readData();
    const newTx = req.body;
    const transactions = data.transactions ? [...data.transactions] : [];
    const idx = transactions.findIndex((t: any) => t.id === newTx.id);
    if (idx >= 0) transactions[idx] = newTx;
    else transactions.push(newTx);
    await writeData({ transactions });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar transação' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const data = await readData();
    const transactions = data.transactions ? data.transactions.filter((t: any) => t.id !== req.params.id) : [];
    await writeData({ transactions });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await readData();
    const user = data.users?.find((u: any) => u.name.toLowerCase() === username.toLowerCase());
    
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const isMatch = user.password.startsWith('$2') 
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (isMatch) {
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = await readData();
    const newUser = req.body;
    if (newUser.password && !newUser.password.startsWith('$2')) {
      newUser.password = await bcrypt.hash(newUser.password, 10);
    }
    const users = [...data.users];
    const idx = users.findIndex((u: any) => u.id === newUser.id);
    if (idx >= 0) {
      if (!newUser.password) newUser.password = users[idx].password;
      users[idx] = newUser;
    } else {
      users.push(newUser);
    }
    await writeData({ users });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const data = await readData();
    const users = data.users.filter((u: any) => u.id !== req.params.id);
    await writeData({ users });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

async function startServer() {
  await readData();
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}

if (!process.env.VERCEL) startServer();

export default app;