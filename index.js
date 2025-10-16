//This code was done using the Pokemon API example by Harold Sikkema as a base and adapting it to the Football API with the help of Copilot and ChatGPT

const API_KEY = "31606b7e376d0096a6231cf7c818f1e4";
const API_URL = "https://v3.football.api-sports.io";
const SEASON = "2023";

// Copilot suggested sanitizing names so the teams with more than one word don't break the class names
const sanitizeClassName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

// I asked ChatGPT to help me with this code by providing the following prompt: implement the wireframe I sent you into my existing code by adding a load
// button for each team that when clicked fetches and displays the players of that team in a hidden section below the team card.
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

// I asked ChatGPT to help me with this code by providing the following prompt: can you make it so the index.js code I sent earlier also fetches 
// the stats for each player from the API and displays it on this section of the code replacing the fetched data from the API into the the value 
// div.      <div class="stats">         <div class="stat"><span class="label">GOL</span><span class="value">20</span></div> ... etc
// replace it with GO being stats.goals.total, SHO being stats.shots.total, PAS being stats.passes.total... tec.

const renderPlayerList = (players, teamName) => {
  const section = document.querySelector(`section.${teamName}`);
  section.innerHTML = ""; // Clear loading message

  players.forEach((data) => {
    const { player, statistics } = data;

    // Extract stats from the first statistics object (current season)
    const stats = statistics[0] || {};
    const goals = stats.goals?.total || 0;
    const shots = stats.shots?.total || 0;
    const passes = stats.passes?.total || 0;
    const attempts = stats.dribbles?.attempts || 0;
    const tackles = stats.tackles?.total || 0;
    const fouls = stats.fouls?.committed || 0;

    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <img src="${player.photo}" alt="${player.name}">
      <h4>${player.name}</h4>
      <p>${player.birth.date} | ${player.nationality}</p>
      <p>${player.weight} | ${player.height}</p>
      <p>Position: ${stats.games?.position || "Unknown"}</p>

      <div class="stats">
        <div class="stat"><span class="label">GOL</span><span class="value">${goals}</span></div>
        <div class="stat"><span class="label">SHO</span><span class="value">${shots}</span></div>
        <div class="stat"><span class="label">PAS</span><span class="value">${passes}</span></div>
        <div class="stat"><span class="label">DRI</span><span class="value">${attempts}</span></div>
        <div class="stat"><span class="label">TAC</span><span class="value">${tackles}</span></div>
        <div class="stat"><span class="label">FOL</span><span class="value">${fouls}</span></div>
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
        '<div class="error">No teams were found</div>';
    }
  } catch (error) {
    console.error("Error fetching teams:", error);
    document.querySelector("main").innerHTML = 
      `<div class="error">Error loading teams: ${error.message}</div>`;
  } finally {
    loading.style.display = "none";
  }
};

// Used the PokeAPI code by Harold Sikkema as reference and change the code to fit my website in order to fetch team players
const loadPlayers = async (teamId, teamClassName) => {
  const section = document.querySelector(`section.${teamClassName}`);
  
  // Show loading message (Suggested by ChatGPT)
  section.innerHTML = '<div class="loading">Loading Players</div>';

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

// Event Listener loading teams
document.getElementById("loadTeamsBtn").addEventListener("click", () => {
  const leagueSelect = document.getElementById("leagueSelect");
  const leagueId = leagueSelect.value;

  if (!leagueId) {
    alert("Please select a league");
    return;
  }

  fetchTeams(leagueId);
});