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

// 1. LER INVESTIMENTOS
app.get('/api/investimentos', async (req: Request, res: Response) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Investimentos!G2:K14',
    });
    res.json({ data: response.data.values });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao ler Investimentos.' });
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

    // Mapeamento dinâmico de colunas baseado no Ano e Responsável
    let colFuturo = '';
    let colPessoal = '';

    if (ano === 2026) {
      if (responsavel === 'Davi') { colFuturo = 'H'; colPessoal = 'I'; }
      else if (responsavel === 'Stella') { colFuturo = 'J'; colPessoal = 'K'; }
    } else if (ano === 2025) {
      if (responsavel === 'Davi') { colFuturo = 'B'; colPessoal = 'C'; }
      else if (responsavel === 'Stella') { colFuturo = 'D'; colPessoal = 'E'; }
    } else if (ano === 2027) {
      // Defina aqui as colunas correspondentes ao ano de 2027 na sua planilha de Investimentos
      if (responsavel === 'Davi') { colFuturo = 'L'; colPessoal = 'M'; }
      else if (responsavel === 'Stella') { colFuturo = 'N'; colPessoal = 'O'; }
    } else if (ano === 2028) {
      // Defina aqui as colunas correspondentes ao ano de 2027 na sua planilha de Investimentos
      if (responsavel === 'Davi') { colFuturo = 'P'; colPessoal = 'Q'; }
      else if (responsavel === 'Stella') { colFuturo = 'R'; colPessoal = 'S'; }
    } else if (ano === 2029) {
      // Defina aqui as colunas correspondentes ao ano de 2027 na sua planilha de Investimentos
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

// 3. LER METAS MENSAIS (A5:B12)
app.get('/api/metas/:responsavel', async (req: Request, res: Response) => {
  try {
    const { responsavel } = req.params; // Davi ou Stella
    const aba = `Mensal 26 - ${responsavel}`;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${aba}'!A5:B12`, 
    });
    res.json({ metas: response.data.values });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao buscar metas.' });
  }
});

// 4. LER GASTOS (A48:E)
app.get('/api/gastos/:responsavel', async (req: Request, res: Response) => {
  try {
    const { responsavel } = req.params; // Davi ou Stella
    const aba = `Mensal 26 - ${responsavel}`;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${aba}'!A48:E`, 
    });
    res.json({ data: response.data.values });
  } catch (error) {
    res.status(500).send({ error: 'Erro ao ler Gastos.' });
  }
});

// 5. ESCREVER NOVO GASTO MENSAL COM CRIAÇÃO AUTOMÁTICA DE ABA
app.post('/api/gasto', async (req: Request, res: Response) => {
  try {
    const { aba, mes, categoria, subcategoria, motivo, valor } = req.body; 
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

    // 1. Verifica se a aba já existe na planilha
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const abaExiste = spreadsheetInfo.data.sheets?.some(
      (s) => s.properties?.title === aba
    );

    // 2. Se a aba não existir, cria ela automaticamente
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

      // Opcional: Adiciona o cabeçalho padrão na nova aba recém-criada
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${aba}'!A47:E47`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['MES', 'CATEGORIA', 'SUB-CATEGORIA', 'MOTIVO', 'R$']],
        },
      });
    }

    // 3. Adiciona o gasto na aba (a partir da linha 48)
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});