'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ItemGasto {
  id: string;
  categoria: string;
  subcategoria: string;
  motivo: string;
  valor: string;
}

export default function GastosPage() {
  const [responsavel, setResponsavel] = useState('Davi');
  const [ano, setAno] = useState('26');
  const [mes, setMes] = useState('SETEMBRO');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const anosOpcoes = ['26', '27', '28', '29', '30'];
  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  const categoriaOpcoes = ['Alimentação', 'Atividade Física', 'Cuidado Pessoal', 'Extras', 'Futilidades', 'Imprevisto', 'Lazer', 'Transporte', 'CARRO NOVO', 'EUROTRIP'];
  const subcategoriaOpcoes = ['carro', 'uber', 'restaurante', 'lanche', 'supermercado', 'beleza', 'terapia', 'remedio', 'passeios', 'hobbies', 'eventos', 'gym', 'esportes', 'mimos', 'compras', 'flock'];
  const motivoOpcoes = ['AMIGOS', 'ONE', 'FAMILIA', 'GASOLINA', 'CONSERTO', 'PESSOAL', 'DAVI', 'PRESENTE'];

  const [itens, setItens] = useState<ItemGasto[]>([
    { id: '1', categoria: 'Alimentação', subcategoria: 'lanche', motivo: 'PESSOAL', valor: '' }
  ]);

  const adicionarLinha = () => {
    setItens((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        categoria: prev[prev.length - 1]?.categoria || 'Alimentação',
        subcategoria: prev[prev.length - 1]?.subcategoria || 'lanche',
        motivo: prev[prev.length - 1]?.motivo || 'PESSOAL',
        valor: ''
      }
    ]);
  };

  const removerLinha = (id: string) => {
    if (itens.length === 1) return;
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const atualizarItem = (id: string, campo: keyof ItemGasto, valor: string) => {
    setItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  };

  const handleKeyDownValor = (e: React.KeyboardEvent<HTMLInputElement>, isUltimaLinha: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isUltimaLinha) {
        adicionarLinha();
      }
    }
  };

  const validarFormatoMoeda = (val: string) => {
    const v = val.trim();
    if (v === '') return true;
    const regexSimples = /^\d+$/; 
    const regexDecimalVirgula = /^\d+,\d+$/; 
    const regexDecimalPonto = /^\d+\.\d+$/; 
    const regexBrasileiro = /^(\d{1,3}(\.\d{3})+)(,\d+)?$/; 
    return regexSimples.test(v) || regexDecimalVirgula.test(v) || regexDecimalPonto.test(v) || regexBrasileiro.test(v);
  };

  const formatarValorInteligente = (val: string) => {
    let v = val.trim();
    if (/^(\d{1,3}(\.\d{3})+)(,\d+)?$/.test(v)) return v.replace(/\./g, ''); 
    if (/^\d+\.\d+$/.test(v)) return v.replace('.', ','); 
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itensValidos = itens.filter((i) => i.valor.trim() !== '');

    if (itensValidos.length === 0) {
      setMensagem('❌ Preencha o valor de pelo menos um gasto antes de enviar.');
      return;
    }

    const temValorInvalido = itensValidos.some(i => !validarFormatoMoeda(i.valor));
    if (temValorInvalido) {
      setMensagem('❌ Erro: Formato inválido. Use formatos como 60.000,40 | 60000,40 | 70.55 | 700');
      return; 
    }

    setEnviando(true);
    setMensagem('Enviando gastos em lote...');
    
    const abaNome = `Mensal ${ano} - ${responsavel}`;
    const itensParaEnviar = itensValidos.map((i) => ({
      mes,
      categoria: i.categoria,
      subcategoria: i.subcategoria,
      motivo: i.motivo,
      valor: formatarValorInteligente(i.valor)
    }));

    try {
      const response = await fetch('http://localhost:3000/api/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aba: abaNome, itens: itensParaEnviar }),
      });

      const data = await response.json();
      if (response.ok) {
        setMensagem(`✅ Sucesso: ${itensParaEnviar.length} gasto(s) cadastrado(s) na aba "${abaNome}"!`);
        setItens([{ id: Date.now().toString(), categoria: 'Alimentação', subcategoria: 'lanche', motivo: 'PESSOAL', valor: '' }]);
      } else {
        setMensagem(`❌ Erro: ${data.error || 'Erro ao salvar'}`);
      }
    } catch {
      setMensagem('❌ Erro de conexão com o back-end.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700/50">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
            ← Voltar para o Menu
          </Link>
        </div>
        
        {/* TÍTULO - 10% Azul */}
        <h1 className="text-2xl font-bold mb-8 text-center text-blue-400 tracking-wide">
          Lançamento de Gastos Mensais
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* CABEÇALHO FIXO - 60% e 30% */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900/50 p-5 rounded-xl border border-gray-700">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Responsável</label>
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                <option value="Davi">Davi</option>
                <option value="Stella">Stella</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                {anosOpcoes.map((a) => <option key={a} value={a}>20{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Mês</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* LISTA DINÂMICA */}
          <div className="space-y-3 pt-4">
            <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs font-bold uppercase text-gray-500 px-2 tracking-wider">
              <span className="col-span-3">Categoria</span>
              <span className="col-span-3">Sub-categoria</span>
              <span className="col-span-3">Motivo</span>
              <span className="col-span-2">Valor (R$)</span>
              <span className="col-span-1 text-center">Ação</span>
            </div>

            {itens.map((item, index) => {
              const isUltima = index === itens.length - 1;
              const isValido = validarFormatoMoeda(item.valor);

              return (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-900/30 border border-gray-700 p-2.5 rounded-xl items-center hover:bg-gray-800/80 transition-colors">
                  <div className="col-span-3">
                    <select
                      value={item.categoria}
                      onChange={(e) => atualizarItem(item.id, 'categoria', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                      {categoriaOpcoes.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <select
                      value={item.subcategoria}
                      onChange={(e) => atualizarItem(item.id, 'subcategoria', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                      {subcategoriaOpcoes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <select
                      value={item.motivo}
                      onChange={(e) => atualizarItem(item.id, 'motivo', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                      {motivoOpcoes.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={item.valor}
                      onChange={(e) => atualizarItem(item.id, 'valor', e.target.value)}
                      onKeyDown={(e) => handleKeyDownValor(e, isUltima)}
                      className={`w-full bg-gray-800 border rounded-lg p-2 text-sm text-gray-200 outline-none transition-all focus:ring-1 ${
                        !isValido ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                    />
                  </div>

                  <div className="col-span-1 text-center flex justify-center">
                    <button
                      type="button"
                      onClick={() => removerLinha(item.id)}
                      disabled={itens.length === 1}
                      className="text-red-400/80 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-20 font-bold p-2 rounded-lg transition-all"
                      title="Remover linha"
                    >
                      ✖
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-6 mt-2 border-t border-gray-700/50">
            <button
              type="button"
              onClick={adicionarLinha}
              className="w-full md:w-1/3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-semibold p-3.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              ➕ Nova Linha
            </button>

            {/* BOTÃO PRINCIPAL - 10% Azul */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full md:w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold p-3.5 rounded-xl transition-colors text-sm disabled:opacity-50 shadow-lg shadow-blue-900/20"
            >
              {enviando ? 'Processando Lote...' : 'Adicionar Gastos (Enviar Todos)'}
            </button>
          </div>
        </form>

        {mensagem && (
          <div className={`mt-6 p-4 rounded-xl text-center font-medium text-sm border ${mensagem.includes('❌') ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'}`}>
            {mensagem}
          </div>
        )}
      </div>
    </div>
  );
}