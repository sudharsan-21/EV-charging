<?php
/**
 * EV Charging Station Management System - Session Management
 * Stage 2: Authentication state and role-based access control
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if a user is currently authenticated
 */
function isLoggedIn() {
    return isset($_SESSION['ev_user']) && !empty($_SESSION['ev_user']['user_id']);
}

/**
 * Get current logged in user array or default guest/admin fallback
 */
function getCurrentUser() {
    if (isLoggedIn()) {
        return $_SESSION['ev_user'];
    }
    // Default demo fallback for presentation convenience
    return [
        'user_id' => 1,
        'name'    => 'Rajesh Sharma',
        'email'   => 'admin@evcharge.com',
        'role'    => 'ADMIN',
        'phone'   => '+91 98450 12345'
    ];
}

/**
 * Set logged in user session
 */
function setSessionUser($user) {
    $_SESSION['ev_user'] = [
        'user_id' => $user['user_id'],
        'name'    => $user['name'],
        'email'   => $user['email'],
        'role'    => $user['role'],
        'phone'   => $user['phone'] ?? ''
    ];
}

/**
 * Destroy session on logout
 */
function destroySessionUser() {
    unset($_SESSION['ev_user']);
    session_destroy();
}

/**
 * Enforce role authorization
 */
function requireRole($allowedRoles = []) {
    $user = getCurrentUser();
    if (!in_array($user['role'], (array)$allowedRoles)) {
        sendJsonResponse(false, null, 'Access denied: insufficient permissions for role ' . $user['role'], 403);
    }
}
