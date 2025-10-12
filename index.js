// Enhanced Error Handling System
const API_KEY = "31606b7e376d0096a6231cf7c818f1e4";
const API_URL = "https://v3.football.api-sports.io";
const SEASON = "2023";

// ============================================
// ERROR HANDLING UTILITIES
// ============================================

class APIError extends Error {
  constructor(message, statusCode, type) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

const ErrorTypes = {
  NETWORK: 'network',
  API_LIMIT: 'api_limit',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown'
};

// Determina el tipo de error basado en el código de estado
const getErrorType = (statusCode) => {
  if (statusCode === 429) return ErrorTypes.API_LIMIT;
  if (statusCode === 404) return ErrorTypes.NOT_FOUND;
  if (statusCode >= 500) return ErrorTypes.SERVER;
  if (statusCode >= 400) return ErrorTypes.UNKNOWN;
  return ErrorTypes.NETWORK;
};

// Mensajes de error amigables para el usuario
const getErrorMessage = (error) => {
  if (error instanceof APIError) {
    switch (error.type) {
      case ErrorTypes.API_LIMIT:
        return '⚠️ Límite de solicitudes alcanzado. Por favor, espera un momento e intenta de nuevo.';
      case ErrorTypes.NOT_FOUND:
        return '🔍 No se encontraron datos. Intenta con otra liga o equipo.';
      case ErrorTypes.SERVER:
        return '🔧 El servidor está experimentando problemas. Intenta nuevamente en unos minutos.';
      default:
        return `❌ Error: ${error.message}`;
    }
  }
  
  if (!navigator.onLine) {
    return '📡 Sin conexión a internet. Verifica tu conexión y vuelve a intentar.';
  }
  
  return `❌ Algo salió mal: ${error.message}`;
};

// Muestra un mensaje de error visual en el contenedor especificado
const showError = (container, message, retryCallback = null) => {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <p>${message}</p>
    ${retryCallback ? '<button class="retry-btn">Reintentar</button>' : ''}
  `;
  
  if (retryCallback) {
    const retryBtn = errorDiv.querySelector('.retry-btn');
    retryBtn.addEventListener('click', retryCallback);
  }
  
  container.innerHTML = '';
  container.appendChild(errorDiv);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const sanitizeClassName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

// ============================================
// API FUNCTIONS WITH ERROR HANDLING
// ============================================

const fetchTeams = async (leagueId) => {
  const loading = document.getElementById("loading");
  const main = document.querySelector("main");
  
  loading.style.display = "block";
  main.innerHTML = '';

  try {
    // Validación de entrada
    if (!leagueId) {
      throw new Error('Debe seleccionar una liga válida');
    }

    const response = await fetch(
      `${API_URL}/teams?league=${leagueId}&season=${SEASON}`, 
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );

    // Manejo de errores HTTP
    if (!response.ok) {
      const errorType = getErrorType(response.status);
      throw new APIError(
        `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorType
      );
    }

    const data = await response.json();
    console.log("Teams data:", data);

    // Validación de respuesta vacía
    if (!data.response || data.response.length === 0) {
      showError(main, '🔍 No se encontraron equipos para esta liga.', () => fetchTeams(leagueId));
      return;
    }

    createListings(data.response);

  } catch (error) {
    console.error("Error fetching teams:", error);
    const message = getErrorMessage(error);
    showError(main, message, () => fetchTeams(leagueId));
  } finally {
    loading.style.display = "none";
  }
};

