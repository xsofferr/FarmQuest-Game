let currentUser = null;
let users = JSON.parse(localStorage.getItem('farmquest_users')) || [];

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');

window.onload = function() {
  const savedUser = localStorage.getItem('farmquest_currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserUI();
  }
};

function showRegisterModal() {
  window.location.href = 'reg.html';
}

function showLoginModal() {
  window.location.href = 'login.html';
}

function loginAsGuest() {
  currentUser = { id: 'guest', username: 'Гость', isGuest: true };
  localStorage.setItem('farmquest_currentUser', JSON.stringify(currentUser));
  updateUserUI();
}

function updateUserUI() {
  if (currentUser) {
    currentUserLabel.textContent = currentUser.username;
    logoutBtn.style.display = 'inline-block';
  } else {
    currentUserLabel.textContent = 'Не вошли';
    logoutBtn.style.display = 'none';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('farmquest_currentUser');
  updateUserUI();
}

function startGame() {
  alert('Скоро будет экран игры!');
}

function showScreen(screenId) {
  alert(`Скоро будет экран: ${screenId}`);
}

const coinsLabel = document.getElementById('coinsLabel');

let farmState = Array(9).fill('empty');
let plantedTime = Array(9).fill(0);
let plantedSeed = Array(9).fill('');
let coins = 100;
let selectedSeed = 'wheat';
let seedsInventory = {'wheat': 5, 'carrot': 3, 'corn': 2};
let currentLocation = 'farm';
let tools = {'scythe': false, 'hoe': false, 'watering_can': false};
let equipment = {'tractor': false, 'irrigation': false, 'second_field': false};
let growthMultiplier = 1;
let harvestBonus = 0;
let snakeGameInstance = null;

let totalHarvested = 0;
let playerLevel = 1;
let levelProgress = 0;
let nextLevelThreshold = 50;

const SEEDS = {
    'wheat': { name: 'Пшеница', emoji: '🌾', price: 10, reward: 3, growTime: 5000 },
    'carrot': { name: 'Морковь', emoji: '🥕', price: 15, reward: 5, growTime: 8000 },
    'corn': { name: 'Кукуруза', emoji: '🌽', price: 20, reward: 8, growTime: 12000 }
};

const TOOLS_SHOP = [
    { id: 'scythe', name: 'Острая коса', emoji: '🔪', price: 50, desc: '+1 монета за сбор', bonus: 1 },
    { id: 'hoe', name: 'Золотая мотыга', emoji: '⛏️', price: 100, desc: '+2 монеты за сбор', bonus: 2 },
    { id: 'watering_can', name: 'Волшебная лейка', emoji: '🚰', price: 150, desc: '+3 монеты за сбор', bonus: 3 }
];

const EQUIPMENT_SHOP = [
    { id: 'tractor', name: 'Мини-трактор', emoji: '🚜', price: 200, desc: 'Ускоряет рост на 20%', effect: 0.8 },
    { id: 'irrigation', name: 'Система полива', emoji: '💧', price: 300, desc: 'Ускоряет рост на 30%', effect: 0.7 },
    { id: 'second_field', name: 'Второе поле', emoji: '🧩', price: 500, desc: 'Открывает второе поле' }
];

const LEVEL_REWARDS = {
    1: { coins: 0, bonus: "Старт игры" },
    2: { coins: 50, bonus: "+1 монета за сбор" },
    3: { coins: 100, bonus: "Ускорение роста 10%" },
    4: { coins: 150, bonus: "+2 монеты за сбор" },
    5: { coins: 200, bonus: "Ускорение роста 20%" },
    6: { coins: 300, bonus: "Бесплатные семена" },
    7: { coins: 400, bonus: "+3 монеты за сбор" },
    8: { coins: 500, bonus: "Ускорение роста 30%" },
    9: { coins: 750, bonus: "Двойной урожай" },
    10: { coins: 1000, bonus: "Золотая коса" }
};

if (typeof audioManager === 'undefined') {
    window.audioManager = {
        playSound: function() {},
        userInteracted: true,
        musicEnabled: true,
        sfxEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        toggleMusic: function() { return this.musicEnabled; },
        toggleSFX: function() { return this.sfxEnabled; },
        setMusicVolume: function() {},
        setSFXVolume: function() {},
        initAudio: function() {}
    };
}

window.onload = async function() {
    console.log('Страница загружена');
    
    initSoundControls();
    
    const savedUser = localStorage.getItem('farmquest_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        await loadCoinsFromDB();
    }
    
    setTimeout(() => {
        if (audioManager.userInteracted) {
            audioManager.initAudio();
        }
    }, 1000);
};

async function loadCoinsFromDB() {
    try {
        if (!currentUser || currentUser.isGuest) return;
        const response = await fetch(`/api/coins/${currentUser.username}`);
        const data = await response.json();
        if (coinsLabel) coinsLabel.textContent = data.coins;
    } catch(e) {}
}

function initSoundControls() {
    const musicSlider = document.getElementById('musicVolume');
    const sfxSlider = document.getElementById('sfxVolume');
    const musicValue = document.getElementById('musicVolumeValue');
    const sfxValue = document.getElementById('sfxVolumeValue');
    
    if (musicSlider && sfxSlider) {
        musicSlider.value = audioManager.musicVolume * 100;
        sfxSlider.value = audioManager.sfxVolume * 100;
        if (musicValue) musicValue.textContent = `${Math.round(audioManager.musicVolume * 100)}%`;
        if (sfxValue) sfxValue.textContent = `${Math.round(audioManager.sfxVolume * 100)}%`;
        
        musicSlider.addEventListener('input', function() {
            audioManager.setMusicVolume(this.value);
            if (musicValue) musicValue.textContent = `${this.value}%`;
        });
        
        sfxSlider.addEventListener('input', function() {
            audioManager.setSFXVolume(this.value);
            if (sfxValue) sfxValue.textContent = `${this.value}%`;
        });
        
        sfxSlider.addEventListener('change', function() {
            if (this.value > 0) {
                audioManager.playSound('button');
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            setTimeout(() => {
                audioManager.playSound('button');
            }, 100);
        }
        
        const hint = document.getElementById('audioHint');
        if (hint && audioManager.userInteracted) {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (hint) hint.remove();
            }, 500);
        }
    });
}

