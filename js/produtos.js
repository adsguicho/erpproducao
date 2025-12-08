// Sistema de Gestão de Produtos
class ProdutosSystem {
    constructor() {
        this.produtos = [];
        this.produtosPorCategoria = {
            cobertura: [],
            biju: [],
            granulado: []
        };
        this.currentFilter = '';
        this.currentCategory = '';
        this.initialize();
    }

    initialize() {
        this.carregarProdutos();
        this.setupEventListeners();
        this.setupModal();
    }

    carregarProdutos() {
        this.produtos = storage.getProdutos();
        this.produtosPorCategoria = storage.getProdutosPorCategoria();
        this.renderProdutos();
        this.atualizarResumos();
    }

    atualizarResumos() {
        // Atualizar contadores nos resumos
        const totalCoberturas = this.produtosPorCategoria.cobertura.length;
        const totalBiju = this.produtosPorCategoria.biju.length;
        const totalGranulado = this.produtosPorCategoria.granulado.length;
        
        document.getElementById('total-coberturas').textContent = totalCoberturas;
        document.getElementById('total-biju').textContent = totalBiju;
        document.getElementById('total-granulado').textContent = totalGranulado;
        
        // Atualizar contadores nas seções
        document.querySelector('#secao-coberturas .categoria-count').textContent = `${totalCoberturas} produtos`;
        document.querySelector('#secao-biju .categoria-count').textContent = `${totalBiju} produto`;
        document.querySelector('#secao-granulado .categoria-count').textContent = `${totalGranulado} produtos`;
        
        // Atualizar alertas de estoque
        this.atualizarAlertasEstoque();
    }

    atualizarAlertasEstoque() {
        const alertasCobertura = this.verificarAlertasEstoque('cobertura');
        const alertasBiju = this.verificarAlertasEstoque('biju');
        const alertasGranulado = this.verificarAlertasEstoque('granulado');
        
        this.atualizarAlerta('alert-coberturas', alertasCobertura);
        this.atualizarAlerta('alert-biju', alertasBiju);
        this.atualizarAlerta('alert-granulado', alertasGranulado);
    }

    verificarAlertasEstoque(categoria) {
        const produtos = this.produtosPorCategoria[categoria];
        const estoqueBaixo = produtos.filter(p => p.estoque < p.estoqueMin).length;
        const estoqueCritico = produtos.filter(p => p.estoque < p.estoqueMin * 0.5).length;
        
        if (estoqueCritico > 0) {
            return {
                tipo: 'critical',
                mensagem: `${estoqueCritico} produto(s) com estoque CRÍTICO!`
            };
        } else if (estoqueBaixo > 0) {
            return {
                tipo: 'warning',
                mensagem: `${estoqueBaixo} produto(s) com estoque baixo`
            };
        } else {
            return {
                tipo: 'success',
                mensagem: 'Todos os produtos com estoque OK'
            };
        }
    }

    atualizarAlerta(elementoId, alerta) {
        const elemento = document.getElementById(elementoId);
        if (!elemento) return;
        
        elemento.className = `summary-alert alert-${alerta.tipo}`;
        elemento.innerHTML = `
            <i class="fas fa-${alerta.tipo === 'success' ? 'check-circle' : 
                                alerta.tipo === 'warning' ? 'exclamation-triangle' : 
                                'exclamation-circle'}"></i>
            <span>${alerta.mensagem}</span>
        `;
    }

    renderProdutos() {
        // Renderizar cada categoria em sua respectiva seção
        this.renderCategoria('cobertura', 'grid-coberturas');
        this.renderCategoria('biju', 'grid-biju');
        this.renderCategoria('granulado', 'grid-granulado');
    }

