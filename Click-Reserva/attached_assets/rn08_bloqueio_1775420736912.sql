-- ============================================================
-- RN-08: BLOQUEIO POR NÃO COMPARECIMENTO
-- ClickReserva | C.E. Prof. Mario B.T. Braga | Prof.ª Simone Barros
-- ============================================================
-- LÓGICA:
-- 1. Professor faz reserva → Status = 'Confirmada'
-- 2. No horário da reserva, professor confirma presença → Status = 'Realizada'
-- 3. Após X minutos do início sem confirmação → Status = 'Nao_Compareceu'
-- 4. Ao atingir o limite configurado pelo coordenador → professor bloqueado
-- 5. Professor bloqueado não consegue fazer nova reserva
-- ============================================================

-- ── ALTERAÇÕES NA TABELA RESERVA ─────────────────────────────
-- Adicionar novo status possível (já suportado pelo campo VARCHAR)
-- Novos status: 'Confirmada' | 'Pendente' | 'Cancelada'
--             | 'Realizada' | 'Nao_Compareceu'

-- Adicionar campo de confirmação de presença
ALTER TABLE RESERVA ADD COLUMN Confirmou_Presenca INTEGER DEFAULT 0;
ALTER TABLE RESERVA ADD COLUMN Data_Confirmacao   TEXT    DEFAULT NULL;

-- ── NOVA TABELA: CONFIGURAÇÃO DO SISTEMA ─────────────────────
CREATE TABLE IF NOT EXISTS CONFIGURACAO (
    Chave       TEXT PRIMARY KEY,
    Valor       TEXT NOT NULL,
    Descricao   TEXT
);

-- Limite padrão: 3 faltas (coordenador pode alterar pela interface)
INSERT OR IGNORE INTO CONFIGURACAO VALUES
    ('limite_faltas',      '3',  'Número de faltas para bloquear o professor'),
    ('minutos_tolerancia', '15', 'Minutos após o início para aguardar confirmação');

-- ── NOVA TABELA: HISTÓRICO DE FALTAS ─────────────────────────
CREATE TABLE IF NOT EXISTS FALTA_PROFESSOR (
    ID_Falta     TEXT PRIMARY KEY,
    ID_Professor TEXT NOT NULL,
    ID_Reserva   TEXT NOT NULL,
    Data_Falta   TEXT NOT NULL,
    Registrado_Em TEXT NOT NULL,
    FOREIGN KEY (ID_Professor) REFERENCES PROFESSOR(ID_Professor),
    FOREIGN KEY (ID_Reserva)   REFERENCES RESERVA(ID_Reserva)
);

-- ── ALTERAÇÕES NA TABELA PROFESSOR ───────────────────────────
ALTER TABLE PROFESSOR ADD COLUMN Bloqueado       INTEGER DEFAULT 0;
ALTER TABLE PROFESSOR ADD COLUMN Total_Faltas    INTEGER DEFAULT 0;
ALTER TABLE PROFESSOR ADD COLUMN Data_Bloqueio   TEXT    DEFAULT NULL;
ALTER TABLE PROFESSOR ADD COLUMN Motivo_Bloqueio TEXT    DEFAULT NULL;

-- ── CONSULTAS ÚTEIS ──────────────────────────────────────────

-- Ver professores bloqueados
-- SELECT ID_Professor, Nome, Total_Faltas, Data_Bloqueio, Motivo_Bloqueio
-- FROM PROFESSOR WHERE Bloqueado = 1;

-- Ver histórico de faltas de um professor
-- SELECT f.ID_Falta, f.Data_Falta, r.ID_Sala, r.Hora_Inicio
-- FROM FALTA_PROFESSOR f
-- JOIN RESERVA r ON f.ID_Reserva = r.ID_Reserva
-- WHERE f.ID_Professor = 'PRO-001';

-- Ver reservas aguardando confirmação de presença (passaram do horário)
-- SELECT * FROM RESERVA
-- WHERE Status = 'Confirmada'
-- AND Confirmou_Presenca = 0
-- AND datetime(Data || ' ' || Hora_Inicio, '+15 minutes') < datetime('now');
