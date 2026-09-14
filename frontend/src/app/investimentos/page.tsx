'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InvestimentosPage() {
  const [invAno, setInvAno] = useState(2026);
  const [invMes, setInvMes] = useState('MARÇO');
  const [invResponsavel, setInvResponsavel] = useState('Davi');
  const [invValor, setInvValor] = useState('');
  const [invMensagem, setInvMensagem] = useState('');

  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  const handleInvestimentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMensagem('Enviando investimento...');
    const mesFormatado = invMes.charAt(0) + invMes.slice(1).toLowerCase();

    try {
      const response = await fetch('http://localhost:3000/api/investimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: Number(invAno),
          mes: mesFormatado,
          responsavel: invResponsavel,
          valor: Number(invValor),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setInvMensagem(`Investimento registrado! Futuro: R$ ${data.valorFuturo} | Pessoal: R$ ${data.valorPessoal}`);
        setInvValor('');
      } else {
        setInvMensagem(`Erro: ${data.error || 'Erro ao salvar'}`);
      }
    } catch {
      setInvMensagem('Erro de conexão com o back-end.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="mb-4">
          <Link href="/" className="text-sm text-green-400 hover:underline">← Voltar para o Menu</Link>
        </div>
        <h2 className="text-xl font-bold mb-6 text-center text-green-400">Adicionar Investimento (70/30)</h2>

        <form onSubmit={handleInvestimentoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ano</label>
            <input type="number" value={invAno} onChange={(e) => setInvAno(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select value={invMes} onChange={(e) => setInvMes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Responsável</label>
            <select value={invResponsavel} onChange={(e) => setInvResponsavel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              <option value="Davi">Davi</option>
              <option value="Stella">Stella</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor Total (R$)</label>
            <input type="number" step="0.01" placeholder="Ex: 1000" value={invValor} onChange={(e) => setInvValor(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition duration-200">
            Registrar Investimento
          </button>
        </form>

        {invMensagem && <p className="mt-4 text-center font-semibold text-sm text-green-300">{invMensagem}</p>}
      </div>
    </div>
  );
}