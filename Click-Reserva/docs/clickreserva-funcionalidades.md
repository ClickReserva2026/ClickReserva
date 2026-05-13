# ClickReserva — Resumo Completo de Funcionalidades

**Sistema de Agendamento de Laboratórios de Informática**
C.E. Prof. Mário B.T. Braga

---

## 1. Visão Geral

O ClickReserva é um sistema web completo para gerenciamento de reservas de salas de informática e laboratórios em uma escola estadual. Permite que professores agendem aulas, coordenadores gerenciem o fluxo de aprovações e administradores tenham controle total sobre todas as funcionalidades.

---

## 2. Perfis de Usuário

### 2.1 Professor
- Cria reservas de sala para suas aulas
- Visualiza suas próprias reservas (Cards, Tabela ou Calendário semanal)
- Confirma presença no horário da aula
- Solicita redefinição de senha
- Envia feedback sobre o sistema

### 2.2 Coordenador
- Aprova ou recusa reservas de professores
- Gerencia cadastros (aprova, recusa, ativa/desativa)
- Cria reservas em nome de professores
- Define bloqueios de horários
- Gerencia salas e configurações do sistema
- Visualiza todas as reservas
- Redefine senhas de professores
- Visualiza feedbacks

### 2.3 Administrador (acesso total)
- Possui **todos** os poderes do Coordenador
- Pode fazer reservas como professor (aprovadas automaticamente)
- Acesso a todos os painéis sem restrições
- Mesmo menu completo: seção de professor + seção de administração

---

## 3. Autenticação e Cadastro

### 3.1 Login
- Acesso por e-mail institucional e senha
- Verificação de status da conta (ativa, bloqueada, pendente, recusada)
- Mensagens de erro específicas para cada situação

### 3.2 Cadastro de Professores
- Auto-cadastro com e-mail institucional (`@escola.pr.gov.br`, `.edu.br`, etc.)
- Conta fica em status **pendente** até aprovação do coordenador
- Validação de domínio de e-mail no momento do cadastro

### 3.3 Criação Direta (Coordenador/Admin)
- Coordenador pode criar contas de Professor, Coordenador ou Administrador diretamente
- Conta criada pelo coordenador é ativada imediatamente, sem necessidade de aprovação

### 3.4 Redefinição de Senha
- Professor clica em "Esqueci minha senha" na tela de login
- Pedido aparece na aba "Senhas" do painel do coordenador
- Coordenador define a nova senha e informa ao professor

### 3.5 Alteração de Perfil
- Coordenador/Admin pode promover ou rebaixar qualquer usuário diretamente na lista de professores (Professor → Coordenador → Administrador ou vice-versa)

---

## 4. Reservas

### 4.1 Criação de Reserva
- Seleção de sala, data, horário e turma
- **Seletor visual de períodos** com abas: Manhã / Tarde / Noite
- **Variantes de horário Tipo A e Tipo B** (diferem na posição do intervalo)
- Clicar em uma aula preenche automaticamente o horário de início e fim
- Detecção de conflito em tempo real (antes de salvar)
- Verificação de bloqueios de horário ativos

### 4.2 Horários Padrão

**Manhã — Tipo A**
- 1ª Aula: 07:30–08:20 | 2ª Aula: 08:20–09:10 | Intervalo: 09:10–09:25
- 3ª Aula: 09:25–10:15 | 4ª Aula: 10:15–11:05 | 5ª Aula: 11:05–11:55

**Manhã — Tipo B**
- 1ª Aula: 07:30–08:20 | 2ª Aula: 08:20–09:10 | 3ª Aula: 09:10–10:00
- Intervalo: 10:00–10:15 | 4ª Aula: 10:15–11:05 | 5ª Aula: 11:05–11:55

**Tarde — Tipo A**
- 1ª Aula: 13:00–13:50 | 2ª Aula: 13:50–14:40 | Intervalo: 14:40–14:55
- 3ª Aula: 14:55–15:45 | 4ª Aula: 15:45–16:35 | 5ª Aula: 16:35–17:25

**Tarde — Tipo B**
- 1ª Aula: 13:00–13:50 | 2ª Aula: 13:50–14:40 | 3ª Aula: 14:40–15:30
- Intervalo: 15:30–15:45 | 4ª Aula: 15:45–16:35 | 5ª Aula: 16:35–17:25

**Noite**
- 6ª Aula: 18:00–18:45 | 1ª Aula: 18:45–19:35 | 2ª Aula: 19:35–20:25
- Intervalo: 20:25–20:40 | 3ª Aula: 20:40–21:30 | 4ª Aula: 21:30–22:20 | 5ª Aula: 22:20–23:10

### 4.3 Fluxo de Status das Reservas

```
[Criada pelo professor]  →  pendente
[Aprovada pelo coordenador]  →  confirmada
[Presença confirmada no dia]  →  realizada
[Não confirmou presença]  →  falta registrada

[Recusada pelo coordenador]  →  recusada
[Cancelada pelo professor/coord]  →  cancelada
[Reserva de coordenador/admin]  →  confirmada (automático)
```