function showRegisterModal() {
    audioManager.playSound('click');
    window.location.href = 'reg.html';
}

function showLoginModal() {
    audioManager.playSound('click');
    loginWithServer();
}

async function loginWithServer() {
    const username = prompt('Логин:');
    if (!username) return;
    
    const password = prompt('Пароль (пока = логину для простоты):');
    if (!password || password !== username) {
        alert('Пароль должен равняться логину');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        
        const user = await response.json();
        if (user.error) {
            alert(user.error);
            return;
        }
        
        currentUser = user;
        localStorage.setItem('farmquest_currentUser', JSON.stringify(currentUser));
        updateUserUI();
        if (coinsLabel) coinsLabel.textContent = user.coins;
        alert(`Добро пожаловать, ${user.username}! Монет: ${user.coins}`);
        
    } catch(e) {
        loginAsGuestWithName(username);
    }
}

function loginAsGuest() {
    audioManager.playSound('click');
    currentUser = { id: 'guest', username: 'Гость', isGuest: true };
    localStorage.setItem('farmquest_currentUser', JSON.stringify(currentUser));
    updateUserUI();
}

function loginAsGuestWithName(username) {
    currentUser = { id: 'guest', username, isGuest: true };
    localStorage.setItem('farmquest_currentUser', JSON.stringify(currentUser));
    updateUserUI();
}

function updateUserUI() {
    if (currentUser) {
        currentUserLabel.textContent = currentUser.username;
        logoutBtn.style.display = 'inline-block';
    } else {
        currentUserLabel.textContent = 'Не вошли';
        logoutBtn.style.display = 'none';
    }
}

function logout() {
    audioManager.playSound('click');
    currentUser = null;
    localStorage.removeItem('farmquest_currentUser');
    updateUserUI();
    if (coinsLabel) coinsLabel.textContent = '0';
}

function startGame() {
    audioManager.playSound('click');
    window.location.href = 'game.html';
}

function showScreen(screenId) {
    audioManager.playSound('click');
    if (screenId === 'farm') {
        window.location.href = 'farm.html';
    } else {
        alert(`Скоро будет экран: ${screenId}`);
    }
}

function goToFarm() {
    audioManager.playSound('click');
    window.location.href = 'farm.html';
}

function updateLevelDisplay() {
    document.getElementById('levelLabel').textContent = playerLevel;
    const progressPercent = (levelProgress / nextLevelThreshold) * 100;
    document.getElementById('levelProgressFill').style.width = progressPercent + '%';
    document.getElementById('levelProgressText').textContent = 
        `${levelProgress}/${nextLevelThreshold}`;
}

function addHarvest(amount) {
    totalHarvested += amount;
    levelProgress += amount;
    
    if (levelProgress >= nextLevelThreshold) {
        levelUp();
    }
    
    updateLevelDisplay();
    saveGameProgress();
}

