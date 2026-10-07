/**
 * EV Charging Station Management System
 * Charging Sessions & Live Simulation Controller (js/charging.js)
 */

let simulationInterval = null;
let isSimulationPaused = false;

// Active Simulation State
let activeSim = {
  sessionId: 'SES-2026-LIVE',
  vehicleName: 'Tata Nexon EV',
  vehicleNumber: 'TN 38 BZ 4021',
  batteryCapacity: 40.5,
  currentBattery: 42,
  targetBattery: 90,
  stationId: 'STN-001',
  stationName: 'Coimbatore Central EV Hub',
  chargerId: 'CH-002',
  chargerCode: 'CH-002',
  chargerPowerKw: 120,
  tariffRate: 15.0,
  energyDelivered: 0.0,
  elapsedSeconds: 0,
  accumulatedCost: 0.0
};

document.addEventListener('DOMContentLoaded', () => {
  initNewSessionModalOptions();
  renderSessionsTable();

  window.addEventListener('evDataSynced', () => {
    initNewSessionModalOptions();
    renderSessionsTable();
  });
  startLiveSimulationTimer();

  // Button controls
  const pauseBtn = document.getElementById('simPauseBtn');
  const stopBtn = document.getElementById('simStopBtn');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePauseSimulation);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopAndCompleteSession);
  }

  // New Session Form
  const newSessForm = document.getElementById('newSessionForm');
  if (newSessForm) {
    newSessForm.addEventListener('submit', handleStartNewSession);
  }

  // Search input
  const searchInput = document.getElementById('sessionSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderSessionsTable);
  }
});

function initNewSessionModalOptions() {
  const vehSelect = document.getElementById('newSessVehicle');
  const stnSelect = document.getElementById('newSessStation');

  const vehicles = evApp.getVehicles();
  const stations = evApp.getStations();

  if (vehSelect) {
    vehSelect.innerHTML = '';
    vehicles.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.model} (${v.number})`;
      vehSelect.appendChild(opt);
    });
  }

  if (stnSelect) {
    stnSelect.innerHTML = '';
    stations.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.city})`;
      stnSelect.appendChild(opt);
    });

    stnSelect.addEventListener('change', (e) => {
      updateModalChargerOptions(e.target.value);
    });

    if (stations.length > 0) {
      updateModalChargerOptions(stations[0].id);
    }
  }
}

function updateModalChargerOptions(stationId) {
  const chSelect = document.getElementById('newSessCharger');
  if (!chSelect) return;

  const chargers = evApp.getChargersByStation(stationId);
  chSelect.innerHTML = '';

  chargers.forEach(ch => {
    const opt = document.createElement('option');
    opt.value = ch.id;
    opt.textContent = `${ch.code} - ${ch.connectorType} (${ch.powerKw} kW) [${ch.status}]`;
    chSelect.appendChild(opt);
  });
}

function startLiveSimulationTimer() {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(() => {
    if (isSimulationPaused) return;

    activeSim.elapsedSeconds += 1; // 1s represents ~1 min of fast charge

    // Increment battery SoC smoothly towards target
    if (activeSim.currentBattery < activeSim.targetBattery) {
      activeSim.currentBattery = Math.min(activeSim.targetBattery, activeSim.currentBattery + 0.5);
    }

    // Energy calculation: Power * Time
    const incrementalEnergy = (activeSim.chargerPowerKw * 0.5) / 60; // kWh per tick
    activeSim.energyDelivered += incrementalEnergy;

    // Power output variation for realism (e.g. 56kW - 62kW)
    const variance = (Math.random() * 4 - 2);
    const livePower = Math.max(10, (activeSim.chargerPowerKw * 0.5) + variance);

    // Accumulated energy cost
    activeSim.accumulatedCost = activeSim.energyDelivered * activeSim.tariffRate;

    updateSimulationUI(livePower);

    // Auto complete if reached target
    if (activeSim.currentBattery >= activeSim.targetBattery) {
      stopAndCompleteSession();
    }
  }, 1000);
}

