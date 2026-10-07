<?php
/**
 * EV Charging Station Management System - Database Installer & Health Check
 * Stage 2: 1-Click Database Setup & Table Population for XAMPP
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$dbName = 'ev_charging_db';
$sqlFile = __DIR__ . '/database/ev_charging_db.sql';

$status = [];
$error = null;

try {
    // 1. Connect to MySQL Server (without selecting DB first)
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $status[] = "Connected to MySQL server at $host successfully.";

    // 2. Read SQL File
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL script file not found at: $sqlFile");
    }
    $sqlContent = file_get_contents($sqlFile);
    $status[] = "Loaded SQL schema file (" . strlen($sqlContent) . " bytes).";

    // 3. Execute SQL Statements
    $pdo->exec($sqlContent);
    $status[] = "Database `$dbName` and all tables created with seed records.";

    // 4. Verify Tables
    $pdo->exec("USE `$dbName`");
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $status[] = "Verified " . count($tables) . " relational tables: " . implode(', ', $tables);

} catch (Exception $e) {
    $error = $e->getMessage();
}

// If JSON requested
if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $error === null,
        'status' => $status,
        'error' => $error
    ], JSON_PRETTY_PRINT);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Setup | EV Charging Infrastructure</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-light py-5">
  <div class="container" style="max-width: 680px;">
    <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
      <div class="p-4 bg-dark text-white text-center" style="background: radial-gradient(circle at 100% 0%, #1e293b 0%, #0b1329 100%);">
        <div class="ev-brand-icon mx-auto mb-2" style="width: 46px; height: 46px;">
          <i class="bi bi-database-check"></i>
        </div>
        <h4 class="fw-bold mb-1">Stage 2 MySQL Database Setup</h4>
        <small class="text-secondary">VoltFlow EV Charging Station Management System</small>
      </div>
      <div class="card-body p-4 p-md-5">
        <?php if ($error): ?>
          <div class="alert alert-danger d-flex align-items-center mb-4">
            <i class="bi bi-x-circle-fill fs-3 me-3 text-danger"></i>
            <div>
              <strong class="d-block">Setup Error:</strong>
              <?= htmlspecialchars($error) ?>
            </div>
          </div>
          <p class="small text-muted">
            Ensure MySQL is running in your <strong>XAMPP Control Panel</strong> on port 3306 before retrying.
          </p>
          <a href="setup_database.php" class="btn btn-outline-danger w-100">Retry Setup</a>
        <?php else: ?>
          <div class="alert alert-success d-flex align-items-center mb-4">
            <i class="bi bi-check-circle-fill fs-3 me-3 text-success"></i>
            <div>
              <strong class="d-block">Database Successfully Initialized!</strong>
              Database <code>ev_charging_db</code> is ready with full seed data.
            </div>
          </div>
          
          <h6 class="fw-bold text-dark mb-2">Setup Log:</h6>
          <ul class="list-group list-group-flush small border rounded mb-4">
            <?php foreach ($status as $msg): ?>
              <li class="list-group-item d-flex align-items-center gap-2">
                <i class="bi bi-check2 text-success"></i> <?= htmlspecialchars($msg) ?>
              </li>
            <?php endforeach; ?>
          </ul>

          <div class="d-flex gap-2">
            <a href="index.html" class="btn btn-ev-primary flex-grow-1">
              <i class="bi bi-speedometer2 me-1"></i> Open Application Dashboard
            </a>
            <a href="pages/login.html" class="btn btn-outline-dark">
              <i class="bi bi-box-arrow-in-right me-1"></i> Login Portal
            </a>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>
</body>
</html>
