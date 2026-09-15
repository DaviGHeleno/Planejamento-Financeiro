'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function ResumoPage() {
  const [responsavel, setResponsavel] = useState('Davi');
  const [ano, setAno] = useState('26');
  const [dadosGastos, setDadosGastos] = useState<any[]>([]);
  const [dadosMetas, setDadosMetas] = useState<any[]>([]);
  const [visao, setVisao] = useState<'tabela' | 'graficos'>('tabela');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Filtro de Período para os Gráficos
  const [filtroPeriodoGrafico, setFiltroPeriodoGrafico] = useState('TODOS');

  // Filtros internos da tabela
  const [filtroMes, setFiltroMes] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');

  const anosOpcoes = ['26', '27', '28', '29', '30'];
  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  const carregarDados = async () => {
    setCarregando(true);
    setMensagem('');
    try {
      // 1. Busca os Gastos e as Metas em paralelo
      const [resGastos, resMetas] = await Promise.all([
        fetch(`http://localhost:3000/api/gastos/${responsavel}/${ano}`),
        fetch(`http://localhost:3000/api/metas/${responsavel}/${ano}`)
      ]);

      const dataGastos = await resGastos.json();
      const dataMetas = await resMetas.json();

      if (resGastos.ok && resMetas.ok) {
        setDadosGastos(dataGastos.gastos || []);
        setDadosMetas(dataMetas.metas || []);
        if ((dataGastos.gastos || []).length === 0) {
          setMensagem(`Nenhum gasto encontrado para ${responsavel} em 20${ano}.`);
        }
      } else {
        setMensagem('Erro ao carregar dados da planilha.');
      }
    } catch {
      setMensagem('Erro de conexão com o back-end.');
    } finally {
      setCarregando(false);
    }
  };

  const parseValor = (val: string) => {
    if (!val) return 0;
    const limpo = val.toString().replace('R$', '').trim().replace('.', '').replace(',', '.');
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  };

  // Filtragem para a tabela
  const dadosFiltradosTabela = dadosGastos.filter((gasto) => {
    const matchMes = gasto.mes.toLowerCase().includes(filtroMes.toLowerCase());
    const matchCat = gasto.categoria.toLowerCase().includes(filtroCategoria.toLowerCase());
    const matchSub = gasto.subcategoria.toLowerCase().includes(filtroSubcategoria.toLowerCase());
    const matchMot = gasto.motivo.toLowerCase().includes(filtroMotivo.toLowerCase());
    return matchMes && matchCat && matchSub && matchMot;
  });

  // Filtragem para os gráficos
  const dadosParaGraficos = dadosGastos.filter((gasto) => {
    if (filtroPeriodoGrafico === 'TODOS') return true;
    return gasto.mes.trim().toUpperCase() === filtroPeriodoGrafico.toUpperCase();
  });

  const normalizarCategoria = (cat: string) => {
    const c = cat.trim().toLowerCase();
    if (c.includes('transporte')) return 'TRANSPORTE';
    if (c.includes('alimentação') || c.includes('alimentacao')) return 'ALIMENTAÇÃO';
    if (c.includes('cuidado') || c.includes('pessoal')) return 'CUIDADOS PESSOAIS';
    if (c.includes('atividade') || c.includes('fisica') || c.includes('física')) return 'ATIVIDADES FÍSICAS';
    if (c.includes('extra') || c.includes('futilidade')) return 'EXTRAS/FUTILIDADES';
    if (c.includes('lazer')) return 'LAZER';
    if (c.includes('imprevisto')) return 'IMPREVISTOS';
    if (c.includes('carro') || c.includes('parcelas')) return 'PARCELAS CARRO';
    return cat.trim().toUpperCase();
  };

  // Mapeia as metas vindas de A5:B12
  const metasMap: { [key: string]: number } = {};
  dadosMetas.forEach((linha) => {
    if (linha[0]) {
      const nomeCat = normalizarCategoria(linha[0]);
      const valorMeta = parseValor(linha[1]);
      metasMap[nomeCat] = valorMeta;
    }
  });

