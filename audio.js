class AudioManager {
    constructor() {
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.userInteracted = false;
        this.audioContext = null;
        
        this.loadSettings();
        this.setupInteraction();
    }
    
    loadSettings() {
        const savedMusic = localStorage.getItem('farmquest_musicVolume');
        const savedSFX = localStorage.getItem('farmquest_sfxVolume');
        const savedMusicEnabled = localStorage.getItem('farmquest_musicEnabled');
        const savedSFXEnabled = localStorage.getItem('farmquest_sfxEnabled');
        
        if (savedMusic) this.musicVolume = parseFloat(savedMusic);
        if (savedSFX) this.sfxVolume = parseFloat(savedSFX);
        if (savedMusicEnabled !== null) this.musicEnabled = savedMusicEnabled === 'true';
        if (savedSFXEnabled !== null) this.sfxEnabled = savedSFXEnabled === 'true';
    }
    
    saveSettings() {
        localStorage.setItem('farmquest_musicVolume', this.musicVolume);
        localStorage.setItem('farmquest_sfxVolume', this.sfxVolume);
        localStorage.setItem('farmquest_musicEnabled', this.musicEnabled);
        localStorage.setItem('farmquest_sfxEnabled', this.sfxEnabled);
    }
    
    setupInteraction() {
        const enableAudio = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                console.log('Аудио активировано');
                
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    console.log('AudioContext создан');
                } catch (e) {
                    console.log('AudioContext не поддерживается:', e);
                }
            }
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('keydown', enableAudio);
        document.addEventListener('touchstart', enableAudio);
        
        setTimeout(enableAudio, 1000);
    }
    
    playSound(soundName) {
        if (!this.sfxEnabled || this.sfxVolume <= 0 || !this.userInteracted) {
            return;
        }
        
        const soundUrls = {
            click: 'sounds/click.mp3',
            button: 'sounds/button.mp3',
            coin: 'sounds/coin.mp3',
            harvest: 'sounds/harvest.mp3',
            buy: 'sounds/buy.mp3',
            error: 'sounds/error.mp3',
            plant: 'sounds/click.mp3',
            snakeEat: 'sounds/coin.mp3',
            snakeMove: 'sounds/click.mp3',
            fishCatch: 'sounds/coin.mp3',
            carrotCatch: 'sounds/coin.mp3'
        };
        
        const soundUrl = soundUrls[soundName];
        if (!soundUrl) {
            this.playBeepSound();
            return;
        }
        
        try {
            const audio = new Audio(soundUrl);
            audio.volume = this.sfxVolume;
            audio.play().catch(e => {
                console.log('Ошибка воспроизведения файла:', soundName, e);
                this.playBeepSound();
            });
        } catch (e) {
            console.log('Ошибка создания Audio:', e);
            this.playBeepSound();
        }
    }
    
    playBeepSound() {
        if (!this.userInteracted || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1 * this.sfxVolume;
            oscillator.type = 'sine';
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Не удалось воспроизвести звук:', e);
        }
    }
    
    playMusic() {
        if (!this.musicEnabled || this.musicVolume <= 0 || !this.userInteracted) return;
        
        try {
            if (this.musicAudio) {
                this.musicAudio.pause();
                this.musicAudio.currentTime = 0;
            }
            
            this.musicAudio = new Audio('sounds/music.mp3');
            this.musicAudio.loop = true;
            this.musicAudio.volume = this.musicVolume;
            this.musicAudio.play().catch(e => {
                console.log('Музыка не запущена:', e);
            });
        } catch (e) {
            console.log('Ошибка музыки:', e);
        }
    }
    
    stopMusic() {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio.currentTime = 0;
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = volume / 100;
        if (this.musicAudio) {
            this.musicAudio.volume = this.musicVolume;
            if (this.musicVolume > 0 && this.musicEnabled && this.musicAudio.paused) {
                this.playMusic();
            }
        }
        this.saveSettings();
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = volume / 100;
        this.saveSettings();
        
        if (volume > 0 && this.sfxEnabled && this.userInteracted) {
            this.playSound('button');
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled && this.musicVolume > 0) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        this.saveSettings();
        return this.musicEnabled;
    }
    
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        
        if (this.sfxEnabled && this.sfxVolume > 0 && this.userInteracted) {
            this.playSound('button');
        }
        return this.sfxEnabled;
    }
}

let audioManager = new AudioManager();