function updateSimulationUI(livePower) {
  const fill = document.getElementById('simBatteryFill');
  const pctDisplay = document.getElementById('simBatteryPct');
  const bar = document.getElementById('simProgressBar');
  const energyDisplay = document.getElementById('simEnergyDelivered');
  const powerDisplay = document.getElementById('simCurrentPower');
  const timeDisplay = document.getElementById('simElapsedTime');
  const costDisplay = document.getElementById('simCurrentCost');

  const roundedPct = Math.round(activeSim.currentBattery);

  if (fill) {
    fill.style.width = roundedPct + '%';
    fill.textContent = roundedPct + '%';
  }
  if (pctDisplay) pctDisplay.textContent = roundedPct + '%';
  if (bar) bar.style.width = roundedPct + '%';

  if (energyDisplay) energyDisplay.innerHTML = `${activeSim.energyDelivered.toFixed(2)} <small class="fs-6 fw-normal text-muted">kWh</small>`;
  if (powerDisplay) powerDisplay.innerHTML = `${livePower.toFixed(1)} <small class="fs-6 fw-normal text-muted">kW</small>`;

  if (timeDisplay) {
    const mins = Math.floor(activeSim.elapsedSeconds / 60);
    const secs = activeSim.elapsedSeconds % 60;
    timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (costDisplay) {
    costDisplay.textContent = formatCurrency(activeSim.accumulatedCost);
  }
}

function togglePauseSimulation() {
  isSimulationPaused = !isSimulationPaused;
  const btn = document.getElementById('simPauseBtn');
  if (btn) {
    if (isSimulationPaused) {
      btn.innerHTML = `<i class="bi bi-play-fill me-1"></i> Resume Simulation`;
      btn.className = 'btn btn-sm btn-outline-success';
      showToast('Simulation Paused', 'Session simulation paused.', 'info');
    } else {
      btn.innerHTML = `<i class="bi bi-pause-fill me-1"></i> Pause Simulation`;
      btn.className = 'btn btn-sm btn-outline-warning';
      showToast('Simulation Resumed', 'Session simulation running.', 'info');
    }
  }
}

function stopAndCompleteSession() {
  if (simulationInterval) clearInterval(simulationInterval);

  const durationMins = Math.max(15, Math.round(activeSim.elapsedSeconds));
  const energy = parseFloat(activeSim.energyDelivered.toFixed(2)) || 22.4;
  const energyCost = parseFloat((energy * activeSim.tariffRate).toFixed(2));
  const serviceFee = 20.00;
  const tax = parseFloat(((energyCost + serviceFee) * 0.09).toFixed(2));
  const total = parseFloat((energyCost + serviceFee + tax).toFixed(2));

  const currentSessions = evApp.getSessions();
  const nextNum = currentSessions.length + 1;
  const sessionId = 'SES-2026-' + String(nextNum).padStart(4, '0');

  const completedSession = {
    id: sessionId,
    reservationId: null,
    userId: evApp.getCurrentUser().id,
    customerName: evApp.getCurrentUser().name,
    vehicleName: activeSim.vehicleName,
    stationId: activeSim.stationId,
    stationName: activeSim.stationName,
    chargerId: activeSim.chargerId,
    chargerCode: activeSim.chargerCode,
    startTime: new Date(Date.now() - durationMins * 60000).toISOString().replace('T', ' ').substring(0, 16),
    endTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
    energyConsumed: energy,
    durationMinutes: durationMins,
    cost: energyCost,
    serviceFee: serviceFee,
    tax: tax,
    total: total,
    status: 'Completed',
    paymentStatus: 'Paid'
  };

  evApp.saveSession(completedSession);
  evApp.updateChargerStatus(activeSim.chargerId, 'Available');
  evApp.addNotification('Charging Completed', `Session ${sessionId} finished! Total: ${energy} kWh (${formatCurrency(total)})`, 'success');

  showToast('Charging Complete', `Session ${sessionId} completed and recorded.`, 'success');

  // Fill and show modal
  document.getElementById('summaryModalId').textContent = sessionId;
  document.getElementById('summaryModalEnergy').textContent = `${energy} kWh`;
  document.getElementById('summaryModalDuration').textContent = `${durationMins} mins`;
  document.getElementById('summaryModalTotal').textContent = formatCurrency(total);

  const summaryModal = new bootstrap.Modal(document.getElementById('sessionSummaryModal'));
  summaryModal.show();

  renderSessionsTable();
}

function handleStartNewSession(e) {
  e.preventDefault();

  const vehId = document.getElementById('newSessVehicle').value;
  const stnId = document.getElementById('newSessStation').value;
  const chId = document.getElementById('newSessCharger').value;
  const startPct = parseInt(document.getElementById('newSessStartPct').value) || 25;
  const targetPct = parseInt(document.getElementById('newSessTargetPct').value) || 90;

  const vehicle = evApp.getVehicles().find(v => v.id === vehId) || { model: 'Nexon EV', number: 'TN 38', batteryCapacity: 40.5 };
  const station = evApp.getStationById(stnId) || { name: 'Station Hub', pricingRate: 15.0 };
  const charger = evApp.getChargerById(chId) || { code: 'CH-001', powerKw: 60 };

  // Set charger to Charging status
  evApp.updateChargerStatus(charger.id, 'Charging');

  activeSim = {
    sessionId: 'SES-2026-LIVE',
    vehicleName: vehicle.model,
    vehicleNumber: vehicle.number,
    batteryCapacity: vehicle.batteryCapacity,
    currentBattery: startPct,
    targetBattery: targetPct,
    stationId: station.id,
    stationName: station.name,
    chargerId: charger.id,
    chargerCode: charger.code,
    chargerPowerKw: charger.powerKw,
    tariffRate: station.pricingRate,
    energyDelivered: 0.0,
    elapsedSeconds: 0,
    accumulatedCost: 0.0
  };

  document.getElementById('simVehicleTitle').textContent = `${vehicle.model} • ${charger.code} (${charger.powerKw} kW)`;
  document.getElementById('simStationTitle').textContent = station.name;

  const modalEl = document.getElementById('newSessionModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  isSimulationPaused = false;
  startLiveSimulationTimer();
  showToast('Session Started', `Simulating charging session on ${charger.code}`, 'info');
}

function renderSessionsTable() {
  const tbody = document.getElementById('sessionsTableBody');
  const summary = document.getElementById('sessionsCountSummary');
  if (!tbody) return;

  const keyword = (document.getElementById('sessionSearchInput')?.value || '').toLowerCase().trim();
  const allSessions = evApp.getSessions();

  const filtered = allSessions.filter(s => {
    return !keyword || 
      s.id.toLowerCase().includes(keyword) || 
      s.vehicleName.toLowerCase().includes(keyword) || 
      s.stationName.toLowerCase().includes(keyword) || 
      s.chargerCode.toLowerCase().includes(keyword);
  });

  if (summary) {
    summary.textContent = `Showing ${filtered.length} of ${allSessions.length} total sessions`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">No session records found.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(s => {
    const isCompleted = s.status === 'Completed';

    html += `
      <tr>
        <td>
          <span class="font-monospace fw-bold text-dark">${s.id}</span>
        </td>
        <td>
          <div class="fw-semibold text-dark">${s.vehicleName}</div>
          <small class="text-muted">${s.customerName}</small>
        </td>
        <td>
          <div class="small fw-semibold">${s.stationName}</div>
        </td>
        <td>
          <span class="badge bg-light text-dark border font-monospace">${s.chargerCode}</span>
        </td>
        <td>
          <span class="small font-monospace">${s.startTime}</span>
        </td>
        <td>
          <strong class="font-monospace">${s.energyConsumed} kWh</strong>
        </td>
        <td>
          <span class="font-monospace">${s.durationMinutes} mins</span>
        </td>
        <td>
          <strong class="text-dark font-monospace">${formatCurrency(s.total)}</strong>
        </td>
        <td>
          <span class="badge ${isCompleted ? 'bg-success' : 'bg-info'} bg-opacity-20 ${isCompleted ? 'text-success' : 'text-info'} border ${isCompleted ? 'border-success' : 'border-info'} px-2 py-1">
            ${s.status}
          </span>
        </td>
        <td class="text-end">
          <a href="billing.html?sessionId=${s.id}" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:0.75rem;" title="View Invoice">
            <i class="bi bi-file-earmark-text"></i> Invoice
          </a>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
