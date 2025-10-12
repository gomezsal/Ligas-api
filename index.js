// Configuración de la API

import { sumasuper, suma } from "./folder/index";

const API_KEY = "31606b7e376d0096a6231cf7c818f1e4";
const API_URL = "https://v3.football.api-sports.io";
const SEASON = "2023";

const sanitizeClassName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

const createListings = (leagueTeams) => {
  console.log(suma(2 + 2));
  const main = document.querySelector("main");
  main.innerHTML = "";

  leagueTeams.forEach((team) => {
    const section = document.createElement("section");
    section.className = sanitizeClassName(team.team.name);

    const h2 = document.createElement("h2");
    h2.textContent = team.team.name;

    const logo = document.createElement("img");
    logo.src = team.team.logo;
    logo.alt = ⁠ ${team.team.name} Logo ⁠;

    const venue = document.createElement("p");
    venue.textContent = ⁠ Stadium: ${team.venue.name}, ${team.venue.city} ⁠;

    // Botón para cargar jugadores
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

// Función para renderizar la lista de jugadores
const renderPlayerList = (players, teamName) => {
  const section = document.querySelector(⁠ section.${teamName} ⁠);
  const oldList = section.querySelector(".player-list");
  if (oldList) oldList.remove();

  const playerList = document.createElement("div");
  playerList.className = "player-list";

  players.forEach((data) => {
    const { player, statistics } = data;

    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <img src="${player.photo}" alt="${player.name}">
      <h4>${player.name}</h4>
      <p>${player.birth.date} | ${player.nationality}</p>
      <p>${player.weight} | ${player.height}</p>
      <p>Position: ${statistics[0]?.games.position || "Unknown"}</p>

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

// Función para obtener equipos de una liga
const fetchTeams = async (leagueId) => {
  const loading = document.getElementById("loading");
  loading.style.display = "block";

  try {
    const response = await fetch(
      ⁠ ${API_URL}/teams?league=${leagueId}&season=${SEASON} ⁠,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );

    if (!response.ok) {
      throw new Error(⁠ Error: ${response.status} ⁠);
    }

    const data = await response.json();
    console.log("Teams data:", data);

    if (data.response && data.response.length > 0) {
      createListings(data.response);
    } else {
      document.querySelector("main").innerHTML =
        '<div class="error">No se encontraron equipos</div>';
    }
  } catch (error) {
    console.error("Error fetching teams:", error);
    document.querySelector(
      "main"
    ).innerHTML = ⁠ <div class="error">Error al cargar equipos: ${error.message}</div> ⁠;
  } finally {
    loading.style.display = "none";
  }
};

// Función para obtener jugadores de un equipo
const loadPlayers = async (teamId, teamClassName) => {
  const section = document.querySelector(⁠ section.${teamClassName} ⁠);
  const button = section.querySelector(".load-players-btn");

  button.disabled = true;
  button.textContent = "Cargando...";

  try {
    const response = await fetch(
      ⁠ ${API_URL}/players?team=${teamId}&season=${SEASON} ⁠,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": API_KEY,
          "x-rapidapi-host": "v3.football.api-sports.io",
        },
      }
    );

    if (!response.ok) {
      throw new Error(⁠ Error: ${response.status} ⁠);
    }

    const data = await response.json();
    console.log("Players data:", data);

    if (data.response && data.response.length > 0) {
      renderPlayerList(data.response, teamClassName);
      button.textContent = "Recargar Jugadores";
    } else {
      const errorMsg = document.createElement("p");
      errorMsg.style.color = "red";
      errorMsg.textContent = "No se encontraron jugadores";
      section.appendChild(errorMsg);
    }
  } catch (error) {
    console.error("Error fetching players:", error);
    const errorMsg = document.createElement("p");
    errorMsg.style.color = "red";
    errorMsg.textContent = ⁠ Error: ${error.message} ⁠;
    section.appendChild(errorMsg);
  } finally {
    button.disabled = false;
    if (button.textContent === "Cargando...") {
      button.textContent = "Ver Jugadores";
    }
  }
};

// Event Listener para cargar equipos
document.getElementById("loadTeamsBtn").addEventListener("click", () => {
  const leagueSelect = document.getElementById("leagueSelect");
  const leagueId = leagueSelect.value;

  if (!leagueId) {
    alert("Por favor selecciona una liga");
    return;
  }

  fetchTeams(leagueId);
});