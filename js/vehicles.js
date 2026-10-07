/**
 * EV Charging Station Management System
 * Vehicles Controller (js/vehicles.js)
 * Enhanced with Luxury Brands: Porsche, Mercedes-Benz, BMW, Audi, Tesla, Volvo, Jaguar
 */

let activeCategoryFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  renderVehiclesList();

  window.addEventListener('evDataSynced', () => {
    renderVehiclesList();
  });

  const searchInput = document.getElementById('vehicleSearchKeyword');
  if (searchInput) {
    searchInput.addEventListener('input', renderVehiclesList);
  }

  // Model select preset autofill
  const modelSelect = document.getElementById('vehModelSelect');
  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      const presets = {
        // Luxury models
        'Porsche Taycan 4S': { cap: 93.4, conn: 'CCS2', maxP: 270 },
        'Mercedes-Benz EQS 580': { cap: 107.8, conn: 'CCS2', maxP: 200 },
        'BMW iX xDrive50': { cap: 111.5, conn: 'CCS2', maxP: 195 },
        'Audi e-tron GT': { cap: 93.4, conn: 'CCS2', maxP: 270 },
        'Tesla Model 3 Long Range': { cap: 75.0, conn: 'CCS2', maxP: 250 },
        'Volvo XC40 Recharge': { cap: 78.0, conn: 'CCS2', maxP: 150 },
        'BMW i4 eDrive40': { cap: 83.9, conn: 'CCS2', maxP: 205 },
        'Jaguar I-PACE': { cap: 90.0, conn: 'CCS2', maxP: 100 },
        // Mainstream models
        'Tata Nexon EV': { cap: 40.5, conn: 'CCS2', maxP: 60 },
        'MG ZS EV': { cap: 50.3, conn: 'CCS2', maxP: 80 },
        'Hyundai Ioniq 5': { cap: 72.6, conn: 'CCS2', maxP: 150 },
        'BYD Atto 3': { cap: 60.48, conn: 'CCS2', maxP: 80 },
        'Mahindra XUV400': { cap: 39.4, conn: 'CCS2', maxP: 50 },
        'Tata Tiago EV': { cap: 24.0, conn: 'CCS2', maxP: 25 },
        'Kia EV6': { cap: 77.4, conn: 'CCS2', maxP: 240 }
      };

      const preset = presets[e.target.value];
      if (preset) {
        document.getElementById('vehCapacityInput').value = preset.cap;
        document.getElementById('vehConnectorSelect').value = preset.conn;
        document.getElementById('vehMaxPowerInput').value = preset.maxP;
      }
    });
  }

  const registerForm = document.getElementById('registerVehicleForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterVehicle);
  }
});

function filterVehicleCategory(category) {
  activeCategoryFilter = category;
  renderVehiclesList();
}

