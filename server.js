const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const SECRET_KEY = 'secreto123'; // Troque por uma chave segura

// Configuração do multer para salvar imagens na pasta 'imagens'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/images'); // A pasta real onde as imagens são salvas
  },
  filename: function (req, file, cb) {
    const fileName = Date.now() + '-' + file.originalname; // Gera um nome único para o arquivo
    cb(null, fileName); // Salva o arquivo com nome único
  },
});

const upload = multer({ storage: storage });

// Configuração do Supabase
const supabaseUrl = 'https://cmqfnzipoyyerdieuqmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcWZuemlwb3l5ZXJkaWV1cW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDMxNDQsImV4cCI6MjA1NjA3OTE0NH0.7ToJTI_os0GYyDM38yBvR1rPUuY6a-elT9MA7jXvqK0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Rotas

// Rota de login
app.post('/loginadm', async (req, res) => {
  const { login, senha } = req.body;

  const { data, error } = await supabase
    .from('administradores')
    .select('*')
    .eq('login', login)
    .eq('senha', senha);

  if (error) return res.status(500).json({ message: 'Erro no servidor' });

  if (data.length > 0) {
    const token = jwt.sign({ login }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  res.status(401).json({ message: 'Credenciais inválidas' });
});

// Listar todos os produtos
app.get('/produtos', async (req, res) => {
  const { data, error } = await supabase.from('produtos').select('*');

  if (error) {
    console.error('Erro ao realizar a consulta: ', error);
    res.status(500).send('Erro interno');
    return;
  }
  res.json(data);
});

// Listar produtos por categoria ou pesquisa
app.get('/produtos/:categoria?', async (req, res) => {
  const { categoria } = req.params;
  const { search } = req.query;

  let query = supabase.from('produtos').select('*');

  if (categoria && categoria !== 'todos') {
    query = query.eq('filtro', categoria);
  }

  if (search) {
    query = query.ilike('nome', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao realizar a consulta: ', error);
    return res.status(500).json({ error: 'Erro interno ao buscar produtos' });
  }
  res.json(data);
});

// Detalhes de um produto específico
app.get('/produtodetails/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id);

  if (error) {
    console.error('Erro ao realizar a consulta: ', error);
    res.status(500).send('Erro interno');
    return;
  }

  if (data.length === 0) {
    return res.status(404).send('Produto não encontrado');
  }

  res.json(data[0]);
});

// Adicionar um novo produto
app.post('/produtos', upload.single('imagem'), async (req, res) => {
  const { nome, filtro, descricao, preco, estoque } = req.body;
  const imagem = 'src/images/' + req.file.filename;

  if (!nome || !filtro || !imagem || !descricao || !preco || !estoque) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  const { data, error } = await supabase
    .from('produtos')
    .insert([{ nome, filtro, imagem, descricao, preco, estoque }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao inserir produto' });
  }
  res.status(201).json({ id: data[0].id, nome, filtro, imagem, descricao, preco, estoque });
});

// Deletar um produto
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('produtos')
    .select('imagem')
    .eq('id', id);

  if (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }

  if (data.length === 0) {
    return res.status(404).json({ message: 'Produto não encontrado!' });
  }

  const produto = data[0];
  const caminhoImagem = path.resolve(__dirname, produto.imagem);

  if (produto.imagem && fs.existsSync(caminhoImagem)) {
    fs.unlink(caminhoImagem, (err) => {
      if (err) {
        console.error('Erro ao excluir a imagem:', err);
      } else {
        console.log('Imagem excluída com sucesso');
      }
    });
  }

  const { error: deleteError } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error(deleteError);
    return res.status(500).json({ message: 'Erro ao deletar produto' });
  }

  res.status(200).json({ message: 'Produto deletado com sucesso!' });
});

// Atualizar um produto
app.put('/produtos/:id', upload.single('imagem'), async (req, res) => {
  const id = req.params.id;
  const { nome, filtro, descricao, preco, estoque } = req.body;
  const novaImagem = req.file ? 'src/images/' + req.file.filename : null;

  const { data: produtoData, error: selectError } = await supabase
    .from('produtos')
    .select('imagem')
    .eq('id', id);

  if (selectError) {
    console.error('Erro ao buscar produto:', selectError);
    return res.status(500).json({ message: 'Erro ao buscar produto.' });
  }

  if (produtoData.length === 0) {
    return res.status(404).json({ message: 'Produto não encontrado.' });
  }

  const produto = produtoData[0];
  const imagemAntiga = produto.imagem;

  if (novaImagem && imagemAntiga && fs.existsSync(path.resolve(__dirname, imagemAntiga))) {
    fs.unlink(path.resolve(__dirname, imagemAntiga), (err) => {
      if (err) {
        console.error('Erro ao excluir a imagem antiga:', err);
      } else {
        console.log('Imagem antiga excluída com sucesso');
      }
    });
  }

  const imagem = novaImagem || imagemAntiga;

  const { data, error } = await supabase
    .from('produtos')
    .update({ nome, filtro, imagem, descricao, preco, estoque })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar o produto:', error);
    return res.status(500).json({ message: 'Erro ao atualizar o produto.' });
  }

  res.json({ message: 'Produto atualizado com sucesso!', imagem });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});