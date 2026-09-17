
const express = require("express");
const cors = require("cors");
const path = require("path");
// Importa o banco de dados
const db = require("./database");

const app = express();

app.use(express.json());
app.use(cors());
// Permite abrir os arquivos do frontend
app.use(express.static(path.join(__dirname, "frontend")));
// Abre a página principal do sistema
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});
// Horários de funcionamento da clínica
const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00"
];

// API obrigatória de feriados
async function buscarFeriados(ano) {
  const resposta = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${ano}/BR`
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar os feriados.");
  }

  return await resposta.json();
}

// Verifica se a data é válida
function dataValida(data) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data);
}

// Rota inicial
app.get("/", (req, res) => {
  res.json({
    mensagem: "Sistema de agendamento funcionando!"
  });
});

// Rota de horários disponíveis
app.get("/available", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !dataValida(date)) {
      return res.status(400).json({
        erro: "Informe uma data válida no formato YYYY-MM-DD."
      });
    }

    const data = new Date(`${date}T12:00:00`);

    // 0 = domingo, 6 = sábado
    const diaSemana = data.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
      return res.json({
        date,
        available: false,
        reason: "Não há atendimento aos finais de semana.",
        horarios: []
      });
    }

    // Consulta a API real de feriados
    const feriados = await buscarFeriados(data.getFullYear());

    const feriado = feriados.find(
      (item) => item.date === date
    );

    if (feriado) {
      return res.json({
        date,
        available: false,
        reason: `Feriado: ${feriado.localName}`,
        horarios: []
      });
    }

    // Busca os horários já ocupados
    const ocupados = db.prepare(`
      SELECT time
      FROM appointments
      WHERE date = ?
    `).all(date);

    const horariosOcupados = ocupados.map(
      (item) => item.time
    );

    // Filtra os horários livres
    const horariosDisponiveis = HORARIOS.filter(
      (horario) => !horariosOcupados.includes(horario)
    );

    res.json({
      date,
      available: true,
      horarios: horariosDisponiveis
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao consultar os horários."
    });
  }
});

// Criar agendamento
app.post("/appointments", (req, res) => {
  try {
    const { patient_name, date, time } = req.body;

    if (!patient_name || !date || !time) {
      return res.status(400).json({
        erro: "Nome, data e horário são obrigatórios."
      });
    }
    // Verifica se a data possui o formato correto
if (!dataValida(date)) {
  return res.status(400).json({
    erro: "Informe uma data válida no formato YYYY-MM-DD."
  });
}

    if (!HORARIOS.includes(time)) {
      return res.status(400).json({
        erro: "Horário inválido."
      });
    }

    const agendamentoExistente = db.prepare(`
      SELECT *
      FROM appointments
      WHERE date = ? AND time = ?
    `).get(date, time);

    if (agendamentoExistente) {
      return res.status(409).json({
        erro: "Esse horário já está ocupado."
      });
    }

    const resultado = db.prepare(`
      INSERT INTO appointments (patient_name, date, time)
      VALUES (?, ?, ?)
    `).run(patient_name, date, time);

    res.status(201).json({
      mensagem: "Agendamento criado com sucesso!",
      id: resultado.lastInsertRowid,
      patient_name,
      date,
      time
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao criar agendamento."
    });
  }
});

// Listar agendamentos
app.get("/appointments", (req, res) => {
  const agendamentos = db.prepare(`
    SELECT *
    FROM appointments
    ORDER BY date, time
  `).all();

  res.json(agendamentos);
});

// Inicia o servidor
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});