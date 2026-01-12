const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./farmquest.db');

const schema = fs.readFileSync('sch.sql', 'utf8');
db.exec(schema);

db.run(`
    CREATE TABLE IF NOT EXISTS game_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        progress_data TEXT NOT NULL,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
    )
`);

db.run('CREATE INDEX IF NOT EXISTS idx_username ON game_progress(username)');

app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, email, coins FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    
    db.run('INSERT INTO users (username, email, password, coins) VALUES (?, ?, ?, 100)',
        [username, email, password],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Пользователь уже существует' });
                } else {
                    res.status(500).json({ error: err.message });
                }
                return;
            }
            
            res.json({
                id: this.lastID,
                username,
                email,
                coins: 100
            });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT id, username, email, coins FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, user) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (!user) {
                res.status(401).json({ error: 'Неверный логин или пароль' });
                return;
            }
            
            res.json(user);
        }
    );
});

app.post('/api/save-progress', async (req, res) => {
    const { username, progress } = req.body;
    
    try {
        const progressData = JSON.stringify(progress);
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO game_progress (username, progress_data, last_saved) 
            VALUES (?, ?, datetime('now'))
        `);
        stmt.run(username, progressData);
        stmt.finalize();
        
        res.json({ success: true, message: 'Прогресс сохранен' });
    } catch (error) {
        console.error('Ошибка сохранения прогресса:', error);
        res.status(500).json({ error: 'Ошибка сохранения прогресса' });
    }
});

app.get('/api/load-progress/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        db.get(`
            SELECT progress_data FROM game_progress 
            WHERE username = ? 
            ORDER BY last_saved DESC 
            LIMIT 1
        `, [username], (err, row) => {
            if (err) {
                console.error('Ошибка загрузки прогресса:', err);
                return res.status(500).json({ error: 'Ошибка загрузки прогресса' });
            }
            
            if (row && row.progress_data) {
                res.json({ 
                    success: true, 
                    progress: JSON.parse(row.progress_data) 
                });
            } else {
                res.json({ success: false, message: 'Прогресс не найден' });
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
        res.status(500).json({ error: 'Ошибка загрузки прогресса' });
    }
});

app.get('/api/coins/:username', (req, res) => {
    const { username } = req.params;
    
    db.get('SELECT coins FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }
        
        res.json({ coins: row.coins });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'screentest(1).html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});