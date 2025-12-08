// Sistema de armazenamento usando localStorage
class StorageSystem {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // Inicializar dados se não existirem
        if (!localStorage.getItem('produtos')) {
            const produtosIniciais = this.getProdutosIniciais();
            localStorage.setItem('produtos', JSON.stringify(produtosIniciais));
        }

        if (!localStorage.getItem('pausas')) {
            localStorage.setItem('pausas', JSON.stringify({
                programadas: [],
                naoProgramadas: []
            }));
        }

        if (!localStorage.getItem('kanban')) {
            localStorage.setItem('kanban', JSON.stringify({
                'a-fazer': [],
                'fazendo': [],
                'testando': [],
                'concluido': []
            }));
        }

        if (!localStorage.getItem('oeeHistorico')) {
            localStorage.setItem('oeeHistorico', JSON.stringify([]));
        }

        if (!localStorage.getItem('configCapacidade')) {
            localStorage.setItem('configCapacidade', JSON.stringify({
                horasDiaEfetiva: 8,
                diasSemanaEfetiva: 6,
                numMaquinas: 5,
                pausasProgramadas: 10,
                pausasNaoProgramadas: 15
            }));
        }
    }

    getProdutosIniciais() {
        const produtos = [];
        let id = 1;

        // Sabores de cobertura
        const saboresCobertura = [
            { nome: "Chocolate", codigo: "CHOC" },
            { nome: "Chocolate Meio Amargo", codigo: "MA" },
            { nome: "Morango", codigo: "MOR" },
            { nome: "Coco", codigo: "COC" },
            { nome: "Doce de Leite", codigo: "DL" },
            { nome: "Caramelo", codigo: "CAR" }
        ];

        // Tamanhos de cobertura
        const tamanhosCobertura = ['190g', '390g', '2kg'];

        // Criar todos os produtos de cobertura
        saboresCobertura.forEach(sabor => {
            tamanhosCobertura.forEach(tamanho => {
                produtos.push({
                    id: id++,
                    nome: `Cobertura ${sabor.nome}`,
                    categoria: "cobertura",
                    sabor: sabor.nome.toLowerCase().replace(/\s+/g, '-'),
                    tamanho: tamanho,
                    tempoProducao: this.getTempoProducaoPorTamanho(tamanho),
                    estoque: this.getEstoqueInicial(tamanho),
                    estoqueMin: this.getEstoqueMinimo(tamanho),
                    codigo: `COB-${sabor.codigo}-${tamanho.replace('g', '').replace('2kg', '2K')}`
                });
            });
        });

        // Produtos Biju (250g)
        produtos.push({
            id: id++,
            nome: "Biju Tradicional",
            categoria: "biju",
            sabor: null,
            tamanho: "250g",
            tempoProducao: 25,
            estoque: 2000,
            estoqueMin: 800,
            codigo: "BIJU-250"
        });

        // Produtos Granulado
        // Granulado Chocolate
        produtos.push({
            id: id++,
            nome: "Granulado Chocolate",
            categoria: "granulado",
            sabor: "chocolate",
            tamanho: "120g",
            tempoProducao: 20,
            estoque: 3000,
            estoqueMin: 1000,
            codigo: "GRAN-CHOC-120"
        });

        produtos.push({
            id: id++,
            nome: "Granulado Chocolate",
            categoria: "granulado",
            sabor: "chocolate",
            tamanho: "500g",
            tempoProducao: 28,
            estoque: 1500,
            estoqueMin: 500,
            codigo: "GRAN-CHOC-500"
        });

        // Granulado Colorido
        produtos.push({
            id: id++,
            nome: "Granulado Colorido",
            categoria: "granulado",
            sabor: "colorido",
            tamanho: "120g",
            tempoProducao: 22,
            estoque: 2800,
            estoqueMin: 900,
            codigo: "GRAN-COL-120"
        });

        produtos.push({
            id: id++,
            nome: "Granulado Colorido",
            categoria: "granulado",
            sabor: "colorido",
            tamanho: "500g",
            tempoProducao: 30,
            estoque: 1400,
            estoqueMin: 450,
            codigo: "GRAN-COL-500"
        });

        return produtos;
    }

    getTempoProducaoPorTamanho(tamanho) {
        const tempos = {
            '190g': 30,
            '250g': 25,
            '390g': 35,
            '120g': 20,
            '500g': 28,
            '2kg': 45
        };
        return tempos[tamanho] || 30;
    }

    getEstoqueInicial(tamanho) {
        const estoques = {
            '190g': 1500,
            '250g': 2000,
            '390g': 1200,
            '120g': 3000,
            '500g': 1500,
            '2kg': 800
        };
        return estoques[tamanho] || 1000;
    }

    getEstoqueMinimo(tamanho) {
        const minimos = {
            '190g': 500,
            '250g': 800,
            '390g': 400,
            '120g': 1000,
            '500g': 500,
            '2kg': 200
        };
        return minimos[tamanho] || 300;
    }

    // Métodos para Produtos
    getProdutos() {
        return JSON.parse(localStorage.getItem('produtos')) || [];
    }

    salvarProduto(produto) {
        const produtos = this.getProdutos();
        if (produto.id) {
            // Atualizar produto existente
            const index = produtos.findIndex(p => p.id === produto.id);
            if (index !== -1) {
                produtos[index] = produto;
            }
        } else {
            // Novo produto
            produto.id = Date.now();
            produto.codigo = this.gerarCodigo(produto);
            produtos.push(produto);
        }
        localStorage.setItem('produtos', JSON.stringify(produtos));
        return produto;
    }

    excluirProduto(id) {
        const produtos = this.getProdutos().filter(p => p.id !== id);
        localStorage.setItem('produtos', JSON.stringify(produtos));
    }

    gerarCodigo(produto) {
        const prefixos = {
            cobertura: 'COB',
            biju: 'BIJU',
            granulado: 'GRAN'
        };
        
        const saborMap = {
            'chocolate': 'CHOC',
            'chocolate-meio-amargo': 'MA',
            'morango': 'MOR',
            'coco': 'COC',
            'doce-de-leite': 'DL',
            'caramelo': 'CAR',
            'colorido': 'COL'
        };
        
        const prefixo = prefixos[produto.categoria] || 'PROD';
        const sabor = produto.sabor ? saborMap[produto.sabor] || '' : '';
        let tamanhoCodigo = produto.tamanho.replace('g', '');
        if (produto.tamanho === '2kg') tamanhoCodigo = '2K';
        
        return sabor ? `${prefixo}-${sabor}-${tamanhoCodigo}` : `${prefixo}-${tamanhoCodigo}`;
    }

    // Métodos para Pausas
    getPausas() {
        return JSON.parse(localStorage.getItem('pausas'));
    }

    salvarPausa(pausa) {
        const pausas = this.getPausas();
        pausa.id = Date.now();
        pausa.data = new Date().toISOString().split('T')[0];
        
        if (pausa.tipo === 'programada') {
            pausas.programadas.push(pausa);
        } else {
            pausas.naoProgramadas.push(pausa);
        }
        
        localStorage.setItem('pausas', JSON.stringify(pausas));
        return pausa;
    }

    excluirPausa(id, tipo) {
        const pausas = this.getPausas();
        if (tipo === 'programada') {
            pausas.programadas = pausas.programadas.filter(p => p.id !== id);
        } else {
            pausas.naoProgramadas = pausas.naoProgramadas.filter(p => p.id !== id);
        }
        localStorage.setItem('pausas', JSON.stringify(pausas));
    }

    // Métodos para Kanban
    getKanban() {
        return JSON.parse(localStorage.getItem('kanban'));
    }

    salvarKanban(kanban) {
        localStorage.setItem('kanban', JSON.stringify(kanban));
    }

    // Métodos para OEE
    getOEEHistorico() {
        return JSON.parse(localStorage.getItem('oeeHistorico')) || [];
    }

    salvarOEE(registro) {
        const historico = this.getOEEHistorico();
        registro.id = Date.now();
        registro.data = new Date().toISOString();
        historico.push(registro);
        
        // Manter apenas os últimos 30 registros
        if (historico.length > 30) {
            historico.shift();
        }
        
        localStorage.setItem('oeeHistorico', JSON.stringify(historico));
        return registro;
    }

    // Métodos para Configuração
    getConfigCapacidade() {
        return JSON.parse(localStorage.getItem('configCapacidade'));
    }

    salvarConfigCapacidade(config) {
        localStorage.setItem('configCapacidade', JSON.stringify(config));
    }

    // Métodos para agrupar produtos por categoria
    getProdutosPorCategoria() {
        const produtos = this.getProdutos();
        return {
            cobertura: produtos.filter(p => p.categoria === 'cobertura'),
            biju: produtos.filter(p => p.categoria === 'biju'),
            granulado: produtos.filter(p => p.categoria === 'granulado')
        };
    }
}

// Instância global do sistema de armazenamento
const storage = new StorageSystem();