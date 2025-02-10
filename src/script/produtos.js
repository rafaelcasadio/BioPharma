function carregarProdutos() {
    let filtro = document.getElementById('filtro').value;
    let f;

    if (filtro !== 'todos') {
        f = '/' + filtro;
    }
    else {
        f = '';
    }

    fetch('http://localhost:3000/produtos' + f)
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
            });
        })
        .catch(error => {
            console.error('Erro ao buscar produtos:', error);
        });
}

carregarProdutos();
