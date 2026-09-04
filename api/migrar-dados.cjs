const fs = require('fs');
const path = require('path');
const db = require('./db.cjs');
const DB_JSON_PATH = path.join(__dirname, 'db.json');
const dados = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf-8'));
const inserirUsuario = db.prepare(
  ` INSERT INTO users (id, name, email, password, role, isActive, precisaTrocarSenha) VALUES (@id, @name, @email, @password, @role, @isActive, @precisaTrocarSenha) `,
);
const inserirCurso = db.prepare(
  ` INSERT INTO cursos (id, nome, nivel, horas) VALUES (@id, @nome, @nivel, @horas) `,
);
const inserirVideo = db.prepare(
  ` INSERT INTO videos (id, cursoId, titulo, youtubeId) VALUES (@id, @cursoId, @titulo, @youtubeId) `,
);
const inserirMatricula = db.prepare(
  ` INSERT INTO matriculas (userId, cursoId, horasAssistidas, dataMatricula) VALUES (@userId, @cursoId, @horasAssistidas, @dataMatricula) `,
);
const migrar = db.transaction(() => {
  for (const u of dados.users) {
    inserirUsuario.run({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      isActive: u.isActive ? 1 : 0,
      precisaTrocarSenha: u.precisaTrocarSenha ? 1 : 0,
    });
  }
  for (const c of dados.cursos) {
    inserirCurso.run({ id: c.id, nome: c.nome, nivel: c.nivel, horas: c.horas });
  }
  for (const v of dados.videos) {
    inserirVideo.run({
      id: v.id,
      cursoId: v.cursoId,
      titulo: v.titulo,
      youtubeId: v.youtubeId.split('&')[0],
    });
  }
  for (const m of dados.matriculas) {
    if (!m.userId) {
      console.warn(`Matricula id=${m.id} sem userId, pulando (registro orfao).`);
      continue;
    }
    inserirMatricula.run({
      userId: m.userId,
      cursoId: m.cursoId,
      horasAssistidas: m.horasAssistidas ?? 0,
      dataMatricula: m.dataMatricula ?? new Date().toISOString().split('T')[0],
    });
  }
});
migrar();
console.log('Migracao concluida com sucesso.');
