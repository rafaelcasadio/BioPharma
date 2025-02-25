document.getElementById('search').addEventListener('input', function() {
    carregarProdutos();
});

function carregarProdutos() {
    let filtro = document.getElementById('filtro').value;
    let pesquisa = document.getElementById('search').value.trim(); // Captura o valor da barra de pesquisa e remove espaços em branco
    let f;

    
     f = '/' + filtro;
    

    // Adiciona o parâmetro de pesquisa à URL
    let url = 'http://localhost:3000/produtos' + f + '?search=' + encodeURIComponent(pesquisa);

    fetch(url)
        .then(response => response.json())
        .then(produtos => {
            const conteudo = document.getElementById('conteudoProdutos');
            conteudo.innerHTML = ''; // Limpa o conteúdo existente antes de adicionar novos produtos

            produtos.forEach(produto => {
                const div = document.createElement('div');
                div.className = 'produto';
                div.onclick = function () {
                    window.location.href = 'comprar.html?id=' + produto.id;
                };

                const heart = document.createElement('div');
                heart.className = 'div-heart';
                heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
                div.appendChild(heart);

                const semEstoque = document.createElement('div');
                semEstoque.className = 'div-sem-estoque';
                semEstoque.innerHTML = '<h5> Produto sem estoque </h5>';
                div.appendChild(semEstoque);

                const image = document.createElement('img');
                image.src = produto.imagem;
                div.appendChild(image);

                const nomeProduto = document.createElement('p');
                nomeProduto.textContent = produto.nome;
                nomeProduto.className = 'nome-produto';
                div.appendChild(nomeProduto);

                const precoProduto = document.createElement('p');
                precoProduto.textContent = 'R$ ' + produto.preco;
                precoProduto.className = 'preco-produto';
                div.appendChild(precoProduto);

                conteudo.appendChild(div);

                const estoque = produto.estoque;

                if(!estoque){
                    div.style.opacity = '0.5';
                    div.style.pointerEvents = 'none';
                    div.style.cursor = 'not-allowed';
                    div.classList.add('produto-indisponivel');
                    semEstoque.style.display = 'block';
                }

            });
        })
        .catch(error => {
            console.error('Erro ao buscar produtos:', error);
        });
}

// Carrega os produtos ao carregar a página
carregarProdutos();
