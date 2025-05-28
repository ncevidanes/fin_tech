// URL base da sua API backend (Exemplo com Flask)
// const API_URL = 'http://127.0.0.1:5000'; // Se rodando Flask localmente

// Vamos simular dados e funcionalidades por enquanto,
// já que o backend Python ainda não está configurado como uma API web.

let transacoes = [
    // Exemplo de dados iniciais (serão substituídos pelos dados do backend)
    { id: 1, data: '2025-05-01', descricao: 'Salário', categoria: 'Renda', tipo: 'receita', valor: 5000.00 },
    { id: 2, data: '2025-05-02', descricao: 'Aluguel', categoria: 'Moradia', tipo: 'despesa', valor: 1200.00 }
];
let proximoId = 3; // Para simular a geração de IDs

const formTransacao = document.getElementById('formTransacao');
const tabelaExtratoBody = document.getElementById('tabelaExtrato').getElementsByTagName('tbody')[0];
const saldoAtualEl = document.getElementById('saldoAtual');
const ctxGrafico = document.getElementById('graficoMensal')?.getContext('2d'); // O '?' para o caso de o canvas não existir
let graficoMensalObj = null;


// Função para renderizar as transações na tabela
function renderizarTabela() {
    tabelaExtratoBody.innerHTML = ''; // Limpa a tabela

    // Ordena as transações por data (mais recentes primeiro)
    const transacoesOrdenadas = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    transacoesOrdenadas.forEach(transacao => {
        const row = tabelaExtratoBody.insertRow();
        row.insertCell().textContent = new Date(transacao.data + 'T00:00:00-03:00').toLocaleDateString('pt-BR'); // Adiciona info de fuso se necessário
        row.insertCell().textContent = transacao.descricao;
        row.insertCell().textContent = transacao.categoria;
        row.insertCell().textContent = transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1);
        
        const valorCell = row.insertCell();
        valorCell.textContent = transacao.valor.toFixed(2);
        valorCell.style.color = transacao.tipo === 'receita' ? 'green' : 'red';

        const acoesCell = row.insertCell();
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('edit-btn');
        btnEditar.onclick = () => preencherFormParaEditar(transacao.id);
        acoesCell.appendChild(btnEditar);

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.classList.add('delete-btn');
        btnExcluir.onclick = () => excluirTransacao(transacao.id);
        acoesCell.appendChild(btnExcluir);

    });
    calcularEExibirSaldo();
    renderizarGrafico(); // Atualiza o gráfico sempre que a tabela é renderizada
}

// Função para calcular e exibir o saldo
function calcularEExibirSaldo() {
    let saldo = 0;
    transacoes.forEach(transacao => {
        if (transacao.tipo === 'receita') {
            saldo += transacao.valor;
        } else {
            saldo -= transacao.valor;
        }
    });
    saldoAtualEl.textContent = `R$ ${saldo.toFixed(2)}`;
    saldoAtualEl.style.color = saldo >= 0 ? 'green' : 'red';
}

// Função para lidar com o envio do formulário
formTransacao.addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const idEdicao = parseInt(formTransacao.dataset.editId); // Pega o ID se estiver editando

    if (idEdicao) { // Lógica de Edição
        const index = transacoes.findIndex(t => t.id === idEdicao);
        if (index !== -1) {
            transacoes[index] = { id: idEdicao, data, descricao, valor, tipo, categoria };
        }
        delete formTransacao.dataset.editId; // Limpa o ID de edição
        formTransacao.querySelector('button[type="submit"]').textContent = 'Adicionar';

    } else { // Lógica de Adição
        const novaTransacao = {
            id: proximoId++, // Simula ID do backend
            data,
            descricao,
            valor,
            tipo,
            categoria
        };
        transacoes.push(novaTransacao);
    }

    renderizarTabela();
    formTransacao.reset(); // Limpa o formulário
});

// Função para preencher o formulário para edição
function preencherFormParaEditar(id) {
    const transacao = transacoes.find(t => t.id === id);
    if (transacao) {
        document.getElementById('data').value = transacao.data;
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('tipo').value = transacao.tipo;
        document.getElementById('categoria').value = transacao.categoria;
        
        formTransacao.dataset.editId = id; // Armazena o ID da transação que está sendo editada
        formTransacao.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
    }
}

// Função para excluir uma transação
function excluirTransacao(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transacoes = transacoes.filter(transacao => transacao.id !== id);
        renderizarTabela();
    }
}

// Função para agregar dados para o gráfico
function obterDadosAgregadosGrafico() {
    const agregados = {}; // Ex: {'2025-05': {receitas: 100, despesas: 50}}

    transacoes.forEach(t => {
        const mesAno = t.data.substring(0, 7); // YYYY-MM
        if (!agregados[mesAno]) {
            agregados[mesAno] = { receitas: 0, despesas: 0 };
        }
        if (t.tipo === 'receita') {
            agregados[mesAno].receitas += t.valor;
        } else {
            agregados[mesAno].despesas += t.valor;
        }
    });

    const labels = Object.keys(agregados).sort(); // Meses ordenados
    const dadosReceitas = labels.map(mes => agregados[mes].receitas);
    const dadosDespesas = labels.map(mes => agregados[mes].despesas);

    return { labels, dadosReceitas, dadosDespesas };
}


// Função para renderizar/atualizar o gráfico
function renderizarGrafico() {
    if (!ctxGrafico) return; // Se o elemento canvas não existe, não faz nada

    const { labels, dadosReceitas, dadosDespesas } = obterDadosAgregadosGrafico();

    if (graficoMensalObj) {
        graficoMensalObj.destroy(); // Destrói o gráfico anterior para criar um novo
    }

    graficoMensalObj = new Chart(ctxGrafico, {
        type: 'line', // Pode ser 'bar', 'line', etc.
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: dadosReceitas,
                    borderColor: 'green',
                    backgroundColor: 'rgba(0, 128, 0, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Despesas',
                    data: dadosDespesas,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Inicializa a tabela ao carregar a página
window.onload = function() {
    renderizarTabela();
    // Aqui você chamaria uma função para carregar as transações do backend
    // Ex: carregarTransacoesDoBackend();
};

// --- Funções que interagiriam com o Backend (Exemplos) ---
// async function carregarTransacoesDoBackend() {
//     try {
//         const response = await fetch(`${API_URL}/transacoes`);
//         transacoes = await response.json();
//         proximoId = transacoes.length > 0 ? Math.max(...transacoes.map(t => t.id)) + 1 : 1;
//         renderizarTabela();
//     } catch (error) {
//         console.error('Erro ao carregar transações:', error);
//     }
// }

// async function adicionarTransacaoNoBackend(novaTransacao) {
//     try {
//         const response = await fetch(`${API_URL}/transacoes`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(novaTransacao)
//         });
//         const transacaoAdicionada = await response.json();
//         // Em vez de adicionar localmente e depois renderizar,
//         // o ideal é recarregar do backend ou adicionar a resposta.
//         // Para simplificar, vamos recarregar tudo:
//         carregarTransacoesDoBackend(); 
//     } catch (error) {
//         console.error('Erro ao adicionar transação:', error);
//     }
// }

// // E assim por diante para editar e excluir...
