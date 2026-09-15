'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 text-center space-y-6">
        <h1 className="text-2xl font-bold text-blue-400">Planejamento Financeiro</h1>
        <p className="text-gray-400 text-sm">Escolha qual operação deseja realizar:</p>

        <div className="flex flex-col gap-4">
          <Link 
            href="/gastos"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-4 rounded-xl transition duration-200 shadow-md text-center block"
          >
            📊 Adicionar Gastos do Mês
          </Link>

          <Link 
            href="/investimentos"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold p-4 rounded-xl transition duration-200 shadow-md text-center block"
          >
            💰 Adicionar Investimentos
          </Link>

          <Link 
            href="/resumo"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-4 rounded-xl transition duration-200 shadow-md text-center block"
          >
            📈 Visualizar Dados e Resumo
          </Link>
        </div>
      </div>
    </div>
  );
}