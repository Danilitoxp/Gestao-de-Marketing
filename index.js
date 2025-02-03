import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDdRfbb1z3uAmkQRwK0xLO0i7ouR-yaxEA",
  authDomain: "marketing-464cc.firebaseapp.com",
  projectId: "marketing-464cc",
  storageBucket: "marketing-464cc.firebasestorage.app",
  messagingSenderId: "644925828873",
  appId: "1:644925828873:web:c136cad9daf6f66f942dd8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Funções Firebase

async function addEventToFirestore(date, title, description, type) {
  try {
    const { icon, color } = eventTypes[type] || { icon: "event", color: "#000000" };

    const docRef = await addDoc(collection(db, "events"), {
      date,
      title,
      description,
      type,
      color // Salva a cor no Firestore
    });

    console.log("Evento adicionado ao Firestore com ID:", docRef.id);
  } catch (error) {
    console.error("Erro ao adicionar evento ao Firestore:", error);
  }
}


async function deleteEventFromFirestore(eventId) {
  try {
    await deleteDoc(doc(db, "events", eventId));
    console.log("Evento excluído com sucesso:", eventId);
  } catch (error) {
    console.error("Erro ao excluir evento do Firestore:", error);
  }
}


async function loadEventsFromFirestore() {
  try {
    // Limpar os eventos previamente carregados
    Object.keys(events).forEach(key => delete events[key]);

    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((doc) => {
      const eventData = doc.data();
      const { date, title, description, type } = eventData;

      if (!events[date]) events[date] = [];
      const { icon, color } = eventTypes[type] || {};
      events[date].push({
        id: doc.id,
        title,
        description,
        type,
        icon: icon || "event",
        color: color || "#000000",
      });
    });

    generateCalendar(currentMonth, currentYear);
  } catch (error) {
    console.error("Erro ao carregar eventos do Firestore:", error);
  }
}


// Objeto para armazenar os eventos
const events = {};

const eventTypes = {
  meeting: { icon: "groups", color: "#007bff" }, // Azul
  recording: { icon: "videocam", color: "#6f42c1" }, // Roxo
  event: { icon: "event", color: "#dc3545" }, // Vermelho
  training: { icon: "school", color: "#28a745" }, // Verde
  birthday: { icon: "cake", color: "#ffc107" }, // Amarelo
  special_day: { icon: "star", color: "#17a2b8" }, // Ciano
};


// Variáveis globais para o mês e ano atualmente exibidos
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Inicialização do DOM
document.addEventListener("DOMContentLoaded", async () => {
  await loadEventsFromFirestore(); // Carrega os eventos antes de gerar o calendário
  initializeCalendar();

  // Adiciona event listeners de forma segura
  const leftButton = document.getElementById("esquerta");
  const rightButton = document.getElementById("direita");

  leftButton.removeEventListener("click", () => changeMonth(-1));
  rightButton.removeEventListener("click", () => changeMonth(1));

  leftButton.addEventListener("click", () => changeMonth(-1));
  rightButton.addEventListener("click", () => changeMonth(1));
});

function changeMonth(direction) {
  // Ajusta o mês atual
  currentMonth += direction;

  // Corrige valores fora do intervalo 0-11
  if (currentMonth < 0) {
    currentMonth = 11; // Dezembro
    currentYear -= 1;  // Reduz o ano
  } else if (currentMonth > 11) {
    currentMonth = 0;  // Janeiro
    currentYear += 1;  // Incrementa o ano
  }

  console.log(`Mês atual: ${currentMonth}, Ano atual: ${currentYear}`);

  // Atualiza o texto do campo de data
  updateDateInput(currentMonth, currentYear);

  // Recarrega os eventos e rege o calendário
  loadEventsFromFirestore().then(() => {
    generateCalendar(currentMonth, currentYear);
  });
}

function updateDateInput(month, year) {
  const dateInput = document.getElementById("dashboard-date-range-1");
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  dateInput.value = `${monthNames[month]} ${year}`;
}

