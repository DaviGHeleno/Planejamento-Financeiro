import express, { Request, Response } from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const SPREADSHEET_ID = '1gzBwu9IF9ZO6kPRWMGYJYzvSqArhyxB9_Fqck9tdkcA';

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ============================================================================
// FUNÇÃO AUXILIAR: REGISTRO DE HISTÓRICO AUTOMÁTICO
// ============================================================================
async function registrarHistorico(acao: string, descricao: string, valor: string) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const abaExiste = spreadsheetInfo.data.sheets?.some((s) => s.properties?.title === 'HISTORICO');

    if (!abaExiste) {
      // Cria a aba HISTORICO se não existir
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: 'HISTORICO' } } }],
        },
      });

      // Adiciona o cabeçalho
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "'HISTORICO'!A1:E1",
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['DATA', 'HORA', 'AÇÃO', 'DESCRIÇÃO', 'VALOR']] },
      });
    }

    // Registra a nova linha no histórico
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "'HISTORICO'!A2:E",
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[dataFormatada, horaFormatada, acao, descricao, valor]],
      },
    });
  } catch (error) {
    console.error('Erro ao salvar no histórico:', error);
  }
}
// ============================================================================


// 1. LER INVESTIMENTOS (Dashboard Completo com Reserva de Emergência e Casamento)
app.get('/api/investimentos/dashboard', async (req: Request, res: Response) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        'Investimentos!A3:W14', 
        'Investimentos!B21',     
        'Investimentos!C21',     
        'Investimentos!D21',     
        'Investimentos!E21',     
        'Investimentos!B23',     
      ],
    });

    const valueRanges = response.data.valueRanges || [];

    const daviFuturoTotal = valueRanges[1]?.values?.[0]?.[0] || 'R$ 0,00';
    const daviPresente = valueRanges[2]?.values?.[0]?.[0] || 'R$ 0,00';
    const stellaFuturoTotal = valueRanges[3]?.values?.[0]?.[0] || 'R$ 0,00';
    const stellaPessoal = valueRanges[4]?.values?.[0]?.[0] || 'R$ 0,00';
    const totalJuntos = valueRanges[5]?.values?.[0]?.[0] || 'R$ 0,00';

    const calcularFracoes = (valStr: string) => {
      const num = parseFloat(valStr.toString().replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      const reserva = num * (1 / 3);
      const casamento = num * (2 / 3);
      return {
        reserva: reserva.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        casamento: casamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      };
    };

    const daviReserva = calcularFracoes(daviFuturoTotal).reserva;
    const daviCasamento = calcularFracoes(daviFuturoTotal).casamento;
    const stellaReserva = calcularFracoes(stellaFuturoTotal).reserva;
    const stellaCasamento = calcularFracoes(stellaFuturoTotal).casamento;

    res.json({
      historico: valueRanges[0]?.values || [],
      totais: {
        daviFuturo: daviFuturoTotal,
        daviReserva,
        daviCasamento,
        daviPresente,
        stellaFuturo: stellaFuturoTotal,
        stellaReserva,
        stellaCasamento,
        stellaPessoal,
        totalJuntos
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao ler dados de Investimentos.' });
  }
});

// 2. ESCREVER INVESTIMENTO (Divisão 70/30) + HISTÓRICO
app.post('/api/investimento', async (req: Request, res: Response) => {
  try {
    const { ano, mes, responsavel, valor } = req.body;
    const valorFuturo = valor * 0.70;
    const valorPessoal = valor * 0.30;

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const linhaMes = meses.indexOf(mes) + 3; 
    if (linhaMes < 3) return res.status(400).send({ error: 'Mês inválido' });

    let colFuturo = '';
    let colPessoal = '';

    if (ano === 2026) {
      if (responsavel === 'Davi') { colFuturo = 'H'; colPessoal = 'I'; }
      else if (responsavel === 'Stella') { colFuturo = 'J'; colPessoal = 'K'; }
    } else if (ano === 2025) {
      if (responsavel === 'Davi') { colFuturo = 'B'; colPessoal = 'C'; }
      else if (responsavel === 'Stella') { colFuturo = 'D'; colPessoal = 'E'; }
    } else if (ano === 2027) {
      if (responsavel === 'Davi') { colFuturo = 'L'; colPessoal = 'M'; }
      else if (responsavel === 'Stella') { colFuturo = 'N'; colPessoal = 'O'; }
    } else if (ano === 2028) {
      if (responsavel === 'Davi') { colFuturo = 'P'; colPessoal = 'Q'; }
      else if (responsavel === 'Stella') { colFuturo = 'R'; colPessoal = 'S'; }
    } else if (ano === 2029) {
      if (responsavel === 'Davi') { colFuturo = 'T'; colPessoal = 'U'; }
      else if (responsavel === 'Stella') { colFuturo = 'V'; colPessoal = 'W'; }
    }

    const rangeUpdate = `Investimentos!${colFuturo}${linhaMes}:${colPessoal}${linhaMes}`;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeUpdate,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[valorFuturo, valorPessoal]] },
    });

    // Registra a ação no Histórico
    await registrarHistorico(
      'INVESTIMENTO',
      `${responsavel} realizou aporte referente a ${mes}/${ano}`,
      `R$ ${valor.toFixed(2).replace('.', ',')} (Futuro: R$ ${valorFuturo.toFixed(2)} | Pessoal: R$ ${valorPessoal.toFixed(2)})`
    );

    res.json({ message: 'Investimento registrado!', valorFuturo, valorPessoal });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao registrar investimento.' });
  }
});

