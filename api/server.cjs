require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'db.json');
const SEGREDO_JWT = process.env.JWT_SECRET;

if (!SEGREDO_JWT) {
  throw new Error('Defina a variavel JWT_SECRET no arquivo .env antes de iniciar a API.');
}

const server = jsonServer.create();
const router = jsonServer.router(DB_PATH);
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);

// Funções auxiliares
function buscarUsuarioPorEmail(email) {
  return router.db.get('users').find({ email }).value();
}

function buscarUsuarioPorId(id) {
  return router.db.get('users').find({ id }).value();
}

// 1. ENDPOINT: REGISTER
server.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });
  }

  if (buscarUsuarioPorEmail(email)) {
    return res.status(400).json({ error: 'Ja existe um usuario com esse e-mail.' });
  }

  const senhaCriptografada = await bcrypt.hash(password, 10);
  const novoUsuario = {
    id: crypto.randomUUID(),
    name: name ?? '',
    email,
    password: senhaCriptografada,
    isActive: true,
    role: 'aluno',
  };

  router.db.get('users').push(novoUsuario).write();

  const accessToken = jwt.sign({ sub: novoUsuario.id }, SEGREDO_JWT, { expiresIn: '2h' });
  const { password: _senha, ...usuarioSemSenha } = novoUsuario;

  res.status(201).json({ accessToken, user: usuarioSemSenha });
});

// 2. ENDPOINT: LOGIN
server.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const usuario = buscarUsuarioPorEmail(email);

  if (!usuario) {
    return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
  }

  const senhaCorreta = await bcrypt.compare(password, usuario.password);

  if (!senhaCorreta) {
    return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
  }

  const accessToken = jwt.sign({ sub: usuario.id }, SEGREDO_JWT, { expiresIn: '2h' });
  const { password: _senha, ...usuarioSemSenha } = usuario;

  res.json({ accessToken, user: usuarioSemSenha });
});

// 3. ENDPOINT: ALTERAR SENHA (INSERIDO AQUI)
server.post('/alterar-senha', async (req, res) => {
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

  router.db
    .get('users')
    .find({ id: usuarioId })
    .assign({ password: novaSenhaCriptografada, precisaTrocarSenha: false })
    .write();

  const usuarioAtualizado = buscarUsuarioPorId(usuarioId);
  const { password: _senha, ...usuarioSemSenha } = usuarioAtualizado;

  res.json({ user: usuarioSemSenha });
});

// Middlewares de autenticação e autorização
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

    if (!usuario || usuario.role !== 'backoffice') {
      return res.status(403).json({ error: 'Acesso restrito ao backoffice.' });
    }

    req.usuarioId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado.' });
  }
}

async function hashearSenhaSeNecessario(req, res, next) {
  const metodosComCorpo = ['POST', 'PUT', 'PATCH'];

  if (metodosComCorpo.includes(req.method) && req.body && req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  next();
}

// Aplicação das travas e rotas do JSON Server
server.use(['/cursos', '/videos', '/matriculas'], exigirLogin);
server.use(['/users'], exigirBackoffice);
server.use(['/users'], hashearSenhaSeNecessario);

// Oculta a senha das respostas para a rota de usuários
router.render = (req, res) => {
  let dados = res.locals.data;

  if (req.path.startsWith('/users')) {
    if (Array.isArray(dados)) {
      dados = dados.map(({ password, ...resto }) => resto);
    } else if (dados && typeof dados === 'object' && 'password' in dados) {
      const { password, ...resto } = dados;
      dados = resto;
    }
  }

  res.jsonp(dados);
};

server.use(router);

server.listen(3000, () => {
  console.log('API rodando em http://localhost:3000');
});
