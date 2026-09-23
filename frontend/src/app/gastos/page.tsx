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

  // NOVA FUNÇÃO: Validador Estrutural de Moeda
  const validarFormatoMoeda = (val: string) => {
    const v = val.trim();
    if (v === '') return true; // Se estiver vazio, não mostra erro (tratado no envio)

    const regexSimples = /^\d+$/; // Ex: 700
    const regexDecimalVirgula = /^\d+,\d+$/; // Ex: 60000,40
    const regexDecimalPonto = /^\d+\.\d+$/; // Ex: 70.55
    const regexBrasileiro = /^(\d{1,3}(\.\d{3})+)(,\d+)?$/; // Ex: 60.000,40 ou 1.000.000,00

    return regexSimples.test(v) || regexDecimalVirgula.test(v) || regexDecimalPonto.test(v) || regexBrasileiro.test(v);
  };

  // Formata o valor validado para o padrão da planilha (remove pontos de milhar e garante vírgula)
  const formatarValorInteligente = (val: string) => {
    let v = val.trim();
    if (/^(\d{1,3}(\.\d{3})+)(,\d+)?$/.test(v)) {
      return v.replace(/\./g, ''); // 60.000,40 -> 60000,40
    }
    if (/^\d+\.\d+$/.test(v)) {
      return v.replace('.', ','); // 70.55 -> 70,55
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itensValidos = itens.filter((i) => i.valor.trim() !== '');

    if (itensValidos.length === 0) {
      setMensagem('❌ Preencha o valor de pelo menos um gasto antes de enviar.');
      return;
    }

    // VALIDAÇÃO ESTRUTURAL
    const temValorInvalido = itensValidos.some(i => !validarFormatoMoeda(i.valor));
    
    if (temValorInvalido) {
      setMensagem('❌ Erro: Formato de valore(s) inválido(s)');
      return; 
    }

    setEnviando(true);
    setMensagem('Enviando gastos em lote...');
    
    const abaNome = `Mensal ${ano} - ${responsavel}`;

    const itensParaEnviar = itensValidos.map((i) => {
      const valorFormatado = formatarValorInteligente(i.valor);
      return {
        mes,
        categoria: i.categoria,
        subcategoria: i.subcategoria,
        motivo: i.motivo,
        valor: valorFormatado
      };
    });

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
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="mb-4">
          <Link href="/" className="text-sm text-blue-400 hover:underline">← Voltar para o Menu</Link>
        </div>
        <h1 className="text-xl font-bold mb-6 text-center text-blue-400">Lançamento de Gastos Mensais</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Responsável</label>
              <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                <option value="Davi">Davi</option>
                <option value="Stella">Stella</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                {anosOpcoes.map((a) => <option key={a} value={a}>20{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Mês</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-bold uppercase text-gray-400 px-2">
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
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-800 border border-gray-700 p-2 rounded-lg items-center">
                  <div className="col-span-3">
                    <select
                      value={item.categoria}
                      onChange={(e) => atualizarItem(item.id, 'categoria', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                    >
                      {categoriaOpcoes.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <select
                      value={item.subcategoria}
                      onChange={(e) => atualizarItem(item.id, 'subcategoria', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                    >
                      {subcategoriaOpcoes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <select
                      value={item.motivo}
                      onChange={(e) => atualizarItem(item.id, 'motivo', e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                    >
                      {motivoOpcoes.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 100,00"
                      value={item.valor}
                      onChange={(e) => atualizarItem(item.id, 'valor', e.target.value)}
                      onKeyDown={(e) => handleKeyDownValor(e, isUltima)}
                      className={`w-full bg-gray-700 border rounded p-2 text-sm text-white focus:outline-none focus:ring-2 ${
                        !isValido ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-blue-500'
                      }`}
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removerLinha(item.id)}
                      disabled={itens.length === 1}
                      className="text-red-400 hover:text-red-300 disabled:opacity-30 font-bold p-1 text-sm"
                      title="Remover linha"
                    >
                      ✖
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={adicionarLinha}
              className="w-full md:w-1/3 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-semibold p-3 rounded transition duration-200 text-sm"
            >
              ➕ Nova Linha
            </button>

            <button
              type="submit"
              disabled={enviando}
              className="w-full md:w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded transition duration-200 text-sm disabled:opacity-50"
            >
              {enviando ? 'Salvando...' : 'Adicionar Gastos (Enviar Todos)'}
            </button>
          </div>
        </form>

        {mensagem && (
          <p className={`mt-4 text-center font-bold text-sm ${mensagem.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
            {mensagem}
          </p>
        )}
      </div>
    </div>
  );
}