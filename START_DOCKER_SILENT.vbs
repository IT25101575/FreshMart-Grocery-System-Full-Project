Set WshShell = CreateObject("WScript.Shell")
strDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\Full-Grocery-System"

' 1. Silently terminate any conflicting local host Java or Python processes
WshShell.Run "taskkill /F /IM java.exe", 0, True
WshShell.Run "taskkill /F /IM python.exe", 0, True

' 2. Silently start Docker Compose in detached background mode
WshShell.Run "cmd /c cd /d """ & strDir & """ && docker compose up -d", 0, True

' 3. Wait 3 seconds for services to initialize
WScript.Sleep 3000

' 4. Open Customer Store in default browser
WshShell.Run "http://localhost:8000/index.html"