// Somatório dos gastos realizados por categoria
  const dadosCatMap = dadosParaGraficos.reduce((acc: any, item: any) => {
    const catPadrao = normalizarCategoria(item.categoria || '');
    const val = parseValor(item.valor);
    if (!acc[catPadrao]) acc[catPadrao] = 0;
    acc[catPadrao] += val;
    return acc;
  }, {});

  // 👇 AQUI: Removemos 'PARCELAS CARRO' da lista de exibição do gráfico
  const ordemCategorias = [
    'TRANSPORTE', 'ALIMENTAÇÃO', 'CUIDADOS PESSOAIS', 
    'ATIVIDADES FÍSICAS', 'EXTRAS/FUTILIDADES', 'LAZER', 'IMPREVISTOS'
  ];

  // Se o filtro for "Ano Todo", multiplicamos a meta mensal por 12. 
  const fatorMultiplicador = filtroPeriodoGrafico === 'TODOS' ? 12 : 1;

  const dadosGraficoCategorias = ordemCategorias.map((cat) => ({
    categoria: cat,
    Realizado: Number((dadosCatMap[cat] || 0).toFixed(2)),
    Planejado: Number(((metasMap[cat] || 0) * fatorMultiplicador).toFixed(2)),
  }));

  // Sub-categorias
  const normalizarSubcategoria = (sub: string) => {
    const s = sub.trim().toLowerCase();
    if (s.includes('carro')) return 'Carro';
    if (s.includes('uber')) return 'Uber';
    if (s.includes('restaurante')) return 'Restaurante';
    if (s.includes('gastronomia')) return 'Gastronomia';
    if (s.includes('mimo')) return 'Mimos';
    if (s.includes('compra')) return 'Compras';
    if (s.includes('hobbie') || s.includes('hobbies')) return 'Hobbies';
    return sub.trim();
  };

  const dadosSubMap = dadosParaGraficos.reduce((acc: any, item: any) => {
    const subPadrao = normalizarSubcategoria(item.subcategoria || '');
    const val = parseValor(item.valor);
    if (!acc[subPadrao]) acc[subPadrao] = 0;
    acc[subPadrao] += val;
    return acc;
  }, {});

  const ordemSubcategorias = ['Carro', 'Uber', 'Restaurante', 'Gastronomia', 'Mimos', 'Compras', 'Hobbies'];

  const dadosGraficoSubcategorias = ordemSubcategorias.map((sub) => ({
    subcategoria: sub,
    Total: Number((dadosSubMap[sub] || 0).toFixed(2)),
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="mb-4">
          <Link href="/" className="text-sm text-purple-400 hover:underline">← Voltar para o Menu</Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-400">Consulta de Gastos e Relatórios</h1>

        {/* Filtro Inicial por Ano e Responsável */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
          <div>
            <label className="block text-sm font-medium mb-1">Responsável</label>
            <select 
              value={responsavel} 
              onChange={(e) => setResponsavel(e.target.value)} 
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            >
              <option value="Davi">Davi</option>
              <option value="Stella">Stella</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ano</label>
            <select 
              value={ano} 
              onChange={(e) => setAno(e.target.value)} 
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
            >
              {anosOpcoes.map((a) => (
                <option key={a} value={a}>20{a}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={carregarDados}
            disabled={carregando}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded transition duration-200 h-10"
          >
            {carregando ? 'Carregando...' : 'Carregar Dados do Ano'}
          </button>
        </div>

        {mensagem && <p className="text-center text-yellow-400 mb-4">{mensagem}</p>}

        {dadosGastos.length > 0 && (
          <>
            {/* Abas de Alternância */}
            <div className="flex justify-center gap-4 mb-6">
              <button 
                onClick={() => setVisao('tabela')}
                className={`px-4 py-2 rounded font-bold transition ${visao === 'tabela' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                📋 Tabela de Gastos
              </button>
              <button 
                onClick={() => setVisao('graficos')}
                className={`px-4 py-2 rounded font-bold transition ${visao === 'graficos' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                📊 Painel de Gráficos & Planejado
              </button>
            </div>

            {/* VISÃO 1: TABELA */}
            {visao === 'tabela' && (
              <div className="overflow-x-auto">
                <p className="text-sm text-gray-400 mb-3">Exibindo {dadosFiltradosTabela.length} de {dadosGastos.length} registro(s).</p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-purple-300">
                      <th className="p-3">Mês</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Sub-categoria</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3">Valor (R$)</th>
                    </tr>
                    <tr className="bg-gray-700/40 border-b border-gray-700">
                      <th className="p-2">
                        <input type="text" placeholder="Filtrar mês..." value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                      </th>
                      <th className="p-2">
                        <input type="text" placeholder="Filtrar categoria..." value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                      </th>
                      <th className="p-2">
                        <input type="text" placeholder="Filtrar sub..." value={filtroSubcategoria} onChange={(e) => setFiltroSubcategoria(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                      </th>
                      <th className="p-2">
                        <input type="text" placeholder="Filtrar motivo..." value={filtroMotivo} onChange={(e) => setFiltroMotivo(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white" />
                      </th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltradosTabela.map((gasto, index) => (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="p-3">{gasto.mes}</td>
                        <td className="p-3">{gasto.categoria}</td>
                        <td className="p-3">{gasto.subcategoria}</td>
                        <td className="p-3">{gasto.motivo}</td>
                        <td className="p-3 font-semibold text-green-400">{gasto.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VISÃO 2: PAINEL DE GRÁFICOS COM META PLANEJADA */}
            {visao === 'graficos' && (
              <div className="space-y-8">
                {/* Seletor de Período */}
                <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                  <span className="font-medium text-gray-300">Filtrar Período dos Gráficos:</span>
                  <select 
                    value={filtroPeriodoGrafico} 
                    onChange={(e) => setFiltroPeriodoGrafico(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded p-2 text-white w-full md:w-64"
                  >
                    <option value="TODOS">📅 Ano Todo (Acumulado)</option>
                    {mesesOpcoes.map((m) => (
                      <option key={m} value={m}>🗓️ {m}</option>
                    ))}
                  </select>
                </div>

                {/* GRÁFICO 1: CATEGORIAS (REALIZADO x PLANEJADO) */}
                <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-lg font-bold text-center mb-2 text-green-400">
                    Gastos por Categoria: Realizado vs Planejado ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                  </h2>
                  <p className="text-xs text-center text-gray-400 mb-4">Compara os gastos lançados com as metas definidas em A5:B12</p>
                  
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoCategorias}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="categoria" stroke="#9CA3AF" interval={0} angle={-15} textAnchor="end" height={60} tick={{fontSize: 11}} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} 
                        />
                        <Legend />
                        {/* Barra verde para o Gasto Real */}
                        <Bar dataKey="Realizado" fill="#10B981" radius={[4, 4, 0, 0]} />
                        {/* Barra azul/cinza para a Meta Planejada */}
                        <Bar dataKey="Planejado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* GRÁFICO 2: SUB-CATEGORIAS */}
                <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-lg font-bold text-center mb-4 text-indigo-400">
                    Gastos por Sub-categoria ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                  </h2>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoSubcategorias}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="subcategoria" stroke="#9CA3AF" interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} 
                        />
                        <Legend />
                        <Bar dataKey="Total" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}