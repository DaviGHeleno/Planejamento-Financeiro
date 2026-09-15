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

// 1. LER INVESTIMENTOS (Dashboard Completo)
app.get('/api/investimentos/dashboard', async (req: Request, res: Response) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    // Busca a matriz de todos os meses/anos e as células específicas de totais
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [
        'Investimentos!A3:W14', // Histórico mensal de 2025 a 2029
        'Investimentos!B22',    // Total Davi
        'Investimentos!D22',    // Total Stella
        'Investimentos!B23'     // Total Juntos
      ],
    });
    
    const [mensal, totalDavi, totalStella, totalJuntos] = response.data.valueRanges || [];
    
    res.json({ 
      mensal: mensal.values || [], 
      totais: {
        davi: totalDavi.values?.[0]?.[0] || 'R$ 0,00',
        stella: totalStella.values?.[0]?.[0] || 'R$ 0,00',
        juntos: totalJuntos.values?.[0]?.[0] || 'R$ 0,00'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao ler dados de Investimentos.' });
  }
});

// 2. ESCREVER INVESTIMENTO (Divisão 70/30)
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
    res.json({ message: 'Investimento registrado!', valorFuturo, valorPessoal });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao registrar investimento.' });
  }
});

// 3. LER METAS MENSAIS (A5:B12) COM SUPORTE A ANOS DINÂMICOS
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

// 4. LER GASTOS DE UM RESPONSÁVEL POR ANO (A48:E)
app.get('/api/gastos/:responsavel/:ano', async (req: Request, res: Response) => {
  try {
    const { responsavel, ano } = req.params; // ex: Davi, 26 (ou 2026)
    const anoAbreviado = ano.length === 4 ? ano.slice(2) : ano; // converte 2026 para 26 se necessário
    const abaNome = `Mensal ${anoAbreviado} - ${responsavel}`; 

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    // Verifica se a aba existe antes de buscar para evitar erros 500 se a aba do ano não existir ainda
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

// 5. ESCREVER NOVO GASTO MENSAL COM CRIAÇÃO AUTOMÁTICA DE ABA
app.post('/api/gasto', async (req: Request, res: Response) => {
  try {
    const { aba, mes, categoria, subcategoria, motivo, valor } = req.body; 
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const abaExiste = spreadsheetInfo.data.sheets?.some(
      (s) => s.properties?.title === aba
    );

    if (!abaExiste) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: aba,
                },
              },
            },
          ],
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

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${aba}'!A48:E`, 
      valueInputOption: 'USER_ENTERED', 
      requestBody: {
        values: [[mes, categoria, subcategoria, motivo, valor]],
      },
    });

    res.json({ message: 'Gasto adicionado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao adicionar gasto.' });
  }
});

// 6. LER OBJETIVOS
app.get('/api/objetivos', async (req: Request, res: Response) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'OBJETIVOS!A1:C20', 
    });
    res.json({ data: response.data.values });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao ler Objetivos.' });
  }
});

// O app.listen fica obrigatoriamente no final de tudo
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});