function initializeCalendar() {
  const dateInput = document.getElementById("dashboard-date-range-1");

  // Define o valor inicial do campo de data para o mês e ano atuais
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  updateDateInput(currentMonth, currentYear);

  flatpickr(dateInput, {
    locale: "pt",
    plugins: [
      new monthSelectPlugin({
        shorthand: true,
        dateFormat: "F Y",
        altFormat: "F Y",
      }),
    ],
    onChange: async (selectedDates) => {
      if (selectedDates.length > 0) {
        const selectedDate = selectedDates[0];
        currentMonth = selectedDate.getMonth(); // Atualiza o mês atual
        currentYear = selectedDate.getFullYear(); // Atualiza o ano atual

        await loadEventsFromFirestore(); // Recarrega eventos do Firestore
        generateCalendar(currentMonth, currentYear); // Regera o calendário
      }
    },
  });

  generateCalendar(currentMonth, currentYear);
}

function generateCalendar(month, year) {
  const calendarTable = document.querySelector("#calendario-section table");
  calendarTable.innerHTML = "";

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  diasDaSemana.forEach((dia) => {
    const th = document.createElement("th");
    th.textContent = dia;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  calendarTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let day = 1;

  const today = new Date();

  for (let i = 0; i < 6; i++) {
    const row = document.createElement("tr");

    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");

      if (i === 0 && j < firstDay) {
        cell.textContent = "";
      } else if (day > daysInMonth) {
        cell.textContent = "";
      } else {
        const currentDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayText = document.createElement("span");
        dayText.textContent = day;
        cell.appendChild(dayText);

        const eventList = document.createElement("ul");
        eventList.classList.add("event-list");

        // Verificar se há eventos na data atual
        if (events[currentDate]) {
          events[currentDate].forEach((event, index) => {
            const listItem = document.createElement("li");
            listItem.style.backgroundColor = event.color; // Aplica cor do evento
        
            // Adicionar ícone e título ao item
            const icon = document.createElement("span");
            icon.className = "material-icons";
            icon.textContent = event.icon;
            icon.style.marginRight = "5px";
        
            listItem.appendChild(icon);
            listItem.appendChild(document.createTextNode(event.title));
        
            // **Impede que abrir evento acione o modal de adicionar evento**
            listItem.addEventListener("click", (e) => {
              e.stopPropagation(); // Bloqueia a propagação do clique no dia
              console.log("Editando evento:", event.title);
              openEditEventModal(currentDate, index);
            });

            eventList.appendChild(listItem);
          });
        }

        cell.appendChild(eventList);

        // Verificar se o dia é o dia atual
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
          cell.classList.add("current-day");
        }

        // Evento de clique no dia para adicionar evento (Somente se não clicar em um evento)
        cell.addEventListener("click", ((currentDay, currentMonth, currentYear) => (e) => {
          if (!e.target.classList.contains("event-list")) { // Verifica se não está clicando em um evento
            openAddEventModal(currentDay, currentMonth, currentYear);
          }
        })(day, month, year));

        day++;
      }

      row.appendChild(cell);
    }

    tbody.appendChild(row);

    if (day > daysInMonth) break;
  }

  calendarTable.appendChild(tbody);
}


document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth(); // Janeiro é 0!
  const year = today.getFullYear();

  document.querySelectorAll('#calendario-section table tbody td').forEach(td => {
    if (td.classList.contains("current-day")) {
      console.log("Dia atual destacado com classe 'current-day':", td);
    }
  });
  
});


function openAddEventModal(day, month, year) {
  const modal = document.getElementById("add-event-modal");
  const eventListContainer = document.getElementById("event-list-container");
  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  modal.dataset.selectedDate = date;
  modal.classList.add("show");

  // Limpa a lista de eventos anteriores no modal
  eventListContainer.innerHTML = "";
}

function openEditEventModal(date, index) {
  const event = events[date] ? events[date][index] : null;

  if (!event) {
    console.error("Erro: Evento não encontrado.");
    return;
  }

  // Buscar elementos do modal de edição
  const modal = document.getElementById("edit-event-modal");
  const titleInput = document.getElementById("edit-event-title");
  const descriptionInput = document.getElementById("edit-event-description");
  const typeInput = document.getElementById("edit-event-type");
  const eventIdInput = document.getElementById("edit-event-id");
  const eventDateInput = document.getElementById("edit-event-date");
  const deleteButton = document.getElementById("delete-event-button");

  if (!modal || !titleInput || !descriptionInput || !typeInput || !eventIdInput || !eventDateInput || !deleteButton) {
    console.error("Erro: Um ou mais elementos do modal de edição não foram encontrados.");
    return;
  }

  // Preencher os campos do modal de edição
  titleInput.value = event.title || "";
  descriptionInput.value = event.description || "";
  typeInput.value = event.type || "";
  eventIdInput.value = event.id || "";
  eventDateInput.value = date || "";

  // Adiciona evento ao botão de exclusão
  deleteButton.onclick = () => deleteEvent(date, index);

  // Exibir o modal de edição
  modal.classList.add("show");
}