function renderVehiclesList() {
  const container = document.getElementById('vehiclesGridContainer');
  if (!container) return;

  const keyword = (document.getElementById('vehicleSearchKeyword')?.value || '').toLowerCase().trim();
  const allVehicles = evApp.getVehicles();

  const luxuryKeywords = ['porsche', 'mercedes', 'bmw', 'audi', 'tesla', 'volvo', 'jaguar'];

  const filtered = allVehicles.filter(v => {
    const matchesKeyword = !keyword || 
      v.number.toLowerCase().includes(keyword) || 
      v.model.toLowerCase().includes(keyword) || 
      v.connectorType.toLowerCase().includes(keyword);

    const isLuxury = luxuryKeywords.some(brand => v.model.toLowerCase().includes(brand));

    let matchesCategory = true;
    if (activeCategoryFilter === 'luxury') matchesCategory = isLuxury;
    else if (activeCategoryFilter === 'mainstream') matchesCategory = !isLuxury;

    return matchesKeyword && matchesCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-car-front text-muted fs-1 mb-2"></i>
        <h5 class="text-secondary">No vehicles found in this category</h5>
        <p class="text-muted small">Try selecting "All Models" or register a new electric vehicle.</p>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(v => {
    const batteryPct = v.currentBattery || 30;
    let batteryColor = '#10b981';
    if (batteryPct < 20) batteryColor = '#ef4444';
    else if (batteryPct < 50) batteryColor = '#f59e0b';

    const isLuxury = luxuryKeywords.some(brand => v.model.toLowerCase().includes(brand));

    html += `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 border-0 shadow-sm rounded-4 p-4 ${isLuxury ? 'border-top border-4 border-warning' : ''}">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-light text-dark border font-monospace">${v.number}</span>
                ${isLuxury ? '<span class="badge bg-warning bg-opacity-20 text-dark border border-warning border-opacity-50 small"><i class="bi bi-gem me-1 text-warning"></i>Luxury EV</span>' : ''}
              </div>
              <h5 class="fw-bold mb-0 text-dark">${v.model}</h5>
            </div>
            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
              ${v.connectorType}
            </span>
          </div>

          <!-- Battery Level Visual Frame -->
          <div class="p-3 bg-light rounded-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="small text-secondary fw-semibold">Current State of Charge</span>
              <span class="fw-bold font-monospace" style="color: ${batteryColor}">${batteryPct}%</span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="battery-frame">
                <div class="battery-fill" style="width: ${batteryPct}%; background: ${batteryColor};">
                  ${batteryPct}%
                </div>
              </div>
              <div class="small text-muted">
                Est. ${((v.batteryCapacity * batteryPct) / 100).toFixed(1)} kWh remaining
              </div>
            </div>
          </div>

          <!-- Specifications Row -->
          <div class="row g-2 mb-3 small text-secondary">
            <div class="col-6">
              <div class="p-2 border rounded bg-white">
                <span class="text-muted d-block" style="font-size:0.75rem;">BATTERY PACK</span>
                <strong class="text-dark font-monospace">${v.batteryCapacity} kWh</strong>
              </div>
            </div>
            <div class="col-6">
              <div class="p-2 border rounded bg-white">
                <span class="text-muted d-block" style="font-size:0.75rem;">MAX DC RATE</span>
                <strong class="text-dark font-monospace">${v.maxChargingPower} kW</strong>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-auto border-top pt-3 d-flex justify-content-between align-items-center">
            <a href="reservations.html?vehicleId=${v.id}" class="btn btn-sm btn-ev-primary">
              <i class="bi bi-calendar2-plus me-1"></i> Book Slot
            </a>
            <a href="calculator.html?vehicle=${encodeURIComponent(v.model)}" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-calculator me-1"></i> Calculate
            </a>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function handleRegisterVehicle(e) {
  e.preventDefault();

  const model = document.getElementById('vehModelSelect').value;
  const number = document.getElementById('vehNumberInput').value.trim().toUpperCase();
  const capacity = parseFloat(document.getElementById('vehCapacityInput').value) || 40.5;
  const currentBattery = parseInt(document.getElementById('vehCurrentBatteryInput').value) || 25;
  const connector = document.getElementById('vehConnectorSelect').value;
  const maxPower = parseInt(document.getElementById('vehMaxPowerInput').value) || 60;

  const currentVehicles = evApp.getVehicles();
  const nextNum = currentVehicles.length + 1;
  const newId = 'VEH-' + String(nextNum).padStart(3, '0');

  const newVehicle = {
    id: newId,
    userId: evApp.getCurrentUser().id,
    number,
    model,
    batteryCapacity: capacity,
    currentBattery: currentBattery,
    maxChargingPower: maxPower,
    connectorType: connector
  };

  evApp.saveVehicle(newVehicle);
  showToast('Vehicle Registered', `${model} (${number}) added successfully!`, 'success');

  const modalEl = document.getElementById('registerVehicleModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  e.target.reset();
  renderVehiclesList();
}
