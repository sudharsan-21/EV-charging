/**
 * EV Charging Station Management System
 * Maintenance & Fault Dispatch Controller (js/maintenance.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  populateChargerOptions();
  renderMaintenanceTable();

  window.addEventListener('evDataSynced', () => {
    populateChargerOptions();
    renderMaintenanceTable();
  });

  // Search & Filters
  const searchInput = document.getElementById('maintSearchKeyword');
  const statusSelect = document.getElementById('maintFilterStatus');
  const prioritySelect = document.getElementById('maintFilterPriority');
  const resetBtn = document.getElementById('maintResetFiltersBtn');

  if (searchInput) searchInput.addEventListener('input', renderMaintenanceTable);
  if (statusSelect) statusSelect.addEventListener('change', renderMaintenanceTable);
  if (prioritySelect) prioritySelect.addEventListener('change', renderMaintenanceTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = '';
      if (prioritySelect) prioritySelect.value = '';
      renderMaintenanceTable();
    });
  }

  // Report Fault form
  const reportForm = document.getElementById('reportFaultForm');
  if (reportForm) {
    reportForm.addEventListener('submit', handleReportFault);
  }

  // Check URL params if arrived from "Report" button on a charger
  const urlParams = new URLSearchParams(window.location.search);
  const paramChargerId = urlParams.get('chargerId');
  if (paramChargerId) {
    const modalEl = document.getElementById('reportFaultModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
      setTimeout(() => {
        const sel = document.getElementById('faultChargerSelect');
        if (sel) sel.value = paramChargerId;
      }, 200);
    }
  }
});

function populateChargerOptions() {
  const chargers = evApp.getChargers();
  const stations = evApp.getStations();
  const select = document.getElementById('faultChargerSelect');
  if (!select) return;

  select.innerHTML = '';
  chargers.forEach(ch => {
    const stn = stations.find(s => s.id === ch.stationId) || { name: 'Station' };
    const opt = document.createElement('option');
    opt.value = ch.id;
    opt.textContent = `${ch.code} - ${stn.name} (${ch.connectorType} ${ch.powerKw}kW) [${ch.status}]`;
    select.appendChild(opt);
  });
}

function handleReportFault(e) {
  e.preventDefault();

  const chargerId = document.getElementById('faultChargerSelect').value;
  const category = document.getElementById('faultCategorySelect').value;
  const priority = document.getElementById('faultPrioritySelect').value;
  const desc = document.getElementById('faultDescInput').value.trim();

  const charger = evApp.getChargerById(chargerId);
  const station = evApp.getStationById(charger.stationId);

  const currentMaint = evApp.getMaintenance();
  const nextNum = currentMaint.length + 1;
  const newId = 'MNT-2026-' + String(nextNum).padStart(2, '0');

  const newTicket = {
    id: newId,
    chargerId: charger.id,
    chargerCode: charger.code,
    stationId: station.id,
    stationName: station.name,
    technicianId: 'USR-003',
    technicianName: 'Arun Kumar',
    issue: `${category}: ${desc}`,
    priority: priority,
    reportedDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    completionDate: null,
    status: 'Reported',
    remarks: 'Dispatched to field maintenance technician.'
  };

  // Rule 24 & 43: Automatically set charger status to Maintenance
  evApp.saveMaintenance(newTicket);
  evApp.addNotification('Maintenance Alert', `Charger ${charger.code} has been placed under maintenance.`, 'warning');

  showToast('Fault Dispatched', `Ticket ${newId} logged. Charger ${charger.code} locked for safety.`, 'danger');

  const modalEl = document.getElementById('reportFaultModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  e.target.reset();
  renderMaintenanceTable();
}

function renderMaintenanceTable() {
  const tbody = document.getElementById('maintenanceTableBody');
  const summary = document.getElementById('maintCountSummary');
  if (!tbody) return;

  const keyword = (document.getElementById('maintSearchKeyword')?.value || '').toLowerCase().trim();
  const status = document.getElementById('maintFilterStatus')?.value || '';
  const priority = document.getElementById('maintFilterPriority')?.value || '';

  const allMaint = evApp.getMaintenance();

  const filtered = allMaint.filter(m => {
    const matchesKeyword = !keyword || 
      m.id.toLowerCase().includes(keyword) || 
      m.chargerCode.toLowerCase().includes(keyword) || 
      m.stationName.toLowerCase().includes(keyword) || 
      m.issue.toLowerCase().includes(keyword);

    const matchesStatus = !status || m.status === status;
    const matchesPriority = !priority || m.priority === priority;

    return matchesKeyword && matchesStatus && matchesPriority;
  });

  if (summary) {
    summary.textContent = `Showing ${filtered.length} of ${allMaint.length} tickets`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No maintenance work orders found.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    let priorityBadge = 'bg-secondary';
    if (m.priority === 'Critical') priorityBadge = 'bg-danger';
    else if (m.priority === 'High') priorityBadge = 'bg-warning text-dark';
    else if (m.priority === 'Medium') priorityBadge = 'bg-info text-dark';

    let statusBadge = 'bg-secondary';
    if (m.status === 'Reported') statusBadge = 'bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25';
    else if (m.status === 'In Progress') statusBadge = 'bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25';
    else if (m.status === 'Completed') statusBadge = 'bg-success bg-opacity-15 text-success border border-success border-opacity-25';

    html += `
      <tr>
        <td>
          <span class="font-monospace fw-bold text-dark">${m.id}</span>
          <div class="small text-muted" style="font-size:0.72rem;">${m.reportedDate}</div>
        </td>
        <td>
          <span class="badge bg-light text-dark border font-monospace px-2 py-1">${m.chargerCode}</span>
        </td>
        <td>
          <div class="small fw-semibold text-dark">${m.stationName}</div>
        </td>
        <td style="max-width: 280px;">
          <div class="text-dark small fw-semibold text-truncate" title="${m.issue}">${m.issue}</div>
          <small class="text-muted fst-italic" style="font-size:0.72rem;">${m.remarks || 'No remarks'}</small>
        </td>
        <td>
          <span class="badge ${priorityBadge} px-2 py-1">${m.priority}</span>
        </td>
        <td>
          <div class="small fw-semibold">${m.technicianName}</div>
        </td>
        <td>
          <span class="badge ${statusBadge} px-2 py-1">${m.status}</span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="openUpdateTicketModal('${m.id}')" title="Update Ticket">
            <i class="bi bi-pencil-square"></i> Resolve
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function openUpdateTicketModal(ticketId) {
  const ticket = evApp.getMaintenance().find(m => m.id === ticketId);
  if (!ticket) return;

  document.getElementById('updateTicketId').value = ticket.id;
  document.getElementById('updateTicketDisplayId').textContent = `${ticket.id} (${ticket.chargerCode})`;
  document.getElementById('updateTicketStatusSelect').value = ticket.status;
  document.getElementById('updateTicketRemarksInput').value = ticket.remarks || '';

  const modal = new bootstrap.Modal(document.getElementById('updateTicketModal'));
  modal.show();
}

function saveTicketUpdate() {
  const ticketId = document.getElementById('updateTicketId').value;
  const newStatus = document.getElementById('updateTicketStatusSelect').value;
  const newRemarks = document.getElementById('updateTicketRemarksInput').value.trim();

  const list = evApp.getMaintenance();
  const ticket = list.find(m => m.id === ticketId);
  if (!ticket) return;

  ticket.status = newStatus;
  ticket.remarks = newRemarks;
  if (newStatus === 'Completed') {
    ticket.completionDate = new Date().toISOString().split('T')[0];
    // Rule 24 & 43: Restore charger to Available!
    evApp.updateChargerStatus(ticket.chargerId, 'Available');
    evApp.addNotification('Charger Available', `Charger ${ticket.chargerCode} maintenance completed and back in service.`, 'success');
    showToast('Maintenance Resolved', `Charger ${ticket.chargerCode} returned to AVAILABLE status.`, 'success');
  } else {
    evApp.updateChargerStatus(ticket.chargerId, 'Maintenance');
    showToast('Ticket Updated', `Ticket ${ticket.id} status is now ${newStatus}.`, 'info');
  }

  evApp.saveMaintenance(ticket);

  const modalEl = document.getElementById('updateTicketModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  renderMaintenanceTable();
}
