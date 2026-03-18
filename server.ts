import express from 'express';
import path from 'path';
import { Buffer } from 'buffer';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

const app = express();
const PORT = 3000;

app.use(express.json());

const getGitHubConfig = () => ({
  token: process.env.GITHUB_TOKEN || '4mnGBeIx086NuAO7tjhrTko5FbM978T7',
  repo: process.env.GITHUB_REPO || 'gabrielxrm-lab/S-O-JORGE-FUTEBOL',
  branch: process.env.GITHUB_BRANCH || 'main',
  filePath: 'data.json'
});

const defaultData = { players: [], monthly_payments: {}, game_stats: [], transactions: [] };
let memoryData: any = null; // Fallback for missing token or cold starts
let isInitialized = false;
let lastWriteTime = 0;
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data.json');

async function readData() {
  // If we already have data in memory, just return it.
  // This prevents overwriting local changes if GitHub sync fails.
  if (isInitialized && memoryData) {
    return memoryData;
  }

  const { token, repo, branch, filePath } = getGitHubConfig();
  
  // Try to read from local file first as a reliable fallback
  try {
    const localContent = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const localData = JSON.parse(localContent);
    if (localData && localData.players) {
      memoryData = localData;
      isInitialized = true;
      return memoryData;
    }
  } catch (err) {
    // File might not exist yet, that's fine
  }

  if (!token) {
    console.warn('GITHUB_TOKEN não configurado. Retornando dados em memória (somente leitura).');
    isInitialized = true;
    memoryData = memoryData || defaultData;
    return memoryData;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&t=${Date.now()}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (res.status === 404) {
      isInitialized = true;
      memoryData = memoryData || defaultData;
      return memoryData;
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.statusText}`);
    }

    const fileData = await res.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const parsedData = JSON.parse(content);
    memoryData = parsedData; // Cache it
    isInitialized = true;
    
    // Save to local file as backup
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(parsedData, null, 2)).catch(() => {});
    
    return parsedData;
  } catch (error) {
    console.error('Erro ao ler dados do GitHub:', error);
    isInitialized = true;
    memoryData = memoryData || defaultData;
    return memoryData;
  }
}

let writeTimeout: NodeJS.Timeout | null = null;
let isWriting = false;
let pendingWrite = false;

async function writeData(data: any) {
  const { token, repo, branch, filePath } = getGitHubConfig();
  
  memoryData = data; // Update cache immediately
  lastWriteTime = Date.now();
  
  // Always save to local file as backup
  try {
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erro ao salvar arquivo local data.json:', err);
  }

  if (!token) {
    console.warn('GITHUB_TOKEN não configurado. Salvando apenas em memória (será perdido ao reiniciar).');
    return;
  }

  // Schedule GitHub write
  return new Promise<void>((resolve, reject) => {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
    }
    
    writeTimeout = setTimeout(async () => {
      if (isWriting) {
        pendingWrite = true;
        resolve(); // Resolve early, it will be written in the next cycle
        return;
      }
      
      await executeWrite(token, repo, branch, filePath);
      resolve();
    }, 1000); // 1 second debounce
    
    // If we want to resolve immediately for the client:
    resolve(); 
  });
}

async function executeWrite(token: string, repo: string, branch: string, filePath: string) {
  isWriting = true;
  try {
    await performGitHubWrite(memoryData, token, repo, branch, filePath);
  } catch (error) {
    console.error('[GitHub Sync] Delayed write failed:', error);
  } finally {
    isWriting = false;
    if (pendingWrite) {
      pendingWrite = false;
      // Trigger another write if there were pending changes
      setTimeout(() => executeWrite(token, repo, branch, filePath), 1000);
    }
  }
}

async function performGitHubWrite(data: any, token: string, repo: string, branch: string, filePath: string) {
  try {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    console.log(`[GitHub Sync] Tentando salvar em: ${url} na branch: ${branch}`);
    
    // 1. Obter o SHA atual do arquivo
    const getRes = await fetch(`${url}?ref=${branch}&t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    let sha = '';
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      console.log(`[GitHub Sync] Arquivo encontrado. SHA: ${sha}`);
    } else {
      console.log(`[GitHub Sync] Arquivo não encontrado (novo arquivo). Status: ${getRes.status}`);
    }

    // 2. Atualizar o arquivo
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Auto-update data.json via AI Studio / Vercel',
        content: content,
        sha: sha || undefined,
        branch: branch
      })
    });

    if (!putRes.ok) {
      const errorData = await putRes.json();
      console.error('[GitHub Sync] Falha ao fazer push para o GitHub:', errorData);
      console.error(`[GitHub Sync] Detalhes: Repo=${repo}, Branch=${branch}, File=${filePath}`);
      throw new Error(`Falha ao salvar no GitHub: ${errorData.message || putRes.statusText}`);
    } else {
      console.log('[GitHub Sync] data.json atualizado com sucesso no GitHub!');
    }
  } catch (error) {
    console.error('[GitHub Sync] Erro ao fazer push para o GitHub:', error);
    throw error;
  }
}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    // Strip passwords before sending to client
    const safeData = {
      ...data,
      users: data.users ? data.users.map((u: any) => {
        const { password, ...safeUser } = u;
        return safeUser;
      }) : []
    };
    res.json(safeData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const data = await readData();
    const newPlayer = req.body;
    
    const existingIndex = data.players.findIndex((p: any) => p.id === newPlayer.id);
    if (existingIndex >= 0) {
      data.players[existingIndex] = newPlayer;
    } else {
      data.players.push(newPlayer);
    }
    
    await writeData(data);
    res.json({ success: true, player: newPlayer });
  } catch (error) {
    console.error('Erro detalhado no POST /api/players:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save player' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const data = await readData();
    data.players = data.players.filter((p: any) => p.id !== req.params.id);
    
    // Also cleanup payments for this player
    for (const year in data.monthly_payments) {
      if (data.monthly_payments[year][req.params.id]) {
        delete data.monthly_payments[year][req.params.id];
      }
    }
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const data = await readData();
    const { year, payments } = req.body; // payments: { [playerId]: { [month]: status } }
    
    if (!data.monthly_payments) data.monthly_payments = {};
    data.monthly_payments[year] = payments;
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar pagamentos:', error);
    res.status(500).json({ error: 'Failed to save payments' });
  }
});

