"""
RN-08 — BLOQUEIO POR NÃO COMPARECIMENTO
ClickReserva | C.E. Prof. Mario B.T. Braga | Prof.ª Simone Barros

Adicione estas funções e rotas ao seu app.py principal no Replit.
"""

from flask import render_template_string, request, redirect, url_for, flash, session
from datetime import datetime
import sqlite3

DB_PATH = 'reservas.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_config(chave):
    """Busca valor de configuração do sistema."""
    conn = get_db()
    row = conn.execute("SELECT Valor FROM CONFIGURACAO WHERE Chave=?", (chave,)).fetchone()
    conn.close()
    return int(row['Valor']) if row else None

# ============================================================
# FUNÇÕES DE NEGÓCIO
# ============================================================

def professor_pode_reservar(id_professor):
    """
    Verifica se o professor está bloqueado.
    Retorna (True, None) se pode reservar.
    Retorna (False, motivo) se bloqueado.
    """
    conn = get_db()
    prof = conn.execute(
        "SELECT Bloqueado, Total_Faltas, Motivo_Bloqueio FROM PROFESSOR WHERE ID_Professor=?",
        (id_professor,)
    ).fetchone()
    conn.close()

    if prof and prof['Bloqueado']:
        return False, prof['Motivo_Bloqueio']
    return True, None


def registrar_presenca(id_reserva, id_professor):
    """
    Professor confirma presença na sala.
    Só pode confirmar dentro do período da reserva + tolerância.
    """
    conn = get_db()
    reserva = conn.execute(
        "SELECT * FROM RESERVA WHERE ID_Reserva=? AND ID_Professor=?",
        (id_reserva, id_professor)
    ).fetchone()

    if not reserva:
        conn.close()
        return False, "Reserva não encontrada ou não pertence a você."

    if reserva['Confirmou_Presenca']:
        conn.close()
        return False, "Presença já confirmada anteriormente."

    if reserva['Status'] not in ('Confirmada', 'Pendente'):
        conn.close()
        return False, "Essa reserva não está ativa."

    # Verifica se ainda está dentro do horário permitido
    tolerancia = get_config('minutos_tolerancia') or 15
    agora = datetime.now()
    inicio = datetime.strptime(f"{reserva['Data']} {reserva['Hora_Inicio']}", "%Y-%m-%d %H:%M")
    fim    = datetime.strptime(f"{reserva['Data']} {reserva['Hora_Fim']}",    "%Y-%m-%d %H:%M")

    if agora < inicio:
        conn.close()
        return False, f"A reserva ainda não começou. Volte às {reserva['Hora_Inicio']}."

    minutos_apos_inicio = (agora - inicio).total_seconds() / 60
    if minutos_apos_inicio > tolerancia and agora < fim:
        # Dentro da aula mas passou da tolerância — ainda permite confirmar
        pass

    if agora > fim:
        conn.close()
        return False, "O horário da reserva já encerrou. Não é possível confirmar presença."

    # Confirma presença
    conn.execute("""
        UPDATE RESERVA
        SET Confirmou_Presenca = 1,
            Data_Confirmacao   = ?,
            Status             = 'Realizada'
        WHERE ID_Reserva = ?
    """, (agora.strftime("%Y-%m-%d %H:%M:%S"), id_reserva))
    conn.commit()
    conn.close()
    return True, "✅ Presença confirmada com sucesso!"


