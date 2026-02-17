const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// 初始化数据库
const db = new sqlite3.Database('./data.db');
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users ( id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, device_token TEXT UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP )`);
    
    // 任务表
    db.run(`CREATE TABLE IF NOT EXISTS tasks ( id TEXT PRIMARY KEY, name TEXT, status TEXT DEFAULT 'pending', payload TEXT, result TEXT, assigned_to TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME )`);
    
    // 贡献记录表
    db.run(`CREATE TABLE IF NOT EXISTS contributions ( id TEXT PRIMARY KEY, user_id TEXT, task_id TEXT, points INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(task_id) REFERENCES tasks(id) )`);
});

// 注册设备
app.post('/api/register', (req, res) => {
    const { name, email } = req.body;
    const device_token = uuid.v4();
    const user_id = uuid.v4();
    db.run(
        `INSERT INTO users (id, name, email, device_token) VALUES (?, ?, ?, ?)`,
        [user_id, name, email, device_token],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ user_id, device_token });
        }
    );
});

// 获取待执行任务
app.get('/api/tasks/next', (req, res) => {
    const { device_token } = req.query;
    db.get(
        `SELECT u.id as user_id FROM users u WHERE u.device_token = ?`,
        [device_token],
        (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: '未授权' });
            }
            db.get(
                `SELECT * FROM tasks WHERE status = 'pending' LIMIT 1`,
                (err, task) => {
                    if (err || !task) {
                        return res.json({ task: null });
                    }
                    // 标记任务为处理中
                    db.run(
                        `UPDATE tasks SET status = 'processing', assigned_to = ? WHERE id = ?`,
                        [user.user_id, task.id]
                    );
                    res.json({ task: { id: task.id, payload: JSON.parse(task.payload) } });
                }
            );
        }
    );
});

// 提交任务结果
app.post('/api/tasks/submit', (req, res) => {
    const { task_id, device_token, result } = req.body;
    db.get(
        `SELECT u.id as user_id FROM users u WHERE u.device_token = ?`,
        [device_token],
        (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: '未授权' });
            }
            db.run(
                `UPDATE tasks SET status = 'completed', result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [JSON.stringify(result), task_id],
                () => {
                    // 记录贡献积分
                    const contribution_id = uuid.v4();
                    db.run(
                        `INSERT INTO contributions (id, user_id, task_id, points) VALUES (?, ?, ?, ?)`,
                        [contribution_id, user.user_id, task_id, 10]
                    );
                    res.json({ success: true });
                }
            );
        }
    );
});

// 创建任务（管理员接口）
app.post('/api/tasks/create', (req, res) => {
    const { name, payload } = req.body;
    const task_id = uuid.v4();
    db.run(
        `INSERT INTO tasks (id, name, payload) VALUES (?, ?, ?)`,
        [task_id, name, JSON.stringify(payload)],
        () => {
            res.json({ task_id });
        }
    );
});

// 获取用户积分
app.get('/api/users/:user_id/points', (req, res) => {
    const { user_id } = req.params;
    db.get(
        `SELECT SUM(points) as total_points FROM contributions WHERE user_id = ?`,
        [user_id],
        (err, row) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ total_points: row.total_points || 0 });
        }
    );
});

// 获取任务状态
app.get('/api/tasks/:task_id', (req, res) => {
    const { task_id } = req.params;
    db.get(`SELECT * FROM tasks WHERE id = ?`, [task_id], (err, task) => {
        if (err || !task) {
            return res.status(404).json({ error: '任务不存在' });
        }
        res.json({ id: task.id, name: task.name, status: task.status, result: task.result ? JSON.parse(task.result) : null });
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
