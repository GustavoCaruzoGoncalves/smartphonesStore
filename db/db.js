const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'db4free.net',
  user: 'gustavocaruzogon',
  password: 'gustavo673',
  database: 'bd_loja'
});

connection.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
});

module.exports = connection;
