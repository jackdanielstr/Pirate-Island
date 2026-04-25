// ===========================
// PIRATE ISLAND - GAME ENGINE
// Tropico 2 Style Simulator
// ===========================

// Game State
let gameState = {
    treasury: 50000,
    population: 500,
    happiness: 70,
    stability: 75,
    education: 50,
    health: 60,
    
    resources: {
        sugar: 0,
        tobacco: 0,
        rum: 0,
        tourists: 0
    },
    
    dailyIncome: 0,
    dailyExpense: 0,
    
    buildings: {
        house: 0,
        sugarFactory: 0,
        tobaccoFactory: 0,
        rumDistillery: 0,
        resort: 0,
        fortress: 0,
        hospital: 0,
        university: 0
    },
    
    missions: {
        economy: { target: 100000, current: 0, completed: false },
        expansion: { target: 10, current: 0, completed: false },
        happiness: { target: 80, current: 0, completed: false },
        hero: { target: 3, current: 0, completed: false }
    },
    
    dayCount: 0
};

// Building Definitions
const buildings = {
    house: { cost: 100, name: 'Casa', income: 50, happiness: 10, population: 10 },
    sugarFactory: { cost: 500, name: 'Fabbrica Zucchero', income: 300, resources: { sugar: 100 } },
    tobaccoFactory: { cost: 600, name: 'Fabbrica Tabacco', income: 350, resources: { tobacco: 80 } },
    rumDistillery: { cost: 800, name: 'Distilleria Rum', income: 500, resources: { rum: 60 } },
    resort: { cost: 1000, name: 'Resort Turistico', income: 600, happiness: 20, resources: { tourists: 50 } },
    fortress: { cost: 1200, name: 'Fortezza', income: 100, stability: 30 },
    hospital: { cost: 900, name: 'Ospedale', income: 150, health: 40, happiness: 15 },
    university: { cost: 1100, name: 'Università', income: 200, education: 50, happiness: 10 }
};

// Initialize Game
function initGame() {
    loadGame();
    updateUI();
    startGameLoop();
    console.log('🏝️ Pirate Island Game Started!');
    console.log('Stato:', gameState);
}

// Save Game to LocalStorage
function saveGame() {
    localStorage.setItem('pirateIslandGame', JSON.stringify(gameState));
    console.log('💾 Gioco salvato!');
}

// Load Game from LocalStorage
function loadGame() {
    const saved = localStorage.getItem('pirateIslandGame');
    if (saved) {
        gameState = JSON.parse(saved);
        console.log('📂 Gioco caricato!');
    }
}

// Reset Game
function resetGame() {
    if (confirm('Sei sicuro? Il gioco sarà resettato!')) {
        localStorage.removeItem('pirateIslandGame');
        location.reload();
    }
}

// Build a Building
function buildBuilding(buildingKey) {
    const building = buildings[buildingKey];
    
    if (!building) {
        console.error('Edificio non trovato:', buildingKey);
        return;
    }
    
    if (gameState.treasury < building.cost) {
        showNotification('❌ Non hai abbastanza soldi!', 'error');
        return;
    }
    
    // Deduct cost
    gameState.treasury -= building.cost;
    gameState.buildings[buildingKey]++;
    gameState.missions.expansion.current++;
    
    // Apply bonuses
    if (building.happiness) gameState.happiness += building.happiness;
    if (building.stability) gameState.stability += building.stability;
    if (building.health) gameState.health += building.health;
    if (building.education) gameState.education += building.education;
    if (building.population) gameState.population += building.population;
    
    showNotification(`✅ ${building.name} costruita!`, 'success');
    updateUI();
    saveGame();
    
    // Check mission progress
    checkMissions();
}

// Game Loop - Simulate Daily Changes
function gameLoop() {
    gameState.dayCount++;
    
    // Calculate daily income
    gameState.dailyIncome = 0;
    Object.keys(gameState.buildings).forEach(key => {
        const count = gameState.buildings[key];
        if (count > 0) {
            gameState.dailyIncome += buildings[key].income * count;
        }
    });
    
    // Calculate daily expenses
    gameState.dailyExpense = gameState.population * 5 + gameState.buildings.fortress * 50;
    
    // Update treasury
    gameState.treasury += gameState.dailyIncome - gameState.dailyExpense;
    
    // Update happiness based on treasury and buildings
    const hospitalEffect = gameState.buildings.hospital * 2;
    const universityEffect = gameState.buildings.university * 1.5;
    const resortEffect = gameState.buildings.resort * 3;
    
    gameState.happiness += (hospitalEffect + universityEffect + resortEffect) / 10;
    gameState.happiness = Math.max(0, Math.min(100, gameState.happiness));
    
    // Update health
    gameState.health += gameState.buildings.hospital * 0.5;
    gameState.health = Math.max(0, Math.min(100, gameState.health));
    
    // Update education
    gameState.education += gameState.buildings.university * 0.3;
    gameState.education = Math.max(0, Math.min(100, gameState.education));
    
    // Population growth based on happiness
    const populationGrowth = gameState.happiness > 70 ? 2 : -1;
    gameState.population += populationGrowth;
    gameState.population = Math.max(100, gameState.population);
    
    // Stability system
    if (gameState.happiness < 50) {
        gameState.stability -= 2;
    } else if (gameState.happiness > 80) {
        gameState.stability += 1;
    }
    gameState.stability = Math.max(0, Math.min(100, gameState.stability));
    
    // Update mission progress
    gameState.missions.economy.current = gameState.treasury;
    gameState.missions.happiness.current = gameState.happiness;
    
    // Random events
    if (Math.random() < 0.05) {
        triggerRandomEvent();
    }
    
    // Auto-save every 10 days
    if (gameState.dayCount % 10 === 0) {
        saveGame();
    }
    
    updateUI();
}

