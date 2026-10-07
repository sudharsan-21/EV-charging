/**
 * EV Charging Station Management System
 * Dashboard Controller (js/dashboard.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderDashboardKPIs();
  renderEnergyChart();
  renderChargerStatusChart();
  renderLiveChargerBoard();
  renderRecentSessionsTable();
  renderStationPerformanceTable();
  renderNotificationsModal();

  window.addEventListener('evDataSynced', () => {
    renderDashboardKPIs();
    renderLiveChargerBoard();
    renderRecentSessionsTable();
    renderStationPerformanceTable();
  });
});

/**
 * Update 8 KPI Metrics Cards
 */
function renderDashboardKPIs() {
  const stations = evApp.getStations();
  const chargers = evApp.getChargers();
  const sessions = evApp.getSessions();
  const maintenance = evApp.getMaintenance();

  const totalStations = stations.length;
  const totalChargers = chargers.length;
  const availableChargers = chargers.filter(c => c.status === 'Available').length;
  const chargingChargers = chargers.filter(c => c.status === 'Charging').length;
  const maintenanceChargers = chargers.filter(c => c.status === 'Maintenance').length;
  const activeSessions = sessions.filter(s => s.status === 'Active').length;

  // Calculate today's energy delivered
  const totalEnergy = sessions.reduce((acc, curr) => acc + (parseFloat(curr.energyConsumed) || 0), 0);
  const totalRevenue = sessions.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);

  // Update DOM elements if present
  const elTotalStations = document.getElementById('kpiTotalStations');
  const elTotalChargers = document.getElementById('kpiTotalChargers');
  const elAvailableChargers = document.getElementById('kpiAvailableChargers');
  const elChargingCount = document.getElementById('kpiChargingCount');
  const elMaintenanceCount = document.getElementById('kpiMaintenanceCount');
  const elActiveSessions = document.getElementById('kpiActiveSessions');
  const elTodayEnergy = document.getElementById('kpiTodayEnergy');
  const elTodayRevenue = document.getElementById('kpiTodayRevenue');
  const elAvailRate = document.getElementById('kpiAvailRate');

  if (elTotalStations) elTotalStations.textContent = totalStations;
  if (elTotalChargers) elTotalChargers.textContent = totalChargers;
  if (elAvailableChargers) elAvailableChargers.textContent = availableChargers;
  if (elChargingCount) elChargingCount.textContent = chargingChargers;
  if (elMaintenanceCount) elMaintenanceCount.textContent = maintenanceChargers;
  if (elActiveSessions) elActiveSessions.textContent = activeSessions;
  
  if (elAvailRate && totalChargers > 0) {
    elAvailRate.textContent = ((availableChargers / totalChargers) * 100).toFixed(1) + '%';
  }

  if (elTodayEnergy) {
    // Show in kWh or MWh
    const mwh = (totalEnergy / 1000).toFixed(2);
    elTodayEnergy.innerHTML = `${totalEnergy.toFixed(1)} <span class="fs-6 text-muted">kWh</span>`;
  }

  if (elTodayRevenue) {
    elTodayRevenue.textContent = formatCurrency(totalRevenue);
  }
}

/**
 * Render Chart.js - Daily Energy Delivered Chart
 */
function renderEnergyChart() {
  const ctx = document.getElementById('energyDeliveryChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Energy Delivered (kWh)',
          data: [1420, 1850, 1680, 2150, 2480, 2920, 2800],
          backgroundColor: 'rgba(0, 208, 132, 0.75)',
          borderColor: '#00d084',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: 'Peak Power Output (kW)',
          data: [420, 510, 480, 620, 710, 840, 790],
          type: 'line',
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          tension: 0.35,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'Plus Jakarta Sans', size: 12 } }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Energy (kWh)' },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Peak Output (kW)' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/**
 * Render Chart.js - Charger Status Breakdown Donut
 */
function renderChargerStatusChart() {
  const ctx = document.getElementById('chargerStatusChart');
  if (!ctx) return;

  const chargers = evApp.getChargers();
  const counts = {
    Available: chargers.filter(c => c.status === 'Available').length,
    Charging: chargers.filter(c => c.status === 'Charging').length,
    Reserved: chargers.filter(c => c.status === 'Reserved').length,
    Maintenance: chargers.filter(c => c.status === 'Maintenance').length,
    Offline: chargers.filter(c => c.status === 'Offline').length
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Available', 'Charging', 'Reserved', 'Maintenance', 'Offline'],
      datasets: [{
        data: [counts.Available, counts.Charging, counts.Reserved, counts.Maintenance, counts.Offline],
        backgroundColor: [
          '#10b981', // green
          '#06b6d4', // cyan
          '#f59e0b', // amber
          '#ef4444', // red
          '#64748b'  // slate grey
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } }
        }
      },
      cutout: '70%'
    }
  });
}

/**
 * Render Visual Charger Board (Section 35) for Coimbatore Central EV Hub
 */
