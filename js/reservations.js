/**
 * EV Charging Station Management System
 * Reservations Controller (js/reservations.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  initReservationModalData();
  renderReservationsTable();

  window.addEventListener('evDataSynced', () => {
    initReservationModalData();
    renderReservationsTable();
  });

  // Search & filter events
  const searchInput = document.getElementById('resSearchKeyword');
  const statusSelect = document.getElementById('resFilterStatus');
  const dateInput = document.getElementById('resFilterDate');
  const resetBtn = document.getElementById('resResetFiltersBtn');

  if (searchInput) searchInput.addEventListener('input', renderReservationsTable);
  if (statusSelect) statusSelect.addEventListener('change', renderReservationsTable);
  if (dateInput) dateInput.addEventListener('change', renderReservationsTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = '';
      if (dateInput) dateInput.value = '';
      renderReservationsTable();
    });
  }

  // Reservation form submit
  const form = document.getElementById('newReservationForm');
  if (form) {
    form.addEventListener('submit', handleCreateReservation);
  }

  // Check URL params if arrived from "Reserve Slot" buttons
  const urlParams = new URLSearchParams(window.location.search);
  const paramStationId = urlParams.get('stationId');
  const paramChargerId = urlParams.get('chargerId');

  if (paramStationId || paramChargerId) {
    const modalEl = document.getElementById('newReservationModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      setTimeout(() => {
        if (paramStationId) {
          const stnSel = document.getElementById('resStationSelect');
          if (stnSel) {
            stnSel.value = paramStationId;
            updateChargersDropdown(paramStationId);
          }
        }
        if (paramChargerId) {
          const chSel = document.getElementById('resChargerSelect');
          if (chSel) chSel.value = paramChargerId;
        }
      }, 200);
    }
  }
});

function initReservationModalData() {
  const stnSelect = document.getElementById('resStationSelect');
  const vehSelect = document.getElementById('resVehicleSelect');
  const dateInput = document.getElementById('resDateInput');

  // Set default date to today
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }

  // Populate stations
  const stations = evApp.getStations();
  if (stnSelect) {
    stnSelect.innerHTML = '';
    stations.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.city})`;
      stnSelect.appendChild(opt);
    });

    stnSelect.addEventListener('change', (e) => {
      updateChargersDropdown(e.target.value);
    });

    if (stations.length > 0) {
      updateChargersDropdown(stations[0].id);
    }
  }

  // Populate vehicles
  const vehicles = evApp.getVehicles();
  if (vehSelect) {
    vehSelect.innerHTML = '';
    vehicles.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.model} (${v.number}) - ${v.connectorType}`;
      vehSelect.appendChild(opt);
    });
  }

  // Live Conflict & Maintenance check on change
  const chSelect = document.getElementById('resChargerSelect');
  const timeInput = document.getElementById('resTimeInput');
  const durSelect = document.getElementById('resDurationSelect');

  [chSelect, dateInput, timeInput, durSelect].forEach(el => {
    if (el) el.addEventListener('change', checkAvailabilityRealtime);
  });
}

function updateChargersDropdown(stationId) {
  const chSelect = document.getElementById('resChargerSelect');
  if (!chSelect) return;

  const chargers = evApp.getChargersByStation(stationId);
  chSelect.innerHTML = '';

  chargers.forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch.id;
    opt.textContent = `${ch.code} - ${ch.connectorType} (${ch.powerKw} kW) [${ch.status.toUpperCase()}]`;
    chSelect.appendChild(opt);
  });

  checkAvailabilityRealtime();
}

function checkAvailabilityRealtime() {
  const chargerId = document.getElementById('resChargerSelect')?.value;
  const date = document.getElementById('resDateInput')?.value;
  const time = document.getElementById('resTimeInput')?.value;
  const duration = document.getElementById('resDurationSelect')?.value;

  const conflictAlert = document.getElementById('reservationConflictAlert');
  const maintAlert = document.getElementById('reservationMaintenanceAlert');
  const confirmBtn = document.getElementById('confirmReservationBtn');
  const metaDisplay = document.getElementById('resChargerMeta');

  if (!chargerId) return;

  const charger = evApp.getChargerById(chargerId);
  if (!charger) return;

  if (metaDisplay) {
    metaDisplay.textContent = `Connector: ${charger.connectorType} | Power: ${charger.powerKw} kW | Current Bay Status: ${charger.status}`;
  }

  // Rule 43: A charger under maintenance or offline cannot be reserved
  let canBook = true;
  if (charger.status === 'Maintenance' || charger.status === 'Offline') {
    if (maintAlert) maintAlert.classList.remove('d-none');
    canBook = false;
  } else {
    if (maintAlert) maintAlert.classList.add('d-none');
  }

  // Rule 42: Double booking conflict detection
  const hasConflict = evApp.checkConflict(chargerId, date, time, duration);
  if (hasConflict) {
    if (conflictAlert) conflictAlert.classList.remove('d-none');
    canBook = false;
  } else {
    if (conflictAlert) conflictAlert.classList.add('d-none');
  }

  if (confirmBtn) {
    confirmBtn.disabled = !canBook;
  }
}

function handleCreateReservation(e) {
  e.preventDefault();

  const customerName = document.getElementById('resCustomerName').value.trim();
  const vehicleId = document.getElementById('resVehicleSelect').value;
  const stationId = document.getElementById('resStationSelect').value;
  const chargerId = document.getElementById('resChargerSelect').value;
  const date = document.getElementById('resDateInput').value;
  const startTime = document.getElementById('resTimeInput').value;
  const duration = parseInt(document.getElementById('resDurationSelect').value);

  // Validate conflict
  const hasConflict = evApp.checkConflict(chargerId, date, startTime, duration);
  if (hasConflict) {
    showToast('Reservation Error', 'This charger is already reserved for the selected time window.', 'danger');
    return;
  }

  const charger = evApp.getChargerById(chargerId);
  if (charger.status === 'Maintenance' || charger.status === 'Offline') {
    showToast('Booking Rejected', 'This charger is under maintenance or offline.', 'danger');
    return;
  }

  const station = evApp.getStationById(stationId);
  const vehicle = evApp.getVehicles().find(v => v.id === vehicleId) || { model: 'Nexon EV', number: 'TN 38' };

  const currentRes = evApp.getReservations();
  const nextNum = currentRes.length + 1;
  const newId = 'RES-2026-' + String(nextNum).padStart(3, '0');

  const newReservation = {
    id: newId,
    userId: evApp.getCurrentUser().id,
    customerName: customerName,
    stationId: stationId,
    stationName: station.name,
    chargerId: chargerId,
    chargerCode: charger.code,
    vehicleId: vehicleId,
    vehicleName: `${vehicle.model} (${vehicle.number})`,
    date: date,
    startTime: startTime,
    duration: duration,
    status: 'Upcoming',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  evApp.saveReservation(newReservation);
  evApp.addNotification('Reservation Confirmed', `Your charging reservation ${newId} for ${charger.code} starts at ${startTime} on ${date}.`, 'info');
  showToast('Reservation Confirmed', `Charging slot reserved successfully: ${newId}`, 'success');

  const modalEl = document.getElementById('newReservationModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  renderReservationsTable();
}

function renderReservationsTable() {
  const tbody = document.getElementById('reservationsTableBody');
  const summary = document.getElementById('resCountSummary');
  if (!tbody) return;

  const keyword = (document.getElementById('resSearchKeyword')?.value || '').toLowerCase().trim();
  const status = document.getElementById('resFilterStatus')?.value || '';
  const date = document.getElementById('resFilterDate')?.value || '';

  const allRes = evApp.getReservations();

  const filtered = allRes.filter(r => {
    const matchesKeyword = !keyword || 
      r.id.toLowerCase().includes(keyword) || 
      (r.customerName && r.customerName.toLowerCase().includes(keyword)) || 
      (r.vehicleName && r.vehicleName.toLowerCase().includes(keyword)) || 
      (r.stationName && r.stationName.toLowerCase().includes(keyword));

    const matchesStatus = !status || r.status === status;
    const matchesDate = !date || r.date === date;

    return matchesKeyword && matchesStatus && matchesDate;
  });

  if (summary) {
    summary.textContent = `Showing ${filtered.length} of ${allRes.length} bookings`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No reservations matched the criteria.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    let badgeClass = 'bg-secondary';
    if (r.status === 'Upcoming') badgeClass = 'bg-primary';
    else if (r.status === 'Active') badgeClass = 'bg-info text-dark';
    else if (r.status === 'Completed') badgeClass = 'bg-success';
    else if (r.status === 'Cancelled') badgeClass = 'bg-danger';

    html += `
      <tr>
        <td>
          <span class="font-monospace fw-bold text-dark">${r.id}</span>
          <div class="small text-muted" style="font-size:0.72rem;">Booked: ${r.createdAt}</div>
        </td>
        <td>
          <div class="fw-semibold text-dark">${r.customerName || 'Customer'}</div>
          <small class="text-muted">${r.vehicleName || 'Tata Nexon EV'}</small>
        </td>
        <td>
          <div class="fw-semibold">${r.stationName}</div>
        </td>
        <td>
          <span class="badge bg-light text-dark border font-monospace px-2 py-1">${r.chargerCode}</span>
        </td>
        <td>
          <div class="fw-bold">${r.date}</div>
          <small class="text-primary font-monospace"><i class="bi bi-clock me-1"></i>${r.startTime}</small>
        </td>
        <td>
          <span class="font-monospace">${r.duration} mins</span>
        </td>
        <td>
          <span class="badge ${badgeClass} px-2 py-1">${r.status}</span>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            ${r.status === 'Upcoming' ? `
              <a href="charging-session.html?reservationId=${r.id}" class="btn btn-outline-success" title="Check In & Start Session">
                <i class="bi bi-play-circle"></i> Start
              </a>
              <button class="btn btn-outline-danger" onclick="cancelReservation('${r.id}')" title="Cancel Booking">
                <i class="bi bi-x-circle"></i>
              </button>
            ` : `
              <span class="text-muted small px-2">Archived</span>
            `}
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function cancelReservation(resId) {
  if (!confirm(`Are you sure you want to cancel reservation ${resId}?`)) return;

  const list = evApp.getReservations();
  const target = list.find(r => r.id === resId);
  if (target) {
    target.status = 'Cancelled';
    evApp.set('ev_reservations', list);

    // Free up charger if it was marked Reserved
    evApp.updateChargerStatus(target.chargerId, 'Available');
    evApp.addNotification('Reservation Cancelled', `Reservation ${resId} was successfully cancelled.`, 'warning');
    showToast('Cancelled', `Reservation ${resId} has been cancelled.`, 'info');
    renderReservationsTable();
  }
}
