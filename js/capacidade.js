// Sistema de Cálculo de Capacidade Produtiva
class CapacidadeSystem {
    constructor() {
        this.config = {};
        this.pausas = { programadas: [], naoProgramadas: [] };
        this.grafico = null;
        this.initialize();
    }

    initialize() {
        this.carregarDados();
        this.setupEventListeners();
        this.atualizarCalculos();
        this.inicializarGrafico();
    }

    carregarDados() {
        this.config = storage.getConfigCapacidade();
        this.pausas = storage.getPausas();
        this.renderPausas();
    }

    setupEventListeners() {
        // Configurações
        const inputsConfig = ['horas-efetiva', 'dias-efetiva', 'num-maquinas'];
        inputsConfig.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.config[id.replace('-', '')] = parseInt(e.target.value);
                    storage.salvarConfigCapacidade(this.config);
                    this.atualizarCalculos();
                });
            }
        });

        // Adicionar pausa
        const btnAdicionarPausa = document.getElementById('btn-adicionar-pausa');
        if (btnAdicionarPausa) {
            btnAdicionarPausa.addEventListener('click', () => {
                this.adicionarPausa();
            });
        }

        // Exportar dados
        const btnExportar = document.getElementById('btn-exportar-capacidade');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                this.exportarDados();
            });
        }
    }

    atualizarCalculos() {
        // Capacidade Instalada (24h × 7 dias × número de máquinas)
        const instalada = 24 * 7 * this.config.numMaquinas;
        
        // Capacidade Efetiva (horas/dia × dias/semana × número de máquinas)
        const efetiva = this.config.horasDiaEfetiva * this.config.diasSemanaEfetiva * this.config.numMaquinas;
        
        // Soma das pausas programadas
        const pausasProgramadasTotal = this.pausas.programadas.reduce((total, p) => total + p.horas, 0);
        
        // Soma das pausas não programadas
        const pausasNaoProgramadasTotal = this.pausas.naoProgramadas.reduce((total, p) => total + p.horas, 0);
        
        // Capacidade Disponível (Efetiva - Pausas Programadas)
        const disponivel = efetiva - pausasProgramadasTotal;
        
        // Capacidade Realizada (Disponível - Pausas Não Programadas)
        const realizada = disponivel - pausasNaoProgramadasTotal;
        
        // Atualizar interface
        this.atualizarInterface({
            instalada,
            efetiva,
            disponivel,
            realizada,
            pausasProgramadasTotal,
            pausasNaoProgramadasTotal
        });
        
        // Atualizar gráfico
        this.atualizarGrafico(instalada, efetiva, disponivel, realizada);
        
        // Atualizar dashboard
        mainSystem.updateDashboardMetrics();
    }

    atualizarInterface(dados) {
        document.getElementById('valor-instalada').textContent = `${dados.instalada}h`;
        document.getElementById('valor-efetiva').textContent = `${dados.efetiva}h`;
        document.getElementById('valor-disponivel').textContent = `${dados.disponivel}h`;
        document.getElementById('valor-realizada').textContent = `${dados.realizada}h`;
        
        document.getElementById('desc-efetiva').textContent = 
            `${this.config.horasDiaEfetiva}h/dia × ${this.config.diasSemanaEfetiva} dias × ${this.config.numMaquinas} máquinas`;
    }

    adicionarPausa() {
        const tipo = document.getElementById('tipo-pausa').value;
        const descricao = document.getElementById('descricao-pausa').value;
        const horas = parseFloat(document.getElementById('horas-pausa').value);
        
        if (!descricao || !horas || horas <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        const pausa = {
            tipo,
            descricao,
            horas,
            data: new Date().toLocaleDateString('pt-BR')
        };
        
        storage.salvarPausa(pausa);
        this.carregarDados();
        this.atualizarCalculos();
        
        // Limpar formulário
        document.getElementById('descricao-pausa').value = '';
        document.getElementById('horas-pausa').value = '1';
    }

    excluirPausa(id, tipo) {
        if (confirm('Tem certeza que deseja excluir esta pausa?')) {
            storage.excluirPausa(id, tipo);
            this.carregarDados();
            this.atualizarCalculos();
        }
    }

    renderPausas() {
        const renderLista = (lista, elementoId) => {
            const container = document.getElementById(elementoId);
            if (!container) return;
            
            if (lista.length === 0) {
                container.innerHTML = '<li class="empty">Nenhuma pausa registrada</li>';
                return;
            }
            
            container.innerHTML = lista.map(pausa => `
                <li>
                    <div>
                        <strong>${pausa.descricao}</strong>
                        <small>${pausa.data} - ${pausa.horas}h</small>
                    </div>
                    <button class="btn btn-sm btn-danger" 
                            onclick="capacidadeSystem.excluirPausa(${pausa.id}, '${pausa.tipo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
            `).join('');
        };
        
        renderLista(this.pausas.programadas, 'lista-pausas-programadas');
        renderLista(this.pausas.naoProgramadas, 'lista-pausas-nao-programadas');
    }

    inicializarGrafico() {
        const ctx = document.getElementById('grafico-capacidade');
        if (!ctx) return;
        
        this.grafico = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Instalada', 'Efetiva', 'Disponível', 'Realizada'],
                datasets: [{
                    label: 'Horas por Semana',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(30, 64, 175, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(96, 165, 250, 0.7)',
                        'rgba(147, 197, 253, 0.7)'
                    ],
                    borderColor: [
                        'rgb(30, 64, 175)',
                        'rgb(59, 130, 246)',
                        'rgb(96, 165, 250)',
                        'rgb(147, 197, 253)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    }
                }
            }
        });
    }

    atualizarGrafico(instalada, efetiva, disponivel, realizada) {
        if (this.grafico) {
            this.grafico.data.datasets[0].data = [instalada, efetiva, disponivel, realizada];
            this.grafico.update();
        }
    }

    exportarDados() {
        const dados = {
            config: this.config,
            pausas: this.pausas,
            calculos: {
                instalada: 24 * 7 * this.config.numMaquinas,
                efetiva: this.config.horasDiaEfetiva * this.config.diasSemanaEfetiva * this.config.numMaquinas,
                programadasTotal: this.pausas.programadas.reduce((t, p) => t + p.horas, 0),
                naoProgramadasTotal: this.pausas.naoProgramadas.reduce((t, p) => t + p.horas, 0)
            },
            data: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `capacidade-produtiva-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Inicializar sistema de capacidade
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('capacidade')) {
        window.capacidadeSystem = new CapacidadeSystem();
    }
});