def verificar_faltas_pendentes():
    """
    Verifica reservas que passaram do horário (+ tolerância) sem confirmação.
    Registra como falta e bloqueia professor se atingir o limite.
    Chamar esta função periodicamente (ex: a cada página carregada).
    """
    tolerancia = get_config('minutos_tolerancia') or 15
    limite_faltas = get_config('limite_faltas') or 3
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()

    # Busca reservas não confirmadas cujo horário já passou + tolerância
    reservas_faltadas = conn.execute(f"""
        SELECT * FROM RESERVA
        WHERE Status = 'Confirmada'
        AND Confirmou_Presenca = 0
        AND datetime(Data || ' ' || Hora_Inicio, '+{tolerancia} minutes') < ?
    """, (agora,)).fetchall()

    for reserva in reservas_faltadas:
        id_reserva   = reserva['ID_Reserva']
        id_professor = reserva['ID_Professor']

        # Verifica se já foi registrada como falta
        ja_registrou = conn.execute(
            "SELECT 1 FROM FALTA_PROFESSOR WHERE ID_Reserva=?", (id_reserva,)
        ).fetchone()

        if ja_registrou:
            continue

        # Gera ID da falta
        total = conn.execute("SELECT COUNT(*) FROM FALTA_PROFESSOR").fetchone()[0]
        id_falta = f"FAL-{total + 1:03d}"

        # Registra a falta
        conn.execute("""
            INSERT INTO FALTA_PROFESSOR VALUES (?, ?, ?, ?, ?)
        """, (id_falta, id_professor, id_reserva,
              reserva['Data'], agora))

        # Atualiza status da reserva
        conn.execute("""
            UPDATE RESERVA SET Status = 'Nao_Compareceu' WHERE ID_Reserva = ?
        """, (id_reserva,))

        # Incrementa contador de faltas do professor
        conn.execute("""
            UPDATE PROFESSOR SET Total_Faltas = Total_Faltas + 1 WHERE ID_Professor = ?
        """, (id_professor,))

        # Verifica se atingiu o limite de bloqueio
        prof = conn.execute(
            "SELECT Total_Faltas, Nome FROM PROFESSOR WHERE ID_Professor=?",
            (id_professor,)
        ).fetchone()

        if prof and prof['Total_Faltas'] >= limite_faltas:
            motivo = (f"Bloqueado automaticamente em {agora[:10]} "
                      f"por {prof['Total_Faltas']} faltas sem confirmação de presença.")
            conn.execute("""
                UPDATE PROFESSOR
                SET Bloqueado = 1, Data_Bloqueio = ?, Motivo_Bloqueio = ?
                WHERE ID_Professor = ?
            """, (agora, motivo, id_professor))

    conn.commit()
    conn.close()


# ============================================================
# ROTAS FLASK
# ============================================================

# ── Confirmar Presença ────────────────────────────────────────
TEMPLATE_CONFIRMAR = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Presença — ClickReserva</title>
  <link rel="stylesheet" href="/static/clickreserva.css">
</head>
<body>
<header class="cr-header">
  <div class="cr-header-logo"><span>Click<em>Reserva</em></span></div>
</header>
<nav class="cr-nav">
  <a href="/">🏠 Início</a>
  <a href="/reservas">📅 Minhas Reservas</a>
</nav>
<div class="cr-container">
  <div class="cr-card">
    <h2>✅ Confirmar Presença</h2>

    {% if bloqueado %}
    <div class="cr-alert cr-alert-error">
      🚫 Você está bloqueado e não pode fazer reservas.<br>
      <small>{{ motivo_bloqueio }}</small>
    </div>
    {% endif %}

    {% if reservas %}
    <p style="font-size:14px;color:#555;margin-bottom:16px;">
      Selecione a reserva do horário atual para confirmar sua presença:
    </p>
    <table class="cr-table">
      <thead>
        <tr>
          <th>ID</th><th>Sala</th><th>Data</th><th>Horário</th><th>Status</th><th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {% for r in reservas %}
        <tr>
          <td>{{ r.ID_Reserva }}</td>
          <td>{{ r.Numero }}</td>
          <td>{{ r.Data }}</td>
          <td>{{ r.Hora_Inicio }} – {{ r.Hora_Fim }}</td>
          <td>
            {% if r.Confirmou_Presenca %}
              <span class="cr-badge cr-badge-confirmada">✅ Confirmada</span>
            {% else %}
              <span class="cr-badge cr-badge-pendente">⏳ Aguardando</span>
            {% endif %}
          </td>
          <td>
            {% if not r.Confirmou_Presenca %}
            <form method="POST" action="/reservas/confirmar/{{ r.ID_Reserva }}">
              <button class="cr-btn cr-btn-primary cr-btn-sm">Confirmar</button>
            </form>
            {% else %}
              <small style="color:#888">Já confirmado</small>
            {% endif %}
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% else %}
    <div class="cr-alert cr-alert-info">
      📭 Você não tem reservas ativas para hoje.
    </div>
    {% endif %}
  </div>
