'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';

const CORES_PIZZA = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C', '#818CF8', '#C084FC'];

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

  const categoriaOpcoes = ['Alimentação', 'Atividade Física', 'Cuidado Pessoal', 'Extras', 'Futilidades', 'Imprevisto', 'Lazer', 'Transporte', 'CARRO NOVO', 'EUROTRIP'];
  const subcategoriaOpcoes = ['carro', 'uber', 'restaurante', 'lanche', 'supermercado', 'beleza', 'terapia', 'remedio', 'passeios', 'hobbies', 'eventos', 'gym', 'esportes', 'mimos', 'compras', 'flock', 'presentes', 'whey'];
  const motivoOpcoes = ['AMIGOS', 'ONE', 'FAMILIA', 'GASOLINA', 'CONSERTO', 'PESSOAL', 'DAVI', 'PRESENTE'];

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
    const limpo = val.toString().replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  };

  const dadosFiltradosTabela = dadosGastos.filter((gasto) => {
    const matchMes = !filtroMes || gasto.mes.trim().toUpperCase() === filtroMes.toUpperCase();
    const matchCat = !filtroCategoria || gasto.categoria.trim().toLowerCase() === filtroCategoria.toLowerCase();
    const matchSub = !filtroSubcategoria || gasto.subcategoria.trim().toLowerCase() === filtroSubcategoria.toLowerCase();
    const matchMot = !filtroMotivo || gasto.motivo.trim().toUpperCase() === filtroMotivo.toUpperCase();
    return matchMes && matchCat && matchSub && matchMot;
  });

  const valorTotalFiltrado = dadosFiltradosTabela.reduce((acc, gasto) => {
    return acc + parseValor(gasto.valor);
  }, 0);

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

  const dadosPizzasPorCategoria = ordemCategorias.map((cat) => {
    const gastosDaCategoria = dadosParaGraficos.filter(
      (gasto) => normalizarCategoria(gasto.categoria || '') === cat
    );

    const subMapDaCategoria = gastosDaCategoria.reduce((acc: any, item: any) => {
      const sub = normalizarSubcategoria(item.subcategoria || 'Outros');
      const val = parseValor(item.valor);
      if (!acc[sub]) acc[sub] = 0;
      acc[sub] += val;
      return acc;
    }, {});

    const dataPizza = Object.keys(subMapDaCategoria)
      .map((sub) => ({
        name: sub,
        value: Number(subMapDaCategoria[sub].toFixed(2)),
      }))
      .filter((item) => item.value > 0);

    const totalDaCategoria = dataPizza.reduce((sum, item) => sum + item.value, 0);

    return {
      categoria: cat,
      total: totalDaCategoria,
      dados: dataPizza,
    };
  }).filter(pizza => pizza.total > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700/50">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
            ← Voltar para o Menu
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-8 text-center text-blue-400 tracking-wide">
          Consulta de Gastos e Relatórios
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8 bg-gray-900/40 p-5 rounded-xl border border-gray-700/50 shadow-inner">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Responsável</label>
            <select 
              value={responsavel} 
              onChange={(e) => setResponsavel(e.target.value)} 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            >
              <option value="Davi">Davi</option>
              <option value="Stella">Stella</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Ano</label>
            <select 
              value={ano} 
              onChange={(e) => setAno(e.target.value)} 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            >
              {anosOpcoes.map((a) => (
                <option key={a} value={a}>20{a}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={carregarDados}
            disabled={carregando}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 h-11 disabled:opacity-50"
          >
            {carregando ? 'Carregando...' : 'Carregar Dados do Ano'}
          </button>
        </div>

        {mensagem && (
          <div className="mb-6 p-4 rounded-xl text-center font-medium text-sm bg-yellow-900/20 border border-yellow-500/30 text-yellow-400">
            {mensagem}
          </div>
        )}

        {dadosGastos.length > 0 && (
          <>
            <div className="flex justify-center gap-3 mb-8">
              <button 
                onClick={() => setVisao('tabela')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${visao === 'tabela' ? 'bg-blue-500 text-white shadow-blue-900/20' : 'bg-gray-700/60 hover:bg-gray-700 text-gray-300'}`}
              >
                📋 Tabela de Gastos
              </button>
              <button 
                onClick={() => setVisao('graficos')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${visao === 'graficos' ? 'bg-blue-500 text-white shadow-blue-900/20' : 'bg-gray-700/60 hover:bg-gray-700 text-gray-300'}`}
              >
                📊 Painel de Gráficos & Planejado
              </button>
            </div>

            {visao === 'tabela' && (
              <div className="overflow-x-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                 N° de registro(s): {dadosFiltradosTabela.length}.
                </p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700/80 text-blue-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">Mês</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Sub-categoria</th>
                      <th className="p-3">Motivo</th>
                      <th className="p-3">Valor (R$)</th>
                    </tr>
                    <tr className="bg-gray-900/50 border-b border-gray-700/80">
                      <th className="p-2">
                        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500">
                          <option value="">Todos os Meses</option>
                          {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </th>
                      <th className="p-2">
                        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500">
                          <option value="">Todas as Categorias</option>
                          {categoriaOpcoes.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </th>
                      <th className="p-2">
                        <select value={filtroSubcategoria} onChange={(e) => setFiltroSubcategoria(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500">
                          <option value="">Todas as Sub-categorias</option>
                          {subcategoriaOpcoes.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </th>
                      <th className="p-2">
                        <select value={filtroMotivo} onChange={(e) => setFiltroMotivo(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500">
                          <option value="">Todos os Motivos</option>
                          {motivoOpcoes.map((mo) => <option key={mo} value={mo}>{mo}</option>)}
                        </select>
                      </th>
                      
                      <th className="p-2 text-left">
                        <span className="bg-blue-900/30 border border-blue-500/40 text-blue-300 font-bold px-3 py-1.5 rounded-lg text-xs inline-block w-full text-center shadow-sm">
                          Total: {valorTotalFiltrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltradosTabela.map((gasto, index) => (
                      <tr key={index} className="border-b border-gray-700/40 hover:bg-gray-700/20 transition-colors">
                        <td className="p-3 text-sm text-gray-300">{gasto.mes}</td>
                        <td className="p-3 text-sm text-gray-300">{gasto.categoria}</td>
                        <td className="p-3 text-sm text-gray-300">{gasto.subcategoria}</td>
                        <td className="p-3 text-sm text-gray-300">{gasto.motivo}</td>
                        <td className="p-3 text-sm font-semibold text-red-300">{gasto.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {visao === 'graficos' && (
              <div className="space-y-8">
                <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filtrar Período dos Gráficos:</span>
                  <select 
                    value={filtroPeriodoGrafico} 
                    onChange={(e) => setFiltroPeriodoGrafico(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-gray-200 text-sm outline-none focus:border-blue-500 w-full md:w-64"
                  >
                    <option value="TODOS">📅 Ano Todo (Acumulado)</option>
                    {mesesOpcoes.map((m) => (
                      <option key={m} value={m}>🗓️ {m}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-900/30 p-6 md:p-8 rounded-2xl border border-gray-700/50">
                  <h2 className="text-lg font-bold text-center mb-2 text-gray-200 tracking-wide">
                    Gastos por Categoria: Realizado vs Planejado ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                  </h2>
                  <p className="text-xs text-center text-gray-400 mb-6">Compara os gastos lançados com as metas definidas</p>
                  
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoCategorias}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="categoria" stroke="#9CA3AF" interval={0} angle={-15} textAnchor="end" height={60} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF', borderRadius: '0.5rem' }} 
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        
                        <Bar dataKey="Realizado" fill="#10B981" radius={[4, 4, 0, 0]}>
                          {dadosGraficoCategorias.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.Realizado > entry.Planejado ? '#EF4444' : '#10B981'} 
                            />
                          ))}
                        </Bar>

                        <Bar dataKey="Planejado" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-900/30 p-6 md:p-8 rounded-2xl border border-gray-700/50">
                  <h2 className="text-lg font-bold text-center mb-6 text-gray-200 tracking-wide">
                    Gastos Totais por Sub-categoria ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                  </h2>
                  <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosGraficoSubcategorias}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="subcategoria" stroke="#9CA3AF" interval={0} angle={-45} textAnchor="end" height={80} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF', borderRadius: '0.5rem' }} 
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Total" fill="#818CF8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {dadosPizzasPorCategoria.length > 0 && (
                  <div className="bg-gray-900/30 p-6 md:p-8 rounded-2xl border border-gray-700/50">
                    <h2 className="text-lg font-bold text-center mb-2 text-gray-200 tracking-wide">
                      Distribuição Interna das Categorias ({filtroPeriodoGrafico === 'TODOS' ? 'Ano Todo' : filtroPeriodoGrafico})
                    </h2>
                    <p className="text-xs text-center text-gray-400 mb-8">Valor de cada categoria dividido entre suas sub-categorias</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dadosPizzasPorCategoria.map((pizza, index) => (
                        <div key={index} className="bg-gray-800/60 p-5 rounded-2xl border border-gray-700/50 flex flex-col items-center shadow-md">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-1">{pizza.categoria}</h3>
                          <p className="text-sm font-semibold text-emerald-400 mb-4">
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
                                  outerRadius={75}
                                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {pizza.dados.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={CORES_PIZZA[idx % CORES_PIZZA.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name]}
                                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF', borderRadius: '0.5rem' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }}/>
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