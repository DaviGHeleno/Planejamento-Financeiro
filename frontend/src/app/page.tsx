'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700/50 text-center space-y-6">
        <h1 className="text-2xl font-bold text-blue-400 tracking-wide">Planejamento Financeiro</h1>
        <p className="text-gray-400 text-sm">Escolha qual operação deseja realizar:</p>

        <div className="flex flex-col gap-4 pt-2">
          <Link 
            href="/gastos"
            className="w-full bg-gray-700 hover:bg-blue-500 border border-blue-300 text-white font-bold p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-center block"
          >
            📊 Adicionar Gastos do Mês
          </Link>

          <Link 
            href="/resumo"
            className="w-full bg-gray-700 hover:bg-blue-500 border border-blue-300 text-white font-bold p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-center block"
          >
            📈 Visualizar Gastos
          </Link>

          <Link 
            href="/investimentos"
            className="w-full bg-gray-700 hover:bg-blue-500 border border-blue-200 text-white font-bold p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-center block"
          >
            💰 Investimentos
          </Link>
        </div>
      </div>
    </div>
  );
}