</div>
</body>
</html>
"""

# ── Painel do Coordenador — Gestão de Bloqueios ───────────────
TEMPLATE_COORDENADOR = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gestão de Bloqueios — ClickReserva</title>
  <link rel="stylesheet" href="/static/clickreserva.css">
</head>
<body>
<header class="cr-header">
  <div class="cr-header-logo"><span>Click<em>Reserva</em></span></div>
</header>
<nav class="cr-nav">
  <a href="/">🏠 Início</a>
  <a href="/coordenador/bloqueios" class="ativo">🚫 Bloqueios</a>
  <a href="/coordenador/config">⚙️ Configurações</a>
</nav>
<div class="cr-container">

  <!-- Configuração do limite -->
  <div class="cr-card">
    <h2>⚙️ Configuração do Limite de Faltas</h2>
    <form method="POST" action="/coordenador/config" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <div class="cr-form-group" style="margin:0;flex:1;min-width:160px">
        <label>Faltas para bloqueio</label>
        <input type="number" name="limite_faltas" value="{{ limite_faltas }}" min="1" max="10">
      </div>
      <div class="cr-form-group" style="margin:0;flex:1;min-width:160px">
        <label>Tolerância (minutos)</label>
        <input type="number" name="minutos_tolerancia" value="{{ tolerancia }}" min="5" max="60">
      </div>
      <button type="submit" class="cr-btn cr-btn-primary">💾 Salvar</button>
    </form>
  </div>

  <!-- Professores bloqueados -->
  <div class="cr-card">
    <h2>🚫 Professores Bloqueados</h2>
    {% if bloqueados %}
    <table class="cr-table">
      <thead>
        <tr><th>Nome</th><th>Faltas</th><th>Bloqueado em</th><th>Motivo</th><th>Ação</th></tr>
      </thead>
      <tbody>
        {% for p in bloqueados %}
        <tr>
          <td>{{ p.Nome }}</td>
          <td style="font-weight:800;color:#e53e3e">{{ p.Total_Faltas }}</td>
          <td>{{ p.Data_Bloqueio[:10] if p.Data_Bloqueio else '—' }}</td>
          <td style="font-size:12px;color:#888">{{ p.Motivo_Bloqueio }}</td>
          <td>
            <form method="POST" action="/coordenador/desbloquear/{{ p.ID_Professor }}">
              <button class="cr-btn cr-btn-secondary cr-btn-sm">🔓 Desbloquear</button>
            </form>
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% else %}
    <div class="cr-alert cr-alert-success">✅ Nenhum professor bloqueado no momento.</div>
    {% endif %}
  </div>

  <!-- Histórico de faltas -->
  <div class="cr-card">
    <h2>📋 Histórico de Faltas</h2>
    {% if faltas %}
    <table class="cr-table">
      <thead>
        <tr><th>Professor</th><th>Reserva</th><th>Data da Falta</th><th>Registrado em</th></tr>
      </thead>
      <tbody>
        {% for f in faltas %}
        <tr>
          <td>{{ f.Nome }}</td>
          <td>{{ f.ID_Reserva }}</td>
          <td>{{ f.Data_Falta }}</td>
          <td style="font-size:12px;color:#888">{{ f.Registrado_Em }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% else %}
    <div class="cr-alert cr-alert-info">📭 Nenhuma falta registrada ainda.</div>
    {% endif %}
  </div>

</div>
</body>
</html>
"""

# ── Definição das rotas (adicionar ao app.py) ─────────────────

