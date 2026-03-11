import express from 'express';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

const getGitHubConfig = () => ({
  token: process.env.GITHUB_TOKEN,
  repo: process.env.GITHUB_REPO || 'gabrielxrm-lab/S-O-JORGE-FUTEBOL',
  branch: process.env.GITHUB_BRANCH || 'main',
  filePath: 'data.json'
});

const defaultData = { players: [], monthly_payments: {}, game_stats: [] };
let memoryData: any = null; // Fallback for missing token or cold starts

async function readData() {
  const { token, repo, branch, filePath } = getGitHubConfig();
  
  if (!token) {
    console.warn('GITHUB_TOKEN não configurado. Retornando dados em memória (somente leitura).');
    return memoryData || defaultData;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      return defaultData;
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.statusText}`);
    }

    const fileData = await res.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const parsedData = JSON.parse(content);
    memoryData = parsedData; // Cache it
    return parsedData;
  } catch (error) {
    console.error('Erro ao ler dados do GitHub:', error);
    return memoryData || defaultData;
  }
}

async function writeData(data: any) {
  const { token, repo, branch, filePath } = getGitHubConfig();
  
  memoryData = data; // Update cache immediately

  if (!token) {
    console.warn('GITHUB_TOKEN não configurado. Salvando apenas em memória (será perdido ao reiniciar).');
    return;
  }

  try {
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    
    // 1. Obter o SHA atual do arquivo
    const getRes = await fetch(`${url}?ref=${branch}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = '';
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Atualizar o arquivo
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
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
      console.error('Falha ao fazer push para o GitHub:', errorData);
      throw new Error(`Falha ao salvar no GitHub: ${errorData.message || putRes.statusText}`);
    } else {
      console.log('data.json atualizado com sucesso no GitHub!');
    }
  } catch (error) {
    console.error('Erro ao fazer push para o GitHub:', error);
    throw error;
  }
}

// API Routes
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
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
    
    data.monthly_payments[year] = payments;
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save payments' });
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

async function startServer() {
  // Pré-carrega os dados do GitHub na inicialização
  await readData();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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

export default app;
