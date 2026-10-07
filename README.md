# EV Charging Station Management System
## Academic Web Technology Course Project — Stage 1 & Stage 2 Complete

* **Project Title:** EV Charging Station Management System
* **Academic Reviews:**
  * **LWP Review 01:** Stage 1 — Static Web Application (HTML5, CSS3, JavaScript, Bootstrap 5)
  * **LWP Review 02:** Stage 2 — Dynamic Web Application (PHP, MySQL, Apache XAMPP, PDO, REST APIs)
* **Primary Focus:** Electric Vehicle Charging Infrastructure Operations & Energy Management

---

## 1. System Architecture (Three-Tier Enterprise Model)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER (FRONTEND)                         │
│  HTML5 Semantic Structure | CSS3 Custom Electric Mobility Styling      │
│  Bootstrap 5.3.3 Grid & UI Components | Chart.js 4 Data Visualizations │
│  Vanilla JavaScript (ES6+) Dynamic Controllers & Event Subscribers     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Asynchronous HTTP / JSON API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   APPLICATION TIER (PHP 8.2 BACKEND)                   │
│  Apache 2.4 Server (XAMPP at http://localhost/EV/)                     │
│  PDO Database Abstraction with Prepared Statements                     │
│  Role-Based Access Control (Admin, Station Manager, Tech, Customer)   │
│  Double-Booking Conflict Engine (Rule 42) & Maintenance Lockout (Rule 43)│
│  Energy Metering, Dynamic Pricing, Service Fee & GST 18% Invoicing     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Parameterized SQL Queries (3NF)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DATA TIER (MYSQL 8.0 RELATIONAL DB)                  │
│  Database Name: ev_charging_db (InnoDB Engine, utf8mb4)                │
│  10 Normalized Tables: users, stations, pricing, chargers, vehicles,   │
│  reservations, charging_sessions, payments, maintenance, notifications │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Directory Structure

```text
EV/
│
├── index.html                      # Landing page with hero, live counters, feature grid
├── setup_database.php              # 1-Click web installer & MySQL diagnostics
├── LWP_REVIEW_01_PRESENTATION.md   # Stage 1 Review presentation guide
├── LWP_REVIEW_02_PRESENTATION.md   # Stage 2 Dynamic review presentation guide
├── VIVA_QUESTIONS_GUIDE.md         # Comprehensive viva exam questions & answers
│
├── config/
│   ├── db.php                      # PDO connection helper (localhost, root, "")
│   └── session.php                 # PHP session management & role authorization
│
├── api/                            # RESTful JSON API Endpoints
│   ├── auth.php                    # Login, register, logout, session check & role switch
│   ├── dashboard.php               # Real-time aggregated KPIs & utilization metrics
│   ├── stations.php                # Stations directory & CRUD operations
│   ├── chargers.php                # Hardware bay inventory & live status updater
│   ├── vehicles.php                # Customer EV fleet & battery specs
│   ├── reservations.php            # Double-booking conflict & maintenance lockout engine
│   ├── charging.php                # Session lifecycle, timer & energy metering calculation
│   ├── billing.php                 # Itemized GST tax invoices & payment settlements
│   ├── maintenance.php             # Work orders, fault dispatch & auto bay lockout
│   └── reports.php                 # 5 Academic reports & RFC CSV export generator
│
├── database/
│   └── ev_charging_db.sql          # 10 Normalized tables & seed dataset
│
├── pages/
│   ├── dashboard.html              # Central KPI dashboard & analytics
│   ├── stations.html               # 24 Charging hubs directory & filtering
│   ├── station-details.html        # Detailed station bay visual board
│   ├── chargers.html               # 20+ Hardware bays inventory & status control
│   ├── find-charger.html           # Geospatial, power & connector search
│   ├── reservations.html           # Conflict-free slot reservation system
│   ├── vehicles.html               # Luxury & standard EV fleet management
│   ├── calculator.html             # Smart Charging Calculator (Battery, kW, Time, ₹)
│   ├── charging-session.html       # Live charging simulation with dynamic timers
│   ├── billing.html                # Itemized GST tax invoices & payment simulation
│   ├── maintenance.html            # Fault dispatch & auto-lockout tickets
│   ├── reports.html                # 5 Academic reports with CSV download
│   └── login.html                  # Role-based 1-click authentication demo
│
├── css/
│   ├── style.css                   # Core EV branding, battery graphics & components
│   ├── dashboard.css               # Sidebar, KPI cards, visual charger boards
│   └── responsive.css              # Breakpoints for desktop, tablet & mobile
│
└── js/
    ├── app.js                      # Core state manager, backend sync & utilities
    ├── dashboard.js                # KPI calculations & Chart.js instances
    ├── stations.js                 # Station list & filter controller
    ├── chargers.js                 # Charger bay grid & utilization rating
    ├── reservations.js             # Overlapping time conflict validator
    ├── vehicles.js                 # Luxury EV presets & battery visualizer
    ├── calculator.js               # Mathematical formulas & charge duration estimator
    ├── charging.js                 # Live timer simulator & kWh accumulator
    └── maintenance.js              # Fault tickets, priority & charger auto-lock
```

---

## 3. How to Run the Project in XAMPP (Stage 2)

### Prerequisites:
* **XAMPP** installed with Apache and MySQL services running.

### Quick Setup Steps:
1. Ensure the project is located in `C:\xampp\htdocs\EV` (or junctioned).
2. Start **Apache** and **MySQL** in the XAMPP Control Panel.
3. Open your browser and navigate to:
   ```text
   http://localhost/EV/setup_database.php
   ```
   * The setup script will automatically create the database `ev_charging_db`, import all 10 normalized tables, insert default seed data, and verify system health.
4. Launch the application:
   * **Homepage:** `http://localhost/EV/index.html`
   * **Dashboard:** `http://localhost/EV/pages/dashboard.html`
   * **Slot Reservations:** `http://localhost/EV/pages/reservations.html`
   * **Reports & CSV Export:** `http://localhost/EV/pages/reports.html`

---

## 4. Academic Features Implemented (Stage 2)

### A. Double-Booking Conflict Prevention (Rule 42)
Implemented directly in SQL via `api/reservations.php`:
$$\text{Overlap Condition: } (\text{New Start} < \text{Existing End}) \land (\text{New End} > \text{Existing Start})$$
Rejects conflicting bookings with HTTP 409 Conflict.

### B. Hardware Fault Auto-Lockout (Rule 43)
When a maintenance issue is logged via `api/maintenance.php`, the target charger's status automatically switches to `'Maintenance'`, preventing any customer reservations until a technician completes the work order.

### C. 5 Academic Reports with Real CSV Export
Available in `pages/reports.html` and `api/reports.php`:
1. **Charging Sessions Report**
2. **Energy Consumption Report**
3. **Station Revenue Report**
4. **Charger Utilization Report**
5. **Maintenance Tickets Report**
* Includes 1-click **Export Active Report (CSV)** that streams a real `.csv` spreadsheet file from MySQL.

### D. Comprehensive Luxury Vehicle Fleet & Coimbatore Network
* **Vehicles:** Porsche Taycan 4S, Mercedes-Benz EQS 580, BMW iX xDrive50, Audi e-tron GT, Tesla Model 3 Long Range, Volvo XC40 Recharge, Jaguar I-PACE, Tata Nexon EV, MG ZS EV, Mahindra XUV400.
* **Stations:** 20+ charging hubs across Coimbatore (Avinashi Road, Gandhipuram, RS Puram, Peelamedu, Saravanampatti IT Park, Prozone Mall, Brookefields Mall, Coimbatore Airport, etc.) plus Chennai and Bengaluru hubs.

---

## 5. Security Architecture
* **PDO Prepared Statements:** Parameterized queries used across all 10 endpoints.
* **Password Hashing:** Passwords encrypted using `password_hash($pass, PASSWORD_BCRYPT)`.
* **RBAC:** Session-based authentication enforcing Admin, Station Manager, Technician, and Customer permissions.
* **Input Sanitization:** Server-side validation and type-casting.

---
**Status:** 100% Complete, Tested, and Ready for Academic Submission and Viva Defense.