function levelUp() {
    playerLevel++;
    levelProgress = levelProgress - nextLevelThreshold;
    nextLevelThreshold = Math.floor(50 * Math.pow(1.2, playerLevel - 1));
    
    const reward = LEVEL_REWARDS[playerLevel] || { coins: 100, bonus: "Бонусный приз" };
    
    if (reward.coins > 0) {
        coins += reward.coins;
        document.getElementById('coinsLabel').textContent = coins;
    }
    
    applyLevelBonus(playerLevel, reward.bonus);
    
    showRewardPanel(playerLevel, reward);
    updateLevelDisplay();
}

function applyLevelBonus(level, bonus) {
    switch(level) {
        case 2:
            harvestBonus += 1;
            break;
        case 3:
            growthMultiplier *= 0.9;
            break;
        case 4:
            harvestBonus += 2;
            break;
        case 5:
            growthMultiplier *= 0.8;
            break;
        case 6:
            seedsInventory.wheat += 10;
            seedsInventory.carrot += 10;
            seedsInventory.corn += 10;
            break;
        case 7:
            harvestBonus += 3;
            break;
        case 8:
            growthMultiplier *= 0.7;
            break;
        case 9:
            harvestBonus += 5;
            break;
        case 10:
            harvestBonus += 10;
            tools.scythe = true;
            tools.hoe = true;
            tools.watering_can = true;
            break;
    }
    
    showMessage(`Бонус уровня ${level}: ${bonus}`);
}

function showRewardPanel(level, reward) {
    audioManager.playSound('harvest');
    
    document.getElementById('rewardIcon').textContent = getLevelIcon(level);
    document.getElementById('rewardTitle').textContent = `Уровень ${level} достигнут!`;
    document.getElementById('rewardDesc').textContent = getLevelDescription(level);
    document.getElementById('rewardAmount').textContent = reward.coins;
    document.getElementById('nextLevelProgress').textContent = nextLevelThreshold;
    
    document.getElementById('rewardsPanel').style.display = 'block';
}

function getLevelIcon(level) {
    if (level === 10) return '🏆';
    if (level >= 7) return '⭐';
    if (level >= 4) return '🌟';
    return '🎯';
}

function getLevelDescription(level) {
    const descriptions = {
        1: "Добро пожаловать в FarmQuest!",
        2: "Вы становитесь опытнее!",
        3: "Ваши навыки растут!",
        4: "Вы - уверенный фермер!",
        5: "Мастер земледелия!",
        6: "Эксперт по урожаю!",
        7: "Великий фермер!",
        8: "Легенда фермерства!",
        9: "Повелитель урожая!",
        10: "ВЕЛИЧАЙШИЙ ФЕРМЕР ВСЕХ ВРЕМЁН!"
    };
    return descriptions[level] || "Новая вершина достигнута!";
}

function closeRewardPanel() {
    audioManager.playSound('click');
    document.getElementById('rewardsPanel').style.display = 'none';
    updateContent(currentLocation);
}

function showLevelInfo() {
    audioManager.playSound('click');
    
    let info = `📊 Статистика уровня:\n`;
    info += `Текущий уровень: ${playerLevel}\n`;
    info += `Собрано всего: ${totalHarvested} урожая\n`;
    info += `Прогресс: ${levelProgress}/${nextLevelThreshold}\n\n`;
    info += `Бонусы уровня ${playerLevel}:\n`;
    info += `+${harvestBonus} монет за сбор\n`;
    info += `Скорость роста: ${Math.round((1/growthMultiplier)*100)}%\n\n`;
    
    if (playerLevel < 10) {
        const nextReward = LEVEL_REWARDS[playerLevel + 1];
        info += `Следующий уровень (${playerLevel + 1}):\n`;
        info += `Награда: ${nextReward.coins} монет\n`;
        info += `Бонус: ${nextReward.bonus}`;
    } else {
        info += `🎉 Вы достигли максимального уровня!`;
    }
    
    alert(info);
}

function saveGameProgress() {
    const progress = {
        totalHarvested,
        playerLevel,
        levelProgress,
        nextLevelThreshold,
        coins,
        seedsInventory,
        tools,
        equipment,
        growthMultiplier,
        harvestBonus
    };
    localStorage.setItem('farmquest_game_progress', JSON.stringify(progress));
}

function loadGameProgress() {
    const saved = localStorage.getItem('farmquest_game_progress');
    if (saved) {
        const progress = JSON.parse(saved);
        totalHarvested = progress.totalHarvested || 0;
        playerLevel = progress.playerLevel || 1;
        levelProgress = progress.levelProgress || 0;
        nextLevelThreshold = progress.nextLevelThreshold || 50;
        coins = progress.coins || 100;
        seedsInventory = progress.seedsInventory || {'wheat': 5, 'carrot': 3, 'corn': 2};
        tools = progress.tools || {'scythe': false, 'hoe': false, 'watering_can': false};
        equipment = progress.equipment || {'tractor': false, 'irrigation': false, 'second_field': false};
        growthMultiplier = progress.growthMultiplier || 1;
        harvestBonus = progress.harvestBonus || 0;
    }
}