// 2.1. ESCREVER RESGATE DE INVESTIMENTO (Subtração) + HISTÓRICO
app.post('/api/resgate', async (req: Request, res: Response) => {
  try {
    const { ano, mes, responsavel, tipo, valor } = req.body; 
    const valorResgate = Number(valor);

    if (isNaN(valorResgate) || valorResgate <= 0) {
      return res.status(400).send({ error: 'Valor de resgate inválido.' });
    }

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const linhaMes = meses.indexOf(mes) + 3; 
    if (linhaMes < 3) return res.status(400).send({ error: 'Mês inválido' });

    const mapaColunas: Record<number, { Davi: { Futuro: string, Pessoal: string }, Stella: { Futuro: string, Pessoal: string } }> = {
      2025: { Davi: { Futuro: 'B', Pessoal: 'C' }, Stella: { Futuro: 'D', Pessoal: 'E' } },
      2026: { Davi: { Futuro: 'H', Pessoal: 'I' }, Stella: { Futuro: 'J', Pessoal: 'K' } },
      2027: { Davi: { Futuro: 'L', Pessoal: 'M' }, Stella: { Futuro: 'N', Pessoal: 'O' } },
      2028: { Davi: { Futuro: 'P', Pessoal: 'Q' }, Stella: { Futuro: 'R', Pessoal: 'S' } },
      2029: { Davi: { Futuro: 'T', Pessoal: 'U' }, Stella: { Futuro: 'V', Pessoal: 'W' } },
    };

    const configAno = mapaColunas[Number(ano)];
    if (!configAno) return res.status(400).send({ error: 'Ano inválido' });

    const colunaAlvo = configAno[responsavel as 'Davi' | 'Stella']?.[tipo as 'Futuro' | 'Pessoal'];
    if (!colunaAlvo) return res.status(400).send({ error: 'Parâmetros inválidos' });

    const celulaAlvo = `Investimentos!${colunaAlvo}${linhaMes}`;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const leitura = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: celulaAlvo,
    });

    const valorAtualStr = leitura.data.values?.[0]?.[0] || '0';
    const valorAtualNum = parseFloat(valorAtualStr.toString().replace(/[R$\s.]/g, '').replace(',', '.')) || 0;

    const novoValor = valorAtualNum - valorResgate;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: celulaAlvo,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[novoValor]] },
    });

    // Registra a ação no Histórico
    await registrarHistorico(
      'RESGATE',
      `${responsavel} resgatou do saldo de ${tipo} referente a ${mes}/${ano}`,
      `- R$ ${valorResgate.toFixed(2).replace('.', ',')}`
    );

    res.json({ message: 'Resgate registrado com sucesso!', novoValor });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao registrar resgate.' });
  }
});

