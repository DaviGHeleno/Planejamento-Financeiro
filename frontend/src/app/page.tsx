'use client';

import Link from 'next/link';
import { ReceiptText, ChartColumn, TrendingUp, Target } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700/50 text-center space-y-6">
        <h1 className="text-2xl font-bold text-blue-400 tracking-wide">Planejamento Financeiro</h1>
        <p className="text-gray-400 text-sm">Escolha qual operação deseja realizar:</p>

        <div className="flex flex-col gap-4 pt-2">
          <Link 
            href="/gastos"
            className="w-full bg-gray-800 hover:bg-sky-600 border border-gray-600 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
          >
            <ReceiptText className="w-5 h-5 text-amber-300" />
            Lançar Gastos
          </Link>

          <Link 
            href="/resumo"
            className="w-full bg-gray-800 hover:bg-sky-600 border border-gray-600 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
          >
            <ChartColumn className="w-5 h-5 text-purple-400" />
            Consulta e Relatórios
          </Link>

          <Link 
            href="/investimentos"
            className="w-full bg-gray-800 hover:bg-sky-600 border border-gray-600 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
          >
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Investimentos
          </Link>

          {/* NOVO BOTÃO DE OBJETIVOS */}
          <Link 
            href="/objetivos"
            className="w-full bg-gray-800 hover:bg-sky-600 border border-gray-600 text-white font-bold p-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
          >
            <Target className="w-5 h-5 text-rose-400" />
            Objetivos do Casal
          </Link>
        </div>
      </div>
    </div>
  );
}