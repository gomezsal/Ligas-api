const API_KEY = "31606b7e376d0096a6231cf7c818f1e4";
const API_URL = "https://v3.football.api-sports.io";
const SEASON = "2023";

const sanitizeClassName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

// Create team buttons that act like navigation
const createListings = (leagueTeams) => {
  const main = document.querySelector("main");
  main.innerHTML = "";

  leagueTeams.forEach((team) => {
    const teamClassName = sanitizeClassName(team.team.name);

    // Create team card
    const teamCard = document.createElement("div");
    teamCard.className = `team-card ${teamClassName}`;

    const teamName = document.createElement("h2");
    teamName.textContent = team.team.name;

    const logo = document.createElement("img");
    logo.src = team.team.logo;
    logo.alt = `${team.team.name} Logo`;

    const venue = document.createElement("p");
    venue.className = "venue";
    venue.textContent = `Stadium: ${team.venue.name}, ${team.venue.city}`;

    const loadPlayersBtn = document.createElement("button");
    loadPlayersBtn.className = "load-players-btn";
    loadPlayersBtn.textContent = "LOAD PLAYERS";

    teamCard.appendChild(teamName);
    teamCard.appendChild(logo);
    teamCard.appendChild(venue);
    teamCard.appendChild(loadPlayersBtn);

    // Create the hidden section for players
    const section = document.createElement("section");
    section.className = teamClassName;

    // Click handler for the button
    loadPlayersBtn.addEventListener("click", async () => {
      const isActive = section.classList.contains("active");

      // Remove active class from all sections
      document.querySelectorAll("section").forEach((sec) => {
        sec.classList.remove("active");
      });

      // If this section wasn't active, make it active and load players
      if (!isActive) {
        section.classList.add("active");

        // Load players if not already loaded
        if (section.children.length === 0) {
          await loadPlayers(team.team.id, teamClassName);
        }
      }
    });

    main.appendChild(teamCard);
    main.appendChild(section);
  });
};

// Rendering players
const renderPlayerList = (players, teamName) => {
  const section = document.querySelector(`section.${teamName}`);
  section.innerHTML = ""; // Clear loading message

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

    section.appendChild(card);
  });
};

// Fetching league teams
const fetchTeams = async (leagueId) => {
  const loading = document.getElementById("loading");
  loading.style.display = "block";

  try {
    const response = await fetch(`${API_URL}/teams?league=${leagueId}&season=${SEASON}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
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
    document.querySelector("main").innerHTML = 
      `<div class="error">Error al cargar equipos: ${error.message}</div>`;
  } finally {
    loading.style.display = "none";
  }
};

// Fetching team players
const loadPlayers = async (teamId, teamClassName) => {
  const section = document.querySelector(`section.${teamClassName}`);
  
  // Show loading message
  section.innerHTML = '<div class="loading">Cargando jugadores...</div>';

  try {
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

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Players data:", data);

    if (data.response && data.response.length > 0) {
      renderPlayerList(data.response, teamClassName);
    } else {
      section.innerHTML = '<p style="color: red; text-align: center;">No se encontraron jugadores</p>';
    }
  } catch (error) {
    console.error("Error fetching players:", error);
    section.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
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