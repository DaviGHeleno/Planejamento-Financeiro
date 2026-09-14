'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GastosPage() {
  const [responsavel, setResponsavel] = useState('Davi');
  const [ano, setAno] = useState('26'); // Ex: 26, 27, 28...
  const [mes, setMes] = useState('SETEMBRO');
  const [categoria, setCategoria] = useState('Lazer');
  const [subcategoria, setSubcategoria] = useState('eventos');
  const [motivo, setMotivo] = useState('AMIGOS');
  const [valor, setValor] = useState('');
  const [mensagem, setMensagem] = useState('');

  const anosOpcoes = ['26', '27', '28', '29', '30'];
  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  const categoriaOpcoes = ['Alimentação', 'Atividade Física', 'Cuidado Pessoal', 'Extras', 'Futilidades', 'Imprevisto', 'Lazer', 'Transporte', 'CARRO NOVO', 'EUROTRIP'];
  const subcategoriaOpcoes = ['carro', 'uber', 'restaurante', 'lanche', 'supermercado', 'beleza', 'terapia', 'remedio', 'passeios', 'hobbies', 'eventos', 'gym', 'esportes', 'mimos', 'compras', 'flock'];
  const motivoOpcoes = ['AMIGOS', 'ONE', 'FAMILIA', 'GASOLINA', 'CONSERTO', 'PESSOAL', 'DAVI', 'PRESENTE'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('Enviando gasto...');
    
    // Monta o nome da aba dinamicamente, ex: "Mensal 27 - Davi"
    const abaNome = `Mensal ${ano} - ${responsavel}`;

    try {
      const response = await fetch('http://localhost:3000/api/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aba: abaNome, mes, categoria, subcategoria, motivo, valor }),
      });

      const data = await response.json();
      if (response.ok) {
        setMensagem(`Gasto cadastrado com sucesso na aba "${abaNome}"!`);
        setValor('');
      } else {
        setMensagem(`Erro: ${data.error || 'Erro ao salvar'}`);
      }
    } catch {
      setMensagem('Erro de conexão com o back-end.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="mb-4">
          <Link href="/" className="text-sm text-blue-400 hover:underline">← Voltar para o Menu</Link>
        </div>
        <h1 className="text-xl font-bold mb-6 text-center text-blue-400">Lançamento de Gastos Mensais</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                <option value="Davi">Davi</option>
                <option value="Stella">Stella</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                {anosOpcoes.map((a) => <option key={a} value={a}>20{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              {categoriaOpcoes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sub-categoria</label>
            <select value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              {subcategoriaOpcoes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
              {motivoOpcoes.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input type="text" placeholder="Ex: 150,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded transition duration-200">
            Adicionar Gasto
          </button>
        </form>

        {mensagem && <p className="mt-4 text-center font-semibold text-sm text-yellow-400">{mensagem}</p>}
      </div>
    </div>
  );
}