// 3. LER METAS MENSAIS
app.get('/api/metas/:responsavel/:ano', async (req: Request, res: Response) => {
  try {
    const { responsavel, ano } = req.params;
    const anoAbreviado = ano.length === 4 ? ano.slice(2) : ano;
    const aba = `Mensal ${anoAbreviado} - ${responsavel}`;
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${aba}'!A5:B12`, 
    });
    res.json({ metas: response.data.values || [] });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao buscar metas.' });
  }
});

// 4. LER GASTOS
app.get('/api/gastos/:responsavel/:ano', async (req: Request, res: Response) => {
  try {
    const { responsavel, ano } = req.params; 
    const anoAbreviado = ano.length === 4 ? ano.slice(2) : ano; 
    const abaNome = `Mensal ${anoAbreviado} - ${responsavel}`; 

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const abaExiste = spreadsheetInfo.data.sheets?.some(
      (s) => s.properties?.title === abaNome
    );

    if (!abaExiste) {
      return res.json({ gastos: [] });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${abaNome}'!A48:E`,
    });

    const rows = response.data.values || [];
    
    const gastos = rows.map((row) => ({
      mes: row[0] || '',
      categoria: row[1] || '',
      subcategoria: row[2] || '',
      motivo: row[3] || '',
      valor: row[4] || '',
    }));

    res.json({ gastos });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao buscar gastos da planilha.' });
  }
});

// 5. ESCREVER GASTOS EM LOTE + HISTÓRICO
app.post('/api/gasto', async (req: Request, res: Response) => {
  try {
    const { aba, itens } = req.body; 

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).send({ error: 'Nenhum gasto enviado para salvar.' });
    }
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const abaExiste = spreadsheetInfo.data.sheets?.some((s) => s.properties?.title === aba);

    if (!abaExiste) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: aba } } }],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${aba}'!A47:E47`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['MES', 'CATEGORIA', 'SUB-CATEGORIA', 'MOTIVO', 'R$']],
        },
      });
    }

    const linhasParaInserir = itens.map((item: any) => [
      item.mes,
      item.categoria,
      item.subcategoria,
      item.motivo,
      item.valor
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${aba}'!A48:E`, 
      valueInputOption: 'USER_ENTERED', 
      requestBody: {
        values: linhasParaInserir,
      },
    });

    // Calcula o valor total do lote para o histórico
    const totalLote = itens.reduce((acc: number, item: any) => {
      const val = parseFloat(item.valor.replace(/\./g, '').replace(',', '.')) || 0;
      return acc + val;
    }, 0);

    // Registra a ação no Histórico
    await registrarHistorico(
      'GASTO (LOTE)',
      `Lançados ${itens.length} gasto(s) na aba "${aba}"`,
      `R$ ${totalLote.toFixed(2).replace('.', ',')}`
    );

    res.json({ message: `${itens.length} gasto(s) adicionado(s) com sucesso!` });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao adicionar gastos.' });
  }
});

// 6. LER OBJETIVOS (Bucket List / Lista de Sonhos)
app.get('/api/objetivos', async (req: Request, res: Response) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    // Lê as colunas A e B a partir da linha 2 (ignorando o título da A1:B1)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'OBJETIVOS!A2:B', 
    });

    res.json({ data: response.data.values || [] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao ler Objetivos.' });
  }
});
// 6.1. ATUALIZAR STATUS DO OBJETIVO (Marcar/Desmarcar)
app.post('/api/objetivos/toggle', async (req: Request, res: Response) => {
  try {
    const { index, concluido } = req.body;
    
    // Como lemos a partir da linha 2 (A2), o index 0 do array corresponde à linha 2 na planilha.
    const linhaSheets = Number(index) + 2; 
    const rangeUpdate = `OBJETIVOS!A${linhaSheets}`;
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeUpdate,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[concluido ? 'TRUE' : 'FALSE']] },
    });

    res.json({ message: 'Objetivo atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar objetivo:', error);
    res.status(500).send({ error: 'Erro ao atualizar objetivo.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});