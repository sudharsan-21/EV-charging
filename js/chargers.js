/**
 * EV Charging Station Management System
 * Chargers Controller (js/chargers.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  populateStationFilterOptions();
  renderChargersTable();

  window.addEventListener('evDataSynced', () => {
    populateStationFilterOptions();
    renderChargersTable();
  });

  // Filter listeners
  const keywordInput = document.getElementById('chargerSearchKeyword');
  const stationSelect = document.getElementById('filterChargerStation');
  const connectorSelect = document.getElementById('filterChargerConnector');
  const powerSelect = document.getElementById('filterChargerPower');
  const statusSelect = document.getElementById('filterChargerStatus');
  const resetBtn = document.getElementById('resetChargerFiltersBtn');

  if (keywordInput) keywordInput.addEventListener('input', renderChargersTable);
  if (stationSelect) stationSelect.addEventListener('change', renderChargersTable);
  if (connectorSelect) connectorSelect.addEventListener('change', renderChargersTable);
  if (powerSelect) powerSelect.addEventListener('change', renderChargersTable);
  if (statusSelect) statusSelect.addEventListener('change', renderChargersTable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (keywordInput) keywordInput.value = '';
      if (stationSelect) stationSelect.value = '';
      if (connectorSelect) connectorSelect.value = '';
      if (powerSelect) powerSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      renderChargersTable();
    });
  }

  // Add Charger Form
  const addForm = document.getElementById('addChargerForm');
  if (addForm) {
    addForm.addEventListener('submit', handleAddCharger);
  }
});

function populateStationFilterOptions() {
  const stations = evApp.getStations();
  const filterSelect = document.getElementById('filterChargerStation');
  const modalSelect = document.getElementById('newChargerStation');

  stations.forEach(s => {
    if (filterSelect) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.city})`;
      filterSelect.appendChild(opt);
    }
    if (modalSelect) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.city})`;
      modalSelect.appendChild(opt);
    }
  });
}

function renderChargersTable() {
  const tbody = document.getElementById('chargersTableBody');
  const summary = document.getElementById('chargerCountSummary');
  if (!tbody) return;

  const keyword = (document.getElementById('chargerSearchKeyword')?.value || '').toLowerCase().trim();
  const stationId = document.getElementById('filterChargerStation')?.value || '';
  const connector = document.getElementById('filterChargerConnector')?.value || '';
  const power = document.getElementById('filterChargerPower')?.value || '';
  const status = document.getElementById('filterChargerStatus')?.value || '';

  const allChargers = evApp.getChargers();
  const allStations = evApp.getStations();

  const filtered = allChargers.filter(ch => {
    const stn = allStations.find(s => s.id === ch.stationId);
    const stnName = stn ? stn.name.toLowerCase() : '';

    const matchesKeyword = !keyword || 
      ch.code.toLowerCase().includes(keyword) || 
      ch.connectorType.toLowerCase().includes(keyword) || 
      stnName.includes(keyword);

    const matchesStation = !stationId || ch.stationId === stationId;
    const matchesConnector = !connector || ch.connectorType === connector;
    const matchesPower = !power || parseFloat(ch.powerKw) === parseFloat(power);
    const matchesStatus = !status || ch.status === status;

    return matchesKeyword && matchesStation && matchesConnector && matchesPower && matchesStatus;
  });

  if (summary) {
    summary.textContent = `Displaying ${filtered.length} of ${allChargers.length} charging points`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No chargers matched your filter settings.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(ch => {
    const stn = allStations.find(s => s.id === ch.stationId) || { name: 'Unknown Hub' };
    const utilScore = evApp.calculateUtilization(ch.id);

    // Section 22: High / Normal / Low utilization classification
    let utilBadge = `<span class="badge bg-secondary font-monospace">${utilScore}% (Low)</span>`;
    if (utilScore >= 75) {
      utilBadge = `<span class="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 font-monospace">${utilScore}% (High)</span>`;
    } else if (utilScore >= 40) {
      utilBadge = `<span class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 font-monospace">${utilScore}% (Normal)</span>`;
    }

    let statusBadge = `<span class="badge-status ${ch.status.toLowerCase()}">${ch.status}</span>`;

    html += `
      <tr>
        <td>
          <span class="font-monospace fw-bold text-dark">${ch.code}</span>
          <div class="small text-muted font-monospace" style="font-size:0.7rem;">ID: ${ch.id}</div>
        </td>
        <td>
          <div class="fw-semibold">${stn.name}</div>
          <small class="text-muted"><i class="bi bi-geo-alt"></i> ${stn.city || ''}</small>
        </td>
        <td>
          <span class="badge bg-light text-dark border px-2 py-1">${ch.connectorType}</span>
        </td>
        <td>
          <strong class="text-dark font-monospace">${ch.powerKw} kW</strong>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${utilBadge}
            <div class="progress flex-grow-1" style="height: 5px; width: 50px;">
              <div class="progress-bar ${utilScore >= 75 ? 'bg-danger' : (utilScore >= 40 ? 'bg-success' : 'bg-secondary')}" style="width: ${utilScore}%;"></div>
            </div>
          </div>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" onclick="openStatusModal('${ch.id}', '${ch.code}', '${ch.status}')" title="Change Status">
              <i class="bi bi-arrow-repeat"></i>
            </button>
            ${ch.status === 'Available' ? 
              `<a href="reservations.html?chargerId=${ch.id}" class="btn btn-outline-success" title="Reserve Slot"><i class="bi bi-calendar-plus"></i></a>` : 
              ''
            }
            <a href="maintenance.html?chargerId=${ch.id}" class="btn btn-outline-danger" title="Report Fault"><i class="bi bi-wrench"></i></a>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function handleAddCharger(e) {
  e.preventDefault();

  const stationId = document.getElementById('newChargerStation').value;
  const connector = document.getElementById('newChargerConnector').value;
  const power = parseFloat(document.getElementById('newChargerPower').value) || 60;
  const status = document.getElementById('newChargerStatus').value;

  const currentChargers = evApp.getChargers();
  const nextNum = currentChargers.length + 1;
  const newCode = 'CH-' + String(nextNum).padStart(3, '0');

  const newCharger = {
    id: newCode,
    stationId,
    code: newCode,
    connectorType: connector,
    powerKw: power,
    status: status,
    installedDate: new Date().toISOString().split('T')[0],
    totalHoursUsed: 0
  };

  evApp.saveCharger(newCharger);
  showToast('Charger Deployed', `Charger ${newCode} deployed successfully!`, 'success');

  const modalEl = document.getElementById('addChargerModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  e.target.reset();
  renderChargersTable();
}

// Quick Status Switch Modal
function openStatusModal(id, code, currentStatus) {
  document.getElementById('statusModalChargerId').value = id;
  document.getElementById('statusModalChargerCode').textContent = code;
  document.getElementById('statusModalSelect').value = currentStatus;

  const modal = new bootstrap.Modal(document.getElementById('statusChangeModal'));
  modal.show();
}

function saveStatusChange() {
  const id = document.getElementById('statusModalChargerId').value;
  const newStatus = document.getElementById('statusModalSelect').value;

  evApp.updateChargerStatus(id, newStatus);
  showToast('Status Updated', `Charger ${id} is now ${newStatus}`, 'info');

  const modalEl = document.getElementById('statusChangeModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  renderChargersTable();
}
