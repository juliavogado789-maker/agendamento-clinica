// Elementos do formulário
const form = document.getElementById("appointmentForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const message = document.getElementById("message");
const appointmentsList = document.getElementById("appointmentsList");

// Impede a escolha de datas anteriores ao dia atual
const hoje = new Date().toISOString().split("T")[0];

dateInput.min = hoje;
// Busca os horários disponíveis para a data escolhida
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;

  timeSelect.innerHTML = `
    <option value="">Carregando horários...</option>
  `;

  try {
    const response = await fetch(`/available?date=${date}`);
    const data = await response.json();

    timeSelect.innerHTML = `
      <option value="">Selecione um horário</option>
    `;

    if (!data.available) {
      message.textContent = data.reason;
      return;
    }

    data.horarios.forEach((horario) => {
      const option = document.createElement("option");

      option.value = horario;
      option.textContent = horario;

      timeSelect.appendChild(option);
    });

  } catch (error) {
    message.textContent = "Erro ao carregar os horários.";
  }
});

// Envia o formulário
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const patient_name = document.getElementById("patient_name").value;
  const date = dateInput.value;

  const time = timeSelect.value;

  try {
    const response = await fetch("/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        patient_name,
        date,
        time
      })
    });

    const data = await response.json();

    message.textContent = data.mensagem || data.erro;
    
    if (response.ok) {
  message.style.color = "green";
} else {
  message.style.color = "red";
}

    if (response.ok) {
      form.reset();
      carregarAgendamentos();
    }

  } catch (error) {
    message.textContent = "Erro ao realizar o agendamento.";
  }
});

// Carrega os agendamentos existentes
async function carregarAgendamentos() {
  try {
    const response = await fetch("/appointments");
    const agendamentos = await response.json();

    appointmentsList.innerHTML = "";

    agendamentos.forEach((agendamento) => {
      const item = document.createElement("li");

      item.textContent =
        `${agendamento.patient_name} - ` +
        `${agendamento.date} às ${agendamento.time}`;

      appointmentsList.appendChild(item);
    });

  } catch (error) {
    appointmentsList.innerHTML =
      "<li>Erro ao carregar os agendamentos.</li>";
  }
}

// Carrega a lista ao abrir a página
carregarAgendamentos();
