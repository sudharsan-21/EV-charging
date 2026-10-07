<?php
/**
 * EV Charging Station Management System - Stations API
 * Stage 2: CRUD operations for Charging Stations backed by MySQL
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Single station by ID
        if (isset($_GET['id'])) {
            $stationId = (int)$_GET['id'];
            $stnStmt = $pdo->prepare("
                SELECT s.*, p.price_per_kwh, p.service_fee, p.tax_percentage 
                FROM stations s
                LEFT JOIN pricing p ON s.station_id = p.station_id
                WHERE s.station_id = :id OR s.station_code = :code
                LIMIT 1
            ");
            $stnStmt->execute([':id' => $stationId, ':code' => $_GET['id']]);
            $station = $stnStmt->fetch();

            if (!$station) {
                sendJsonResponse(false, null, 'Station not found', 404);
            }

            // Fetch chargers for this station
            $chStmt = $pdo->prepare("SELECT * FROM chargers WHERE station_id = :stn_id ORDER BY charger_id ASC");
            $chStmt->execute([':stn_id' => $station['station_id']]);
            $chargers = $chStmt->fetchAll();

            $station['chargers'] = $chargers;
            sendJsonResponse(true, $station, 'Station details retrieved');
        }

        // List stations with filters
        $city = trim($_GET['city'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                s.station_id,
                s.station_code,
                s.station_name,
                s.address,
                s.city,
                s.contact_number,
                s.operating_hours,
                s.status,
                s.latitude,
                s.longitude,
                COALESCE(p.price_per_kwh, 15.00) AS pricing_rate,
                COUNT(c.charger_id) AS total_chargers,
                SUM(CASE WHEN c.status = 'Available' THEN 1 ELSE 0 END) AS available_chargers,
                SUM(CASE WHEN c.status = 'Charging' THEN 1 ELSE 0 END) AS charging_chargers,
                SUM(CASE WHEN c.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_chargers
            FROM stations s
            LEFT JOIN pricing p ON s.station_id = p.station_id
            LEFT JOIN chargers c ON s.station_id = c.station_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($city)) {
            $sql .= " AND s.city = :city";
            $params[':city'] = $city;
        }

        if (!empty($status)) {
            $sql .= " AND s.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($keyword)) {
            $sql .= " AND (s.station_name LIKE :kw1 OR s.address LIKE :kw2 OR s.city LIKE :kw3 OR s.station_code LIKE :kw4)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
            $params[':kw4'] = "%$keyword%";
        }

        $sql .= " GROUP BY s.station_id ORDER BY s.station_id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stations = $stmt->fetchAll();

        sendJsonResponse(true, $stations, 'Stations retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();

        $name = trim($input['name'] ?? $input['station_name'] ?? '');
        $city = trim($input['city'] ?? '');
        $address = trim($input['address'] ?? '');
        $contact = trim($input['contact'] ?? $input['contact_number'] ?? '');
        $hours = trim($input['operating_hours'] ?? $input['hours'] ?? '24/7 Open');
        $price = (float)($input['pricing_rate'] ?? $input['price'] ?? 15.00);
        $lat = !empty($input['latitude']) ? (float)$input['latitude'] : 11.0168;
        $lng = !empty($input['longitude']) ? (float)$input['longitude'] : 76.9558;

        if (empty($name) || empty($city) || empty($address) || empty($contact)) {
            sendJsonResponse(false, null, 'Station name, city, address, and contact number are required', 400);
        }

        // Generate next code STN-xxx
        $maxId = (int)$pdo->query("SELECT MAX(station_id) FROM stations")->fetchColumn();
        $nextCode = 'STN-' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO stations (station_code, station_name, address, city, latitude, longitude, contact_number, operating_hours, status)
                VALUES (:code, :name, :address, :city, :lat, :lng, :contact, :hours, 'Operational')
            ");
            $stmt->execute([
                ':code'    => $nextCode,
                ':name'    => $name,
                ':address' => $address,
                ':city'    => $city,
                ':lat'     => $lat,
                ':lng'     => $lng,
                ':contact' => $contact,
                ':hours'   => $hours
            ]);

            $newStationId = (int)$pdo->lastInsertId();

            // Insert pricing
            $priceStmt = $pdo->prepare("
                INSERT INTO pricing (station_id, price_per_kwh, service_fee, tax_percentage, effective_from)
                VALUES (:stn_id, :price, 20.00, 9.00, CURDATE())
            ");
            $priceStmt->execute([
                ':stn_id' => $newStationId,
                ':price'  => $price
            ]);

            $pdo->commit();

            sendJsonResponse(true, [
                'station_id'   => $newStationId,
                'station_code' => $nextCode,
                'station_name' => $name,
                'city'         => $city
            ], 'Station added successfully', 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(false, null, 'Failed to add station: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