function renderLiveChargerBoard() {
  const board = document.getElementById('dashChargerBoard');
  if (!board) return;

  const chargers = evApp.getChargersByStation('STN-001');
  let html = '';

  chargers.forEach(ch => {
    let statusClass = ch.status.toLowerCase();
    let badgeHtml = '';
    let extraDetails = '';

    if (ch.status === 'Available') {
      badgeHtml = `<span class="badge-status available"><i class="bi bi-check-circle-fill"></i> AVAILABLE</span>`;
      extraDetails = `<div class="small text-muted mt-2"><i class="bi bi-clock me-1"></i>Ready for connection</div>`;
    } else if (ch.status === 'Charging') {
      const progress = ch.currentSessionProgress || 65;
      badgeHtml = `<span class="badge-status charging"><i class="bi bi-lightning-charge-fill"></i> CHARGING ${progress}%</span>`;
      extraDetails = `
        <div class="mt-2">
          <div class="progress" style="height: 6px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" style="width: ${progress}%;"></div>
          </div>
          <div class="d-flex justify-content-between text-secondary mt-1" style="font-size:0.75rem;">
            <span>Current: 142A</span>
            <span>Est: 18 mins left</span>
          </div>
        </div>
      `;
    } else if (ch.status === 'Reserved') {
      badgeHtml = `<span class="badge-status reserved"><i class="bi bi-clock-history"></i> RESERVED</span>`;
      extraDetails = `<div class="small text-warning mt-2"><i class="bi bi-shield-check me-1"></i>Reserved for 10:30 AM</div>`;
    } else if (ch.status === 'Maintenance') {
      badgeHtml = `<span class="badge-status maintenance"><i class="bi bi-wrench-adjustable"></i> MAINTENANCE</span>`;
      extraDetails = `<div class="small text-danger mt-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>Hardware ticket active</div>`;
    } else {
      badgeHtml = `<span class="badge-status offline"><i class="bi bi-power"></i> OFFLINE</span>`;
      extraDetails = `<div class="small text-muted mt-2">Network link disconnected</div>`;
    }

    html += `
      <div class="charger-cell ${statusClass}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="charger-code-tag">${ch.code}</span>
          ${badgeHtml}
        </div>
        <div class="d-flex justify-content-between text-secondary small mb-1">
          <span>Connector: <strong>${ch.connectorType}</strong></span>
          <span>Power: <strong class="text-dark">${ch.powerKw} kW</strong></span>
        </div>
        ${extraDetails}
        <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
          <small class="text-muted" style="font-size: 0.72rem;">Utilization: ${evApp.calculateUtilization(ch.id)}%</small>
          <a href="reservations.html?chargerId=${ch.id}" class="btn btn-sm btn-outline-dark py-0 px-2" style="font-size: 0.75rem;">
            ${ch.status === 'Available' ? 'Reserve' : 'Details'}
          </a>
        </div>
      </div>
    `;
  });

  board.innerHTML = html;
}

/**
 * Render Recent Sessions Table
 */
function renderRecentSessionsTable() {
  const tbody = document.getElementById('dashSessionsTable');
  if (!tbody) return;

  const sessions = evApp.getSessions();
  let html = '';

  if (sessions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No charging sessions recorded yet.</td></tr>`;
    return;
  }

  sessions.slice(0, 5).forEach(s => {
    const isCompleted = s.status === 'Completed';
    html += `
      <tr>
        <td class="font-monospace fw-semibold">${s.id}</td>
        <td>
          <div class="fw-semibold">${s.vehicleName || 'Nexon EV'}</div>
          <small class="text-muted">${s.customerName}</small>
        </td>
        <td><span class="badge bg-light text-dark border font-monospace">${s.chargerCode}</span></td>
        <td class="font-monospace">${s.energyConsumed} kWh</td>
        <td class="font-monospace text-dark fw-bold">${formatCurrency(s.total)}</td>
        <td>
          <span class="badge ${isCompleted ? 'bg-success' : 'bg-info'} bg-opacity-15 ${isCompleted ? 'text-success' : 'text-info'} border ${isCompleted ? 'border-success' : 'border-info'} border-opacity-25 px-2 py-1">
            ${s.status}
          </span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Render Station Performance Table with Utilization Scores (Section 22 & 23)
 */
function renderStationPerformanceTable() {
  const tbody = document.getElementById('dashStationPerfTable');
  if (!tbody) return;

  const stations = evApp.getStations();
  const chargers = evApp.getChargers();
  let html = '';

  stations.slice(0, 5).forEach(stn => {
    const stnChargers = chargers.filter(c => c.stationId === stn.id);
    let totalUtil = 0;
    stnChargers.forEach(c => {
      totalUtil += evApp.calculateUtilization(c.id);
    });
    const avgUtil = stnChargers.length > 0 ? Math.round(totalUtil / stnChargers.length) : 60;

    let utilBadgeClass = 'bg-success';
    if (avgUtil < 50) utilBadgeClass = 'bg-secondary';
    else if (avgUtil >= 75) utilBadgeClass = 'bg-primary';

    html += `
      <tr>
        <td>
          <div class="fw-bold">${stn.name}</div>
          <small class="text-muted">${stn.city}</small>
        </td>
        <td class="font-monospace">${stnChargers.length} pts</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold small font-monospace">${avgUtil}%</span>
            <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
              <div class="progress-bar ${utilBadgeClass}" style="width: ${avgUtil}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${stn.status === 'Operational' ? 'bg-success' : 'bg-warning'} bg-opacity-25 ${stn.status === 'Operational' ? 'text-success' : 'text-warning'} border px-2 py-1">
            ${stn.status}
          </span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Render Notifications in Modal Dialog
 */
function renderNotificationsModal() {
  const container = document.getElementById('notificationsList');
  if (!container) return;

  const notifs = evApp.getNotifications();
  if (notifs.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">No notifications.</div>`;
    return;
  }

  let html = '<div class="list-group list-group-flush">';
  notifs.forEach(n => {
    let icon = 'bi-info-circle text-info';
    if (n.type === 'warning') icon = 'bi-exclamation-triangle text-warning';
    if (n.type === 'success') icon = 'bi-check-circle text-success';

    html += `
      <div class="list-group-item p-3 ${n.read ? '' : 'bg-light'}">
        <div class="d-flex align-items-start gap-3">
          <i class="bi ${icon} fs-5 mt-1"></i>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <strong class="text-dark">${n.title}</strong>
              <small class="text-muted">${n.time}</small>
            </div>
            <p class="mb-0 text-secondary small mt-1">${n.message}</p>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
