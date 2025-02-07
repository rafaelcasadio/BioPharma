const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Configuração do multer para salvar imagens na pasta 'imagens'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Salvar o arquivo na pasta 'imagens'
    cb(null, './src/images');  // A pasta real onde as imagens são salvas
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '-' + file.originalname;  // Gera um nome único para o arquivo
    cb(null, fileName);  // Salva o arquivo com nome único
  }
});

const upload = multer({ storage: storage });

// Criando a conexão com o banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '34413169',
  database: 'farmacia'
});

// Conectando ao banco
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err);
    return;
  }
  console.log('Conexão bem-sucedida ao banco de dados!');
});

// Rotas

app.get('/produtos', (req, res) => {
  db.query('SELECT * FROM produtos', (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta: ', err);
      res.status(500).send('Erro interno');
      return;
    }
    res.json(results);
  });
});

app.get('/produtos/:categoria', (req, res) => {
  const { categoria } = req.params;
  
  db.query('SELECT * FROM produtos WHERE filtro = ?', [categoria], (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta: ', err);
      res.status(500).send('Erro interno');
      return;
    }
    res.json(results);
  });
});

app.post('/produtos', upload.single('imagem'), (req, res) => {
  const { nome, filtro, descricao, preco } = req.body;

  // Aqui é onde a imagem vai ter o caminho 'src/images/nome-do-arquivo.extensão'
  const imagem = 'src/images/' + req.file.filename;  // Caminho relativo que será salvo no banco

  if (!nome || !filtro || !imagem || !descricao || !preco) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  const query = 'INSERT INTO produtos (nome, filtro, imagem, descricao, preco) VALUES (?, ?, ?, ?, ?)';
  const values = [nome, filtro, imagem, descricao, preco];

  db.execute(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao inserir produto' });
    }
    res.status(201).json({ id: results.insertId, nome, filtro, imagem, descricao, preco });
  });
});

app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;

  // Consultar o produto no banco para pegar o caminho da imagem
  const querySelect = 'SELECT imagem FROM produtos WHERE id = ?';

  db.execute(querySelect, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao buscar produto' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado!' });
    }

    const produto = results[0];
    const caminhoImagem = path.resolve(__dirname, produto.imagem);

    // Deletar a imagem, se ela existir
    if (produto.imagem && fs.existsSync(caminhoImagem)) {
      fs.unlink(caminhoImagem, (err) => {
        if (err) {
          console.error('Erro ao excluir a imagem:', err);
        } else {
          console.log('Imagem excluída com sucesso');
        }
      });
    }

    // Agora, deletar o produto do banco de dados
    const queryDelete = 'DELETE FROM produtos WHERE id = ?';
    
    db.execute(queryDelete, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar produto' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Produto não encontrado!' });
      }

      res.status(200).json({ message: 'Produto deletado com sucesso!' });
    });
  });
});

const fs = require('fs');
const path = require('path');

app.put('/produtos/:id', upload.single('imagem'), (req, res) => {
  const id = req.params.id;
  const { nome, filtro, descricao, preco } = req.body;
  const novaImagem = req.file ? 'src/images/' + req.file.filename : null;

  // Primeiro, buscamos o produto no banco para pegar a imagem antiga
  const querySelect = 'SELECT imagem FROM produtos WHERE id = ?';
  
  db.execute(querySelect, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar produto:", err);
      return res.status(500).json({ message: "Erro ao buscar produto." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const produto = results[0];
    const imagemAntiga = produto.imagem;

    // Se existir uma imagem antiga, excluímos ela
    if (imagemAntiga && fs.existsSync(path.resolve(__dirname, imagemAntiga))) {
      fs.unlink(path.resolve(__dirname, imagemAntiga), (err) => {
        if (err) {
          console.error('Erro ao excluir a imagem antiga:', err);
        } else {
          console.log('Imagem antiga excluída com sucesso');
        }
      });
    }

    // Se uma nova imagem foi enviada, atualizamos o caminho
    const imagem = novaImagem ? novaImagem : imagemAntiga; // Se não houver nova imagem, mantemos a antiga

    // Atualizando o produto no banco de dados
    const sql = `UPDATE produtos 
                 SET nome = ?, filtro = ?, imagem = ?, descricao = ?, preco = ? 
                 WHERE id = ?`;

    db.query(sql, [nome, filtro, imagem, descricao, preco, id], (err, result) => {
      if (err) {
        console.error("Erro ao atualizar o produto:", err);
        return res.status(500).json({ message: "Erro ao atualizar o produto." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Produto não encontrado." });
      }

      res.json({ message: "Produto atualizado com sucesso!" });
    });
  });
});


app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
