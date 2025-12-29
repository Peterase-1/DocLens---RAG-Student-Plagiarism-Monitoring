import subprocess
import os
import sys
import time

def start_backend():
    print("Starting Backend (FastAPI)...")
    backend_dir = os.path.join(os.getcwd(), "backend")
    # Use the venv python to run uvicorn
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        # Alternative for non-windows or different structure
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
        
    return subprocess.Popen([venv_python, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"], cwd=backend_dir)

def start_frontend():
    print("Starting Frontend (Vite)...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    return subprocess.Popen(["npm.cmd", "run", "dev"], cwd=frontend_dir, shell=True)

if __name__ == "__main__":
    backend_proc = None
    frontend_proc = None
    try:
        backend_proc = start_backend()
        time.sleep(2) # Give backend a moment
        frontend_proc = start_frontend()
        
        print("\n" + "="*50)
        print("Plagiarism Checker RAG is running!")
        print("Backend API: http://localhost:8000")
        print("Frontend UI: http://localhost:5173")
        print("Access Backend Docs: http://localhost:8000/docs")
        print("="*50 + "\n")
        
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        if backend_proc: backend_proc.terminate()
        if frontend_proc: frontend_proc.terminate()
        sys.exit(0)