function goToMainMenu() {
    audioManager.playSound('click');
    window.location.href = 'screentest(1).html';
}

document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('farmquest_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('currentCharLabel').textContent = currentUser.username;
    }
    
    loadProgressFromServer();
    
    updateLevelDisplay();
    selectLocation('farm');
    
    startAutoSave();
    
    document.querySelectorAll('.map-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            audioManager.playSound('click');
            selectLocation(this.dataset.location);
        });
    });
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            audioManager.playSound('click');
            selectLocation(this.dataset.tab);
        });
    });
    
    const musicBtn = document.getElementById('musicToggle');
    const sfxBtn = document.getElementById('sfxToggle');
    
    if (musicBtn) {
        musicBtn.textContent = audioManager.musicEnabled ? '🎵' : '🔇';
        musicBtn.classList.toggle('active', audioManager.musicEnabled);
    }
    
    if (sfxBtn) {
        sfxBtn.textContent = audioManager.sfxEnabled ? '🔊' : '🔇';
        sfxBtn.classList.toggle('active', audioManager.sfxEnabled);
    }
});

function selectLocation(location) {
    currentLocation = location;
    document.querySelectorAll('.map-tile').forEach(tile => {
        tile.classList.toggle('active', tile.dataset.location === location);
    });
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === location);
    });
    const titles = {
        'farm': 'Поля', 'seeds': 'Магазин семян', 'tools': 'Инструменты',
        'equipment': 'Оборудование', 'minigames': 'Миниигры'
    };
    document.getElementById('detailTitle').textContent = titles[location] || 'Поля';
    updateContent(location);
}