### 4.4 Visualização de Reservas
- **Modo Tabela** (padrão): lista com status, sala, horário e turma
- **Modo Cards**: cartões visuais por reserva
- **Modo Calendário Semanal**: grade de segunda a sábado com slots por horário
- Filtros por status, sala, professor e data
- Professores veem apenas suas próprias reservas; coordenadores/admins veem todas

---

## 5. Confirmação de Presença

- Professores devem confirmar presença **no dia e horário da reserva**
- Janela de confirmação: a partir do horário de início até o término
- Coordenadores/Admins podem confirmar presença por qualquer professor
- Reserva muda para status **"realizada"** após confirmação
- Se não confirmar: registrada como **falta**

---

## 6. Controle de Faltas e Bloqueio

- Cada ausência (não confirmação de presença) incrementa o contador do professor
- Ao atingir o **limite configurável** de faltas, o professor é automaticamente **bloqueado**
- Professor bloqueado não consegue criar novas reservas
- Coordenador pode **desbloquear** o professor (zerando o contador)
- Limite padrão: **3 faltas** (configurável pelo coordenador)
- Tolerância de tempo para confirmação: **15 minutos** (configurável)

---

## 7. Painel do Coordenador / Administrador

### 7.1 Gerenciar Reservas (`/coordenador/reservas`)
- Lista todas as reservas do sistema
- Botões para **Aprovar** ou **Recusar** reservas pendentes
- Filtros por status, sala, professor e data

### 7.2 Gerenciar Professores (`/coordenador/professores`)
- **Aba Professores**: lista todos os usuários com perfil editável (select dropdown inline)
  - Altera o perfil diretamente: Professor / Coordenador / Administrador
  - Ativa ou desativa conta com um clique
  - Cores por perfil: azul (coordenador), roxo (administrador), cinza (professor)
- **Aba Aguardando**: cadastros pendentes de aprovação
  - Aprovar ou Recusar com um clique
- **Aba Recusados**: lista de cadastros recusados (pode ser reaprovado)
- **Aba Senhas**: pedidos de redefinição de senha
  - Coordenador define a nova senha diretamente no painel

### 7.3 Bloqueios e Restrições (`/coordenador/bloqueios`)
- Cria bloqueios de horário globais ou por sala específica
- Pode ser em uma data específica ou recorrente
- Professor não consegue reservar no horário bloqueado
- Lista e remove bloqueios existentes

### 7.4 Gerenciar Salas (`/coordenador/salas`)
- Cadastro de salas com número, nome e capacidade
- Ativa ou desativa salas
- Salas desativadas não aparecem para reserva

### 7.5 Configurações (`/coordenador/configuracoes`)
- Ajusta o **limite de faltas** para bloqueio automático
- Ajusta a **tolerância de minutos** para confirmação de presença
- Botão para enviar **e-mail de teste** (verifica integração com Resend)

---

## 8. Feedback

### Para Professores
- Formulário com: avaliação por estrelas (1–5), categoria, mensagem
- Opção de enviar anonimamente
- Visualiza apenas os próprios feedbacks enviados

### Para Coordenadores/Admins
- Visualiza todos os feedbacks recebidos
- Nome do professor (ou "Anônimo" se enviado anonimamente)
- Pode excluir feedbacks
- Categorias: Sistema, Sala, Processo, Outro

---

## 9. Notificações

### Notificações Push (Navegador)
- Banner de solicitação de permissão ao entrar no sistema
- Lembretes automáticos: 10 minutos antes de cada reserva confirmada

### Lembretes por E-mail
- Enviados automaticamente pelo sistema (via Resend)
- Disparados em: 10 min, 5 min e 1 min antes do horário
- Informa: sala, data, horário, turma e disciplina

---

## 10. Identidade Visual

- **Nome**: ClickReserva
- **Tagline**: "Tecnologia que organiza, escola que avança"
- **Cores**: verde escuro (primária), branco, tons de cinza
- **Logo**: ícone de calendário + texto "Click Reserva" em SVG
- **Idioma**: Português (Brasil)
- Interface responsiva (desktop e mobile)

---

## 11. Informações Técnicas

| Item | Detalhe |
|------|---------|
| Banco de dados | PostgreSQL (Replit) |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + Tailwind CSS |
| Autenticação | Sessão por cookie (express-session) |
| E-mail | Resend API |
| Validação | Zod |
| ORM | Drizzle ORM |
| Hospedagem | Replit Deployments |

---

## 12. URLs de Acesso

| Perfil | Caminho |
|--------|---------|
| Login | `/login` |
| Dashboard | `/` |
| Minhas Reservas | `/reservas` |
| Nova Reserva | `/reservas/nova` |
| Confirmar Presença | `/presenca` |
| Feedback | `/feedback` |
| Gerenciar Reservas | `/coordenador/reservas` |
| Gerenciar Professores | `/coordenador/professores` |
| Bloqueios | `/coordenador/bloqueios` |
| Salas | `/coordenador/salas` |
| Configurações | `/coordenador/configuracoes` |

---

*Documento gerado em abril de 2026 — ClickReserva v1.0*
