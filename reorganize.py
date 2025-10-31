import os
import shutil
from pathlib import Path

workspace = Path(r"T:\Cadet's Compass")

# Create backend and frontend directories if they don't exist
backend_dir = workspace / "backend"
frontend_dir = workspace / "frontend"

backend_dir.mkdir(exist_ok=True)
frontend_dir.mkdir(exist_ok=True)

# Move server contents to backend
server_dir = workspace / "server"
if server_dir.exists():
    print("Moving server contents to backend...")
    for item in server_dir.iterdir():
        if item.name not in ['.', '..']:
            dest = backend_dir / item.name
            if dest.exists():
                if item.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            shutil.move(str(item), str(backend_dir))
    print("Backend organization complete!")

# Move frontend folders
print("Moving frontend folders...")
folders_to_move = ["views", "public", "config"]
for folder_name in folders_to_move:
    folder_path = workspace / folder_name
    if folder_path.exists():
        dest = frontend_dir / folder_name
        if dest.exists():
            shutil.rmtree(dest)
        shutil.move(str(folder_path), str(frontend_dir))
        print(f"Moved {folder_name} to frontend/")

# Move package files to frontend
files_to_move = ["package.json", "package-lock.json"]
for file_name in files_to_move:
    file_path = workspace / file_name
    if file_path.exists():
        dest = frontend_dir / file_name
        if dest.exists():
            dest.unlink()
        shutil.move(str(file_path), str(frontend_dir))
        print(f"Moved {file_name} to frontend/")

# Remove empty server directory if it exists
if server_dir.exists() and not any(server_dir.iterdir()):
    server_dir.rmdir()
    print("Removed empty server directory")

print("\nReorganization complete!")
print("Backend files are in: backend/")
print("Frontend files are in: frontend/")

