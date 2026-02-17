# 🚀 分布式算力整合平台

将闲置的手机和电脑的算力聚合起来，对外提供计算服务。

## ✨ 核心功能

- ✅ 设备注册与管理
- ✅ 任务自动分发与执行
- ✅ 结果回收与校验
- ✅ 积分激励机制
- ✅ 一键Docker部署

## 🏗️ 项目结构

```
├── server/          # Node.js服务端
│   ├── app.js
│   ├── package.json
│   └── Dockerfile
├── client/          # Python客户端
│   ├── worker.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 快速开始

### 方式1：Docker一键启动（推荐）

```bash
git clone https://github.com/nolanrayecore-dotcom/distributed-computing-network.git
cd distributed-computing-network
docker-compose up --build
```

这会启动：
- 1个计算服务器（端口3000）
- 3个工作节点（客户端）

### 方式2：本地开发

**服务端：**
```bash
cd server
npm install
npm start
```

**客户端：**
```bash
cd client
pip install -r requirements.txt
python worker.py
```

## 📡 API 文档

### 1. 注册设备
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-device",
    "email": "user@example.com"
  }'
```

响应：
```json
{
  "user_id": "uuid",
  "device_token": "uuid"
}
```

### 2. 创建任务
```bash
curl -X POST http://localhost:3000/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "质数计算",
    "payload": {
      "type": "cpu_compute",
      "params": {"n": 10000}
    }
  }'
```

响应：
```json
{
  "task_id": "uuid"
}
```

### 3. 查询任务
```bash
curl http://localhost:3000/api/tasks/task_id
```

### 4. 查询积分
```bash
curl http://localhost:3000/api/users/user_id/points
```

## 📊 支持的任务类型

### 1. CPU计算
```json
{
  "type": "cpu_compute",
  "params": {
    "n": 10000
  }
}
```

### 2. 数据处理
```json
{
  "type": "data_process",
  "params": {
    "data": [1, 2, 3, 4, 5]
  }
}
```

### 3. 脚本执行
```json
{
  "type": "script",
  "params": {
    "script": "print('Hello World')",
    "timeout": 30
  }
}
```

## 🎯 工作流程

1. **设备注册** → 客户端向服务器注册
2. **任务拉取** → 客户端定期从服务器拉取任务
3. **任务执行** → 客户端在本地执行任务
4. **结果上传** → 客户端将结果上传到服务器
5. **积分奖励** → 服务器记录贡献积分

## 🔧 配置说明

### 环境变量

**客户端：**
- `SERVER_URL`: 服务器地址（默认：http://localhost:3000）
- `DEVICE_NAME`: 设备名称（默认：worker-随机ID）

**服务端：**
- `PORT`: 服务端口（默认：3000）

## 🛡️ 安全特性

- 设备Token验证
- 任务沙盒执行
- 脚本执行超时控制
- 数据JSON序列化

## 📈 扩展方向

- [ ] Web管理后台
- [ ] 实时websocket通讯
- [ ] Kubernetes编排
- [ ] 移动端客户端（Android/iOS）
- [ ] GPU任务支持
- [ ] 任务优先级队列
- [ ] 结果冗余校验

## 📝 开发指南

修改代码后：

```bash
# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**有问题？** 提 Issue：https://github.com/nolanrayecore-dotcom/distributed-computing-network/issues