function updateContent(location) {
    const content = document.getElementById('detailContent');
    if (!content) return;
    
    if (location === 'farm') {
        content.innerHTML = `
            <div class="farm-with-selector">
                <div class="seed-selector">
                    <div class="seed-option ${selectedSeed === 'wheat' ? 'active' : ''}" onclick="selectSeedType('wheat')">
                        <span class="seed-emoji">🌾</span>
                        <div>
                            <div><strong>Пшеница</strong></div>
                            <div class="seed-info">${seedsInventory.wheat} шт.</div>
                        </div>
                    </div>
                    <div class="seed-option ${selectedSeed === 'carrot' ? 'active' : ''}" onclick="selectSeedType('carrot')">
                        <span class="seed-emoji">🥕</span>
                        <div>
                            <div><strong>Морковь</strong></div>
                            <div class="seed-info">${seedsInventory.carrot} шт.</div>
                        </div>
                    </div>
                    <div class="seed-option ${selectedSeed === 'corn' ? 'active' : ''}" onclick="selectSeedType('corn')">
                        <span class="seed-emoji">🌽</span>
                        <div>
                            <div><strong>Кукуруза</strong></div>
                            <div class="seed-info">${seedsInventory.corn} шт.</div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;">
                    <div class="single-farm">
                        <div class="single-farm-header">
                            <div class="single-farm-title">Поле 1 (основное)</div>
                            <div class="single-farm-tools">
                                Бонус: +${harvestBonus} монет • Скорость: ${Math.round((1/growthMultiplier)*100)}%
                            </div>
                        </div>
                        <div class="farm-grid" id="farmGrid1"></div>
                    </div>
                    ${equipment.second_field ? `
                    <div class="single-farm" style="margin-top:15px;">
                        <div class="single-farm-header">
                            <div class="single-farm-title">Поле 2 (дополнительное)</div>
                            <div class="single-farm-tools">
                                Бонус: +${harvestBonus} монет • Скорость: ${Math.round((1/growthMultiplier)*100)}%
                            </div>
                        </div>
                        <div class="farm-grid" id="farmGrid2"></div>
                    </div>
                    ` : ''}
                    <p style="font-size:12px; color:#777; text-align:center; margin-top:10px;">
                        Нажимайте на клетки: пусто → вспахано → посеяно → (растёт) → готово → пусто.
                    </p>
                </div>
            </div>
        `;
        
        createFarmGrid('farmGrid1', 0);
        if (equipment.second_field) {
            createFarmGrid('farmGrid2', 9);
        }
        
    } else if (location === 'seeds') {
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Покупка пакетов семян. За каждую покупку вы получаете 5 штук.
                </p>
                <div class="seeds-shop" id="seedsShop">
                    ${Object.entries(SEEDS).map(([id, seed]) => `
                        <div class="seed-item">
                            <div class="seed-header">
                                <span class="emoji">${seed.emoji}</span>
                                <div class="seed-name">${seed.name}</div>
                            </div>
                            <div class="seed-desc">Растёт ${seed.growTime/1000} сек, даёт ${seed.reward} монет</div>
                            <div class="seed-footer">
                                <div>
                                    <div class="seed-price">${seed.price} монет</div>
                                    <div class="seed-owned ${seedsInventory[id] > 0 ? '' : 'none'}">
                                        На складе: ${seedsInventory[id]} шт.
                                    </div>
                                </div>
                                <button class="seed-buy-btn" onclick="buySeed('${id}')">Купить (5 шт.)</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'tools') {
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Инструменты увеличивают монеты за каждый сбор урожая.
                </p>
                <div class="shop-list" id="toolsShop">
                    ${TOOLS_SHOP.map(tool => `
                        <div class="shop-item">
                            <div class="shop-header">
                                <span class="emoji">${tool.emoji}</span>
                                <div class="shop-name">${tool.name}</div>
                            </div>
                            <div class="shop-desc">${tool.desc}</div>
                            <div class="shop-footer">
                                <div>
                                    <div class="shop-price">${tool.price} монет</div>
                                    <div class="shop-owned ${tools[tool.id] ? '' : 'none'}">
                                        ${tools[tool.id] ? 'Куплено' : 'Не куплено'}
                                    </div>
                                </div>
                                <button class="shop-buy-btn" ${tools[tool.id] ? 'disabled' : ''} onclick="buyTool('${tool.id}')">
                                    Купить
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'equipment') {
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Оборудование ускоряет рост растений и открывает новое поле.
                </p>
                <div class="shop-list" id="equipmentShop">
                    ${EQUIPMENT_SHOP.map(item => `
                        <div class="shop-item">
                            <div class="shop-header">
                                <span class="emoji">${item.emoji}</span>
                                <div class="shop-name">${item.name}</div>
                            </div>
                            <div class="shop-desc">${item.desc}</div>
                            <div class="shop-footer">
                                <div>
                                    <div class="shop-price">${item.price} монет</div>
                                    <div class="shop-owned ${equipment[item.id] ? '' : 'none'}">
                                        ${equipment[item.id] ? 'Куплено' : 'Не куплено'}
                                    </div>
                                </div>
                                <button class="shop-buy-btn" ${equipment[item.id] ? 'disabled' : ''} onclick="buyEquipment('${item.id}')">
                                    Купить
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'minigames') {
        content.innerHTML = `
            <div class="minigames-placeholder">
                Здесь доступны миниигры, за которые можно получить дополнительные монеты.
                <div class="minigame-card">
                    🎣 Рыбалка, 🐰 Поймай морковку и 🐇 Кролик-змейка<br>
                    <button class="seed-buy-btn" style="margin-top:6px; padding:6px 14px;" onclick="openMinigame()">
                        Открыть окно миниигр
                    </button>
                </div>
            </div>
        `;
    }
}

function createFarmGrid(gridId, startIndex) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const globalIndex = startIndex + i;
        const tile = document.createElement('div');
        const seedType = plantedSeed[globalIndex];
        
        tile.className = `tile ${farmState[globalIndex]}`;
        tile.dataset.index = globalIndex;
        
        if (farmState[globalIndex] === 'empty') {
            tile.innerHTML = '⬜';
        } else if (farmState[globalIndex] === 'tilled') {
            tile.innerHTML = '🪓';
        } else if (farmState[globalIndex] === 'planted') {
            tile.innerHTML = seedType ? SEEDS[seedType].emoji : '🌱';
        } else if (farmState[globalIndex] === 'ready') {
            tile.innerHTML = '✅';
        }
        
        tile.addEventListener('click', () => handleTileClick(globalIndex, tile));
        grid.appendChild(tile);
    }
}

function selectSeedType(seedType) {
    audioManager.playSound('click');
    selectedSeed = seedType;
    updateContent('farm');
}

function handleTileClick(index, tileElement) {
    if (!tileElement) {
        tileElement = document.querySelector(`[data-index="${index}"]`);
    }
    
    switch(farmState[index]) {
        case 'empty':
            audioManager.playSound('click');
            farmState[index] = 'tilled';
            tileElement.className = 'tile tilled';
            tileElement.innerHTML = '🪓';
            break;
            
        case 'tilled':
            if (seedsInventory[selectedSeed] > 0) {
                audioManager.playSound('plant');
                farmState[index] = 'planted';
                plantedSeed[index] = selectedSeed;
                plantedTime[index] = Date.now();
                seedsInventory[selectedSeed]--;
                tileElement.className = 'tile planted';
                tileElement.innerHTML = SEEDS[selectedSeed].emoji;
                
                setTimeout(() => {
                    if (farmState[index] === 'planted') {
                        farmState[index] = 'ready';
                        const currentTile = document.querySelector(`[data-index="${index}"]`);
                        if (currentTile) {
                            currentTile.className = 'tile ready';
                            currentTile.innerHTML = '✅';
                        }
                    }
                }, SEEDS[selectedSeed].growTime * growthMultiplier);
            } else {
                audioManager.playSound('error');
                showMessage(`Нет семян ${SEEDS[selectedSeed].name}!`);
            }
            break;
            
        case 'planted':
            audioManager.playSound('error');
            showMessage('Ещё растёт...');
            break;
            
        case 'ready':
            const seedType = plantedSeed[index];
            const baseReward = SEEDS[seedType].reward;
            const totalReward = baseReward + harvestBonus;
            
            audioManager.playSound('harvest');
            coins += totalReward;
            document.getElementById('coinsLabel').textContent = coins;
            
            farmState[index] = 'empty';
            plantedSeed[index] = '';
            tileElement.className = 'tile empty';
            tileElement.innerHTML = '⬜';
            
            addHarvest(1);
            
            showMessage(`Собрано +${totalReward} монет! (+1 к уровню)`);
            break;
    }
}

function buySeed(seedId) {
    const seed = SEEDS[seedId];
    if (coins >= seed.price) {
        audioManager.playSound('buy');
        coins -= seed.price;
        seedsInventory[seedId] += 5;
        document.getElementById('coinsLabel').textContent = coins;
        showMessage(`Куплено 5 семян ${seed.name}!`);
        updateContent('seeds');
    } else {
        audioManager.playSound('error');
        showMessage('Недостаточно монет!');
    }
}

function buyTool(toolId) {
    const tool = TOOLS_SHOP.find(t => t.id === toolId);
    if (!tool) return;
    
    if (coins >= tool.price) {
        audioManager.playSound('buy');
        coins -= tool.price;
        tools[toolId] = true;
        harvestBonus += tool.bonus;
        document.getElementById('coinsLabel').textContent = coins;
        showMessage(`Куплено: ${tool.name}!`);
        updateContent('tools');
    } else {
        audioManager.playSound('error');
        showMessage('Недостаточно монет!');
    }
}

function buyEquipment(itemId) {
    const item = EQUIPMENT_SHOP.find(e => e.id === itemId);
    if (!item) return;
    
    if (coins >= item.price) {
        audioManager.playSound('buy');
        coins -= item.price;
        equipment[itemId] = true;
        
        if (itemId === 'tractor' || itemId === 'irrigation') {
            growthMultiplier *= item.effect;
        }
        
        document.getElementById('coinsLabel').textContent = coins;
        showMessage(`Куплено: ${item.name}!`);
        updateContent('equipment');
        
        if (itemId === 'second_field') {
            setTimeout(() => updateContent('farm'), 100);
        }
    } else {
        audioManager.playSound('error');
        showMessage('Недостаточно монет!');
    }
}

function openMinigame() {
    audioManager.playSound('click');
    document.getElementById('minigameModal').style.display = 'flex';
}

function closeMinigame() {
    audioManager.playSound('click');
    document.getElementById('minigameModal').style.display = 'none';
}

function startFishingGame() {
    audioManager.playSound('click');
    document.getElementById('minigameArea').innerHTML = `
        <h3>🎣 Рыбалка</h3>
        <p>Ловите рыбу, нажимая на кнопку!</p>
        <button onclick="catchFish()" style="padding:10px 20px; font-size:16px; margin:10px;">
            🎣 Забросить удочку
        </button>
        <div id="fishingResult"></div>
    `;
}

function catchFish() {
    audioManager.playSound('fishCatch');
    const fish = ['🐟 (+3 монеты)', '🐠 (+5 монет)', '🐡 (+8 монет)', '🩴 (ничего)', '🗑 (ничего)'];
    const result = fish[Math.floor(Math.random() * fish.length)];
    const reward = result.includes('+3') ? 3 : result.includes('+5') ? 5 : result.includes('+8') ? 8 : 0;
    
    if (reward > 0) {
        audioManager.playSound('coin');
        coins += reward;
        document.getElementById('coinsLabel').textContent = coins;
        addHarvest(1);
    }
    
    document.getElementById('fishingResult').innerHTML = `
        <p>Вы поймали: ${result}</p>
        <button onclick="catchFish()" style="padding:8px 16px; margin-top:10px;">
            🎣 Забросить снова
        </button>
    `;
}

function startCarrotGame() {
    audioManager.playSound('click');
    document.getElementById('minigameArea').innerHTML = `
        <h3>🐰 Поймай морковку</h3>
        <p>Кликайте на падающие морковки!</p>
        <div style="position:relative; height:200px; border:1px solid #ccc; border-radius:8px; overflow:hidden; margin:10px 0;">
            <div id="carrotGameArea"></div>
        </div>
        <button onclick="startCarrotDropping()" style="padding:10px 20px; font-size:16px;">
            🐰 Начать игру
        </button>
        <div id="carrotScore">Очки: 0</div>
    `;
}

function startCarrotDropping() {
    audioManager.playSound('click');
    const area = document.getElementById('carrotGameArea');
    area.innerHTML = '';
    let score = 0;
    const updateScore = () => {
        document.getElementById('carrotScore').textContent = `Очки: ${score}`;
    };
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const carrot = document.createElement('div');
            carrot.style.cssText = `
                position: absolute;
                top: -30px;
                left: ${20 + Math.random() * 80}%;
                font-size: 30px;
                cursor: pointer;
                animation: fall 2s linear;
            `;
            carrot.innerHTML = '🥕';
            carrot.onclick = () => {
                audioManager.playSound('carrotCatch');
                score += 2;
                coins += 2;
                document.getElementById('coinsLabel').textContent = coins;
                updateScore();
                carrot.remove();
                addHarvest(1);
            };
            area.appendChild(carrot);
            
            setTimeout(() => carrot.remove(), 2000);
        }, i * 500);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            from { top: -30px; }
            to { top: 170px; }
        }
    `;
    document.head.appendChild(style);
}

function startSnakeGame() {
    audioManager.playSound('click');
    document.getElementById('minigameArea').innerHTML = `
        <h3>🐇 Кролик-змейка</h3>
        <p>Управляйте кроликом и собирайте морковки! Стрелки на клавиатуре или кнопки ниже.</p>
        <canvas id="snakeCanvas" width="400" height="400"></canvas>
        <div class="snake-info">
            <div>Собрано морковок: <span id="snakeScore">0</span></div>
            <div>Приз: <span id="snakePrize">0</span> монет</div>
        </div>
        <div class="snake-controls">
            <div class="snake-row">
                <button class="snake-btn" onclick="snakeChangeDirection('up')">⬆️</button>
            </div>
            <div class="snake-row">
                <button class="snake-btn" onclick="snakeChangeDirection('left')">⬅️</button>
                <button class="snake-btn" onclick="snakePauseResume()">⏯️</button>
                <button class="snake-btn" onclick="snakeChangeDirection('right')">➡️</button>
            </div>
            <div class="snake-row">
                <button class="snake-btn" onclick="snakeChangeDirection('down')">⬇️</button>
            </div>
        </div>
        <div style="margin-top:10px;">
            <button class="seed-buy-btn" onclick="snakeRestartGame()">🔄 Начать заново</button>
        </div>
    `;
    
    if (typeof SnakeGame !== 'undefined') {
        snakeGameInstance = new SnakeGame(
            'snakeCanvas', 
            'snakeScore', 
            'snakePrize', 
            function(score, prize) {
                if (prize > 0) {
                    audioManager.playSound('harvest');
                    coins += prize;
                    document.getElementById('coinsLabel').textContent = coins;
                    addHarvest(score);
                    showMessage(`Игра окончена! Вы получили ${prize} монет и ${score} к уровню!`);
                }
            }
        );
        snakeGameInstance.start();
    }
}

function snakeChangeDirection(dir) {
    audioManager.playSound('click');
    if (snakeGameInstance) {
        snakeGameInstance.changeDirection(dir);
    }
}

function snakePauseResume() {
    audioManager.playSound('click');
    if (snakeGameInstance) {
        snakeGameInstance.pauseResume();
    }
}

function snakeRestartGame() {
    audioManager.playSound('click');
    if (snakeGameInstance) {
        snakeGameInstance.start();
    }
}

function showMessage(text) {
    const message = document.createElement('div');
    message.style.cssText = 'position:fixed; top:20px; right:20px; background:#4b8b3b; color:white; padding:10px 15px; border-radius:10px; z-index:1000; animation:fadeInOut 3s;';
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => {
        if (message && message.parentNode) {
            message.remove();
        }
    }, 3000);
    
    if (!document.querySelector('#messageStyle')) {
        const style = document.createElement('style');
        style.id = 'messageStyle';
        style.textContent = '@keyframes fadeInOut {0% { opacity:0; transform:translateX(100px); }10% { opacity:1; transform:translateX(0); }90% { opacity:1; transform:translateX(0); }100% { opacity:0; transform:translateX(100px); }}';
        document.head.appendChild(style);
    }
}

function toggleMusic() {
    const enabled = audioManager.toggleMusic();
    const btn = document.getElementById('musicToggle');
    if (btn) {
        btn.textContent = enabled ? '🎵' : '🔇';
        btn.classList.toggle('active', enabled);
        audioManager.playSound('click');
    }
}

function toggleSFX() {
    const enabled = audioManager.toggleSFX();
    const btn = document.getElementById('sfxToggle');
    if (btn) {
        btn.textContent = enabled ? '🔊' : '🔇';
        btn.classList.toggle('active', enabled);
        audioManager.playSound('click');
    }
}

async function saveProgressToServer() {
    if (!currentUser || currentUser.isGuest) {
        console.log('Гость не может сохранять прогресс на сервер');
        return false;
    }
    
    const progress = {
        farmState,
        plantedTime,
        plantedSeed,
        coins,
        selectedSeed,
        seedsInventory,
        tools,
        equipment,
        growthMultiplier,
        harvestBonus,
        totalHarvested,
        playerLevel,
        levelProgress,
        nextLevelThreshold,
        lastSave: Date.now()
    };
    
    try {
        const response = await fetch('/api/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser.username,
                progress: progress
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Прогресс сохранен на сервер');
            showMessage('Прогресс сохранен в облако! ☁️');
            return true;
        }
    } catch (error) {
        console.error('Ошибка сохранения на сервер:', error);
        showMessage('Не удалось сохранить в облако 😢');
    }
    return false;
}

async function loadProgressFromServer() {
    if (!currentUser || currentUser.isGuest) {
        console.log('Гость загружает из localStorage');
        loadGameProgress();
        return;
    }
    
    try {
        const response = await fetch(`/api/load-progress/${currentUser.username}`);
        const result = await response.json();
        
        if (result.success && result.progress) {
            const progress = result.progress;
            
            farmState = progress.farmState || Array(18).fill('empty');
            plantedTime = progress.plantedTime || Array(18).fill(0);
            plantedSeed = progress.plantedSeed || Array(18).fill('');
            coins = progress.coins || 100;
            selectedSeed = progress.selectedSeed || 'wheat';
            seedsInventory = progress.seedsInventory || {'wheat': 5, 'carrot': 3, 'corn': 2};
            tools = progress.tools || {'scythe': false, 'hoe': false, 'watering_can': false};
            equipment = progress.equipment || {'tractor': false, 'irrigation': false, 'second_field': false};
            growthMultiplier = progress.growthMultiplier || 1;
            harvestBonus = progress.harvestBonus || 0;
            
            totalHarvested = progress.totalHarvested || 0;
            playerLevel = progress.playerLevel || 1;
            levelProgress = progress.levelProgress || 0;
            nextLevelThreshold = progress.nextLevelThreshold || 50;
            
            document.getElementById('coinsLabel').textContent = coins;
            updateLevelDisplay();
            
            restoreGrowthTimers();
            
            showMessage('Прогресс загружен из облака! ☁️');
            console.log('Прогресс загружен с сервера');
        } else {
            loadGameProgress();
        }
    } catch (error) {
        console.error('Ошибка загрузки с сервера:', error);
        loadGameProgress();
    }
}

function restoreGrowthTimers() {
    const now = Date.now();
    
    for (let i = 0; i < plantedTime.length; i++) {
        if (farmState[i] === 'planted' && plantedSeed[i] && plantedTime[i] > 0) {
            const seedType = plantedSeed[i];
            const growTime = SEEDS[seedType].growTime * growthMultiplier;
            const timePassed = now - plantedTime[i];
            const timeLeft = growTime - timePassed;
            
            if (timeLeft > 0) {
                setTimeout(() => {
                    if (farmState[i] === 'planted') {
                        farmState[i] = 'ready';
                        const tile = document.querySelector(`[data-index="${i}"]`);
                        if (tile) {
                            tile.className = 'tile ready';
                            tile.innerHTML = '✅';
                        }
                    }
                }, timeLeft);
            } else {
                farmState[i] = 'ready';
            }
        }
    }
}

function saveGameProgress() {
    const progress = {
        totalHarvested,
        playerLevel,
        levelProgress,
        nextLevelThreshold,
        coins,
        seedsInventory,
        tools,
        equipment,
        growthMultiplier,
        harvestBonus,
        farmState,
        plantedTime,
        plantedSeed,
        selectedSeed
    };
    localStorage.setItem('farmquest_game_progress', JSON.stringify(progress));
    
    if (currentUser && !currentUser.isGuest) {
        setTimeout(() => saveProgressToServer(), 100);
    }
}

let autoSaveInterval;
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        if (currentUser && (farmState.includes('planted') || farmState.includes('ready'))) {
            saveGameProgress();
            console.log('Автосохранение выполнено');
        }
    }, 30000);
}
