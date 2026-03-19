import express from 'express';
import path from 'path';
import { Buffer } from 'buffer';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const getGitHubConfig = () => ({
  token: process.env.GITHUB_TOKEN || '', 
  repo: process.env.GITHUB_REPO || 'gabrielxrm-lab/S-O-JORGE-FUTEBOL',
  branch: process.env.GITHUB_BRANCH || 'main',
  filePath: 'data.json'
});

const defaultData = { 
  players: [], 
  monthly_payments: {}, 
  game_stats: [], 
  transactions: [], 
  users: [], 
  matches: [] 
};

let memoryData: any = null;
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data.json');

// Função mestre para ler dados com segurança total
async function readData() {
  try {
    // Sempre tenta ler do arquivo local primeiro para ter a versão mais recente em disco
    const localContent = await fs.readFile(LOCAL_DATA_FILE, 'utf-8');
    const dataFromFile = JSON.parse(localContent);
    memoryData = { ...defaultData, ...dataFromFile };
    return memoryData;
  } catch (err) {
    console.log('[Storage] Arquivo local não encontrado ou erro na leitura, tentando GitHub...');
    
    const { token, repo, branch, filePath } = getGitHubConfig();
    if (token) {
      try {
        const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&t=${Date.now()}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache'
          }
        });

        if (res.ok) {
          const fileData = await res.json();
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          const dataFromGH = JSON.parse(content);
          memoryData = { ...defaultData, ...dataFromGH };
          // Salva localmente para as próximas leituras serem rápidas
          await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(memoryData, null, 2));
          return memoryData;
        }
      } catch (error) {
        console.error('[GitHub] Erro ao ler dados:', error);
      }
    }
  }

  // Se tudo falhar, usa o que está em memória ou o padrão
  if (!memoryData) memoryData = { ...defaultData };
  return memoryData;
}

// Função mestre para escrever dados garantindo que nada seja apagado
async function writeData(newData: any) {
  // 1. Carrega os dados atuais para garantir que temos a versão mais fresca
  const currentData = await readData();
  
  // 2. Mescla os dados novos com os atuais (newData sobrescreve apenas as chaves enviadas)
  const updatedData = { ...currentData, ...newData };
  
  // 3. Atualiza a memória global
  memoryData = JSON.parse(JSON.stringify(updatedData));
  
  // 4. Salva no arquivo local imediatamente
  try {
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(memoryData, null, 2));
    console.log('[Storage] Dados salvos localmente com sucesso.');
  } catch (err) {
    console.error('[Storage] Erro crítico ao salvar localmente:', err);
  }

  // 5. Sincroniza com o GitHub em segundo plano
  const { token, repo, branch, filePath } = getGitHubConfig();
  if (token) {
    performGitHubWrite(memoryData, token, repo, branch, filePath).catch(err => {
      console.error('[GitHub] Erro na sincronização:', err.message);
    });
  }
  
  return memoryData;
}

async function performGitHubWrite(data: any, token: string, repo: string, branch: string, filePath: string) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const getRes = await fetch(`${url}?ref=${branch}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });

  let sha = '';
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update data.json [Automated Integrity Check]',
      content: content,
      sha: sha || undefined,
      branch: branch
    })
  });

  if (putRes.ok) {
    console.log('[GitHub] Sincronização concluída.');
  } else {
    console.error('[GitHub] Falha na sincronização:', await putRes.text());
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
    const newData = req.body;
    if (!newData.players || !Array.isArray(newData.players)) {
      return res.status(400).json({ error: 'Formato de dados inválido' });
    }
    // No restore, forçamos a substituição total
    memoryData = { ...defaultData, ...newData };
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(memoryData, null, 2));
    const { token, repo, branch, filePath } = getGitHubConfig();
    if (token) await performGitHubWrite(memoryData, token, repo, branch, filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao restaurar dados' });
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
    const transactions = [...data.transactions];
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
    const transactions = data.transactions.filter((t: any) => t.id !== req.params.id);
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