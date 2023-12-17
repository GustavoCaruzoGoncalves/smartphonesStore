// index.js

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const db = require('./db/db');
const app = express();
const port = 3000;
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); // Especifique o diretório onde você deseja salvar as imagens
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


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
  const nomeUsuario = req.session.nomeUsuario;
  const tipo = req.session.tipo;

  const sqlProdutos = 'SELECT * FROM produtos';
  db.query(sqlProdutos, (err, resultados) => {
    if (err) {
      console.error('Erro ao buscar produtos:', err.stack);
      res.status(500).send('Erro ao buscar produtos');
      return;
    }

    const produtos = resultados.map(produto => {
      return {
        ...produto,
        imagem: produto.imagem ? produto.imagem.toString('base64') : null, // Trata o caso da imagem nula
      };
    });

    res.render('index', { nomeUsuario, produtos, tipo });
  });
});

// Rota para exibir o formulário de login
app.get('/login', (req, res) => {
  // Recupera a variável mensagemErro da sessão
  const mensagemErro = req.session.mensagemErro;

  res.render('cadastro', { mensagemErro }); // Crie a view login.ejs para exibir o formulário de login
});

// Rota para processar o formulário de login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const senha = req.body.senha;

  // Lógica para verificar as credenciais no banco de dados
  const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';
  db.query(sql, [email, senha], (err, results) => {
    if (err) {
      console.error('Erro ao verificar credenciais:', err.stack);
      res.status(500).send('Erro ao verificar credenciais');
      return;
    }

    if (results.length > 0) {
      // Usuário autenticado, armazena o nome do usuário e tipo na sessão
      req.session.nomeUsuario = results[0].nome;
      req.session.tipo = results[0].tipo; // Verifique se o nome da coluna está correto
      res.redirect('/');
    } else {
      // Credenciais inválidas, configura a mensagem de erro na sessão
      req.session.mensagemErro = 'Credenciais inválidas. Por favor, verifique seu email e senha.';
      res.redirect('/cadastro');
    }
  });
});

app.get('/cadastro', (req, res) => {
  const mensagemErro = req.session.mensagemErro || '';
  req.session.mensagemErro = '';
  res.render('cadastro', { mensagemErro });
});

// Rota para processar o formulário de cadastro
app.post('/cadastro', (req, res) => {
  const nome = req.body.nome;
  const email = req.body.email;
  const senha = req.body.senha;
  const tipo = req.body.tipo || 0;  // Padrão para usuário comum se não houver tipo no formulário

  const sql = 'INSERT INTO usuarios (email, senha, nome, tipo) VALUES (?, ?, ?, ?)';
  db.query(sql, [email, senha, nome, tipo], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err.stack);
      req.session.mensagemErro = 'Erro ao cadastrar usuário. Por favor, tente novamente.';
      res.status(500).send('Erro ao cadastrar usuário');
      return;
    }

    // Armazena o nome do usuário na sessão
    req.session.nomeUsuario = nome;

    // Redireciona para o index.ejs com o nome do usuário
    res.redirect('/');  // Redireciona para a rota '/' após o cadastro
  });
});

app.get('/produtos', (req, res) => {
  // Verifique se o usuário é um administrador
  if (req.session.tipo === 1) {
    res.render('produtos');
  } else {
    res.status(403).send('Acesso negado.');
  }
});

app.get('/admin', (req, res) => {
  // Verifique se o usuário é um administrador
  if (req.session.tipo === 1) {
    res.render('admin');
  } else {
    res.status(403).send('Acesso negado.');
  }
});

app.post('/admin/adicionar-produto', upload.single('imagem'), (req, res) => {
  const nome = req.body.nome;
  const descricao = req.body.descricao;
  const preco = req.body.preco;
  const imagem = req.file;

  if (!imagem) {
    res.status(400).send('É necessário enviar uma imagem.');
    return;
  }

  const caminhoImagem = '/uploads/' + imagem.filename; // Caminho relativo ao diretório public

  const sql = 'INSERT INTO produtos (nome, descricao, preco, imagem) VALUES (?, ?, ?, ?)';
  db.query(sql, [nome, descricao, preco, caminhoImagem], (err, result) => {
    if (err) {
      console.error('Erro ao adicionar produto:', err.stack);
      res.status(500).send('Erro ao adicionar produto');
      return;
    }

    res.redirect('/admin');
  });
});

// Rota para efetuar logout
app.get('/logout', (req, res) => {
  // Limpa a variável nomeUsuario da sessão
  req.session.nomeUsuario = null;
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});