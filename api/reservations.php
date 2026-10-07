<?php
/**
 * EV Charging Station Management System - Reservations API
 * Stage 2: Slot booking engine with Server-Side Double-Booking Conflict Prevention (Rule 42 & 43)
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $status = trim($_GET['status'] ?? '');
        $date = trim($_GET['date'] ?? '');
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                r.reservation_id,
                r.reservation_code,
                r.user_id,
                r.vehicle_id,
                r.station_id,
                r.charger_id,
                r.reservation_date,
                r.start_time,
                r.duration_minutes,
                r.status,
                r.created_at,
                u.name AS customer_name,
                v.vehicle_model,
                v.vehicle_number,
                s.station_name,
                s.city,
                c.charger_code,
                c.connector_type,
                c.charging_power
            FROM reservations r
            JOIN users u ON r.user_id = u.user_id
            JOIN vehicles v ON r.vehicle_id = v.vehicle_id
            JOIN stations s ON r.station_id = s.station_id
            JOIN chargers c ON r.charger_id = c.charger_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($status)) {
            $sql .= " AND r.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($date)) {
            $sql .= " AND r.reservation_date = :res_date";
            $params[':res_date'] = $date;
        }

        if (!empty($keyword)) {
            $sql .= " AND (r.reservation_code LIKE :kw1 OR u.name LIKE :kw2 OR v.vehicle_model LIKE :kw3 OR s.station_name LIKE :kw4)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
            $params[':kw4'] = "%$keyword%";
        }

        $sql .= " ORDER BY r.reservation_date DESC, r.start_time DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reservations = $stmt->fetchAll();

        sendJsonResponse(true, $reservations, 'Reservations retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $input['action'] ?? $_GET['action'] ?? 'create';

        // Action: Cancel Reservation
        if ($action === 'cancel') {
            $resId = (int)($input['reservation_id'] ?? 0);
            $resCode = trim($input['reservation_code'] ?? '');

            $stmt = $pdo->prepare("SELECT reservation_id, charger_id, status FROM reservations WHERE reservation_id = :id OR reservation_code = :code LIMIT 1");
            $stmt->execute([':id' => $resId, ':code' => $resCode]);
            $res = $stmt->fetch();

            if (!$res) {
                sendJsonResponse(false, null, 'Reservation not found', 404);
            }

            $pdo->beginTransaction();
            try {
                $updRes = $pdo->prepare("UPDATE reservations SET status = 'Cancelled' WHERE reservation_id = :id");
                $updRes->execute([':id' => $res['reservation_id']]);

                // Restore charger to Available if currently Reserved
                $updCh = $pdo->prepare("UPDATE chargers SET status = 'Available' WHERE charger_id = :cid AND status = 'Reserved'");
                $updCh->execute([':cid' => $res['charger_id']]);

                $pdo->commit();
                sendJsonResponse(true, null, 'Reservation cancelled successfully');
            } catch (Exception $e) {
                $pdo->rollBack();
                sendJsonResponse(false, null, 'Failed to cancel reservation: ' . $e->getMessage(), 500);
            }
        }

        // Action: Create New Reservation
        $user = getCurrentUser();
        $userId = !empty($input['user_id']) ? (int)$input['user_id'] : $user['user_id'];
        $stationId = (int)($input['station_id'] ?? 0);
        $chargerId = (int)($input['charger_id'] ?? 0);
        $vehicleId = (int)($input['vehicle_id'] ?? 0);
        $resDate = trim($input['reservation_date'] ?? $input['date'] ?? '');
        $startTime = trim($input['start_time'] ?? $input['time'] ?? '');
        $duration = (int)($input['duration_minutes'] ?? $input['duration'] ?? 45);

        if (!$stationId || !$chargerId || !$vehicleId || empty($resDate) || empty($startTime)) {
            sendJsonResponse(false, null, 'Station, charger, vehicle, reservation date, and start time are required', 400);
        }

        // Rule 43: Check charger status (Under maintenance or offline cannot be reserved)
        $chStmt = $pdo->prepare("SELECT status, charger_code FROM chargers WHERE charger_id = :cid LIMIT 1");
        $chStmt->execute([':cid' => $chargerId]);
        $charger = $chStmt->fetch();

        if (!$charger) {
            sendJsonResponse(false, null, 'Selected charger does not exist', 404);
        }

        if ($charger['status'] === 'Maintenance' || $charger['status'] === 'Offline') {
            sendJsonResponse(false, null, "Charger {$charger['charger_code']} is under {$charger['status']} and cannot be reserved.", 409);
        }

        // Rule 42: Double-Booking Conflict Prevention
        // Conflict formula: Same Charger + Same Date + Overlapping Time Window
        $conflictSql = "
            SELECT reservation_id, reservation_code, start_time, duration_minutes 
            FROM reservations
            WHERE charger_id = :charger_id
              AND reservation_date = :res_date
              AND status NOT IN ('Cancelled', 'Completed')
              AND (
                  TIME(:new_start1) < ADDTIME(start_time, SEC_TO_TIME(duration_minutes * 60))
                  AND ADDTIME(TIME(:new_start2), SEC_TO_TIME(:new_duration * 60)) > start_time
              )
            LIMIT 1
        ";
        $conflictStmt = $pdo->prepare($conflictSql);
        $conflictStmt->execute([
            ':charger_id'    => $chargerId,
            ':res_date'      => $resDate,
            ':new_start1'    => $startTime,
            ':new_start2'    => $startTime,
            ':new_duration'  => $duration
        ]);
        $conflict = $conflictStmt->fetch();

        if ($conflict) {
            sendJsonResponse(false, [
                'conflict_with' => $conflict['reservation_code'],
                'booked_time'   => $conflict['start_time'],
                'duration'      => $conflict['duration_minutes']
            ], 'This charger is already reserved for the selected time.', 409);
        }

        // Generate next RES-2026-xxx code
        $maxId = (int)$pdo->query("SELECT MAX(reservation_id) FROM reservations")->fetchColumn();
        $resCode = 'RES-2026-' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);

        $pdo->beginTransaction();
        try {
            $insertStmt = $pdo->prepare("
                INSERT INTO reservations (reservation_code, user_id, vehicle_id, station_id, charger_id, reservation_date, start_time, duration_minutes, status)
                VALUES (:code, :uid, :vid, :sid, :cid, :rdate, :stime, :dur, 'Upcoming')
            ");
            $insertStmt->execute([
                ':code'  => $resCode,
                ':uid'   => $userId,
                ':vid'   => $vehicleId,
                ':sid'   => $stationId,
                ':cid'   => $chargerId,
                ':rdate' => $resDate,
                ':stime' => $startTime,
                ':dur'   => $duration
            ]);

            $newResId = (int)$pdo->lastInsertId();

            // Set charger status to Reserved
            $pdo->prepare("UPDATE chargers SET status = 'Reserved' WHERE charger_id = :cid")->execute([':cid' => $chargerId]);

            // Add notification
            $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (:uid, 'Reservation Confirmed', :msg, 'info')
            ")->execute([
                ':uid' => $userId,
                ':msg' => "Your charging slot $resCode on {$charger['charger_code']} starts at $startTime on $resDate."
            ]);

            $pdo->commit();

            sendJsonResponse(true, [
                'reservation_id'   => $newResId,
                'reservation_code' => $resCode,
                'charger_code'     => $charger['charger_code'],
                'date'             => $resDate,
                'time'             => $startTime
            ], 'Slot reservation confirmed successfully', 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(false, null, 'Database error creating reservation: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