    renderCategoria(categoria, elementoId) {
        const container = document.getElementById(elementoId);
        if (!container) {
            console.error(`Elemento não encontrado: ${elementoId}`);
            return;
        }

        let produtosCategoria = this.produtosPorCategoria[categoria];

        // Aplicar filtro global de busca
        if (this.currentFilter) {
            const filterLower = this.currentFilter.toLowerCase();
            produtosCategoria = produtosCategoria.filter(produto =>
                produto.nome.toLowerCase().includes(filterLower) ||
                produto.codigo.toLowerCase().includes(filterLower)
            );
        }

        // Aplicar filtro de categoria global
        if (this.currentCategory && this.currentCategory !== categoria) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <p>Categoria filtrada: ${this.getCategoriaNome(this.currentCategory)}</p>
                </div>
            `;
            return;
        }

        // Aplicar filtros específicos da categoria
        if (categoria === 'cobertura') {
            const filtroSabor = document.getElementById('filtro-sabor-cobertura')?.value;
            const filtroTamanho = document.getElementById('filtro-tamanho-cobertura')?.value;

            if (filtroSabor) {
                produtosCategoria = produtosCategoria.filter(p => p.sabor === filtroSabor);
            }
            if (filtroTamanho) {
                produtosCategoria = produtosCategoria.filter(p => p.tamanho === filtroTamanho);
            }
        }

        if (categoria === 'granulado') {
            const filtroSabor = document.getElementById('filtro-sabor-granulado')?.value;
            const filtroTamanho = document.getElementById('filtro-tamanho-granulado')?.value;

            if (filtroSabor) {
                produtosCategoria = produtosCategoria.filter(p => p.sabor === filtroSabor);
            }
            if (filtroTamanho) {
                produtosCategoria = produtosCategoria.filter(p => p.tamanho === filtroTamanho);
            }
        }

        // Verificar se há produtos após os filtros
        if (produtosCategoria.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }

        // Renderizar os produtos
        container.innerHTML = produtosCategoria.map(produto => this.createProdutoCard(produto)).join('');
    }

    createProdutoCard(produto) {
        const tipoClasses = {
            cobertura: 'tipo-cobertura',
            biju: 'tipo-biju',
            granulado: 'tipo-granulado'
        };

        // Calcular percentual de estoque
        const percentualEstoque = (produto.estoque / (produto.estoqueMin * 2)) * 100;
        let estoqueStatus = 'status-ok';
        
        if (produto.estoque < produto.estoqueMin * 0.5) {
            estoqueStatus = 'status-critical';
        } else if (produto.estoque < produto.estoqueMin) {
            estoqueStatus = 'status-warning';
        }

        return `
            <div class="produto-card" data-id="${produto.id}">
                <div class="produto-header">
                    <h4>${produto.nome}</h4>
                    <span class="produto-tipo ${tipoClasses[produto.categoria]}">
                        ${this.getCategoriaNome(produto.categoria)}
                    </span>
                </div>
                
                <div class="produto-info">
                    <p><i class="fas fa-barcode"></i> <strong>Código:</strong> ${produto.codigo}</p>
                    <p><i class="fas fa-weight"></i> <strong>Tamanho:</strong> ${produto.tamanho}</p>
                    ${produto.sabor ? `<p><i class="fas fa-ice-cream"></i> <strong>Sabor:</strong> ${this.getSaborNome(produto.sabor)}</p>` : ''}
                    <p><i class="fas fa-clock"></i> <strong>Tempo Produção:</strong> ${produto.tempoProducao} min</p>
                </div>
                
                <div class="produto-estoque">
                    <div class="estoque-header">
                        <span>Estoque: ${produto.estoque} unidades</span>
                        <span>Mínimo: ${produto.estoqueMin}</span>
                    </div>
                    <div class="barra-estoque">
                        <div class="barra-estoque-fill ${estoqueStatus}" 
                             style="width: ${Math.min(percentualEstoque, 100)}%"></div>
                    </div>
                </div>
                
                <div class="produto-acoes">
                    <button class="btn btn-sm btn-secondary" onclick="produtosSystem.editarProduto(${produto.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="produtosSystem.excluirProduto(${produto.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    getCategoriaNome(categoria) {
        const nomes = {
            cobertura: 'Cobertura',
            biju: 'Biju',
            granulado: 'Granulado'
        };
        return nomes[categoria] || categoria;
    }

    getSaborNome(sabor) {
        const sabores = {
            'chocolate': 'Chocolate',
            'chocolate-meio-amargo': 'Chocolate Meio Amargo',
            'morango': 'Morango',
            'coco': 'Coco',
            'doce-de-leite': 'Doce de Leite',
            'caramelo': 'Caramelo',
            'colorido': 'Colorido'
        };
        return sabores[sabor] || sabor;
    }

    setupEventListeners() {
        // Filtro de busca
        const filtroProduto = document.getElementById('filtro-produto');
        if (filtroProduto) {
            filtroProduto.addEventListener('input', (e) => {
                this.currentFilter = e.target.value;
                this.renderProdutos();
            });
        }

        // Filtro de categoria
        const filtroCategoria = document.getElementById('filtro-categoria');
        if (filtroCategoria) {
            filtroCategoria.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.renderProdutos();
            });
        }

        // Filtro de status
        const filtroStatus = document.getElementById('filtro-status');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', (e) => {
                this.aplicarFiltroStatus(e.target.value);
            });
        }

        // Botão limpar filtros
        const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', () => {
                this.limparFiltros();
            });
        }

        // Filtros específicos para coberturas
        const filtroSaborCobertura = document.getElementById('filtro-sabor-cobertura');
        const filtroTamanhoCobertura = document.getElementById('filtro-tamanho-cobertura');
        
        if (filtroSaborCobertura) {
            filtroSaborCobertura.addEventListener('change', () => {
                this.renderProdutos();
            });
        }
        
        if (filtroTamanhoCobertura) {
            filtroTamanhoCobertura.addEventListener('change', () => {
                this.renderProdutos();
            });
        }

        // Filtros específicos para granulado
        const filtroSaborGranulado = document.getElementById('filtro-sabor-granulado');
        const filtroTamanhoGranulado = document.getElementById('filtro-tamanho-granulado');
        
        if (filtroSaborGranulado) {
            filtroSaborGranulado.addEventListener('change', () => {
                this.renderProdutos();
            });
        }
        
        if (filtroTamanhoGranulado) {
            filtroTamanhoGranulado.addEventListener('change', () => {
                this.renderProdutos();
            });
        }

        // Exportar produtos
        const btnExportarProdutos = document.getElementById('btn-exportar-produtos');
        if (btnExportarProdutos) {
            btnExportarProdutos.addEventListener('click', () => {
                this.exportarProdutos();
            });
        }
    }

    aplicarFiltroStatus(status) {
        // Este método pode ser expandido para filtrar por status de estoque
        this.renderProdutos();
    }

    limparFiltros() {
        this.currentFilter = '';
        this.currentCategory = '';
        
        // Resetar inputs
        document.getElementById('filtro-produto').value = '';
        document.getElementById('filtro-categoria').value = '';
        document.getElementById('filtro-status').value = '';
        
        // Resetar filtros específicos
        const filtroSaborCobertura = document.getElementById('filtro-sabor-cobertura');
        const filtroTamanhoCobertura = document.getElementById('filtro-tamanho-cobertura');
        const filtroSaborGranulado = document.getElementById('filtro-sabor-granulado');
        const filtroTamanhoGranulado = document.getElementById('filtro-tamanho-granulado');
        
        if (filtroSaborCobertura) filtroSaborCobertura.value = '';
        if (filtroTamanhoCobertura) filtroTamanhoCobertura.value = '';
        if (filtroSaborGranulado) filtroSaborGranulado.value = '';
        if (filtroTamanhoGranulado) filtroTamanhoGranulado.value = '';
        
        this.renderProdutos();
    }

    setupModal() {
        // Formulário de produto
        const formProduto = document.getElementById('form-produto');
        if (formProduto) {
            formProduto.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarProduto();
            });
        }

        // Atualizar opções de tamanho quando a categoria muda
        const selectCategoria = document.getElementById('produto-categoria');
        if (selectCategoria) {
            selectCategoria.addEventListener('change', (e) => {
                this.atualizarOpcoesTamanho(e.target.value);
            });
        }

        // Calcular produção por hora automaticamente
        const tempoProducaoInput = document.getElementById('produto-tempo-producao');
        if (tempoProducaoInput) {
            tempoProducaoInput.addEventListener('input', (e) => {
                const tempo = parseFloat(e.target.value);
                if (tempo && tempo > 0) {
                    const producaoPorHora = Math.floor(60 / tempo);
                    document.getElementById('produto-producao-hora').value = producaoPorHora;
                }
            });
        }
    }

    atualizarOpcoesTamanho(categoria) {
        const tamanhoSelect = document.getElementById('produto-tamanho');
        const saborField = document.getElementById('sabor-field');
        
        if (!tamanhoSelect) return;
        
        // Limpar opções atuais
        tamanhoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Mostrar/ocultar campo de sabor
        if (categoria === 'cobertura') {
            saborField.style.display = 'block';
            
            // Adicionar opções para cobertura
            const opcoesCobertura = ['190g', '390g', '2kg'];
            opcoesCobertura.forEach(tamanho => {
                const option = document.createElement('option');
                option.value = tamanho;
                option.textContent = tamanho;
                tamanhoSelect.appendChild(option);
            });
        } else if (categoria === 'biju') {
            saborField.style.display = 'none';
            
            // Adicionar opção única para biju
            const option = document.createElement('option');
            option.value = '250g';
            option.textContent = '250g';
            tamanhoSelect.appendChild(option);
        } else if (categoria === 'granulado') {
            saborField.style.display = 'block';
            
            // Adicionar opções para granulado
            const opcoesGranulado = ['120g', '500g'];
            opcoesGranulado.forEach(tamanho => {
                const option = document.createElement('option');
                option.value = tamanho;
                option.textContent = tamanho;
                tamanhoSelect.appendChild(option);
            });
        }
    }

    resetarFormulario() {
        const form = document.getElementById('form-produto');
        form.reset();
        delete form.dataset.id;
        
        // Resetar para cobertura como padrão
        document.getElementById('produto-categoria').value = 'cobertura';
        this.atualizarOpcoesTamanho('cobertura');
        
        // Limpar cálculo de produção por hora
        document.getElementById('produto-producao-hora').value = '';
    }

    editarProduto(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) return;

        // Preencher formulário
        document.getElementById('produto-nome').value = produto.nome;
        document.getElementById('produto-categoria').value = produto.categoria;
        
        // Atualizar opções de tamanho baseado na categoria
        this.atualizarOpcoesTamanho(produto.categoria);
        
        // Configurar valores após a atualização das opções
        setTimeout(() => {
            document.getElementById('produto-sabor').value = produto.sabor || '';
            document.getElementById('produto-tamanho').value = produto.tamanho;
            document.getElementById('produto-tempo-producao').value = produto.tempoProducao;
            
            // Calcular produção por hora
            const producaoPorHora = Math.floor(60 / produto.tempoProducao);
            document.getElementById('produto-producao-hora').value = producaoPorHora;
            
            document.getElementById('produto-estoque').value = produto.estoque;
            document.getElementById('produto-estoque-min').value = produto.estoqueMin;
            document.getElementById('produto-estoque-max').value = produto.estoqueMin * 3;
            document.getElementById('produto-ponto-reposicao').value = produto.estoqueMin * 1.5;
        }, 100);

        // Armazenar ID para atualização
        document.getElementById('form-produto').dataset.id = id;

        // Abrir modal
        mainSystem.openModal('produto');
    }

    excluirProduto(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            storage.excluirProduto(id);
            this.carregarProdutos();
            
            // Mostrar mensagem de sucesso
            this.showMessage('Produto excluído com sucesso!', 'success');
        }
    }

    salvarProduto() {
        const form = document.getElementById('form-produto');
        const id = form.dataset.id;
        
        const produto = {
            id: id ? parseInt(id) : null,
            nome: document.getElementById('produto-nome').value,
            categoria: document.getElementById('produto-categoria').value,
            sabor: document.getElementById('produto-sabor').value || null,
            tamanho: document.getElementById('produto-tamanho').value,
            tempoProducao: parseInt(document.getElementById('produto-tempo-producao').value),
            estoque: parseInt(document.getElementById('produto-estoque').value),
            estoqueMin: parseInt(document.getElementById('produto-estoque-min').value)
        };

        // Validar campos obrigatórios
        if (!produto.nome || !produto.categoria || !produto.tamanho) {
            this.showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        // Validar tamanho baseado na categoria
        if (!this.validarTamanhoPorCategoria(produto.categoria, produto.tamanho)) {
            this.showMessage('Tamanho inválido para esta categoria.', 'error');
            return;
        }

        // Salvar no storage
        storage.salvarProduto(produto);
        
        // Atualizar lista
        this.carregarProdutos();
        
        // Fechar modal e limpar formulário
        mainSystem.closeModal('produto');
        this.resetarFormulario();
        
        // Mostrar mensagem de sucesso
        this.showMessage('Produto salvo com sucesso!', 'success');
    }

    validarTamanhoPorCategoria(categoria, tamanho) {
        const tamanhosValidos = {
            cobertura: ['190g', '390g', '2kg'],
            biju: ['250g'],
            granulado: ['120g', '500g']
        };
        
        return tamanhosValidos[categoria].includes(tamanho);
    }

    exportarProdutos() {
        const dados = {
            produtos: this.produtos,
            dataExportacao: new Date().toISOString(),
            totalProdutos: this.produtos.length,
            porCategoria: {
                cobertura: this.produtosPorCategoria.cobertura.length,
                biju: this.produtosPorCategoria.biju.length,
                granulado: this.produtosPorCategoria.granulado.length
            }
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `produtos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showMessage(message, type) {
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Adicionar ao documento
        document.body.appendChild(messageDiv);

        // Remover após 3 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Inicializar sistema de produtos
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('produtos')) {
        window.produtosSystem = new ProdutosSystem();
    }
});