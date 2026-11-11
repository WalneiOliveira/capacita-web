//require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Conexão com o banco centralizado
const db = require('./db.cjs');

// Evita que uma falha silenciosa derrube o servidor sem deixar rastro nos logs
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  process.exit(1); // o Railway reinicia o container
});

const SEGREDO_JWT = process.env.JWT_SECRET;

if (!SEGREDO_JWT) {
  throw new Error('Defina a variavel JWT_SECRET no arquivo .env antes de iniciar a API.');
}

const app = express();

app.use(cors());
app.use(express.json());

// Encaminha erros de handlers assíncronos para o tratador de erros (resposta 500 em vez de travar)
const assincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// --- FRONT-END ANGULAR (build de produção) ---
// Procura dist/<projeto>/browser/index.html (gerado por "ng build")
const distRoot = path.join(__dirname, '..', 'dist');
let webDir = null;
if (fs.existsSync(distRoot)) {
  for (const nome of fs.readdirSync(distRoot)) {
    const dir = path.join(distRoot, nome, 'browser');
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      webDir = dir;
      break;
    }
  }
}
const indexHtml = webDir ? path.join(webDir, 'index.html') : null;
console.log('Pasta do front:', webDir);

// Aceita chamadas com prefixo /api (ex.: /api/login) ou sem prefixo (/login)
app.use((req, res, next) => {
  if (req.url === '/api' || req.url.startsWith('/api/') || req.url.startsWith('/api?')) {
    req.url = req.url.slice(4);
    if (!req.url.startsWith('/')) req.url = '/' + req.url;
  }
  next();
});

if (webDir) {
  // Arquivos estáticos do Angular (js, css, index.html)
  app.use(express.static(webDir));

  // Navegação do navegador (GET pedindo HTML) vai para o Angular. Isso evita conflito entre
  // rotas do Angular (ex.: /cursos) e rotas da API de mesmo nome. Chamadas XHR/fetch da API
  // não pedem text/html e seguem normalmente para as rotas abaixo.
  app.use((req, res, next) => {
    const querHtml = (req.headers.accept || '').includes('text/html');
    if (req.method === 'GET' && querHtml) return res.sendFile(indexHtml);
    next();
  });
}

// --- FUNÇÕES AUXILIARES COM SQL ---

function buscarUsuarioPorEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function buscarUsuarioPorId(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function removerSenha(usuario) {
  if (!usuario) return null;
  const { password, ...usuarioSemSenha } = usuario;
  return {
    ...usuarioSemSenha,
    isActive: Boolean(usuario.isActive),
    precisaTrocarSenha: Boolean(usuario.precisaTrocarSenha),
  };
}

// --- MIDDLEWARES DE AUTENTICAÇÃO E AUTORIZAÇÃO ---

function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao informado.' });
  }

  const token = cabecalho.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, SEGREDO_JWT);
    req.usuarioId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

function exigirBackoffice(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao informado.' });
  }

  const token = cabecalho.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, SEGREDO_JWT);
    const usuario = buscarUsuarioPorId(payload.sub);

    // Normaliza para letras minúsculas antes de verificar
    const roleUsuario = usuario?.role ? usuario.role.toLowerCase() : '';

    if (!usuario || (roleUsuario !== 'backoffice' && roleUsuario !== 'admin')) {
      return res.status(403).json({ error: 'Acesso restrito ao backoffice.' });
    }

    req.usuarioId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

// --- ROTAS DE AUTENTICAÇÃO E CONTA ---