app.put('/api/payments/single', async (req, res) => {
  try {
    const data = await readData();
    const { year, playerId, month, status } = req.body;
    
    if (!data.monthly_payments) data.monthly_payments = {};
    if (!data.monthly_payments[year]) data.monthly_payments[year] = {};
    if (!data.monthly_payments[year][playerId]) data.monthly_payments[year][playerId] = {};
    
    data.monthly_payments[year][playerId][month] = status;
    
    await writeData(data);
    res.json({ success: true, payments: data.monthly_payments[year] });
  } catch (error) {
    console.error('Erro ao salvar pagamento unico:', error);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});

app.post('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    const newStats = req.body; // Array of stats
    
    data.game_stats.push(...newStats);
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save stats' });
  }
});

app.delete('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    data.game_stats = [];
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear stats' });
  }
});

app.put('/api/stats/player', async (req, res) => {
  try {
    const data = await readData();
    const { player_name, goals, yellow_cards, red_cards, craque, goleiro, gol } = req.body;

    data.game_stats = data.game_stats.filter((s: any) => s.player_name !== player_name);

    data.game_stats.push({
      game_date: new Date().toISOString().split('T')[0],
      player_name,
      goals: Number(goals || 0),
      yellow_cards: Number(yellow_cards || 0),
      red_cards: Number(red_cards || 0),
      craque_do_jogo: Number(craque || 0),
      goleiro_do_jogo: Number(goleiro || 0),
      gol_do_jogo: Number(gol || 0)
    });

    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const data = await readData();
    if (!data.transactions) data.transactions = [];
    
    const newTx = req.body;
    const existingIndex = data.transactions.findIndex((t: any) => t.id === newTx.id);
    if (existingIndex >= 0) {
      data.transactions[existingIndex] = newTx;
    } else {
      data.transactions.push(newTx);
    }
    
    await writeData(data);
    res.json({ success: true, transaction: newTx });
  } catch (error) {
    console.error('Erro ao salvar transacao:', error);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const data = await readData();
    if (!data.transactions) data.transactions = [];
    
    data.transactions = data.transactions.filter((t: any) => t.id !== req.params.id);
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const data = await readData();
    
    if (!data.users) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = data.users.find((u: any) => u.name.trim().toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if password matches (either bcrypt or plain text for legacy users)
    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text password
      isMatch = user.password === password;
      
      // Auto-upgrade password to bcrypt if it matches
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await writeData(data);
      }
    }

    if (isMatch) {
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const data = await readData();
    if (!data.users) data.users = [];
    
    const newUser = req.body;
    
    // Hash password if provided and not already hashed (basic check)
    if (newUser.password && !newUser.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(newUser.password.trim(), salt);
    }
    
    if (newUser.name) {
      newUser.name = newUser.name.trim();
    }
    
    const existingIndex = data.users.findIndex((u: any) => u.id === newUser.id);
    if (existingIndex >= 0) {
      // If updating and no new password provided, keep the old one
      if (!newUser.password && data.users[existingIndex].password) {
        newUser.password = data.users[existingIndex].password;
      }
      data.users[existingIndex] = newUser;
    } else {
      data.users.push(newUser);
    }
    
    await writeData(data);
    
    // Return safe user without password
    const { password, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const data = await readData();
    if (!data.users) data.users = [];
    
    data.users = data.users.filter((u: any) => u.id !== req.params.id);
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

async function startServer() {
  // Pré-carrega os dados do GitHub na inicialização
  await readData();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const viteName = 'vite';
    const { createServer: createViteServer } = await import(String(viteName));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// No Vercel, não iniciamos o servidor na porta 3000, apenas exportamos o app
if (!process.env.VERCEL) {
  startServer();
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

export default app;
