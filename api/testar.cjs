const db = require('./db.cjs');

console.log('\n--- 👥 USUÁRIOS ---');
console.table(db.prepare('SELECT id, name, email, role, isActive FROM users').all());

console.log('\n--- 📚 CURSOS ---');
console.table(db.prepare('SELECT * FROM cursos').all());

console.log('\n--- 🎥 VÍDEOS ---');
console.table(db.prepare('SELECT * FROM videos').all());

console.log('\n--- 📝 MATRÍCULAS ---');
console.table(db.prepare('SELECT * FROM matriculas').all());