// 1. ENDPOINT: REGISTER
app.post(
  '/register',
  assincrono(async (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
    }

    const userExistente = buscarUsuarioPorEmail(email);
    if (userExistente) {
      return res.status(400).json({ error: 'Ja existe um usuario com esse e-mail.' });
    }

    const senhaCriptografada = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, isActive, precisaTrocarSenha)
      VALUES (?, ?, ?, ?, 'aluno', 1, 0)
    `);
    stmt.run(id, name ?? '', email, senhaCriptografada);

    const accessToken = jwt.sign({ sub: id }, SEGREDO_JWT, { expiresIn: '2h' });
    const novoUsuario = buscarUsuarioPorId(id);

    res.status(201).json({ accessToken, user: removerSenha(novoUsuario) });
  }),
);

// 2. ENDPOINT: LOGIN
app.post(
  '/login',
  assincrono(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
    }

    const usuario = buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
    }

    const senhaCorreta = await bcrypt.compare(password, usuario.password);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
    }

    const accessToken = jwt.sign({ sub: usuario.id }, SEGREDO_JWT, { expiresIn: '2h' });

    res.json({ accessToken, user: removerSenha(usuario) });
  }),
);

// 3. ENDPOINT: ALTERAR SENHA
app.post(
  '/alterar-senha',
  assincrono(async (req, res) => {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao informado.' });
    }

    const token = cabecalho.replace('Bearer ', '');
    let usuarioId;

    try {
      const payload = jwt.verify(token, SEGREDO_JWT);
      usuarioId = payload.sub;
    } catch {
      return res.status(401).json({ error: 'Token invalido ou expirado.' });
    }

    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
    }

    const usuario = buscarUsuarioPorId(usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario nao encontrado.' });
    }

    const senhaAtualCorreta = await bcrypt.compare(senhaAtual, usuario.password);

    if (!senhaAtualCorreta) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

    db.prepare('UPDATE users SET password = ?, precisaTrocarSenha = 0 WHERE id = ?').run(
      novaSenhaCriptografada,
      usuarioId,
    );

    const usuarioAtualizado = buscarUsuarioPorId(usuarioId);
    res.json({ user: removerSenha(usuarioAtualizado) });
  }),
);

// --- GERENCIAMENTO DE USUÁRIOS (BACKOFFICE) ---

app.get('/users', exigirBackoffice, (req, res) => {
  const usuarios = db
    .prepare('SELECT id, name, email, role, isActive, precisaTrocarSenha FROM users')
    .all();
  const formatados = usuarios.map((u) => ({
    ...u,
    isActive: Boolean(u.isActive),
    precisaTrocarSenha: Boolean(u.precisaTrocarSenha),
  }));
  res.json(formatados);
});

app.post(
  '/users',
  exigirBackoffice,
  assincrono(async (req, res) => {
    const { name, email, password, role, isActive, precisaTrocarSenha } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
    }

    if (buscarUsuarioPorEmail(email)) {
      return res.status(400).json({ error: 'Ja existe um usuario com esse e-mail.' });
    }

    const id = crypto.randomUUID();
    const senhaHash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password, role, isActive, precisaTrocarSenha)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      name,
      email,
      senhaHash,
      role || 'aluno',
      isActive ? 1 : 0,
      precisaTrocarSenha ? 1 : 0,
    );

    const novo = buscarUsuarioPorId(id);
    res.status(201).json(removerSenha(novo));
  }),
);

// Handler reutilizável para edição completa (PUT) ou parcial (PATCH)
const atualizarUsuarioHandler = assincrono(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, isActive, precisaTrocarSenha } = req.body;

  // 1. Localiza usuário no banco
  const usuarioExistente = buscarUsuarioPorId(id);
  if (!usuarioExistente) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // 2. Trata alteração de e-mail (evita duplicidade com outro usuário)
  if (email && email !== usuarioExistente.email) {
    const emailEmUso = db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email, id);
    if (emailEmUso) {
      return res.status(400).json({ error: 'Já existe outro usuário cadastrado com este e-mail.' });
    }
  }

  // 3. Normaliza a ROLE
  let novaRole = usuarioExistente.role;
  if (role !== undefined) {
    const roleFormatada = role.toString().trim().toLowerCase();
    if (roleFormatada === 'admin' || roleFormatada === 'backoffice') {
      novaRole = 'backoffice';
    } else if (roleFormatada === 'aluno') {
      novaRole = 'aluno';
    }
  }

  // 4. Prepara valores (preserva o atual se não for enviado no PATCH)
  const novoNome = name !== undefined ? name : usuarioExistente.name;
  const novoEmail = email !== undefined ? email : usuarioExistente.email;
  const novoIsActive = isActive !== undefined ? (isActive ? 1 : 0) : usuarioExistente.isActive;
  const novoPrecisaTrocarSenha =
    precisaTrocarSenha !== undefined
      ? precisaTrocarSenha
        ? 1
        : 0
      : usuarioExistente.precisaTrocarSenha;

  // 5. Executa a atualização
  if (password && password.trim() !== '') {
    const senhaHash = await bcrypt.hash(password, 10);
    db.prepare(
      `
      UPDATE users 
      SET name = ?, email = ?, password = ?, role = ?, isActive = ?, precisaTrocarSenha = ? 
      WHERE id = ?
    `,
    ).run(novoNome, novoEmail, senhaHash, novaRole, novoIsActive, novoPrecisaTrocarSenha, id);
  } else {
    db.prepare(
      `
      UPDATE users 
      SET name = ?, email = ?, role = ?, isActive = ?, precisaTrocarSenha = ? 
      WHERE id = ?
    `,
    ).run(novoNome, novoEmail, novaRole, novoIsActive, novoPrecisaTrocarSenha, id);
  }

  const atualizado = buscarUsuarioPorId(id);
  res.json(removerSenha(atualizado));
});

// Registra os métodos PUT e PATCH na API
app.put('/users/:id', exigirBackoffice, atualizarUsuarioHandler);
app.patch('/users/:id', exigirBackoffice, atualizarUsuarioHandler);

app.delete('/users/:id', exigirBackoffice, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// --- CURSOS, VÍDEOS E MATRÍCULAS ---

// Cursos
app.get('/cursos', exigirLogin, (req, res) => {
  res.json(db.prepare('SELECT * FROM cursos').all());
});

app.post('/cursos', exigirBackoffice, (req, res) => {
  const { nome, nivel, horas } = req.body;
  const stmt = db.prepare('INSERT INTO cursos (nome, nivel, horas) VALUES (?, ?, ?)');
  const result = stmt.run(nome, nivel, horas);
  res.status(201).json({ id: Number(result.lastInsertRowid), nome, nivel, horas: Number(horas) });
});

app.delete('/cursos/:id', exigirBackoffice, (req, res) => {
  db.prepare('DELETE FROM cursos WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Vídeos
app.get('/videos', exigirLogin, (req, res) => {
  const { cursoId } = req.query;

  if (cursoId) {
    const stmt = db.prepare('SELECT * FROM videos WHERE cursoId = ?');
    const videos = stmt.all(Number(cursoId));
    return res.json(videos);
  }

  res.json(db.prepare('SELECT * FROM videos').all());
});

app.post('/videos', exigirBackoffice, (req, res) => {
  const { cursoId, titulo, youtubeId } = req.body;
  const stmt = db.prepare('INSERT INTO videos (cursoId, titulo, youtubeId) VALUES (?, ?, ?)');
  const result = stmt.run(Number(cursoId), titulo, youtubeId);
  res
    .status(201)
    .json({ id: Number(result.lastInsertRowid), cursoId: Number(cursoId), titulo, youtubeId });
});

app.delete('/videos/:id', exigirBackoffice, (req, res) => {
  db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Matrículas
// GET /matriculas (Retorna apenas as matrículas do usuário logado)
app.get('/matriculas', exigirLogin, (req, res) => {
  const usuarioId = req.usuarioId; // ID extraído do Token JWT pelo middleware exigirLogin

  // Busca no SQLite apenas as matrículas pertencentes a este aluno
  const stmt = db.prepare('SELECT * FROM matriculas WHERE userId = ?');
  const minhasMatriculas = stmt.all(usuarioId);

  res.json(minhasMatriculas);
});

app.post('/matriculas', exigirLogin, (req, res) => {
  const { userId, cursoId, horasAssistidas, dataMatricula } = req.body;
  const stmt = db.prepare(`
    INSERT INTO matriculas (userId, cursoId, horasAssistidas, dataMatricula)
    VALUES (?, ?, ?, ?)
  `);
  const dataHoje = dataMatricula || new Date().toISOString().split('T')[0];
  const result = stmt.run(userId, Number(cursoId), horasAssistidas || 0, dataHoje);

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    userId,
    cursoId: Number(cursoId),
    horasAssistidas: horasAssistidas || 0,
    dataMatricula: dataHoje,
  });
});

app.put('/matriculas/:id', exigirLogin, (req, res) => {
  const { horasAssistidas } = req.body;
  db.prepare('UPDATE matriculas SET horasAssistidas = ? WHERE id = ?').run(
    horasAssistidas,
    req.params.id,
  );
  const matricula = db.prepare('SELECT * FROM matriculas WHERE id = ?').get(req.params.id);
  res.json(matricula);
});

app.delete('/matriculas/:id', exigirLogin, (req, res) => {
  db.prepare('DELETE FROM matriculas WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// --- FALLBACKS (devem ficar depois de todas as rotas da API) ---

// Qualquer outro GET volta para o Angular (rotas internas do front); o resto é 404
app.use((req, res) => {
  if (req.method === 'GET' && indexHtml) return res.sendFile(indexHtml);
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

// Tratador de erros: registra no log e responde 500 sem derrubar o servidor
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Erro na requisicao:', req.method, req.url, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API rodando com sucesso na porta ${PORT}`);
});
