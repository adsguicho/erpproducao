// Sistema principal de navegação e inicialização
class MainSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialize();
    }

    initialize() {
        // Inicializar navegação
        this.setupNavigation();
        
        // Inicializar dashboard
        this.loadDashboard();
        
        // Inicializar modais
        this.setupModals();
        
        // Carregar dados iniciais
        this.loadInitialData();
        
        // Configurar botão limpar filtros
        this.setupClearFilters();
    }

    setupClearFilters() {
        const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', () => {
                const filtroProduto = document.getElementById('filtro-produto');
                const filtroCategoria = document.getElementById('filtro-categoria');
                
                if (filtroProduto) filtroProduto.value = '';
                if (filtroCategoria) filtroCategoria.value = '';
                
                // Recarregar produtos
                if (typeof produtosSystem !== 'undefined') {
                    produtosSystem.currentFilter = '';
                    produtosSystem.currentCategory = '';
                    produtosSystem.renderProdutos();
                }
            });
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.switchSection(sectionId);
            });
        });
    }

    switchSection(sectionId) {
        // Atualizar navegação ativa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Esconder todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar seção atual
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;

        // Carregar dados específicos da seção
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'produtos':
                // Inicializar sistema de produtos se ainda não estiver
                if (typeof produtosSystem === 'undefined') {
                    // Carregar módulo de produtos dinamicamente
                    this.loadModule('produtos');
                } else {
                    produtosSystem.carregarProdutos();
                }
                break;
            case 'capacidade':
                if (typeof capacidadeSystem === 'undefined') {
                    this.loadModule('capacidade');
                } else {
                    capacidadeSystem.atualizarCalculos();
                }
                break;
            case 'oee':
                if (typeof oeeSystem === 'undefined') {
                    this.loadModule('oee');
                } else {
                    oeeSystem.carregarHistorico();
                }
                break;
            case 'kanban':
                if (typeof kanbanSystem === 'undefined') {
                    this.loadModule('kanban');
                } else {
                    kanbanSystem.carregarKanban();
                }
                break;
        }
    }

    loadModule(moduleName) {
        // Carregar módulo dinamicamente (já incluído no HTML)
        console.log(`Módulo ${moduleName} carregado`);
    }

    loadDashboard() {
        // Atualizar métricas do dashboard
        this.updateDashboardMetrics();
        
        // Atualizar a cada 30 segundos
        setInterval(() => {
            this.updateDashboardMetrics();
        }, 30000);
    }

    updateDashboardMetrics() {
        // Obter dados de capacidade
        const config = storage.getConfigCapacidade();
        const pausas = storage.getPausas();
        
        // Calcular capacidades
        const instalada = 24 * 7 * config.numMaquinas; // horas por semana
        const efetiva = config.horasDiaEfetiva * config.diasSemanaEfetiva * config.numMaquinas;
        
        const pausasProgramadasTotal = pausas.programadas.reduce((total, p) => total + p.horas, 0);
        const pausasNaoProgramadasTotal = pausas.naoProgramadas.reduce((total, p) => total + p.horas, 0);
        
        const disponivel = efetiva - pausasProgramadasTotal;
        const realizada = disponivel - pausasNaoProgramadasTotal;
        
        // Atualizar dashboard
        document.getElementById('instalada-dash').textContent = `${instalada}h`;
        document.getElementById('efetiva-dash').textContent = `${efetiva}h`;
        document.getElementById('disponivel-dash').textContent = `${disponivel}h`;
        document.getElementById('realizada-dash').textContent = `${realizada}h`;
        
        // Atualizar OEE
        this.updateOEEGauge();
        
        // Atualizar resumo do Kanban
        this.updateKanbanSummary();
        
        // Atualizar status de produção
        this.updateProductionStatus();
    }

    updateOEEGauge() {
        // Obter último registro OEE
        const historico = storage.getOEEHistorico();
        if (historico.length > 0) {
            const ultimoOEE = historico[historico.length - 1];
            
            // Atualizar gauge
            const gauge = document.querySelector('.gauge');
            const gaugeValue = document.querySelector('.gauge-cover');
            
            const percent = ultimoOEE.oeeTotal;
            gaugeValue.textContent = `${percent}%`;
            
            // Atualizar breakdown
            document.querySelectorAll('.breakdown-value')[0].textContent = `${ultimoOEE.disponibilidade}%`;
            document.querySelectorAll('.breakdown-value')[1].textContent = `${ultimoOEE.performance}%`;
            document.querySelectorAll('.breakdown-value')[2].textContent = `${ultimoOEE.qualidade}%`;
        }
    }

    updateKanbanSummary() {
        const kanban = storage.getKanban();
        const totalCards = Object.values(kanban).reduce((total, coluna) => total + coluna.length, 0);
        
        let summaryHTML = `
            <div class="kanban-summary-item">
                <span>Tarefas Totais:</span>
                <strong>${totalCards}</strong>
            </div>
        `;
        
        Object.entries(kanban).forEach(([coluna, cards]) => {
            const colunaNome = this.getColunaNome(coluna);
            summaryHTML += `
                <div class="kanban-summary-item">
                    <span>${colunaNome}:</span>
                    <strong>${cards.length}</strong>
                </div>
            `;
        });
        
        const kanbanSummary = document.getElementById('kanban-summary');
        if (kanbanSummary) {
            kanbanSummary.innerHTML = summaryHTML;
        }
    }

    updateProductionStatus() {
        // Simular status de produção
        const produtos = storage.getProdutos();
        const estoqueBaixo = produtos.filter(p => p.estoque < p.estoqueMin).length;
        
        const statusIndicators = document.querySelector('.status-indicators');
        if (statusIndicators) {
            statusIndicators.innerHTML = `
                <div class="status-item status-ok">
                    <i class="fas fa-check-circle"></i>
                    <span>Máquinas Operando: 3/5</span>
                </div>
                <div class="status-item ${estoqueBaixo > 0 ? 'status-warning' : 'status-ok'}">
                    <i class="fas fa-box"></i>
                    <span>Estoque Baixo: ${estoqueBaixo} produtos</span>
                </div>
                <div class="status-item status-critical">
                    <i class="fas fa-times-circle"></i>
                    <span>Paradas: 1</span>
                </div>
            `;
        }
    }

    getColunaNome(key) {
        const nomes = {
            'a-fazer': 'A Fazer',
            'fazendo': 'Fazendo',
            'testando': 'Testando',
            'concluido': 'Concluído'
        };
        return nomes[key] || key;
    }

    setupModals() {
        // Modal de produto
        const modalProduto = document.getElementById('modal-produto');
        const btnNovoProduto = document.getElementById('btn-novo-produto');
        const closeModalBtns = document.querySelectorAll('.close-modal');

        if (btnNovoProduto) {
            btnNovoProduto.addEventListener('click', () => {
                this.openModal('produto');
            });
        }

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal('produto');
            });
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === modalProduto) {
                this.closeModal('produto');
            }
        });
    }

    openModal(modalType) {
        const modal = document.getElementById(`modal-${modalType}`);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalType) {
        const modal = document.getElementById(`modal-${modalType}`);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    loadInitialData() {
        // Carregar dados iniciais de todas as seções
        this.updateDashboardMetrics();
    }
}

// Inicializar sistema principal quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.mainSystem = new MainSystem();
});