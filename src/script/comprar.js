
function carregarProduto() {
    // Recupera o ID da URL
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');

    // Verifica se o ID foi passado
    if (!id) {
        console.error('ID do produto não encontrado na URL.');
        return;
    }

    // Faz a requisição para buscar os detalhes do produto
    fetch(`http://localhost:3000/produtodetails/`+id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar o produto');
            }
            return response.json();
        })
        .then(produto => {
            const produtoDetalhes = document.getElementById('produtoDetalhes');
            produtoDetalhes.innerHTML = ''; // Limpa o conteúdo existente

            // Cria os elementos para exibir os detalhes do produto
            const div = document.createElement('div');
            div.className = 'produto-detalhe';

            const image = document.createElement('img');
            image.src = produto.imagem;
            div.appendChild(image);

            const nomeProduto = document.createElement('h1');
            nomeProduto.textContent = produto.nome;
            div.appendChild(nomeProduto);

            const precoProduto = document.createElement('p');
            precoProduto.textContent = 'R$ ' + produto.preco;
            div.appendChild(precoProduto);

            const descricaoProduto = document.createElement('p');
            descricaoProduto.textContent = produto.descricao; // Supondo que você tenha uma descrição
            div.appendChild(descricaoProduto);

            produtoDetalhes.appendChild(div);
        })
        .catch(error => {
            console.error('Erro ao carregar os detalhes do produto:', error);
        });
}

// Chama a função para carregar o produto ao carregar a página
carregarProduto();