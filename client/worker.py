import requests
import json
import time
import uuid
import subprocess
import sys

class ComputingWorker:
    def __init__(self, server_url, device_name):
        self.server_url = server_url
        self.device_name = device_name
        self.device_token = None
        self.user_id = None
        self.register()

    def register(self):
        response = requests.post(
            f"{self.server_url}/api/register",
            json={
                "name": self.device_name,
                "email": f"{self.device_name}-{uuid.uuid4()}@worker.local"
            }
        )
        data = response.json()
        self.device_token = data['device_token']
        self.user_id = data['user_id']
        print(f"✓ 设备已注册，Token: {self.device_token[:8]}...")

    def get_task(self):
        try:
            response = requests.get(
                f"{self.server_url}/api/tasks/next",
                params={"device_token": self.device_token},
                timeout=10
            )
            data = response.json()
            return data.get('task')
        except Exception as e:
            print(f"✗ 获取任务失败: {e}")
            return None

    def execute_task(self, task):
        task_id = task['id']
        payload = task['payload']
        
        print(f"\n📋 执行任务: {task_id}")
        print(f"   类型: {payload.get('type')}")
        
        try:
            if payload['type'] == 'cpu_compute':
                result = self.cpu_compute(payload['params'])
            elif payload['type'] == 'data_process':
                result = self.data_process(payload['params'])
            elif payload['type'] == 'script':
                result = self.run_script(payload['params'])
            else:
                result = {"error": "未知的任务类型"}
            
            self.submit_result(task_id, result)
            return True
        except Exception as e:
            print(f"✗ 任务执行失败: {e}")
            return False

    def cpu_compute(self, params):
        n = params.get('n', 1000)
        print(f"   计算1-{n}的质数数量...")
        
        primes = []
        for num in range(2, n):
            is_prime = True
            for i in range(2, int(num**0.5) + 1):
                if num % i == 0:
                    is_prime = False
                    break
            if is_prime:
                primes.append(num)
        
        return {"type": "cpu_compute", "count": len(primes)}

    def data_process(self, params):
        data = params.get('data', [])
        print(f"   处理 {len(data)} 条数据...")
        
        result = {
            "total": len(data),
            "sum": sum(data) if data else 0,
            "avg": sum(data) / len(data) if data else 0
        }
        
        return result

    def run_script(self, params):
        script = params.get('script', '')
        timeout = params.get('timeout', 30)
        
        print(f"   运行脚本...")
        try:
            result = subprocess.run(
                [sys.executable, '-c', script],
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"error": "脚本执行超时"}

    def submit_result(self, task_id, result):
        try:
            response = requests.post(
                f"{self.server_url}/api/tasks/submit",
                json={
                    "task_id": task_id,
                    "device_token": self.device_token,
                    "result": result
                }
            )
            if response.status_code == 200:
                print(f"✓ 结果已提交")
                self.check_points()
            else:
                print(f"✗ 提交失败: {response.text}")
        except Exception as e:
            print(f"✗ 提交结果失败: {e}")

    def check_points(self):
        try:
            response = requests.get(
                f"{self.server_url}/api/users/{self.user_id}/points"
            )
            points = response.json().get('total_points', 0)
            print(f"   💰 当前积分: {points}")
        except Exception as e:
            pass

    def run(self, interval=5):
        print(f"\n🚀 客户端启动，服务器: {self.server_url}")
        print(f"📍 设备: {self.device_name}\n")
        
        while True:
            try:
                task = self.get_task()
                if task:
                    self.execute_task(task)
                else:
                    print(f"⏳ 暂无任务，{interval}秒后重试...")
                
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\n\n⏹ 客户端已停止")
                break
            except Exception as e:
                print(f"✗ 未知错误: {e}")
                time.sleep(interval)

if __name__ == "__main__":
    import os
    
    server_url = os.getenv('SERVER_URL', 'http://localhost:3000')
    device_name = os.getenv('DEVICE_NAME', f'worker-{uuid.uuid4().hex[:8]}')
    
    worker = ComputingWorker(server_url, device_name)
    worker.run()