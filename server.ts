import express from 'express';
import path from 'path';
import { Buffer } from 'buffer';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

const app = express();
const PORT = 3000;

app.use(express.json());

const getGitHubConfig = () => ({
  // Prioriza variáveis de ambiente para segurança
  token: process.env.GITHUB_TOKEN || '', 
  repo: process.env.GITHUB_REPO || 'gabrielxrm-lab/S-O-JORGE-FUTEBOL',
  branch: process.env.GITHUB_BRANCH || 'main',
  filePath: 'data.json'
});

const defaultData = { players: [], monthly_payments: {}, game_stats: [], transactions: [], users: [] };
let memoryData: any = null;
let isInitialized = false;
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data.json');

async function readData() {
  if (isInitialized && memoryData) {
    return memoryData;
  }

  // Tenta ler do arquivo local primeiro (mais rápido e confiável para persistência local)
  try {
    const localContent = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const localData = JSON.parse(localContent);
    if (localData && (localData.players || localData.users)) {
      memoryData = localData;
      isInitialized = true;
      console.log('[Storage] Dados carregados do arquivo local.');
      return memoryData;
    }
  } catch (err) {
    console.log('[Storage] Arquivo local não encontrado ou vazio, tentando GitHub...');
  }

  const { token, repo, branch, filePath } = getGitHubConfig();
  
  if (!token) {
    console.warn('[GitHub] GITHUB_TOKEN não configurado. Usando dados locais/padrão.');
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
      }
    });

    if (res.status === 404) {
      console.log('[GitHub] Arquivo data.json não encontrado no repositório.');
      isInitialized = true;
      memoryData = memoryData || defaultData;
      return memoryData;
    }

    if (!res.ok) {
      throw new Error(`Erro na API do GitHub: ${res.status} ${res.statusText}`);
    }

    const fileData = await res.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const parsedData = JSON.parse(content);
    memoryData = parsedData;
    isInitialized = true;
    
    // Sincroniza com o local
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(parsedData, null, 2)).catch(() => {});
    
    return parsedData;
  } catch (error) {
    console.error('[GitHub] Erro ao ler dados:', error);
    isInitialized = true;
    memoryData = memoryData || defaultData;
    return memoryData;
  }
}

async function writeData(data: any) {
  memoryData = data;
  
  // Salva localmente imediatamente
  try {
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
    console.log('[Storage] Dados salvos localmente com sucesso.');
  } catch (err) {
    console.error('[Storage] Erro ao salvar localmente:', err);
  }

  const { token, repo, branch, filePath } = getGitHubConfig();
  
  if (!token) {
    console.warn('[GitHub] GITHUB_TOKEN não configurado. Alterações salvas apenas localmente.');
    return;
  }

  // Tenta sincronizar com o GitHub em background
  performGitHubWrite(data, token, repo, branch, filePath).catch(err => {
    console.error('[GitHub] Falha na sincronização remota:', err.message);
  });
}

async function performGitHubWrite(data: any, token: string, repo: string, branch: string, filePath: string) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  
  // 1. Obter o SHA atual
  const getRes = await fetch(`${url}?ref=${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  let sha = '';
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  // 2. Fazer o upload
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update data.json [Automated]',
      content: content,
      sha: sha || undefined,
      branch: branch
    })
  });

  if (!putRes.ok) {
    const errorData = await putRes.json();
    throw new Error(errorData.message || 'Erro desconhecido ao salvar no GitHub');
  }
  
  console.log('[GitHub] Sincronização remota concluída com sucesso.');
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

app.post('/api/players', async (req, res) => {
  try {
    const data = await readData();
    const newPlayer = req.body;
    const existingIndex = data.players.findIndex((p: any) => p.id === newPlayer.id);
    if (existingIndex >= 0) data.players[existingIndex] = newPlayer;
    else data.players.push(newPlayer);
    await writeData(data);
    res.json({ success: true, player: newPlayer });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar jogador' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const data = await readData();
    data.players = data.players.filter((p: any) => p.id !== req.params.id);
    if (data.monthly_payments) {
      for (const year in data.monthly_payments) {
        if (data.monthly_payments[year][req.params.id]) delete data.monthly_payments[year][req.params.id];
      }
    }
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir jogador' });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const data = await readData();
    const { year, payments } = req.body;
    if (!data.monthly_payments) data.monthly_payments = {};
    data.monthly_payments[year] = payments;
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar pagamentos' });
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
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar pagamento' });
  }
});

app.post('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    data.game_stats.push(...req.body);
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar estatísticas' });
  }
});

app.delete('/api/stats', async (req, res) => {
  try {
    const data = await readData();
    data.game_stats = [];
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar estatísticas' });
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
    res.status(500).json({ error: 'Erro ao atualizar estatísticas' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const data = await readData();
    if (!data.transactions) data.transactions = [];
    const newTx = req.body;
    const idx = data.transactions.findIndex((t: any) => t.id === newTx.id);
    if (idx >= 0) data.transactions[idx] = newTx;
    else data.transactions.push(newTx);
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar transação' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const data = await readData();
    data.transactions = data.transactions.filter((t: any) => t.id !== req.params.id);
    await writeData(data);
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
    if (!data.users) data.users = [];
    const newUser = req.body;
    if (newUser.password && !newUser.password.startsWith('$2')) {
      newUser.password = await bcrypt.hash(newUser.password, 10);
    }
    const idx = data.users.findIndex((u: any) => u.id === newUser.id);
    if (idx >= 0) {
      if (!newUser.password) newUser.password = data.users[idx].password;
      data.users[idx] = newUser;
    } else {
      data.users.push(newUser);
    }
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const data = await readData();
    data.users = data.users.filter((u: any) => u.id !== req.params.id);
    await writeData(data);
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