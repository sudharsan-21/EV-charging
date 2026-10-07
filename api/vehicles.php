<?php
/**
 * EV Charging Station Management System - Vehicles API
 * Stage 2: Vehicle registry, battery specs, and fleet management backed by MySQL
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $user = getCurrentUser();
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                v.vehicle_id,
                v.user_id,
                v.vehicle_number,
                v.vehicle_model,
                v.battery_capacity,
                v.current_battery_pct,
                v.connector_type,
                v.max_charging_power,
                v.status,
                u.name AS owner_name
            FROM vehicles v
            JOIN users u ON v.user_id = u.user_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($keyword)) {
            $sql .= " AND (v.vehicle_number LIKE :kw1 OR v.vehicle_model LIKE :kw2 OR u.name LIKE :kw3)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
        }

        $sql .= " ORDER BY v.vehicle_id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $vehicles = $stmt->fetchAll();

        sendJsonResponse(true, $vehicles, 'Vehicles retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();
        $user = getCurrentUser();

        $userId = !empty($input['user_id']) ? (int)$input['user_id'] : $user['user_id'];
        $model = trim($input['model'] ?? $input['vehicle_model'] ?? '');
        $number = strtoupper(trim($input['number'] ?? $input['vehicle_number'] ?? ''));
        $capacity = (float)($input['battery_capacity'] ?? $input['capacity'] ?? 40.5);
        $currentPct = (int)($input['current_battery'] ?? $input['current_battery_pct'] ?? 25);
        $connector = trim($input['connector_type'] ?? 'CCS2');
        $maxPower = (float)($input['max_charging_power'] ?? $input['max_power'] ?? 60.0);

        if (empty($model) || empty($number)) {
            sendJsonResponse(false, null, 'Vehicle model and registration number are required', 400);
        }

        // Duplicate check
        $dupStmt = $pdo->prepare("SELECT vehicle_id FROM vehicles WHERE vehicle_number = :num LIMIT 1");
        $dupStmt->execute([':num' => $number]);
        if ($dupStmt->fetch()) {
            sendJsonResponse(false, null, "Vehicle with registration number '$number' already exists", 409);
        }

        $stmt = $pdo->prepare("
            INSERT INTO vehicles (user_id, vehicle_number, vehicle_model, battery_capacity, current_battery_pct, connector_type, max_charging_power, status)
            VALUES (:uid, :num, :model, :cap, :curr, :conn, :power, 'Active')
        ");
        $stmt->execute([
            ':uid'   => $userId,
            ':num'   => $number,
            ':model' => $model,
            ':cap'   => $capacity,
            ':curr'  => $currentPct,
            ':conn'  => $connector,
            ':power' => $maxPower
        ]);

        $newVehicleId = (int)$pdo->lastInsertId();

        sendJsonResponse(true, [
            'vehicle_id'     => $newVehicleId,
            'vehicle_number' => $number,
            'vehicle_model'  => $model,
            'battery_capacity' => $capacity
        ], 'Vehicle registered successfully', 201);
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
