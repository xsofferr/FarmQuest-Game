let currentUser = null;
let users = JSON.parse(localStorage.getItem('farmquest_users')) || [];
let characterData = {
    type: 'male',
    hat: 'none',
    shirt: 'green',
    tool: 'none',
    name: 'Фермер'
};

const currentUserLabel = document.getElementById('currentUserLabel');
const logoutBtn = document.getElementById('logoutBtn');
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
let tractorGameInstance = null;

let totalHarvested = 0;
let playerLevel = 1;
let levelProgress = 0;
let nextLevelThreshold = 50;
let skillPoints = 0;

let animalProducts = {
    milk: 0,
    eggs: 0,
    wool: 0
};

let animals = [
    { id: 'chicken', name: 'Курица', emoji: '🐔', price: 50, owned: 0, max: 5, production: 'eggs', timeToProduce: 10000, lastProduction: 0, feedLevel: 100 },
    { id: 'cow', name: 'Корова', emoji: '🐄', price: 150, owned: 0, max: 3, production: 'milk', timeToProduce: 15000, lastProduction: 0, feedLevel: 100 },
    { id: 'sheep', name: 'Овца', emoji: '🐑', price: 100, owned: 0, max: 4, production: 'wool', timeToProduce: 20000, lastProduction: 0, feedLevel: 100 },
    { id: 'pig', name: 'Свинья', emoji: '🐷', price: 120, owned: 0, max: 3, production: 'eggs', timeToProduce: 12000, lastProduction: 0, feedLevel: 100 },
    { id: 'goat', name: 'Коза', emoji: '🐐', price: 80, owned: 0, max: 4, production: 'milk', timeToProduce: 13000, lastProduction: 0, feedLevel: 100 },
    { id: 'rabbit', name: 'Кролик', emoji: '🐇', price: 40, owned: 0, max: 6, production: 'wool', timeToProduce: 8000, lastProduction: 0, feedLevel: 100 }
];

let skills = [
    { id: 'harvesting', name: 'Сбор урожая', emoji: '🌾', level: 1, maxLevel: 10, desc: 'Увеличивает монеты за сбор урожая', effect: 0, nextCost: 5 },
    { id: 'growth', name: 'Скорость роста', emoji: '⚡', level: 1, maxLevel: 10, desc: 'Ускоряет рост растений', effect: 0, nextCost: 5 },
    { id: 'animal_care', name: 'Уход за животными', emoji: '🐄', level: 1, maxLevel: 10, desc: 'Животные производят больше продукции', effect: 0, nextCost: 5 },
    { id: 'animal_speed', name: 'Скорость животных', emoji: '🐇', level: 1, maxLevel: 10, desc: 'Животные производят быстрее', effect: 0, nextCost: 5 },
    { id: 'minigame_bonus', name: 'Бонус миниигр', emoji: '🎮', level: 1, maxLevel: 10, desc: 'Увеличивает награды в минииграх', effect: 0, nextCost: 5 },
    { id: 'discount', name: 'Скидки', emoji: '💰', level: 1, maxLevel: 10, desc: 'Снижает цены в магазинах', effect: 0, nextCost: 5 }
];

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
    loadCharacter();
    loadAnimals();
    loadSkills();
    
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
    
    startAnimalProduction();
    updateSkillPointsDisplay();
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

function loadCharacter() {
    const savedCharacter = localStorage.getItem('farmquest_character');
    if (savedCharacter) {
        characterData = JSON.parse(savedCharacter);
    }
    updateCharacterPreview();
    updateCharacterMiniPreview();
}

function loadAnimals() {
    const savedAnimals = localStorage.getItem('farmquest_animals');
    if (savedAnimals) {
        animals = JSON.parse(savedAnimals);
    }
    
    const savedProducts = localStorage.getItem('farmquest_animal_products');
    if (savedProducts) {
        animalProducts = JSON.parse(savedProducts);
    }
    
    updateAnimalProductsDisplay();
}

function loadSkills() {
    const savedSkills = localStorage.getItem('farmquest_skills');
    if (savedSkills) {
        skills = JSON.parse(savedSkills);
    }
    applySkillEffects();
}

function updateAnimalProductsDisplay() {
    document.getElementById('milkLabel').textContent = animalProducts.milk;
    document.getElementById('eggsLabel').textContent = animalProducts.eggs;
    document.getElementById('woolLabel').textContent = animalProducts.wool;
}

function updateSkillPointsDisplay() {
    document.getElementById('skillPointsLabel').textContent = skillPoints;
}

