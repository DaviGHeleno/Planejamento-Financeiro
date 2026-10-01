'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReceiptText, ChartColumn, TrendingUp, Target } from 'lucide-react';

const ITENS = [
  { href: '/investimentos', rotulo: 'Investimentos', curto: 'Invest.', Icone: TrendingUp, cor: 'text-emerald-400' },
  { href: '/gastos', rotulo: 'Lançar Gastos', curto: 'Lançar', Icone: ReceiptText, cor: 'text-amber-300' },
  { href: '/resumo', rotulo: 'Consulta e Relatórios', curto: 'Consulta', Icone: ChartColumn, cor: 'text-purple-400' },
  { href: '/objetivos', rotulo: 'Objetivos do Casal', curto: 'Objetivos', Icone: Target, cor: 'text-rose-400' },
];

export default function Navegacao() {
  const caminho = usePathname();
  const ativo = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  return (
    <>
      {/* DESKTOP: barra lateral fixa */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-72 bg-gray-800 border-r border-gray-700/50 p-3 z-40">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-blue-400 tracking-wide leading-tight">
            Planejamento<br />Financeiro
          </h1>
          <p className="text-[11px] text-gray-500 mt-1">Davi &amp; Stella</p>
        </div>

        <nav className="flex flex-col gap-2">
          {ITENS.map(({ href, rotulo, Icone, cor }) => {
            const selecionado = ativo(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  selecionado
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                    : 'bg-transparent border-transparent text-gray-300 hover:bg-gray-700/50 hover:border-gray-600'
                }`}
              >
                <Icone className={`w-5 h-5 flex-shrink-0 ${selecionado ? 'text-blue-300' : cor}`} />
                <span className="truncate">{rotulo}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* CELULAR: barra de ícones fixa no rodapé */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-gray-800 border-t border-gray-700/50 flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {ITENS.map(({ href, curto, Icone, cor }) => {
          const selecionado = ativo(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                selecionado ? 'text-blue-300' : 'text-gray-400'
              }`}
            >
              <Icone className={`w-5 h-5 ${selecionado ? 'text-blue-300' : cor}`} />
              <span className="text-[10px] font-semibold">{curto}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}