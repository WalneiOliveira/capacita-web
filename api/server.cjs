require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
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

function lerBanco() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function salvarBanco(dados) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2));
}

server.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const banco = lerBanco();
  const jaExiste = banco.users.find((u) => u.email === email);
  if (jaExiste) {
    return res.status(400).json({ error: 'Já existe um usuário com esse e-mail.' });
  }

  const senhaCriptografada = await bcrypt.hash(password, 10);
  const novoUsuario = {
    id: crypto.randomUUID(),
    name: name ?? '',
    email,
    password: senhaCriptografada,
    isActive: true,
    role: 'aluno', // registro público sempre cria aluno; nunca aceitamos "role" vindo do cliente
  };

  banco.users.push(novoUsuario);
  salvarBanco(banco);

  const accessToken = jwt.sign({ sub: novoUsuario.id }, SEGREDO_JWT, { expiresIn: '2h' });
  const { password: _senha, ...usuarioSemSenha } = novoUsuario;
  res.status(201).json({ accessToken, user: usuarioSemSenha });
});

server.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const banco = lerBanco();
  const usuario = banco.users.find((u) => u.email === email);

  if (!usuario) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const senhaCorreta = await bcrypt.compare(password, usuario.password);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const accessToken = jwt.sign({ sub: usuario.id }, SEGREDO_JWT, { expiresIn: '2h' });
  const { password: _senha, ...usuarioSemSenha } = usuario;
  res.json({ accessToken, user: usuarioSemSenha });
});

function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não informado.' });
  }

  const token = cabecalho.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, SEGREDO_JWT);
    req.usuarioId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function exigirBackoffice(req, res, next) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não informado.' });
  }
  const token = cabecalho.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, SEGREDO_JWT);
    const banco = lerBanco();
    const usuario = banco.users.find((u) => u.id === payload.sub);
    if (!usuario || usuario.role !== 'backoffice') {
      return res.status(403).json({ error: 'Acesso restrito ao backoffice.' });
    }
    req.usuarioId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

server.use(['/cursos', '/videos', '/matriculas'], exigirLogin);

server.use(['/users'], exigirBackoffice);

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
