// Sistema de Cálculo OEE (Overall Equipment Effectiveness)
class OEESystem {
    constructor() {
        this.historico = [];
        this.grafico = null;
        this.initialize();
    }

    initialize() {
        this.carregarHistorico();
        this.setupEventListeners();
        this.inicializarGrafico();
    }

    carregarHistorico() {
        this.historico = storage.getOEEHistorico();
        this.atualizarGraficoHistorico();
    }

    setupEventListeners() {
        const btnCalcularOEE = document.getElementById('btn-calcular-oee');
        if (btnCalcularOEE) {
            btnCalcularOEE.addEventListener('click', () => {
                this.calcularOEE();
            });
        }
    }

    calcularOEE() {
        // Obter valores do formulário
        const tempoDisponivel = parseFloat(document.getElementById('tempo-disponivel').value);
        const tempoParadas = parseFloat(document.getElementById('tempo-paradas').value);
        const tempoCicloIdeal = parseFloat(document.getElementById('tempo-ciclo-ideal').value);
        const totalProduzido = parseInt(document.getElementById('total-produzido').value);
        const defeitos = parseInt(document.getElementById('defeitos').value);
        
        // Validações
        if (tempoDisponivel <= 0 || tempoParadas < 0 || tempoCicloIdeal <= 0 || totalProduzido < 0 || defeitos < 0) {
            alert('Por favor, insira valores válidos maiores que zero.');
            return;
        }
        
        if (defeitos > totalProduzido) {
            alert('O número de defeitos não pode ser maior que o total produzido.');
            return;
        }
        
        // Calcular OEE
        const resultado = this.calcularOEEValores(
            tempoDisponivel,
            tempoParadas,
            tempoCicloIdeal,
            totalProduzido,
            defeitos
        );
        
        // Atualizar interface
        this.atualizarInterface(resultado);
        
        // Salvar no histórico
        this.salvarRegistro(resultado);
    }

    calcularOEEValores(tempoDisponivel, tempoParadas, tempoCicloIdeal, totalProduzido, defeitos) {
        // 1. Disponibilidade
        const tempoOperacional = tempoDisponivel - tempoParadas;
        const disponibilidade = (tempoOperacional / tempoDisponivel) * 100;
        
        // 2. Performance
        const tempoCicloIdealHoras = tempoCicloIdeal / 60; // Converter minutos para horas
        const producaoIdeal = tempoOperacional / tempoCicloIdealHoras;
        const performance = (totalProduzido / producaoIdeal) * 100;
        
        // 3. Qualidade
        const boasPecas = totalProduzido - defeitos;
        const qualidade = (boasPecas / totalProduzido) * 100;
        
        // 4. OEE Total
        const oeeTotal = (disponibilidade * performance * qualidade) / 10000;
        
        return {
            disponibilidade: this.arredondar(disponibilidade),
            performance: this.arredondar(performance),
            qualidade: this.arredondar(qualidade),
            oeeTotal: this.arredondar(oeeTotal),
            tempoDisponivel,
            tempoParadas,
            tempoOperacional,
            totalProduzido,
            defeitos,
            boasPecas,
            data: new Date().toLocaleString('pt-BR')
        };
    }

    arredondar(valor) {
        return Math.round(valor * 100) / 100;
    }

    atualizarInterface(resultado) {
        // Atualizar valores
        document.getElementById('oee-total').textContent = `${resultado.oeeTotal}%`;
        document.getElementById('disponibilidade-valor').textContent = `${resultado.disponibilidade}%`;
        document.getElementById('performance-valor').textContent = `${resultado.performance}%`;
        document.getElementById('qualidade-valor').textContent = `${resultado.qualidade}%`;
        
        // Atualizar barras
        document.getElementById('disponibilidade-bar').style.width = `${resultado.disponibilidade}%`;
        document.getElementById('performance-bar').style.width = `${resultado.performance}%`;
        document.getElementById('qualidade-bar').style.width = `${resultado.qualidade}%`;
        
        // Atualizar classificação
        this.atualizarClassificacao(resultado.oeeTotal);
        
        // Atualizar gauge do dashboard
        mainSystem.updateOEEGauge();
    }

    atualizarClassificacao(oeeTotal) {
        const classificacaoElement = document.getElementById('oee-classificacao');
        let classificacao = '';
        let cor = '';
        
        if (oeeTotal >= 85) {
            classificacao = 'Excelente';
            cor = '#10b981';
        } else if (oeeTotal >= 70) {
            classificacao = 'Bom';
            cor = '#f59e0b';
        } else if (oeeTotal >= 60) {
            classificacao = 'Regular';
            cor = '#f59e0b';
        } else {
            classificacao = 'Ruim';
            cor = '#ef4444';
        }
        
        classificacaoElement.innerHTML = `
            <span class="classificacao-badge" style="background: ${cor}">
                ${classificacao}
            </span>
        `;
    }

    salvarRegistro(resultado) {
        storage.salvarOEE(resultado);
        this.carregarHistorico();
    }

    inicializarGrafico() {
        const ctx = document.getElementById('grafico-oee');
        if (!ctx) return;
        
        this.grafico = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'OEE Total',
                        data: [],
                        borderColor: 'rgb(30, 64, 175)',
                        backgroundColor: 'rgba(30, 64, 175, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Disponibilidade',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Performance',
                        data: [],
                        borderColor: 'rgb(245, 158, 11)',
                        borderWidth: 1,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Qualidade',
                        data: [],
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentual (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    }
                }
            }
        });
    }

    atualizarGraficoHistorico() {
        if (!this.grafico) return;
        
        const ultimosRegistros = this.historico.slice(-10); // Últimos 10 registros
        
        this.grafico.data.labels = ultimosRegistros.map(r => 
            new Date(r.data).toLocaleDateString('pt-BR')
        );
        
        this.grafico.data.datasets[0].data = ultimosRegistros.map(r => r.oeeTotal);
        this.grafico.data.datasets[1].data = ultimosRegistros.map(r => r.disponibilidade);
        this.grafico.data.datasets[2].data = ultimosRegistros.map(r => r.performance);
        this.grafico.data.datasets[3].data = ultimosRegistros.map(r => r.qualidade);
        
        this.grafico.update();
    }
}

// Inicializar sistema OEE
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('oee')) {
        window.oeeSystem = new OEESystem();
    }
});