function updateCharacterPreview() {
    const display = document.getElementById('characterDisplay');
    const nameDisplay = document.getElementById('characterNameDisplay');
    const hatElement = document.getElementById('characterHat');
    const shirtElement = document.getElementById('characterShirt');
    const toolElement = document.getElementById('characterTool');
    const nameInput = document.getElementById('characterNameInput');
    
    if (!display) return;
    
    const baseElement = display.querySelector('.character-base');
    if (baseElement) {
        baseElement.textContent = characterData.type === 'male' ? '👨' : '👩';
    }
    
    const hats = {
        'none': '',
        'straw': '👒',
        'cowboy': '🤠',
        'tophat': '🎩',
        'cap': '🧢'
    };
    
    const shirts = {
        'green': '🟢',
        'blue': '🔵',
        'red': '🔴',
        'overall': '👖',
        'fancy': '👔'
    };
    
    const tools = {
        'none': '',
        'hoe': '⛏️',
        'scythe': '🔪',
        'watering': '🚰',
        'pitchfork': '🍴'
    };
    
    if (hatElement) hatElement.textContent = hats[characterData.hat] || '';
    if (shirtElement) shirtElement.textContent = shirts[characterData.shirt] || '';
    if (toolElement) toolElement.textContent = tools[characterData.tool] || '';
    if (nameDisplay) nameDisplay.textContent = `Имя: ${characterData.name}`;
    if (nameInput) nameInput.value = characterData.name;
    
    updateOptionButtons();
}

function updateCharacterMiniPreview() {
    const miniDisplay = document.getElementById('characterDisplayMini');
    if (!miniDisplay) return;
    
    const hats = {
        'none': '',
        'straw': '👒',
        'cowboy': '🤠',
        'tophat': '🎩',
        'cap': '🧢'
    };
    
    const shirts = {
        'green': '🟢',
        'blue': '🔵',
        'red': '🔴',
        'overall': '👖',
        'fancy': '👔'
    };
    
    const tools = {
        'none': '',
        'hoe': '⛏️',
        'scythe': '🔪',
        'watering': '🚰',
        'pitchfork': '🍴'
    };
    
    miniDisplay.innerHTML = `
        <div class="character-base-mini">${characterData.type === 'male' ? '👨' : '👩'}</div>
        ${characterData.hat !== 'none' ? `<div class="character-hat-mini">${hats[characterData.hat]}</div>` : ''}
        ${characterData.shirt !== 'none' ? `<div class="character-shirt-mini">${shirts[characterData.shirt]}</div>` : ''}
        ${characterData.tool !== 'none' ? `<div class="character-tool-mini">${tools[characterData.tool]}</div>` : ''}
    `;
}

function updateOptionButtons() {
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const typeBtns = document.querySelectorAll(`.option-btn[onclick*="selectCharacterType('${characterData.type}')"]`);
    typeBtns.forEach(btn => btn.classList.add('active'));
    
    const hatBtns = document.querySelectorAll(`.option-btn[onclick*="selectHat('${characterData.hat}')"]`);
    hatBtns.forEach(btn => btn.classList.add('active'));
    
    const shirtBtns = document.querySelectorAll(`.option-btn[onclick*="selectShirt('${characterData.shirt}')"]`);
    shirtBtns.forEach(btn => btn.classList.add('active'));
    
    const toolBtns = document.querySelectorAll(`.option-btn[onclick*="selectTool('${characterData.tool}')"]`);
    toolBtns.forEach(btn => btn.classList.add('active'));
}

function openCharacterCreator() {
    audioManager.playSound('click');
    document.getElementById('characterModal').style.display = 'flex';
    updateCharacterPreview();
}

function closeCharacterCreator() {
    audioManager.playSound('click');
    document.getElementById('characterModal').style.display = 'none';
}

function selectCharacterType(type) {
    audioManager.playSound('click');
    characterData.type = type;
    updateCharacterPreview();
}

function selectHat(hat) {
    audioManager.playSound('click');
    characterData.hat = hat;
    updateCharacterPreview();
}

function selectShirt(shirt) {
    audioManager.playSound('click');
    characterData.shirt = shirt;
    updateCharacterPreview();
}

function selectTool(tool) {
    audioManager.playSound('click');
    characterData.tool = tool;
    updateCharacterPreview();
}