// Random Events
function triggerRandomEvent() {
    const events = [
        {
            text: '🌪️ Una tempesta tropicale ha colpito!',
            effect: () => { gameState.treasury -= 5000; gameState.stability -= 10; }
        },
        {
            text: '🎉 Festival nazionale! La felicità aumenta!',
            effect: () => { gameState.happiness += 10; }
        },
        {
            text: '⚓ Dei pirati attaccano! Costruisci fortezze!',
            effect: () => { gameState.stability -= 15; }
        },
        {
            text: '💰 Una nave commerciale arriva con merci!',
            effect: () => { gameState.treasury += 10000; }
        },
        {
            text: '🏖️ I turisti adorano l\'isola!',
            effect: () => { gameState.resources.tourists += 100; gameState.treasury += 5000; }
        },
        {
            text: '😢 Alcuni cittadini se ne sono andati...',
            effect: () => { gameState.population -= 50; gameState.happiness -= 10; }
        }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    showNotification(event.text, 'event');
}

// Check Missions Completion
function checkMissions() {
    // Mission 1: Economy
    if (gameState.treasury >= gameState.missions.economy.target) {
        gameState.missions.economy.completed = true;
        showNotification('🎯 Missione Completata: Stabilizza l\'Economia!', 'mission');
        gameState.missions.hero.current++;
    }
    
    // Mission 2: Expansion
    if (gameState.buildings.house + gameState.buildings.sugarFactory + 
        gameState.buildings.tobaccoFactory + gameState.buildings.rumDistillery +
        gameState.buildings.resort + gameState.buildings.fortress +
        gameState.buildings.hospital + gameState.buildings.university >= 
        gameState.missions.expansion.target) {
        gameState.missions.expansion.completed = true;
        showNotification('🎯 Missione Completata: Espandi il Regno!', 'mission');
        gameState.missions.hero.current++;
    }
    
    // Mission 3: Happiness
    if (gameState.happiness >= gameState.missions.happiness.target) {
        gameState.missions.happiness.completed = true;
        showNotification('🎯 Missione Completata: Felicità Popolare!', 'mission');
        gameState.missions.hero.current++;
    }
    
    // Mission 4: Hero
    if (gameState.missions.hero.current >= gameState.missions.hero.target) {
        gameState.missions.hero.completed = true;
        showNotification('👑 EROE DELL\'ISOLA! Hai vinto!', 'victory');
    }
}

// Update UI
function updateUI() {
    // Treasury
    document.getElementById('treasury').textContent = formatMoney(gameState.treasury);
    
    // Population
    document.getElementById('population').textContent = gameState.population.toFixed(0);
    
    // Stats
    document.getElementById('happiness').textContent = gameState.happiness.toFixed(1);
    document.getElementById('stability').textContent = gameState.stability.toFixed(1);
    document.getElementById('education').textContent = gameState.education.toFixed(1);
    document.getElementById('health').textContent = gameState.health.toFixed(1);
    
    // Income/Expense
    document.getElementById('dailyIncome').textContent = formatMoney(gameState.dailyIncome);
    document.getElementById('dailyExpense').textContent = formatMoney(gameState.dailyExpense);
    document.getElementById('dayCount').textContent = gameState.dayCount;
    
    // Progress Bars
    updateProgressBar('happinessBar', gameState.happiness);
    updateProgressBar('stabilityBar', gameState.stability);
    updateProgressBar('educationBar', gameState.education);
    updateProgressBar('healthBar', gameState.health);
    
    // Building counts
    Object.keys(gameState.buildings).forEach(key => {
        const element = document.getElementById(`count-${key}`);
        if (element) {
            element.textContent = gameState.buildings[key];
        }
    });
    
    // Missions
    updateMissionUI();
}

// Update Mission UI
function updateMissionUI() {
    // Economy Mission
    const econ = gameState.missions.economy;
    document.getElementById('missionEconomyProgress').textContent = 
        `${formatMoney(econ.current)} / ${formatMoney(econ.target)}`;
    document.getElementById('missionEconomyBar').style.width = 
        `${Math.min(100, (econ.current / econ.target) * 100)}%`;
    
    // Expansion Mission
    const expand = gameState.missions.expansion;
    const totalBuildings = Object.values(gameState.buildings).reduce((a, b) => a + b, 0);
    document.getElementById('missionExpansionProgress').textContent = 
        `${totalBuildings} / ${expand.target}`;
    document.getElementById('missionExpansionBar').style.width = 
        `${Math.min(100, (totalBuildings / expand.target) * 100)}%`;
    
    // Happiness Mission
    const happ = gameState.missions.happiness;
    document.getElementById('missionHappinessProgress').textContent = 
        `${happ.current.toFixed(1)}% / ${happ.target}%`;
    document.getElementById('missionHappinessBar').style.width = 
        `${Math.min(100, (happ.current / happ.target) * 100)}%`;
    
    // Hero Mission
    const hero = gameState.missions.hero;
    document.getElementById('missionHeroProgress').textContent = 
        `${hero.current} / ${hero.target}`;
    document.getElementById('missionHeroBar').style.width = 
        `${Math.min(100, (hero.current / hero.target) * 100)}%`;
}

// Update Progress Bar
function updateProgressBar(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.width = value + '%';
        element.textContent = value.toFixed(1) + '%';
    }
}

// Format Money
function formatMoney(amount) {
    if (amount >= 1000000) {
        return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(1) + 'K';
    }
    return '$' + amount.toFixed(0);
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Start Game Loop
function startGameLoop() {
    // Update every 5 seconds (1 game day)
    setInterval(gameLoop, 5000);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);
