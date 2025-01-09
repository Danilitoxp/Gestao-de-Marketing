import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";


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
    // Referência à coleção "events"
    const docRef = await addDoc(collection(db, "events"), {
      date,
      title,
      description,
      type,
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

function deleteEvent(date, index) {
  const eventId = events[date][index].id; // Obtenha o ID do evento
  deleteEventFromFirestore(eventId); // Exclua do Firestore

  // Remova localmente
  events[date].splice(index, 1);

  if (events[date].length === 0) {
    delete events[date];
  }

  const [year, month] = date.split("-").map(Number);
  generateCalendar(month - 1, year);

  const [day] = date.split("-").slice(-1);
  openAddEventModal(Number(day), month - 1, year);
}

async function loadEventsFromFirestore() {
  try {
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
  const dateInput = document.getElementById("dashboard-date-range-1");
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  dateInput.value = `${monthNames[currentMonth]} ${currentYear}`;

  // Regera o calendário
  generateCalendar(currentMonth, currentYear);
}


function initializeCalendar() {
  const dateInput = document.getElementById("dashboard-date-range-1");

  flatpickr(dateInput, {
    locale: "pt",
    plugins: [
      new monthSelectPlugin({
        shorthand: true,
        dateFormat: "F Y",
        altFormat: "F Y",
      }),
    ],
    onChange: (selectedDates) => {
      if (selectedDates.length > 0) {
        const selectedDate = selectedDates[0];
        generateCalendar(selectedDate.getMonth(), selectedDate.getFullYear());
      }
    },
  });

  const today = new Date();
  generateCalendar(today.getMonth(), today.getFullYear());
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
          events[currentDate].forEach((event) => {
            const listItem = document.createElement("li");
            listItem.style.backgroundColor = event.color;

            // Adicionar ícone e título ao item
            const icon = document.createElement("span");
            icon.className = "material-icons";
            icon.textContent = event.icon;
            icon.style.marginRight = "5px";

            listItem.appendChild(icon);
            listItem.appendChild(document.createTextNode(event.title));
            eventList.appendChild(listItem);
          });
        }

        cell.appendChild(eventList);

        cell.addEventListener("click", ((currentDay, currentMonth, currentYear) => () => {
          openAddEventModal(currentDay, currentMonth, currentYear);
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

function openAddEventModal(day, month, year) {
  const modal = document.getElementById("add-event-modal");
  const eventListContainer = document.getElementById("event-list-container");
  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  modal.dataset.selectedDate = date;
  modal.classList.add("show");

  // Limpa a lista de eventos anteriores no modal
  eventListContainer.innerHTML = "";

  // Exibe eventos existentes, se houver
  if (events[date]) {
    events[date].forEach((event, index) => {
      const eventItem = document.createElement("div");
      eventItem.className = "event-item";

      const title = document.createElement("p");
      title.textContent = `Título: ${event.title}`;

      const description = document.createElement("p");
      description.textContent = `Descrição: ${event.description}`;

      // Botão de editar
      const editButton = document.createElement("button");
      editButton.textContent = "Editar";
      editButton.className = "edit-btn";
      editButton.addEventListener("click", () => editEvent(date, index));

      // Botão de excluir
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Excluir";
      deleteButton.className = "delete-btn";
      deleteButton.addEventListener("click", () => deleteEvent(date, index));

      eventItem.appendChild(title);
      eventItem.appendChild(description);
      eventItem.appendChild(editButton);
      eventItem.appendChild(deleteButton);

      eventListContainer.appendChild(eventItem);
    });
  }
}

function editEvent(date, index) {
  const event = events[date][index];

  // Preenche os campos do formulário com os dados do evento
  document.getElementById("event-title").value = event.title;
  document.getElementById("event-description").value = event.description;

  // Remove o evento atual para evitar duplicação
  deleteEvent(date, index);
}


// Fecha o modal
document.getElementById("close-event-modal").addEventListener("click", () => {
  document.getElementById("add-event-modal").classList.remove("show");
});

// Adiciona evento ao dia selecionado
document.getElementById("add-event-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const modal = document.getElementById("add-event-modal");
  const date = modal.dataset.selectedDate;
  const title = document.getElementById("event-title").value;
  const description = document.getElementById("event-description").value;
  const type = document.getElementById("event-type").value;

  // Salvar evento localmente
  const { icon, color } = eventTypes[type];
  if (!events[date]) events[date] = [];
  events[date].push({ title, description, type, icon, color });

  // Salvar evento no Firestore
  await addEventToFirestore(date, title, description, type);


  // Fechar modal e resetar formulário
  modal.classList.remove("show");
  e.target.reset();

  // Atualizar calendário
  const [year, month] = date.split("-").map(Number);
  generateCalendar(month - 1, year);
});




