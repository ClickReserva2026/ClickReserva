import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// Painel Interno Provisório de Alta Fidelidade (Substitui o arquivo quebrado dos alunos)
function DashboardMock() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Olá, Coordenador(a)!
        </h1>
        <p className="text-sm text-slate-500">
          Bem-vindo ao painel administrativo. Selecione uma opção no menu lateral para começar.
        </p>
      </div>

      {/* Grid de Atividades */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-max uppercase tracking-wider">
            Ambientes
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1">Gerenciar Espaços</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visualize e modifique a disponibilidade de laboratórios, auditórios e salas.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col gap-2">
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-max uppercase tracking-wider">
            Reservas
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1">Solicitações Pendentes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Aprove ou recuse os pedidos de agendamento feitos pelos professores.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col gap-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-max uppercase tracking-wider">
            Usuários
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1">Cadastro de Professores</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gerencie as contas ativas e permissões de acesso ao sistema de reservas.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      {/* 1. Tela Inicial Verde Unificada (Imagem 1) */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Área Logada Real: Renderiza o layout dos alunos com o painel corrigido (Imagem 2) */}
      <Route path="/">
        <MainLayout>
          <DashboardMock />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança para rotas inválidas */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
