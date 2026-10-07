<?php
/**
 * EV Charging Station Management System - Charging Sessions API
 * Stage 2: Session life-cycle, energy metering calculation, and MySQL billing synchronization
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                s.session_id,
                s.session_code,
                s.reservation_id,
                s.user_id,
                s.vehicle_id,
                s.station_id,
                s.charger_id,
                s.start_time,
                s.end_time,
                s.energy_consumed,
                s.duration_minutes,
                s.energy_cost,
                s.service_fee,
                s.tax_amount,
                s.total_cost,
                s.status,
                u.name AS customer_name,
                v.vehicle_model,
                v.vehicle_number,
                st.station_name,
                c.charger_code,
                COALESCE(p.status, 'Pending') AS payment_status
            FROM charging_sessions s
            JOIN users u ON s.user_id = u.user_id
            JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            JOIN stations st ON s.station_id = st.station_id
            JOIN chargers c ON s.charger_id = c.charger_id
            LEFT JOIN payments p ON s.session_id = p.session_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($keyword)) {
            $sql .= " AND (s.session_code LIKE :kw1 OR u.name LIKE :kw2 OR v.vehicle_model LIKE :kw3 OR c.charger_code LIKE :kw4)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
            $params[':kw4'] = "%$keyword%";
        }

        $sql .= " ORDER BY s.session_id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $sessions = $stmt->fetchAll();

        sendJsonResponse(true, $sessions, 'Charging sessions retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $input['action'] ?? $_GET['action'] ?? 'complete';

        // Action: Start Charging Session
        if ($action === 'start') {
            $user = getCurrentUser();
            $userId = !empty($input['user_id']) ? (int)$input['user_id'] : $user['user_id'];
            $stationId = (int)($input['station_id'] ?? 1);
            $chargerId = (int)($input['charger_id'] ?? 1);
            $vehicleId = (int)($input['vehicle_id'] ?? 1);
            $resId = !empty($input['reservation_id']) ? (int)$input['reservation_id'] : null;

            // Generate session code
            $maxId = (int)$pdo->query("SELECT MAX(session_id) FROM charging_sessions")->fetchColumn();
            $sessionCode = 'SES-2026-' . str_pad($maxId + 1, 4, '0', STR_PAD_LEFT);

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO charging_sessions (session_code, reservation_id, user_id, vehicle_id, station_id, charger_id, start_time, status)
                    VALUES (:code, :rid, :uid, :vid, :sid, :cid, NOW(), 'Active')
                ");
                $stmt->execute([
                    ':code' => $sessionCode,
                    ':rid'  => $resId,
                    ':uid'  => $userId,
                    ':vid'  => $vehicleId,
                    ':sid'  => $stationId,
                    ':cid'  => $chargerId
                ]);
                $newSessionId = (int)$pdo->lastInsertId();

                // Rule 43: Set charger to Charging
                $pdo->prepare("UPDATE chargers SET status = 'Charging' WHERE charger_id = :cid")->execute([':cid' => $chargerId]);

                $pdo->commit();
                sendJsonResponse(true, [
                    'session_id'   => $newSessionId,
                    'session_code' => $sessionCode,
                    'status'       => 'Active'
                ], 'Charging session initiated', 201);

            } catch (Exception $e) {
                $pdo->rollBack();
                sendJsonResponse(false, null, 'Error starting session: ' . $e->getMessage(), 500);
            }
        }

        // Action: Complete Charging Session & Bill
        if ($action === 'complete') {
            $user = getCurrentUser();
            $sessionId = (int)($input['session_id'] ?? 0);
            $sessionCode = trim($input['session_code'] ?? '');
            $energy = (float)($input['energy_consumed'] ?? 24.8);
            $duration = (int)($input['duration_minutes'] ?? 38);
            $tariffRate = (float)($input['tariff_rate'] ?? 15.00);

            // Fetch session or active charger
            $sess = null;
            if ($sessionId || $sessionCode) {
                $stmt = $pdo->prepare("SELECT * FROM charging_sessions WHERE session_id = :id OR session_code = :code LIMIT 1");
                $stmt->execute([':id' => $sessionId, ':code' => $sessionCode]);
                $sess = $stmt->fetch();
            }

            // Calculations
            $energyCost = round($energy * $tariffRate, 2);
            $serviceFee = 20.00;
            $taxAmount = round(($energyCost + $serviceFee) * 0.09, 2);
            $totalCost = round($energyCost + $serviceFee + $taxAmount, 2);

            $pdo->beginTransaction();
            try {
                if ($sess) {
                    $updStmt = $pdo->prepare("
                        UPDATE charging_sessions 
                        SET end_time = NOW(),
                            energy_consumed = :energy,
                            duration_minutes = :dur,
                            energy_cost = :ecost,
                            service_fee = :sfee,
                            tax_amount = :tax,
                            total_cost = :total,
                            status = 'Completed'
                        WHERE session_id = :id
                    ");
                    $updStmt->execute([
                        ':energy' => $energy,
                        ':dur'    => $duration,
                        ':ecost'  => $energyCost,
                        ':sfee'   => $serviceFee,
                        ':tax'    => $taxAmount,
                        ':total'  => $totalCost,
                        ':id'     => $sess['session_id']
                    ]);
                    $finalSessionId = $sess['session_id'];
                    $finalCode = $sess['session_code'];
                    $chargerId = $sess['charger_id'];
                } else {
                    // Create directly completed session record
                    $maxId = (int)$pdo->query("SELECT MAX(session_id) FROM charging_sessions")->fetchColumn();
                    $finalCode = 'SES-2026-' . str_pad($maxId + 1, 4, '0', STR_PAD_LEFT);
                    $chargerId = (int)($input['charger_id'] ?? 2);
                    $stationId = (int)($input['station_id'] ?? 1);
                    $vehicleId = (int)($input['vehicle_id'] ?? 1);

                    $insStmt = $pdo->prepare("
                        INSERT INTO charging_sessions (session_code, user_id, vehicle_id, station_id, charger_id, start_time, end_time, energy_consumed, duration_minutes, energy_cost, service_fee, tax_amount, total_cost, status)
                        VALUES (:code, :uid, :vid, :sid, :cid, DATE_SUB(NOW(), INTERVAL :dur MINUTE), NOW(), :energy, :dur, :ecost, :sfee, :tax, :total, 'Completed')
                    ");
                    $insStmt->execute([
                        ':code'   => $finalCode,
                        ':uid'    => $user['user_id'],
                        ':vid'    => $vehicleId,
                        ':sid'    => $stationId,
                        ':cid'    => $chargerId,
                        ':dur'    => $duration,
                        ':energy' => $energy,
                        ':ecost'  => $energyCost,
                        ':sfee'   => $serviceFee,
                        ':tax'    => $taxAmount,
                        ':total'  => $totalCost
                    ]);
                    $finalSessionId = (int)$pdo->lastInsertId();
                }

                // Rule 43: Restore charger back to Available & increment hours
                $hoursAdded = round($duration / 60, 2);
                $pdo->prepare("
                    UPDATE chargers 
                    SET status = 'Available', 
                        total_hours_used = total_hours_used + :hours 
                    WHERE charger_id = :cid
                ")->execute([
                    ':hours' => $hoursAdded,
                    ':cid'   => $chargerId
                ]);

                // Record simulated payment
                $txnRef = 'TXN-' . time() . rand(100, 999);
                $pdo->prepare("
                    INSERT INTO payments (session_id, amount, payment_method, status, transaction_reference)
                    VALUES (:sid, :amt, 'UPI', 'Paid', :ref)
                ")->execute([
                    ':sid' => $finalSessionId,
                    ':amt' => $totalCost,
                    ':ref' => $txnRef
                ]);

                // Notification
                $pdo->prepare("
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (:uid, 'Charging Completed', :msg, 'success')
                ")->execute([
                    ':uid' => $user['user_id'],
                    ':msg' => "Session $finalCode completed: $energy kWh delivered. Total: ₹$totalCost."
                ]);

                $pdo->commit();

                sendJsonResponse(true, [
                    'session_id'      => $finalSessionId,
                    'session_code'    => $finalCode,
                    'energy_consumed' => $energy,
                    'duration'        => $duration,
                    'total_cost'      => $totalCost,
                    'txn_ref'         => $txnRef
                ], 'Charging session completed and invoice generated successfully');

            } catch (Exception $e) {
                $pdo->rollBack();
                sendJsonResponse(false, null, 'Error completing session: ' . $e->getMessage(), 500);
            }
        }
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
