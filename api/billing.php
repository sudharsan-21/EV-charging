<?php
/**
 * EV Charging Station Management System - Billing & Payment API
 * Stage 2: Tax invoice ledger and simulated payment processing backed by MySQL
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sessionId = isset($_GET['session_id']) ? (int)$_GET['session_id'] : null;
        $sessionCode = trim($_GET['session_code'] ?? '');

        // Detailed single invoice
        if ($sessionId || !empty($sessionCode)) {
            $stmt = $pdo->prepare("
                SELECT 
                    s.session_id,
                    s.session_code,
                    s.start_time,
                    s.end_time,
                    s.energy_consumed,
                    s.duration_minutes,
                    s.energy_cost,
                    s.service_fee,
                    s.tax_amount,
                    s.total_cost,
                    s.status AS session_status,
                    u.name AS customer_name,
                    u.email AS customer_email,
                    u.phone AS customer_phone,
                    v.vehicle_model,
                    v.vehicle_number,
                    st.station_name,
                    st.address AS station_address,
                    st.city AS station_city,
                    COALESCE(pr.price_per_kwh, 15.00) AS price_per_kwh,
                    c.charger_code,
                    c.connector_type,
                    c.charging_power,
                    COALESCE(p.payment_id, 0) AS payment_id,
                    COALESCE(p.status, 'Pending') AS payment_status,
                    COALESCE(p.payment_method, 'UPI') AS payment_method,
                    COALESCE(p.transaction_reference, 'N/A') AS transaction_reference
                FROM charging_sessions s
                JOIN users u ON s.user_id = u.user_id
                JOIN vehicles v ON s.vehicle_id = v.vehicle_id
                JOIN stations st ON s.station_id = st.station_id
                JOIN chargers c ON s.charger_id = c.charger_id
                LEFT JOIN pricing pr ON s.station_id = pr.station_id
                LEFT JOIN payments p ON s.session_id = p.session_id
                WHERE s.session_id = :id OR s.session_code = :code
                LIMIT 1
            ");
            $stmt->execute([':id' => $sessionId, ':code' => $sessionCode]);
            $invoice = $stmt->fetch();

            if (!$invoice) {
                sendJsonResponse(false, null, 'Invoice record not found', 404);
            }

            sendJsonResponse(true, $invoice, 'Invoice retrieved successfully');
        }

        // List all invoices
        $stmt = $pdo->query("
            SELECT 
                s.session_id,
                s.session_code,
                s.end_time,
                s.energy_consumed,
                s.total_cost,
                u.name AS customer_name,
                v.vehicle_model,
                st.station_name,
                COALESCE(p.status, 'Pending') AS payment_status,
                COALESCE(p.transaction_reference, 'Pending') AS transaction_reference
            FROM charging_sessions s
            JOIN users u ON s.user_id = u.user_id
            JOIN vehicles v ON s.vehicle_id = v.vehicle_id
            JOIN stations st ON s.station_id = st.station_id
            LEFT JOIN payments p ON s.session_id = p.session_id
            ORDER BY s.session_id DESC
        ");
        $invoices = $stmt->fetchAll();

        sendJsonResponse(true, $invoices, 'Invoices list retrieved');
        break;

    case 'POST':
        $input = getJsonInput();
        $action = $input['action'] ?? 'pay';

        $sessionId = (int)($input['session_id'] ?? 0);
        $newStatus = trim($input['status'] ?? 'Paid');
        $payMethod = trim($input['payment_method'] ?? 'UPI');

        if (!$sessionId) {
            sendJsonResponse(false, null, 'Session ID required', 400);
        }

        // Check if payment already exists
        $chk = $pdo->prepare("SELECT payment_id FROM payments WHERE session_id = :sid LIMIT 1");
        $chk->execute([':sid' => $sessionId]);
        $existing = $chk->fetch();

        if ($existing) {
            $upd = $pdo->prepare("UPDATE payments SET status = :status, payment_method = :method WHERE session_id = :sid");
            $upd->execute([':status' => $newStatus, ':method' => $payMethod, ':sid' => $sessionId]);
        } else {
            // Get total from session
            $amtStmt = $pdo->prepare("SELECT total_cost FROM charging_sessions WHERE session_id = :sid LIMIT 1");
            $amtStmt->execute([':sid' => $sessionId]);
            $amount = (float)$amtStmt->fetchColumn();

            $txnRef = 'TXN-' . time() . rand(100, 999);
            $ins = $pdo->prepare("
                INSERT INTO payments (session_id, amount, payment_method, status, transaction_reference)
                VALUES (:sid, :amt, :method, :status, :ref)
            ");
            $ins->execute([
                ':sid'    => $sessionId,
                ':amt'    => $amount,
                ':method' => $payMethod,
                ':status' => $newStatus,
                ':ref'    => $txnRef
            ]);
        }

        sendJsonResponse(true, ['session_id' => $sessionId, 'status' => $newStatus], "Payment status updated to $newStatus");
        break;

    default:
        sendJsonResponse(false, null, 'Method not allowed', 405);
        break;
}