const loadPlayers = async (teamId, teamClassName) => {
  const section = document.querySelector(`section.${teamClassName}`);
  const button = section.querySelector(".load-players-btn");
  
  // Remover mensajes de error previos
  const oldError = section.querySelector('.error-message');
  if (oldError) oldError.remove();

  button.disabled = true;
  button.textContent = "Cargando...";

  try {
    // Validación de entrada
    if (!teamId) {
      throw new Error('ID de equipo inválido');
    }

    const response = await fetch(
      `${API_URL}/players?team=${teamId}&season=${SEASON}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );

    // Manejo de errores HTTP
    if (!response.ok) {
      const errorType = getErrorType(response.status);
      throw new APIError(
        `Error ${response.status}: ${response.statusText}`,
        response.status,
        errorType
      );
    }

    const data = await response.json();
    console.log("Players data:", data);

    // Validación de respuesta vacía
    if (!data.response || data.response.length === 0) {
      throw new Error('No se encontraron jugadores para este equipo');
    }

    renderPlayerList(data.response, teamClassName);
    button.textContent = "Recargar Jugadores";

  } catch (error) {
    console.error("Error fetching players:", error);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message inline-error';
    errorDiv.innerHTML = `
      <p>${getErrorMessage(error)}</p>
      <button class="retry-btn">Reintentar</button>
    `;
    
    errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
      loadPlayers(teamId, teamClassName);
    });
    
    section.appendChild(errorDiv);
    button.textContent = "Ver Jugadores";
    
  } finally {
    button.disabled = false;
  }
};

// ============================================
// RENDERING FUNCTIONS
// ============================================

const createListings = (leagueTeams) => {
  const main = document.querySelector("main");
  main.innerHTML = "";

  leagueTeams.forEach((team) => {
    const section = document.createElement("section");
    section.className = sanitizeClassName(team.team.name);

    const h2 = document.createElement("h2");
    h2.textContent = team.team.name;

    const logo = document.createElement("img");
    logo.src = team.team.logo;
    logo.alt = `${team.team.name} Logo`;
    
    // Error handling para imágenes
    logo.onerror = () => {
      logo.src = 'https://via.placeholder.com/100?text=No+Logo';
    };

    const venue = document.createElement("p");
    venue.textContent = `Stadium: ${team.venue.name}, ${team.venue.city}`;

    const loadPlayersBtn = document.createElement("button");
    loadPlayersBtn.className = "load-players-btn";
    loadPlayersBtn.textContent = "Ver Jugadores";
    loadPlayersBtn.onclick = () =>
      loadPlayers(team.team.id, sanitizeClassName(team.team.name));

    section.appendChild(h2);
    section.appendChild(logo);
    section.appendChild(venue);
    section.appendChild(loadPlayersBtn);

    main.appendChild(section);
  });
};

const renderPlayerList = (players, teamName) => {
  const section = document.querySelector(`section.${teamName}`);
  const oldList = section.querySelector(".player-list");
  if (oldList) oldList.remove();

  const playerList = document.createElement("div");
  playerList.className = "player-list";

  players.forEach((data) => {
    const { player, statistics } = data;

    const card = document.createElement("div");
    card.className = "player-card";

    // Manejo seguro de datos opcionales
    const photo = player.photo || 'https://via.placeholder.com/100?text=No+Photo';
    const birthDate = player.birth?.date || 'N/A';
    const nationality = player.nationality || 'Unknown';
    const weight = player.weight || 'N/A';
    const height = player.height || 'N/A';
    const position = statistics[0]?.games?.position || "Unknown";

    card.innerHTML = `
      <img src="${photo}" alt="${player.name}" onerror="this.src='https://via.placeholder.com/100?text=No+Photo'">
      <h4>${player.name}</h4>
      <p>${birthDate} | ${nationality}</p>
      <p>${weight} | ${height}</p>
      <p>Position: ${position}</p>

      <div class="stats">
        <div class="stat"><span class="label">PAC</span><span class="value">20</span></div>
        <div class="stat"><span class="label">SHO</span><span class="value">20</span></div>
        <div class="stat"><span class="label">PAS</span><span class="value">20</span></div>
        <div class="stat"><span class="label">DRI</span><span class="value">20</span></div>
        <div class="stat"><span class="label">DEF</span><span class="value">20</span></div>
        <div class="stat"><span class="label">PHY</span><span class="value">20</span></div>
      </div>
    `;

    playerList.appendChild(card);
  });

  section.appendChild(playerList);
};

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById("loadTeamsBtn").addEventListener("click", () => {
  const leagueSelect = document.getElementById("leagueSelect");
  const leagueId = leagueSelect.value;

  if (!leagueId) {
    const main = document.querySelector("main");
    showError(main, '⚠️ Por favor selecciona una liga primero.');
    return;
  }

  fetchTeams(leagueId);
});

// Detectar pérdida de conexión
window.addEventListener('offline', () => {
  const main = document.querySelector("main");
  showError(main, '📡 Conexión perdida. Verifica tu internet.');
});

window.addEventListener('online', () => {
  console.log('Conexión restaurada');
});