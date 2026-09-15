'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function InvestimentosPage() {
  const [isAdicionando, setIsAdicionando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [totais, setTotais] = useState({ davi: 'R$ 0,00', stella: 'R$ 0,00', juntos: 'R$ 0,00' });

  const [invAno, setInvAno] = useState(2026);
  const [invMes, setInvMes] = useState('MARÇO');
  const [invResponsavel, setInvResponsavel] = useState('Davi');
  const [invValor, setInvValor] = useState('');
  const [invMensagem, setInvMensagem] = useState('');

  const mesesOpcoes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  // Função CORRIGIDA para tratar valores negativos e espaços
  const parseValor = (val: string | undefined) => {
    if (!val) return 0;
    // Remove "R$", remove todos os espaços, remove os pontos de milhar, e troca vírgula por ponto
    const limpo = val.toString().replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  };

  const carregarDashboard = async () => {
    setCarregando(true);
    try {
      const res = await fetch('http://localhost:3000/api/investimentos/dashboard');
      const data = await res.json();
      
      if (res.ok) {
        setTotais(data.totais);
        
        const linhas = data.mensal;
        
        // Mapeamento EXATO das colunas indicadas:
        const anosMap: Record<number, { d: number[], s: number[] }> = {
          2025: { d: [1, 2], s: [3, 4] },    // B,C e D,E
          2026: { d: [7, 8], s: [9, 10] },   // H,I e J,K
          2027: { d: [11, 12], s: [13, 14] },// L,M e N,O
          2028: { d: [15, 16], s: [17, 18] },// P,Q e R,S
          2029: { d: [19, 20], s: [21, 22] } // T,U e V,W
        };
        
        const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        let historico: any[] = [];
        
        let accDaviFuturo = 0;
        let accDaviPessoal = 0;
        let accStellaFuturo = 0;
        let accStellaPessoal = 0;
        
        for (let ano = 2025; ano <= 2029; ano++) {
          for (let m = 0; m < 12; m++) {
            const row = linhas[m] || [];
            const indices = anosMap[ano];
            
            // Pega o valor exato da tabela, aceitando números negativos
            const daviFuturoMes = parseValor(row[indices.d[0]]);
            const daviPessoalMes = parseValor(row[indices.d[1]]);
            const stellaFuturoMes = parseValor(row[indices.s[0]]);
            const stellaPessoalMes = parseValor(row[indices.s[1]]);
            
            // Verifica se as células têm algum conteúdo (mesmo que seja negativo)
            const textoLinha = `${row[indices.d[0]] || ''}${row[indices.d[1]] || ''}${row[indices.s[0]] || ''}${row[indices.s[1]] || ''}`;
            const temConteudo = textoLinha.trim() !== '';
            
            // Soma mês a mês para montar a linha de evolução (se for negativo, ele subtrai automaticamente)
            accDaviFuturo += daviFuturoMes;
            accDaviPessoal += daviPessoalMes;
            accStellaFuturo += stellaFuturoMes;
            accStellaPessoal += stellaPessoalMes;
            
            historico.push({
              periodo: `${mesesAbrev[m]}/${ano.toString().slice(2)}`,
              DaviFuturo: Number(accDaviFuturo.toFixed(2)),
              DaviPessoal: Number(accDaviPessoal.toFixed(2)),
              DaviTotal: Number((accDaviFuturo + accDaviPessoal).toFixed(2)),
              StellaFuturo: Number(accStellaFuturo.toFixed(2)),
              StellaPessoal: Number(accStellaPessoal.toFixed(2)),
              StellaTotal: Number((accStellaFuturo + accStellaPessoal).toFixed(2)),
              JuntosFuturo: Number((accDaviFuturo + accStellaFuturo).toFixed(2)),
              JuntosPessoal: Number((accDaviPessoal + accStellaPessoal).toFixed(2)),
              TotalConjunto: Number((accDaviFuturo + accDaviPessoal + accStellaFuturo + accStellaPessoal).toFixed(2)),
              teveAporte: temConteudo
            });
          }
        }
        
        // Remove os meses futuros em branco
        while(historico.length > 0 && !historico[historico.length - 1].teveAporte) {
          historico.pop();
        }
        
        setDadosGrafico(historico);
      }
    } catch (error) {
      console.error('Erro de conexão com o back-end.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  const handleInvestimentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMensagem('Enviando investimento...');
    const mesFormatado = invMes.charAt(0) + invMes.slice(1).toLowerCase();

    try {
      const response = await fetch('http://localhost:3000/api/investimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano: Number(invAno), mes: mesFormatado, responsavel: invResponsavel, valor: Number(invValor) }),
      });

      const data = await response.json();
      if (response.ok) {
        setInvMensagem(`Investimento registrado! Futuro: R$ ${data.valorFuturo.toFixed(2)} | Pessoal: R$ ${data.valorPessoal.toFixed(2)}`);
        setInvValor('');
        carregarDashboard();
      } else {
        setInvMensagem(`Erro: ${data.error || 'Erro ao salvar'}`);
      }
    } catch {
      setInvMensagem('Erro de conexão com o back-end.');
    }
  };

  const tooltipFormatter = (value: any, name: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, name];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <Link href="/" className="text-sm text-green-400 hover:underline mb-4 md:mb-0">← Voltar para o Menu</Link>
          <h1 className="text-2xl font-bold text-green-400">Dashboard de Evolução de Investimentos</h1>
          <button 
            onClick={() => setIsAdicionando(!isAdicionando)}
            className={`px-4 py-2 rounded font-bold transition duration-200 ${isAdicionando ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white`}
          >
            {isAdicionando ? '✖ Cancelar' : '➕ ADICIONAR INVESTIMENTO'}
          </button>
        </div>

        {/* Formulário */}
        {isAdicionando && (
          <div className="mb-10 bg-gray-700/30 p-6 rounded-xl border border-gray-600 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center text-green-400">Registrar Novo Aporte (70/30)</h2>
            <form onSubmit={handleInvestimentoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Responsável</label>
                  <select value={invResponsavel} onChange={(e) => setInvResponsavel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                    <option value="Davi">Davi</option>
                    <option value="Stella">Stella</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ano</label>
                  <input type="number" value={invAno} onChange={(e) => setInvAno(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mês</label>
                <select value={invMes} onChange={(e) => setInvMes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                  {mesesOpcoes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Total a Investir (R$)</label>
                <input type="number" step="0.01" placeholder="Ex: 1000" value={invValor} onChange={(e) => setInvValor(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" required />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition duration-200 mt-4">
                Salvar Investimento
              </button>
            </form>
            {invMensagem && <p className="mt-4 text-center font-semibold text-sm text-green-300">{invMensagem}</p>}
          </div>
        )}

        {/* Cards de Totais */}
        {!carregando && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 text-center shadow-md">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Davi</h3>
              <p className="text-2xl font-bold text-blue-400">{totais.davi}</p>
            </div>
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 text-center shadow-md">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Stella</h3>
              <p className="text-2xl font-bold text-purple-400">{totais.stella}</p>
            </div>
            <div className="bg-gray-700/50 p-6 rounded-xl border border-green-600 text-center shadow-md">
              <h3 className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Valor Total Juntos</h3>
              <p className="text-3xl font-bold text-white">{totais.juntos}</p>
            </div>
          </div>
        )}

        {carregando ? (
          <p className="text-center text-gray-400">Carregando evolução patrimonial...</p>
        ) : (
          <div className="space-y-10">
            {/* Gráfico Davi */}
            <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
              <h2 className="text-lg font-bold text-center mb-4 text-blue-400">Evolução do Patrimônio - Davi</h2>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="periodo" stroke="#9CA3AF" tick={{fontSize: 12}} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} />
                    <Legend />
                    <Line type="monotone" dataKey="DaviFuturo" name="Futuro (Coluna B, H...)" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="DaviPessoal" name="Pessoal/Presente (Coluna C, I...)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="DaviTotal" name="Total Davi" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Stella */}
            <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
              <h2 className="text-lg font-bold text-center mb-4 text-purple-400">Evolução do Patrimônio - Stella</h2>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="periodo" stroke="#9CA3AF" tick={{fontSize: 12}} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} />
                    <Legend />
                    <Line type="monotone" dataKey="StellaFuturo" name="Futuro (Coluna D, J...)" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="StellaPessoal" name="Pessoal (Coluna E, K...)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="StellaTotal" name="Total Stella" stroke="#A855F7" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Juntos */}
            <div className="bg-gray-700/20 p-6 rounded-xl border border-gray-700">
              <h2 className="text-lg font-bold text-center mb-4 text-white">Evolução Acumulada - Juntos</h2>
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="periodo" stroke="#9CA3AF" tick={{fontSize: 12}} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} />
                    <Legend />
                    <Line type="monotone" dataKey="TotalConjunto" name="Patrimônio Total do Casal" stroke="#FFFFFF" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="JuntosFuturo" name="Total Futuro Conjunto" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="JuntosPessoal" name="Total Pessoal Conjunto" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}