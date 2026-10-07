<?php
/**
 * EV Charging Station Management System - Maintenance API
 * Stage 2: Hardware fault reporting, technician work orders, and automatic bay lockout in MySQL
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $status = trim($_GET['status'] ?? '');
        $priority = trim($_GET['priority'] ?? '');
        $keyword = trim($_GET['keyword'] ?? '');

        $sql = "
            SELECT 
                m.maintenance_id,
                m.maintenance_code,
                m.charger_id,
                m.technician_id,
                m.issue,
                m.priority,
                m.reported_date,
                m.start_date,
                m.completion_date,
                m.status,
                m.remarks,
                c.charger_code,
                c.connector_type,
                c.charging_power,
                s.station_name,
                s.city,
                u.name AS technician_name
            FROM maintenance m
            JOIN chargers c ON m.charger_id = c.charger_id
            JOIN stations s ON c.station_id = s.station_id
            JOIN users u ON m.technician_id = u.user_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($status)) {
            $sql .= " AND m.status = :status";
            $params[':status'] = $status;
        }

        if (!empty($priority)) {
            $sql .= " AND m.priority = :priority";
            $params[':priority'] = $priority;
        }

        if (!empty($keyword)) {
            $sql .= " AND (m.maintenance_code LIKE :kw1 OR c.charger_code LIKE :kw2 OR s.station_name LIKE :kw3 OR m.issue LIKE :kw4)";
            $params[':kw1'] = "%$keyword%";
            $params[':kw2'] = "%$keyword%";
            $params[':kw3'] = "%$keyword%";
            $params[':kw4'] = "%$keyword%";
        }

        $sql .= " ORDER BY m.maintenance_id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tickets = $stmt->fetchAll();

        sendJsonResponse(true, $tickets, 'Maintenance tickets retrieved successfully');
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $input['action'] ?? $_GET['action'] ?? 'report';

        // Action: Update Work Order
        if ($action === 'update') {
            $ticketId = (int)($input['maintenance_id'] ?? 0);
            $ticketCode = trim($input['maintenance_code'] ?? '');
            $newStatus = trim($input['status'] ?? 'In Progress');
            $remarks = trim($input['remarks'] ?? '');

            $stmt = $pdo->prepare("SELECT maintenance_id, charger_id FROM maintenance WHERE maintenance_id = :id OR maintenance_code = :code LIMIT 1");
            $stmt->execute([':id' => $ticketId, ':code' => $ticketCode]);
            $ticket = $stmt->fetch();

            if (!$ticket) {
                sendJsonResponse(false, null, 'Maintenance work order not found', 404);
            }

            $pdo->beginTransaction();
            try {
                $updStmt = $pdo->prepare("
                    UPDATE maintenance 
                    SET status = :status,
                        remarks = :remarks,
                        completion_date = CASE WHEN :c_status = 'Completed' THEN CURDATE() ELSE completion_date END
                    WHERE maintenance_id = :id
                ");
                $updStmt->execute([
                    ':status'   => $newStatus,
                    ':remarks'  => $remarks,
                    ':c_status' => $newStatus,
                    ':id'       => $ticket['maintenance_id']
                ]);

                // Rule 43: If completed, restore charger to Available! Otherwise keep Maintenance
                if ($newStatus === 'Completed') {
                    $pdo->prepare("UPDATE chargers SET status = 'Available' WHERE charger_id = :cid")->execute([':cid' => $ticket['charger_id']]);
                } else {
                    $pdo->prepare("UPDATE chargers SET status = 'Maintenance' WHERE charger_id = :cid")->execute([':cid' => $ticket['charger_id']]);
                }

                $pdo->commit();
                sendJsonResponse(true, ['maintenance_id' => $ticket['maintenance_id'], 'status' => $newStatus], 'Maintenance work order updated');

            } catch (Exception $e) {
                $pdo->rollBack();
                sendJsonResponse(false, null, 'Failed to update work order: ' . $e->getMessage(), 500);
            }
        }

        // Action: Report New Fault
        $chargerId = (int)($input['charger_id'] ?? 0);
        $issue = trim($input['issue'] ?? '');
        $priority = trim($input['priority'] ?? 'Medium');
        $techId = (int)($input['technician_id'] ?? 3); // Default Arun Kumar

        if (!$chargerId || empty($issue)) {
            sendJsonResponse(false, null, 'Charger selection and issue description are required', 400);
        }

        // Generate MNT-2026-xx code
        $maxId = (int)$pdo->query("SELECT MAX(maintenance_id) FROM maintenance")->fetchColumn();
        $code = 'MNT-2026-' . str_pad($maxId + 1, 2, '0', STR_PAD_LEFT);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO maintenance (maintenance_code, charger_id, technician_id, issue, priority, reported_date, start_date, status, remarks)
                VALUES (:code, :cid, :tid, :issue, :prio, CURDATE(), CURDATE(), 'Reported', 'Dispatched to field service engineer.')
            ");
            $stmt->execute([
                ':code'  => $code,
                ':cid'   => $chargerId,
                ':tid'   => $techId,
                ':issue' => $issue,
                ':prio'  => $priority
            ]);
            $newTicketId = (int)$pdo->lastInsertId();

            // Rule 24 & 43: Immediately change charger status to MAINTENANCE (automatic safety lock)
            $pdo->prepare("UPDATE chargers SET status = 'Maintenance' WHERE charger_id = :cid")->execute([':cid' => $chargerId]);

            // Notification
            $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (1, 'Maintenance Dispatched', :msg, 'warning')
            ")->execute([
                ':msg' => "Work order $code created. Charger bay locked for technician inspection."
            ]);

            $pdo->commit();

            sendJsonResponse(true, [
                'maintenance_id'   => $newTicketId,
                'maintenance_code' => $code,
                'status'           => 'Reported'
            ], 'Fault reported successfully; charger bay locked for safety', 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(false, null, 'Error reporting fault: ' . $e->getMessage(), 500);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
