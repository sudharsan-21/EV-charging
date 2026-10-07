<?php
/**
 * EV Charging Station Management System - Chargers API
 * Stage 2: Charger hardware management, status synchronization, and utilization calculations
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stationId = isset($_GET['station_id']) && $_GET['station_id'] !== '' ? (int)$_GET['station_id'] : null;
        $connector = trim($_GET['connector'] ?? '');
        $power = isset($_GET['power']) && $_GET['power'] !== '' ? (float)$_GET['power'] : null;
        $status = trim($_GET['status'] ?? '');
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                c.charger_id,
                c.charger_code,
                c.station_id,
                c.connector_type,
                c.charging_power,
                c.status,
                c.installed_date,
                c.total_hours_used,
                ROUND(c.total_hours_used / 24 * 100, 1) AS utilization_pct,
                s.station_code,
                s.station_name,
                s.city
            FROM chargers c
            JOIN stations s ON c.station_id = s.station_id
            WHERE 1=1
        ";
        $params = [];

        if ($stationId !== null) {
            $sql .= " AND c.station_id = :stn_id";
            $params[':stn_id'] = $stationId;
        }

        if (!empty($connector)) {
            $sql .= " AND c.connector_type = :connector";
            $params[':connector'] = $connector;
        }

        if ($power !== null && $power > 0) {
            $sql .= " AND c.charging_power >= :power";
            $params[':power'] = $power;
        }

        if (!empty($status)) {
            $sql .= " AND c.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($keyword)) {
            $sql .= " AND (c.charger_code LIKE :kw1 OR s.station_name LIKE :kw2 OR s.city LIKE :kw3 OR c.connector_type LIKE :kw4)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
            $params[':kw4'] = "%$keyword%";
        }

        $sql .= " ORDER BY c.charger_id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $chargers = $stmt->fetchAll();

        sendJsonResponse(true, $chargers, 'Chargers retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $input['action'] ?? $_GET['action'] ?? 'create';

        // Action: Update Charger Status
        if ($action === 'update_status') {
            $chargerId = (int)($input['charger_id'] ?? 0);
            $newStatus = trim($input['status'] ?? '');

            $validStatuses = ['Available', 'Charging', 'Reserved', 'Maintenance', 'Offline'];
            if (!$chargerId || !in_array($newStatus, $validStatuses)) {
                sendJsonResponse(false, null, 'Valid charger ID and status are required', 400);
            }

            $stmt = $pdo->prepare("UPDATE chargers SET status = :status WHERE charger_id = :id");
            $stmt->execute([':status' => $newStatus, ':id' => $chargerId]);

            sendJsonResponse(true, ['charger_id' => $chargerId, 'status' => $newStatus], "Charger status updated to $newStatus");
        }

        // Action: Deploy New Charger
        $stationId = (int)($input['station_id'] ?? 0);
        $connector = trim($input['connector_type'] ?? '');
        $power = (float)($input['charging_power'] ?? $input['power'] ?? 60.0);
        $status = trim($input['status'] ?? 'Available');

        if (!$stationId || empty($connector) || $power <= 0) {
            sendJsonResponse(false, null, 'Station, connector type, and valid charging power are required', 400);
        }

        // Generate next CH-xxx code
        $maxId = (int)$pdo->query("SELECT MAX(charger_id) FROM chargers")->fetchColumn();
        $nextCode = 'CH-' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("
            INSERT INTO chargers (station_id, charger_code, connector_type, charging_power, status, installed_date, total_hours_used)
            VALUES (:stn_id, :code, :conn, :power, :status, CURDATE(), 0.0)
        ");
        $stmt->execute([
            ':stn_id' => $stationId,
            ':code'   => $nextCode,
            ':conn'   => $connector,
            ':power'  => $power,
            ':status' => $status
        ]);

        $newChargerId = (int)$pdo->lastInsertId();

        sendJsonResponse(true, [
            'charger_id'   => $newChargerId,
            'charger_code' => $nextCode,
            'station_id'   => $stationId,
            'status'       => $status
        ], 'Charger deployed successfully', 201);
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