async function deleteEvent(date, index) {
  const eventId = events[date][index].id; // Obtém o ID do evento do Firestore

  if (!eventId) {
    console.error("Erro: ID do evento não encontrado.");
    return;
  }

  try {
    // Exclui do Firestore
    await deleteDoc(doc(db, "events", eventId));

    console.log("Evento excluído:", eventId);

    // Remove localmente
    events[date].splice(index, 1);
    if (events[date].length === 0) {
      delete events[date];
    }

    // Fecha o modal de edição
    document.getElementById("edit-event-modal").classList.remove("show");

    // Atualiza o calendário
    const [year, month] = date.split("-").map(Number);
    generateCalendar(month - 1, year);

  } catch (error) {
    console.error("Erro ao excluir evento:", error);
  }
}

document.getElementById("edit-event-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Impede o comportamento padrão do formulário

  const modal = document.getElementById("edit-event-modal");
  const eventId = document.getElementById("edit-event-id").value;
  const date = document.getElementById("edit-event-date").value;
  const title = document.getElementById("edit-event-title").value;
  const description = document.getElementById("edit-event-description").value;
  const type = document.getElementById("edit-event-type").value;

  if (!eventId || !date || !title || !type) {
    console.error("Erro: ID, Data, Título e Tipo são obrigatórios.");
    return;
  }

  // Recupera a cor e ícone do evento atualizado
  const { icon, color } = eventTypes[type] || { icon: "event", color: "#000000" };

  try {
    // Atualiza o evento no Firestore
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, { title, description, type, color });

    console.log("Evento atualizado:", eventId);

    // Atualiza os dados localmente
    const eventIndex = events[date].findIndex(event => event.id === eventId);
    if (eventIndex !== -1) {
      events[date][eventIndex] = { id: eventId, title, description, type, icon, color };
    }

    // Fecha modal e reseta formulário
    modal.classList.remove("show");
    e.target.reset();

    // Atualiza o calendário sem apagar eventos antigos
    generateCalendar(currentMonth, currentYear);

  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
  }
});

document.getElementById("close-edit-event-modal").addEventListener("click", () => {
  document.getElementById("edit-event-modal").classList.remove("show");
});


// Fecha o modal
document.getElementById("close-event-modal").addEventListener("click", () => {
  document.getElementById("add-event-modal").classList.remove("show");
});

// Adiciona evento ao dia selecionado
document.getElementById("add-event-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const modal = document.getElementById("add-event-modal");
  const date = modal.dataset.selectedDate; // Obtém a data do modal
  const title = document.getElementById("event-title").value;
  const description = document.getElementById("event-description").value;
  const type = document.getElementById("event-type").value;

  if (!date || !title || !type) {
    console.error("Erro: Data, título e tipo são obrigatórios.");
    return;
  }

  // Recupera a cor e ícone do evento
  const { icon, color } = eventTypes[type] || { icon: "event", color: "#000000" };

  try {
    // Adiciona evento ao Firestore
    const docRef = await addDoc(collection(db, "events"), {
      date,
      title,
      description,
      type,
      color
    });

    console.log("Evento adicionado ao Firestore com ID:", docRef.id);

    // Atualiza eventos localmente
    if (!events[date]) events[date] = [];
    events[date].push({
      id: docRef.id,
      title,
      description,
      type,
      icon,
      color
    });

    // Fecha modal e reseta formulário
    modal.classList.remove("show");
    e.target.reset();

    // Atualizar calendário sem apagar eventos antigos
    loadEventsFromFirestore().then(() => {
      generateCalendar(currentMonth, currentYear);
    });

  } catch (error) {
    console.error("Erro ao adicionar evento:", error);
  }
});






