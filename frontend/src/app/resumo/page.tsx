'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Adicionamos as importações do PieChart e Pie do Recharts
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';

// Paleta de cores para as fatias da pizza
const CORES_PIZZA = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#A855F7'];

export default function ResumoPage() {
  const [responsavel, setResponsavel] = useState('Davi');
  const [ano, setAno] = useState('26');
  const [dadosGastos, setDadosGastos] = useState<any[]>([]);
  const [dadosMetas, setDadosMetas] = useState<any[]>([]);
  const [visao, setVisao] = useState<'tabela' | 'graficos'>('tabela');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [filtroPeriodoGrafico, setFiltroPeriodoGrafico] = useState('TODOS');

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

  const dadosFiltradosTabela = dadosGastos.filter((gasto) => {
    const matchMes = gasto.mes.toLowerCase().includes(filtroMes.toLowerCase());
    const matchCat = gasto.categoria.toLowerCase().includes(filtroCategoria.toLowerCase());
    const matchSub = gasto.subcategoria.toLowerCase().includes(filtroSubcategoria.toLowerCase());
    const matchMot = gasto.motivo.toLowerCase().includes(filtroMotivo.toLowerCase());
    return matchMes && matchCat && matchSub && matchMot;
  });

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

  const metasMap: { [key: string]: number } = {};
  dadosMetas.forEach((linha) => {
    if (linha[0]) {
      const nomeCat = normalizarCategoria(linha[0]);
      const valorMeta = parseValor(linha[1]);
      metasMap[nomeCat] = valorMeta;
    }
  });

  const dadosCatMap = dadosParaGraficos.reduce((acc: any, item: any) => {
    const catPadrao = normalizarCategoria(item.categoria || '');
    const val = parseValor(item.valor);
    if (!acc[catPadrao]) acc[catPadrao] = 0;
    acc[catPadrao] += val;
    return acc;
  }, {});

  const ordemCategorias = [
    'TRANSPORTE', 'ALIMENTAÇÃO', 'CUIDADOS PESSOAIS', 
    'ATIVIDADES FÍSICAS', 'EXTRAS/FUTILIDADES', 'LAZER', 'IMPREVISTOS'
  ];

  const fatorMultiplicador = filtroPeriodoGrafico === 'TODOS' ? 12 : 1;

  const dadosGraficoCategorias = ordemCategorias.map((cat) => ({
    categoria: cat,
    Realizado: Number((dadosCatMap[cat] || 0).toFixed(2)),
    Planejado: Number(((metasMap[cat] || 0) * fatorMultiplicador).toFixed(2)),
  }));

  const normalizarSubcategoria = (sub: string) => {
    const s = sub.trim().toLowerCase();
    if (s.includes('carro')) return 'Carro';
    if (s.includes('uber')) return 'Uber';
    if (s.includes('restaurante')) return 'Restaurante';
    if (s.includes('lanche')) return 'Lanche';
    if (s.includes('supermercado')) return 'Supermercado';
    if (s.includes('beleza')) return 'Beleza';
    if (s.includes('terapia')) return 'Terapia';
    if (s.includes('remedio') || s.includes('remédio')) return 'Remédio';
    if (s.includes('viagen') || s.includes('viagem')) return 'Viagens';
    if (s.includes('hobbie') || s.includes('hobbies')) return 'Hobbies';
    if (s.includes('evento')) return 'Eventos';
    if (s.includes('gym')) return 'Gym';
    if (s.includes('mimo')) return 'Mimos';
    if (s.includes('compra')) return 'Compras';
    if (s.includes('flock')) return 'Flock';
    if (s.includes('presente')) return 'Presentes';
    if (s.includes('whey')) return 'Whey';
    return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
  };

  const dadosSubMap = dadosParaGraficos.reduce((acc: any, item: any) => {
    const subPadrao = normalizarSubcategoria(item.subcategoria || '');
    const val = parseValor(item.valor);
    if (!acc[subPadrao]) acc[subPadrao] = 0;
    acc[subPadrao] += val;
    return acc;
  }, {});

  const ordemSubcategorias = [
    'Carro', 'Uber', 'Restaurante', 'Lanche', 'Supermercado', 
    'Beleza', 'Terapia', 'Remédio', 'Viagens', 'Hobbies', 
    'Eventos', 'Gym', 'Mimos', 'Compras', 'Flock', 'Presentes', 'Whey'
  ];

  const dadosGraficoSubcategorias = ordemSubcategorias.map((sub) => ({
    subcategoria: sub,
    Total: Number((dadosSubMap[sub] || 0).toFixed(2)),
  }));

  // === NOVO: PREPARAÇÃO DOS DADOS PARA OS GRÁFICOS DE PIZZA ===
  const dadosPizzasPorCategoria = ordemCategorias.map((cat) => {
    // 1. Pega apenas os gastos dessa categoria específica
    const gastosDaCategoria = dadosParaGraficos.filter(
      (gasto) => normalizarCategoria(gasto.categoria || '') === cat
    );

    // 2. Agrupa esses gastos por subcategoria
    const subMapDaCategoria = gastosDaCategoria.reduce((acc: any, item: any) => {
      const sub = normalizarSubcategoria(item.subcategoria || 'Outros');
      const val = parseValor(item.valor);
      if (!acc[sub]) acc[sub] = 0;
      acc[sub] += val;
      return acc;
    }, {});

    // 3. Converte para o formato de array esperado pelo PieChart
    const dataPizza = Object.keys(subMapDaCategoria)
      .map((sub) => ({
        name: sub,
        value: Number(subMapDaCategoria[sub].toFixed(2)),
      }))
      .filter((item) => item.value > 0); // Remove o que for zero

    // 4. Calcula o total gasto na categoria
    const totalDaCategoria = dataPizza.reduce((sum, item) => sum + item.value, 0);

    return {
      categoria: cat,
      total: totalDaCategoria,
      dados: dataPizza,
    };
  }).filter(pizza => pizza.total > 0); // Exibe apenas pizzas que têm algum gasto no período

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="mb-4">
          <Link href="/" className="text-sm text-purple-400 hover:underline">← Voltar para o Menu</Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-400">Consulta de Gastos e Relatórios</h1>

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

            {visao === 'graficos' && (
              <div className="space-y-8">
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
                        <defs>
                          <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="50%" stopColor="#10B981" />
                            <stop offset="50%" stopColor="#EF4444" />
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="categoria" stroke="#9CA3AF" interval={0} angle={-15} textAnchor="end" height={60} tick={{fontSize: 11}} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} 
                        />
                        <Legend />
                        
                        <Bar dataKey="Realizado" fill="url(#splitColor)" radius={[4, 4, 0, 0]}>
                          {dadosGraficoCategorias.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.Realizado > entry.Planejado ? '#EF4444' : '#10B981'} 
                            />
                          ))}
                        </Bar>

                        <Bar dataKey="Planejado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* GRÁFICO 2: SUB-CATEGORIAS TOTAL */}
                <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-lg font-bold text-center mb-4 text-indigo-400">
                    Gastos Totais por Sub-categoria ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                  </h2>
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoSubcategorias}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="subcategoria" stroke="#9CA3AF" interval={0} angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} 
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar dataKey="Total" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* GRÁFICO 3: PIZZAS DETALHADAS POR CATEGORIA */}
                {dadosPizzasPorCategoria.length > 0 && (
                  <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-bold text-center mb-2 text-pink-400">
                      Distribuição Interna das Categorias ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                    </h2>
                    <p className="text-xs text-center text-gray-400 mb-8">Como o valor de cada categoria foi dividido entre suas sub-categorias</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dadosPizzasPorCategoria.map((pizza, index) => (
                        <div key={index} className="bg-gray-800/80 p-4 rounded-xl border border-gray-600 flex flex-col items-center">
                          <h3 className="text-md font-bold text-gray-200 mb-1">{pizza.categoria}</h3>
                          <p className="text-sm font-semibold text-green-400 mb-2">
                            Total: R$ {pizza.total.toFixed(2).replace('.', ',')}
                          </p>
                          
                          <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pizza.dados}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={70}
                                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {pizza.dados.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={CORES_PIZZA[idx % CORES_PIZZA.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}