def registrar_rotas_rn08(app):
    """Chame esta função no app.py: registrar_rotas_rn08(app)"""

    @app.route('/reservas/confirmar', methods=['GET'])
    def confirmar_presenca_lista():
        verificar_faltas_pendentes()  # verifica faltas ao carregar
        id_professor = session.get('id_professor')
        if not id_professor:
            return redirect(url_for('login'))

        conn = get_db()
        prof = conn.execute(
            "SELECT Bloqueado, Motivo_Bloqueio FROM PROFESSOR WHERE ID_Professor=?",
            (id_professor,)
        ).fetchone()

        reservas = conn.execute("""
            SELECT r.*, s.Numero
            FROM RESERVA r
            JOIN SALA s ON r.ID_Sala = s.ID_Sala
            WHERE r.ID_Professor = ?
            AND r.Data = date('now')
            AND r.Status IN ('Confirmada', 'Pendente', 'Realizada')
            ORDER BY r.Hora_Inicio
        """, (id_professor,)).fetchall()
        conn.close()

        return render_template_string(
            TEMPLATE_CONFIRMAR,
            reservas=reservas,
            bloqueado=prof['Bloqueado'] if prof else False,
            motivo_bloqueio=prof['Motivo_Bloqueio'] if prof else ''
        )

    @app.route('/reservas/confirmar/<id_reserva>', methods=['POST'])
    def confirmar_presenca(id_reserva):
        id_professor = session.get('id_professor')
        if not id_professor:
            return redirect(url_for('login'))

        sucesso, msg = registrar_presenca(id_reserva, id_professor)
        flash(msg, 'success' if sucesso else 'error')
        return redirect(url_for('confirmar_presenca_lista'))

    @app.route('/coordenador/bloqueios')
    def coordenador_bloqueios():
        verificar_faltas_pendentes()
        conn = get_db()
        bloqueados = conn.execute(
            "SELECT * FROM PROFESSOR WHERE Bloqueado=1 ORDER BY Data_Bloqueio DESC"
        ).fetchall()
        faltas = conn.execute("""
            SELECT f.*, p.Nome FROM FALTA_PROFESSOR f
            JOIN PROFESSOR p ON f.ID_Professor = p.ID_Professor
            ORDER BY f.Registrado_Em DESC LIMIT 50
        """).fetchall()
        limite  = get_config('limite_faltas') or 3
        tolerancia = get_config('minutos_tolerancia') or 15
        conn.close()
        return render_template_string(
            TEMPLATE_COORDENADOR,
            bloqueados=bloqueados,
            faltas=faltas,
            limite_faltas=limite,
            tolerancia=tolerancia
        )

    @app.route('/coordenador/config', methods=['POST'])
    def salvar_config():
        limite    = request.form.get('limite_faltas', '3')
        tolerancia = request.form.get('minutos_tolerancia', '15')
        conn = get_db()
        conn.execute("UPDATE CONFIGURACAO SET Valor=? WHERE Chave='limite_faltas'",    (limite,))
        conn.execute("UPDATE CONFIGURACAO SET Valor=? WHERE Chave='minutos_tolerancia'", (tolerancia,))
        conn.commit()
        conn.close()
        flash(f'✅ Configuração salva: bloqueio após {limite} faltas, tolerância de {tolerancia} min.', 'success')
        return redirect(url_for('coordenador_bloqueios'))

    @app.route('/coordenador/desbloquear/<id_professor>', methods=['POST'])
    def desbloquear_professor(id_professor):
        conn = get_db()
        prof = conn.execute(
            "SELECT Nome FROM PROFESSOR WHERE ID_Professor=?", (id_professor,)
        ).fetchone()
        conn.execute("""
            UPDATE PROFESSOR
            SET Bloqueado=0, Total_Faltas=0, Data_Bloqueio=NULL, Motivo_Bloqueio=NULL
            WHERE ID_Professor=?
        """, (id_professor,))
        conn.commit()
        conn.close()
        nome = prof['Nome'] if prof else id_professor
        flash(f'🔓 Professor {nome} desbloqueado e contador de faltas zerado.', 'success')
        return redirect(url_for('coordenador_bloqueios'))


# ============================================================
# COMO INTEGRAR AO APP.PY EXISTENTE
# ============================================================
#
# 1. Copie este arquivo para o Replit como "rn08_bloqueio.py"
#
# 2. No seu app.py, adicione no topo:
#    from rn08_bloqueio import registrar_rotas_rn08, verificar_faltas_pendentes
#
# 3. Após criar o app Flask, chame:
#    registrar_rotas_rn08(app)
#
# 4. Execute o SQL do arquivo rn08_bloqueio.sql no banco
#    para adicionar as novas colunas e tabelas
#
# 5. Na tela de nova reserva, antes de salvar, adicione:
#    pode, motivo = professor_pode_reservar(session['id_professor'])
#    if not pode:
#        flash(f'🚫 {motivo}', 'error')
#        return redirect(url_for('nova_reserva'))
#
# 6. No menu de navegação de cada página, adicione:
#    <a href="/reservas/confirmar">✅ Confirmar Presença</a>
#    <a href="/coordenador/bloqueios">🚫 Bloqueios</a>  ← só para coordenador
