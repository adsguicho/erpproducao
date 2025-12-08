// Sistema Kanban
class KanbanSystem {
    constructor() {
        this.kanbanData = {};
        this.draggedCard = null;
        this.initialize();
    }

    initialize() {
        this.carregarKanban();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    carregarKanban() {
        this.kanbanData = storage.getKanban();
        this.renderKanban();
    }

    renderKanban() {
        const colunas = ['a-fazer', 'fazendo', 'testando', 'concluido'];
        
        colunas.forEach(coluna => {
            const columnBody = document.querySelector(`[data-status="${coluna}"]`);
            if (!columnBody) return;
            
            columnBody.innerHTML = '';
            
            this.kanbanData[coluna].forEach(card => {
                const cardElement = this.createCardElement(card);
                columnBody.appendChild(cardElement);
            });
            
            // Atualizar contador
            const columnHeader = columnBody.previousElementSibling;
            const countElement = columnHeader.querySelector('.column-count');
            if (countElement) {
                countElement.textContent = this.kanbanData[coluna].length;
            }
        });
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `kanban-card priority-${card.prioridade}`;
        cardDiv.draggable = true;
        cardDiv.dataset.id = card.id;
        
        cardDiv.innerHTML = `
            <div class="card-title">
                <span>${card.titulo}</span>
                <button class="btn-icon" onclick="kanbanSystem.excluirCard(${card.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-desc">${card.descricao}</div>
            <div class="card-footer">
                <span><i class="fas fa-user"></i> ${card.responsavel}</span>
                <span class="card-priority">${this.getPrioridadeNome(card.prioridade)}</span>
            </div>
        `;
        
        // Adicionar eventos de drag
        cardDiv.addEventListener('dragstart', (e) => {
            this.dragStart(e, card.id);
        });
        
        return cardDiv;
    }

    getPrioridadeNome(prioridade) {
        const prioridades = {
            'alta': 'Alta',
            'media': 'Média',
            'baixa': 'Baixa'
        };
        return prioridades[prioridade] || prioridade;
    }

    setupEventListeners() {
        // Novo card
        const btnNovoCard = document.getElementById('btn-novo-card');
        if (btnNovoCard) {
            btnNovoCard.addEventListener('click', () => {
                this.criarNovoCard();
            });
        }
    }

    criarNovoCard() {
        const titulo = prompt('Título da tarefa:');
        if (!titulo) return;
        
        const descricao = prompt('Descrição:');
        const responsavel = prompt('Responsável:') || 'Não definido';
        
        const prioridades = ['alta', 'media', 'baixa'];
        const prioridade = prompt('Prioridade (alta/média/baixa):', 'media').toLowerCase();
        const prioridadeFinal = prioridades.includes(prioridade) ? prioridade : 'media';
        
        const novoCard = {
            id: Date.now(),
            titulo,
            descricao: descricao || '',
            responsavel,
            prioridade: prioridadeFinal,
            dataCriacao: new Date().toISOString(),
            status: 'a-fazer'
        };
        
        this.kanbanData['a-fazer'].push(novoCard);
        this.salvarKanban();
        this.renderKanban();
    }

    excluirCard(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        
        // Encontrar e remover o card de todas as colunas
        Object.keys(this.kanbanData).forEach(coluna => {
            this.kanbanData[coluna] = this.kanbanData[coluna].filter(card => card.id !== id);
        });
        
        this.salvarKanban();
        this.renderKanban();
    }

    setupDragAndDrop() {
        const columnBodies = document.querySelectorAll('.column-body');
        
        columnBodies.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });
            
            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });
            
            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                if (this.draggedCard) {
                    const newStatus = column.dataset.status;
                    this.moverCard(this.draggedCard, newStatus);
                    this.draggedCard = null;
                }
            });
        });
    }

    dragStart(e, cardId) {
        this.draggedCard = cardId;
        e.dataTransfer.effectAllowed = 'move';
    }

    moverCard(cardId, novoStatus) {
        let card = null;
        let colunaOrigem = null;
        
        // Encontrar o card e sua coluna de origem
        Object.entries(this.kanbanData).forEach(([coluna, cards]) => {
            const foundCard = cards.find(c => c.id === cardId);
            if (foundCard) {
                card = foundCard;
                colunaOrigem = coluna;
            }
        });
        
        if (!card || colunaOrigem === novoStatus) return;
        
        // Remover da coluna de origem
        this.kanbanData[colunaOrigem] = this.kanbanData[colunaOrigem].filter(c => c.id !== cardId);
        
        // Adicionar à nova coluna
        card.status = novoStatus;
        this.kanbanData[novoStatus].push(card);
        
        this.salvarKanban();
        this.renderKanban();
        
        // Mostrar notificação
        this.showNotification(`Tarefa "${card.titulo}" movida para ${this.getColunaNome(novoStatus)}`);
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

    salvarKanban() {
        storage.salvarKanban(this.kanbanData);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar sistema Kanban
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('kanban')) {
        window.kanbanSystem = new KanbanSystem();
    }
});