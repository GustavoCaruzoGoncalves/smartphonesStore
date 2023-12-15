const express = require('express');
const session = require('express-session');
const db = require('./db/db');
const app = express();
const port = 3000;

// Configuração do mecanismo de template EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middleware para servir arquivos estáticos (CSS, imagens, etc.)
app.use(express.static(__dirname + '/public'));

// Middleware para parsear dados de formulário
app.use(express.urlencoded({ extended: true }));

// Middleware para sessão
app.use(session({
  secret: 'sua-chave-secreta-aqui',
  resave: false,
  saveUninitialized: true
}));

app.get('/usuarios', (req, res) => {
  const sql = 'SELECT * FROM usuarios';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao executar a consulta:', err.stack);
      res.status(500).send('Erro ao buscar usuários');
      return;
    }

    // Renderiza a página EJS com os resultados da consulta
    res.render('usuarios', { usuarios: results });
  });
});

// Adicione o roteamento para index.ejs
app.get('/', (req, res) => {
  // Recupera a variável nomeUsuario da sessão
  const nomeUsuario = req.session.nomeUsuario;

  res.render('index', { nomeUsuario });  // Renderiza a página index.ejs
});

app.get('/cadastro', (req, res) => {
  res.render('cadastro'); // Assumindo que o arquivo EJS de cadastro é chamado cadastro.ejs
});

// Rota para processar o formulário de cadastro
app.post('/cadastro', (req, res) => {
  // Lógica para processar os dados do formulário de cadastro
  const nome = req.body.nome;
  const email = req.body.email;
  const senha = req.body.senha;

  // Lógica de inserção no banco de dados
  const sql = 'INSERT INTO usuarios (email, senha, nome) VALUES (?, ?, ?)';
  db.query(sql, [email, senha, nome], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err.stack);
      res.status(500).send('Erro ao cadastrar usuário');
      return;
    }

    // Armazena o nome do usuário na sessão
    req.session.nomeUsuario = nome;

    // Redireciona para o index.ejs com o nome do usuário
    res.redirect('/');  // Redireciona para a rota '/' após o cadastro
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});