function saveCharacter() {
    const nameInput = document.getElementById('characterNameInput');
    if (nameInput) {
        const name = nameInput.value.trim();
        if (name.length === 0) {
            alert('Введите имя персонажа!');
            return;
        }
        if (name.length > 20) {
            alert('Имя не должно превышать 20 символов!');
            return;
        }
        characterData.name = name;
    }
    
    localStorage.setItem('farmquest_character', JSON.stringify(characterData));
    updateCharacterMiniPreview();
    
    audioManager.playSound('buy');
    showMessage('Персонаж сохранен!');
    closeCharacterCreator();
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
    
    skillPoints += 2;
    updateSkillPointsDisplay();
    
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
        2: "Вы становитесь опытнее! Получено 2 очка навыков!",
        3: "Ваши навыки растут! Получено 2 очка навыков!",
        4: "Вы - уверенный фермер! Получено 2 очка навыков!",
        5: "Мастер земледелия! Получено 2 очка навыков!",
        6: "Эксперт по урожаю! Получено 2 очка навыков!",
        7: "Великий фермер! Получено 2 очка навыков!",
        8: "Легенда фермерства! Получено 2 очка навыков!",
        9: "Повелитель урожая! Получено 2 очка навыков!",
        10: "ВЕЛИЧАЙШИЙ ФЕРМЕР ВСЕХ ВРЕМЁН! Получено 2 очка навыков!"
    };
    return descriptions[level] || "Новая вершина достигнута! Получено 2 очка навыков!";
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
    info += `Прогресс: ${levelProgress}/${nextLevelThreshold}\n`;
    info += `Очки навыков: ${skillPoints}\n\n`;
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
        harvestBonus,
        animals,
        animalProducts,
        skills,
        skillPoints
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
        
        if (progress.animals) animals = progress.animals;
        if (progress.animalProducts) animalProducts = progress.animalProducts;
        if (progress.skills) skills = progress.skills;
        skillPoints = progress.skillPoints || 0;
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
    
    const savedCharacter = localStorage.getItem('farmquest_character');
    if (savedCharacter) {
        characterData = JSON.parse(savedCharacter);
        document.getElementById('currentCharLabel').textContent = characterData.name;
    }
    
    loadProgressFromServer();
    
    updateLevelDisplay();
    selectLocation('farm');
    updateAnimalProductsDisplay();
    updateSkillPointsDisplay();
    
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
        'equipment': 'Оборудование', 'animals': 'Животные', 'skills': 'Навыки', 'minigames': 'Миниигры'
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
                    <div style="text-align:center; margin-top:15px;">
                        <button class="seed-buy-btn" onclick="openSellProductsModal()" style="padding:10px 20px;">
                            🛒 Продать продукцию животных
                        </button>
                    </div>
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
        const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Покупка пакетов семян. За каждую покупку вы получаете 5 штук.
                    ${getSkillEffect('discount') > 0 ? `Скидка: ${getSkillEffect('discount')}%` : ''}
                </p>
                <div class="seeds-shop" id="seedsShop">
                    ${Object.entries(SEEDS).map(([id, seed]) => {
                        const price = Math.max(1, Math.floor(seed.price * discountMultiplier));
                        return `
                            <div class="seed-item">
                                <div class="seed-header">
                                    <span class="emoji">${seed.emoji}</span>
                                    <div class="seed-name">${seed.name}</div>
                                </div>
                                <div class="seed-desc">Растёт ${seed.growTime/1000} сек, даёт ${seed.reward} монет</div>
                                <div class="seed-footer">
                                    <div>
                                        <div class="seed-price">${price} монет</div>
                                        <div class="seed-owned ${seedsInventory[id] > 0 ? '' : 'none'}">
                                            На складе: ${seedsInventory[id]} шт.
                                        </div>
                                    </div>
                                    <button class="seed-buy-btn" onclick="buySeed('${id}')">Купить (5 шт.)</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'tools') {
        const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Инструменты увеличивают монеты за каждый сбор урожая.
                    ${getSkillEffect('discount') > 0 ? `Скидка: ${getSkillEffect('discount')}%` : ''}
                </p>
                <div class="shop-list" id="toolsShop">
                    ${TOOLS_SHOP.map(tool => {
                        const price = Math.max(1, Math.floor(tool.price * discountMultiplier));
                        return `
                            <div class="shop-item">
                                <div class="shop-header">
                                    <span class="emoji">${tool.emoji}</span>
                                    <div class="shop-name">${tool.name}</div>
                                </div>
                                <div class="shop-desc">${tool.desc}</div>
                                <div class="shop-footer">
                                    <div>
                                        <div class="shop-price">${price} монет</div>
                                        <div class="shop-owned ${tools[tool.id] ? '' : 'none'}">
                                            ${tools[tool.id] ? 'Куплено' : 'Не куплено'}
                                        </div>
                                    </div>
                                    <button class="shop-buy-btn" ${tools[tool.id] ? 'disabled' : ''} onclick="buyTool('${tool.id}')">
                                        Купить
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'equipment') {
        const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Оборудование ускоряет рост растений и открывает новое поле.
                    ${getSkillEffect('discount') > 0 ? `Скидка: ${getSkillEffect('discount')}%` : ''}
                </p>
                <div class="shop-list" id="equipmentShop">
                    ${EQUIPMENT_SHOP.map(item => {
                        const price = Math.max(1, Math.floor(item.price * discountMultiplier));
                        return `
                            <div class="shop-item">
                                <div class="shop-header">
                                    <span class="emoji">${item.emoji}</span>
                                    <div class="shop-name">${item.name}</div>
                                </div>
                                <div class="shop-desc">${item.desc}</div>
                                <div class="shop-footer">
                                    <div>
                                        <div class="shop-price">${price} монет</div>
                                        <div class="shop-owned ${equipment[item.id] ? '' : 'none'}">
                                            ${equipment[item.id] ? 'Куплено' : 'Не куплено'}
                                        </div>
                                    </div>
                                    <button class="shop-buy-btn" ${equipment[item.id] ? 'disabled' : ''} onclick="buyEquipment('${item.id}')">
                                        Купить
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
    } else if (location === 'animals') {
        const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
        const animalSpeedMultiplier = 1 - (getSkillEffect('animal_speed') / 100);
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Покупайте животных, ухаживайте за ними и собирайте продукцию!
                    ${getSkillEffect('discount') > 0 ? `Скидка: ${getSkillEffect('discount')}%` : ''}
                    ${getSkillEffect('animal_speed') > 0 ? `Скорость животных: +${getSkillEffect('animal_speed')}%` : ''}
                </p>
                <div style="margin-bottom:10px; text-align:center;">
                    <button class="seed-buy-btn" onclick="openSellProductsModal()" style="padding:8px 16px;">
                        🛒 Продать продукцию животных
                    </button>
                </div>
                <div class="animals-grid" id="animalsGrid">
                    ${animals.map(animal => {
                        const productionEmoji = animal.production === 'milk' ? '🥛' : animal.production === 'eggs' ? '🥚' : '🧶';
                        const productionName = animal.production === 'milk' ? 'молоко' : animal.production === 'eggs' ? 'яйца' : 'шерсть';
                        const progressPercent = animal.feedLevel;
                        const timeSinceLast = Date.now() - animal.lastProduction;
                        const timeToProduce = Math.max(1000, animal.timeToProduce * animalSpeedMultiplier);
                        const productionReady = timeSinceLast >= timeToProduce && animal.feedLevel > 0;
                        const price = Math.max(1, Math.floor(animal.price * discountMultiplier));
                        
                        return `
                            <div class="animal-item">
                                <div class="animal-header">
                                    <span class="emoji">${animal.emoji}</span>
                                    <div class="animal-name">${animal.name}</div>
                                </div>
                                <div class="animal-desc">Производит: ${productionEmoji} ${productionName}</div>
                                <div class="animal-stats">
                                    <div>В наличии: ${animal.owned}/${animal.max}</div>
                                    <div>Корм: ${animal.feedLevel}%</div>
                                </div>
                                <div class="animal-progress">
                                    <div class="animal-progress-fill" style="width: ${progressPercent}%;"></div>
                                </div>
                                <div class="animal-footer">
                                    <div class="animal-price">${price} монет</div>
                                    <button class="animal-buy-btn" ${animal.owned >= animal.max || coins < price ? 'disabled' : ''} onclick="buyAnimal('${animal.id}')">
                                        Купить
                                    </button>
                                    ${animal.owned > 0 ? `
                                        <button class="animal-feed-btn" onclick="feedAnimal('${animal.id}')" ${coins < 5 ? 'disabled' : ''}>
                                            Кормить (5 монет)
                                        </button>
                                        <button class="animal-collect-btn" onclick="collectAnimalProduct('${animal.id}')" ${!productionReady ? 'disabled' : ''}>
                                            Собрать
                                        </button>
                                        <button class="animal-sell-btn" onclick="sellAnimal('${animal.id}')" ${animal.owned <= 0 ? 'disabled' : ''}>
                                            Продать
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:15px; padding:10px; background:#f0f9f0; border-radius:10px; font-size:12px; color:#555;">
                    <strong>Как это работает:</strong><br>
                    1. Купите животных (максимум зависит от вида)<br>
                    2. Кормите животных за 5 монет (увеличивает уровень корма до 100%)<br>
                    3. Ждите, пока животные произведут продукцию (молоко, яйца или шерсть)<br>
                    4. Собирайте продукцию и продавайте её за монеты<br>
                    5. Можно продавать животных обратно по полцены
                </div>
            </div>
        `;
        
    } else if (location === 'skills') {
        content.innerHTML = `
            <div>
                <p style="font-size:13px; color:#777; margin-bottom:6px;">
                    Прокачивайте навыки, чтобы улучшить свою ферму. Очки навыков получаются за каждый новый уровень.
                </p>
                <div class="skills-grid" id="skillsGrid">
                    ${skills.map(skill => {
                        const progressPercent = (skill.level / skill.maxLevel) * 100;
                        const currentEffect = getSkillEffect(skill.id);
                        return `
                            <div class="skill-item">
                                <div class="skill-header">
                                    <span class="emoji">${skill.emoji}</span>
                                    <div class="skill-name">${skill.name}</div>
                                </div>
                                <div class="skill-level">Уровень: ${skill.level}/${skill.maxLevel}</div>
                                <div class="skill-desc">${skill.desc}</div>
                                <div class="skill-progress">
                                    <div class="skill-progress-fill" style="width: ${progressPercent}%;"></div>
                                </div>
                                <div class="skill-footer">
                                    <div class="skill-cost">Стоимость: ${skill.nextCost} очков</div>
                                    <button class="skill-upgrade-btn" ${skillPoints < skill.nextCost || skill.level >= skill.maxLevel ? 'disabled' : ''} onclick="upgradeSkill('${skill.id}')">
                                        Прокачать
                                    </button>
                                </div>
                                <div style="font-size:11px; color:#4b8b3b; margin-top:5px;">
                                    Текущий эффект: ${getSkillDescription(skill.id, currentEffect)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:15px; padding:10px; background:#f0f9f0; border-radius:10px; font-size:12px; color:#555;">
                    <strong>Описание навыков:</strong><br>
                    • Сбор урожая: +1 монета за сбор за каждый уровень<br>
                    • Скорость роста: +10% скорости роста за каждый уровень<br>
                    • Уход за животными: +10% продукции животных за каждый уровень<br>
                    • Скорость животных: +10% скорости производства за каждый уровень<br>
                    • Бонус миниигр: +10% наград в минииграх за каждый уровень<br>
                    • Скидки: -5% цен в магазинах за каждый уровень
                </div>
            </div>
        `;
        
    } else if (location === 'minigames') {
        const minigameBonus = getSkillEffect('minigame_bonus');
        content.innerHTML = `
            <div class="minigames-placeholder">
                Здесь доступны миниигры, за которые можно получить дополнительные монеты.
                ${minigameBonus > 0 ? `<div style="color:#ff9800; font-weight:600; margin-bottom:10px;">Бонус миниигр: +${minigameBonus}% к наградам!</div>` : ''}
                <div class="minigame-card">
                    🎣 Рыбалка, 🐰 Поймай морковку, 🐇 Кролик-змейка и 🚜 Трактор<br>
                    <button class="seed-buy-btn" style="margin-top:6px; padding:6px 14px;" onclick="openMinigame()">
                        Открыть окно миниигр
                    </button>
                </div>
            </div>
        `;
    }
}

function getSkillEffect(skillId) {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return 0;
    
    switch(skillId) {
        case 'harvesting':
            return skill.level * 1;
        case 'growth':
            return skill.level * 10;
        case 'animal_care':
            return skill.level * 10;
        case 'animal_speed':
            return skill.level * 10;
        case 'minigame_bonus':
            return skill.level * 10;
        case 'discount':
            return skill.level * 5;
        default:
            return 0;
    }
}

function getSkillDescription(skillId, effect) {
    switch(skillId) {
        case 'harvesting':
            return `+${effect} монет за сбор`;
        case 'growth':
            return `+${effect}% скорости роста`;
        case 'animal_care':
            return `+${effect}% продукции животных`;
        case 'animal_speed':
            return `+${effect}% скорости производства`;
        case 'minigame_bonus':
            return `+${effect}% наград в минииграх`;
        case 'discount':
            return `-${effect}% цен в магазинах`;
        default:
            return '';
    }
}

function applySkillEffects() {
    const growthSkill = skills.find(s => s.id === 'growth');
    if (growthSkill && growthSkill.level > 1) {
        growthMultiplier = 1 / (1 + (growthSkill.level - 1) * 0.1);
    }
    
    const harvestingSkill = skills.find(s => s.id === 'harvesting');
    if (harvestingSkill && harvestingSkill.level > 1) {
        harvestBonus += (harvestingSkill.level - 1);
    }
}

function upgradeSkill(skillId) {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    
    if (skillPoints < skill.nextCost) {
        audioManager.playSound('error');
        showMessage('Недостаточно очков навыков!');
        return;
    }
    
    if (skill.level >= skill.maxLevel) {
        audioManager.playSound('error');
        showMessage('Достигнут максимальный уровень навыка!');
        return;
    }
    
    audioManager.playSound('buy');
    skillPoints -= skill.nextCost;
    skill.level++;
    skill.nextCost = Math.floor(skill.nextCost * 1.5);
    
    updateSkillPointsDisplay();
    
    applySkillEffects();
    showMessage(`Навык "${skill.name}" повышен до уровня ${skill.level}!`);
    
    updateContent('skills');
    saveGameProgress();
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
    const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
    const seed = SEEDS[seedId];
    const price = Math.max(1, Math.floor(seed.price * discountMultiplier));
    
    if (coins >= price) {
        audioManager.playSound('buy');
        coins -= price;
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
    const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
    const tool = TOOLS_SHOP.find(t => t.id === toolId);
    if (!tool) return;
    
    const price = Math.max(1, Math.floor(tool.price * discountMultiplier));
    
    if (coins >= price) {
        audioManager.playSound('buy');
        coins -= price;
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
    const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
    const item = EQUIPMENT_SHOP.find(e => e.id === itemId);
    if (!item) return;
    
    const price = Math.max(1, Math.floor(item.price * discountMultiplier));
    
    if (coins >= price) {
        audioManager.playSound('buy');
        coins -= price;
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

function buyAnimal(animalId) {
    const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const price = Math.max(1, Math.floor(animal.price * discountMultiplier));
    
    if (animal.owned >= animal.max) {
        audioManager.playSound('error');
        showMessage(`Достигнут максимум ${animal.max} ${animal.name.toLowerCase()}!`);
        return;
    }
    
    if (coins >= price) {
        audioManager.playSound('buy');
        coins -= price;
        animal.owned++;
        animal.lastProduction = Date.now();
        document.getElementById('coinsLabel').textContent = coins;
        showMessage(`Куплена ${animal.name}!`);
        updateContent('animals');
        saveGameProgress();
    } else {
        audioManager.playSound('error');
        showMessage('Недостаточно монет!');
    }
}

function feedAnimal(animalId) {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    if (coins < 5) {
        audioManager.playSound('error');
        showMessage('Недостаточно монет для кормления!');
        return;
    }
    
    if (animal.feedLevel >= 100) {
        audioManager.playSound('error');
        showMessage(`${animal.name} уже накормлена!`);
        return;
    }
    
    audioManager.playSound('buy');
    coins -= 5;
    animal.feedLevel = Math.min(100, animal.feedLevel + 50);
    document.getElementById('coinsLabel').textContent = coins;
    showMessage(`${animal.name} покормлена! Уровень корма: ${animal.feedLevel}%`);
    updateContent('animals');
    saveGameProgress();
}

function collectAnimalProduct(animalId) {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    if (animal.owned === 0 || animal.feedLevel <= 0) {
        audioManager.playSound('error');
        showMessage(`${animal.name} не готова к сбору продукции!`);
        return;
    }
    
    const animalSpeedMultiplier = 1 - (getSkillEffect('animal_speed') / 100);
    const timeToProduce = Math.max(1000, animal.timeToProduce * animalSpeedMultiplier);
    const timeSinceLast = Date.now() - animal.lastProduction;
    
    if (timeSinceLast < timeToProduce) {
        audioManager.playSound('error');
        const timeLeft = Math.ceil((timeToProduce - timeSinceLast) / 1000);
        showMessage(`${animal.name} ещё не готова! Осталось: ${timeLeft} сек.`);
        return;
    }
    
    audioManager.playSound('harvest');
    
    const animalCareBonus = 1 + (getSkillEffect('animal_care') / 100);
    let productAmount = 0;
    
    switch(animal.production) {
        case 'milk':
            productAmount = Math.floor(animal.owned * (animal.feedLevel / 100) * animalCareBonus);
            animalProducts.milk += productAmount;
            break;
        case 'eggs':
            productAmount = Math.floor(animal.owned * 2 * (animal.feedLevel / 100) * animalCareBonus);
            animalProducts.eggs += productAmount;
            break;
        case 'wool':
            productAmount = Math.floor(animal.owned * (animal.feedLevel / 100) * animalCareBonus);
            animalProducts.wool += productAmount;
            break;
    }
    
    animal.lastProduction = Date.now();
    animal.feedLevel = Math.max(0, animal.feedLevel - 30);
    
    updateAnimalProductsDisplay();
    showMessage(`Собрано ${productAmount} ${animal.production === 'milk' ? 'молока' : animal.production === 'eggs' ? 'яиц' : 'шерсти'}!`);
    updateContent('animals');
    saveGameProgress();
}

function sellAnimal(animalId) {
    const animal = animals.find(a => a.id === animalId);
    if (!animal || animal.owned <= 0) return;
    
    const discountMultiplier = 1 - (getSkillEffect('discount') / 100);
    const sellPrice = Math.floor(animal.price * 0.7 * discountMultiplier);
    
    audioManager.playSound('buy');
    coins += sellPrice;
    animal.owned--;
    document.getElementById('coinsLabel').textContent = coins;
    showMessage(`Продана ${animal.name} за ${sellPrice} монет!`);
    updateContent('animals');
    saveGameProgress();
}

function openSellProductsModal() {
    audioManager.playSound('click');
    document.getElementById('milkCount').textContent = animalProducts.milk;
    document.getElementById('eggCount').textContent = animalProducts.eggs;
    document.getElementById('woolCount').textContent = animalProducts.wool;
    document.getElementById('sellProductsModal').style.display = 'flex';
}

function closeSellProductsModal() {
    audioManager.playSound('click');
    document.getElementById('sellProductsModal').style.display = 'none';
}

function sellProduct(productType, amount) {
    if (animalProducts[productType] <= 0) {
        audioManager.playSound('error');
        showMessage(`Нет ${productType === 'milk' ? 'молока' : productType === 'eggs' ? 'яиц' : 'шерсти'} для продажи!`);
        return;
    }
    
    let sellAmount = amount;
    if (amount === 'all') {
        sellAmount = animalProducts[productType];
    } else if (animalProducts[productType] < amount) {
        audioManager.playSound('error');
        showMessage(`Недостаточно ${productType === 'milk' ? 'молока' : productType === 'eggs' ? 'яиц' : 'шерсти'}!`);
        return;
    }
    
    const prices = {
        'milk': 3,
        'eggs': 2,
        'wool': 5
    };
    
    const productNames = {
        'milk': 'молока',
        'eggs': 'яиц',
        'wool': 'шерсти'
    };
    
    const totalPrice = sellAmount * prices[productType];
    
    audioManager.playSound('coin');
    coins += totalPrice;
    animalProducts[productType] -= sellAmount;
    
    document.getElementById('coinsLabel').textContent = coins;
    updateAnimalProductsDisplay();
    document.getElementById(`${productType}Count`).textContent = animalProducts[productType];
    
    showMessage(`Продано ${sellAmount} ${productNames[productType]} за ${totalPrice} монет!`);
    saveGameProgress();
}

function startAnimalProduction() {
    setInterval(() => {
        let updated = false;
        const animalSpeedMultiplier = 1 - (getSkillEffect('animal_speed') / 100);
        
        animals.forEach(animal => {
            if (animal.owned > 0 && animal.feedLevel > 0) {
                const timeToProduce = Math.max(1000, animal.timeToProduce * animalSpeedMultiplier);
                const timeSinceLast = Date.now() - animal.lastProduction;
                if (timeSinceLast >= timeToProduce) {
                    animal.feedLevel = Math.max(0, animal.feedLevel - 5);
                    updated = true;
                    
                    if (currentLocation === 'animals') {
                        updateContent('animals');
                    }
                }
            }
        });
        
        if (updated) {
            saveGameProgress();
        }
    }, 1000);
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
    const minigameBonus = 1 + (getSkillEffect('minigame_bonus') / 100);
    const fish = ['🐟 (+3 монеты)', '🐠 (+5 монет)', '🐡 (+8 монет)', '🩴 (ничего)', '🗑 (ничего)'];
    const result = fish[Math.floor(Math.random() * fish.length)];
    let reward = result.includes('+3') ? 3 : result.includes('+5') ? 5 : result.includes('+8') ? 8 : 0;
    reward = Math.floor(reward * minigameBonus);
    
    if (reward > 0) {
        audioManager.playSound('coin');
        coins += reward;
        document.getElementById('coinsLabel').textContent = coins;
        addHarvest(1);
    }
    
    document.getElementById('fishingResult').innerHTML = `
        <p>Вы поймали: ${result}</p>
        ${reward > 0 ? `<p>С учётом бонуса: +${reward} монет!</p>` : ''}
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
    const minigameBonus = 1 + (getSkillEffect('minigame_bonus') / 100);
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
                const bonusReward = Math.floor(2 * minigameBonus);
                score += bonusReward;
                coins += bonusReward;
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
    const minigameBonus = getSkillEffect('minigame_bonus');
    document.getElementById('minigameArea').innerHTML = `
        <h3>🐇 Кролик-змейка</h3>
        <p>Управляйте кроликом и собирайте морковки! Стрелки на клавиатуре или кнопки ниже.</p>
        ${minigameBonus > 0 ? `<p style="color:#ff9800;">Бонус: +${minigameBonus}% к награде!</p>` : ''}
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
        const minigameBonusMultiplier = 1 + (getSkillEffect('minigame_bonus') / 100);
        snakeGameInstance = new SnakeGame(
            'snakeCanvas', 
            'snakeScore', 
            'snakePrize', 
            function(score, prize) {
                if (prize > 0) {
                    const bonusPrize = Math.floor(prize * minigameBonusMultiplier);
                    audioManager.playSound('harvest');
                    coins += bonusPrize;
                    document.getElementById('coinsLabel').textContent = coins;
                    addHarvest(score);
                    showMessage(`Игра окончена! Вы получили ${bonusPrize} монет (${prize} + бонус) и ${score} к уровню!`);
                }
            }
        );
        snakeGameInstance.start();
    }
}

function startTractorGame() {
    audioManager.playSound('click');
    const minigameBonus = getSkillEffect('minigame_bonus');
    document.getElementById('minigameArea').innerHTML = `
        <h3>🚜 Трактор</h3>
        <p>Управляйте трактором и перепрыгивайте препятствия! ПРОБЕЛ - прыжок, P - пауза, R - перезапуск</p>
        ${minigameBonus > 0 ? `<p style="color:#ff9800;">Бонус: +${minigameBonus}% к награде!</p>` : ''}
        <canvas id="tractorCanvas" width="400" height="400"></canvas>
        <div class="tractor-game-info">
            <div>Преодолено препятствий: <span id="tractorScore">0</span></div>
            <div>Приз: <span id="tractorPrize">0</span> монет</div>
        </div>
        <div class="tractor-controls">
            <button class="tractor-btn" onclick="tractorJump()">ПРОБЕЛ - Прыжок</button>
            <button class="tractor-btn" onclick="tractorPauseResume()">P - Пауза</button>
            <button class="tractor-btn" onclick="tractorRestart()">R - Перезапуск</button>
        </div>
    `;
    
    if (typeof TractorGame !== 'undefined') {
        const minigameBonusMultiplier = 1 + (getSkillEffect('minigame_bonus') / 100);
        tractorGameInstance = new TractorGame(
            'tractorCanvas', 
            'tractorScore', 
            'tractorPrize', 
            function(score, prize) {
                if (prize > 0) {
                    const bonusPrize = Math.floor(prize * minigameBonusMultiplier);
                    audioManager.playSound('harvest');
                    coins += bonusPrize;
                    document.getElementById('coinsLabel').textContent = coins;
                    addHarvest(Math.floor(score / 2));
                    showMessage(`Игра окончена! Вы получили ${bonusPrize} монет (${prize} + бонус) и ${Math.floor(score / 2)} к уровню!`);
                }
            }
        );
        tractorGameInstance.start();
    }
}

function tractorJump() {
    if (tractorGameInstance) {
        tractorGameInstance.jump();
    }
}

function tractorPauseResume() {
    if (tractorGameInstance) {
        tractorGameInstance.pauseResume();
    }
}

function tractorRestart() {
    if (tractorGameInstance) {
        tractorGameInstance.restart();
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
        animals,
        animalProducts,
        skills,
        skillPoints,
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
            
            if (progress.animals) animals = progress.animals;
            if (progress.animalProducts) animalProducts = progress.animalProducts;
            if (progress.skills) skills = progress.skills;
            skillPoints = progress.skillPoints || 0;
            
            document.getElementById('coinsLabel').textContent = coins;
            updateLevelDisplay();
            updateAnimalProductsDisplay();
            updateSkillPointsDisplay();
            
            applySkillEffects();
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
