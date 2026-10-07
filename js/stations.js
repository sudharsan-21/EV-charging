/**
 * EV Charging Station Management System
 * Stations Controller (js/stations.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderStationsList();

  window.addEventListener('evDataSynced', () => {
    renderStationsList();
  });

  // Search & Filter event listeners
  const keywordInput = document.getElementById('filterStationKeyword');
  const citySelect = document.getElementById('filterStationCity');
  const statusSelect = document.getElementById('filterStationStatus');
  const resetBtn = document.getElementById('resetStationFiltersBtn');
  const globalSearch = document.getElementById('stationSearchInput');

  if (keywordInput) keywordInput.addEventListener('input', renderStationsList);
  if (citySelect) citySelect.addEventListener('change', renderStationsList);
  if (statusSelect) statusSelect.addEventListener('change', renderStationsList);
  if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
      if (keywordInput) keywordInput.value = e.target.value;
      renderStationsList();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (keywordInput) keywordInput.value = '';
      if (citySelect) citySelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (globalSearch) globalSearch.value = '';
      renderStationsList();
    });
  }

  // Add Station Form Submission
  const addForm = document.getElementById('addStationForm');
  if (addForm) {
    addForm.addEventListener('submit', handleAddStation);
  }
});

function renderStationsList() {
  const container = document.getElementById('stationsGridContainer');
  if (!container) return;

  const keyword = (document.getElementById('filterStationKeyword')?.value || '').toLowerCase().trim();
  const selectedCity = document.getElementById('filterStationCity')?.value || '';
  const selectedStatus = document.getElementById('filterStationStatus')?.value || '';

  const allStations = evApp.getStations();
  const allChargers = evApp.getChargers();

  const filtered = allStations.filter(stn => {
    const matchesKeyword = !keyword || 
      stn.name.toLowerCase().includes(keyword) || 
      stn.city.toLowerCase().includes(keyword) || 
      stn.address.toLowerCase().includes(keyword);

    const matchesCity = !selectedCity || stn.city === selectedCity;
    const matchesStatus = !selectedStatus || stn.status === selectedStatus;

    return matchesKeyword && matchesCity && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-geo-alt text-muted fs-1 mb-2"></i>
        <h5 class="text-secondary">No stations found</h5>
        <p class="text-muted small">Try adjusting your search criteria or resetting filters.</p>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(stn => {
    const chargers = allChargers.filter(c => c.stationId === stn.id);
    const available = chargers.filter(c => c.status === 'Available').length;
    const charging = chargers.filter(c => c.status === 'Charging').length;
    const maintenance = chargers.filter(c => c.status === 'Maintenance').length;
    const total = chargers.length;

    const availPercent = total > 0 ? Math.round((available / total) * 100) : 0;

    html += `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-body p-4 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-dark font-monospace">${stn.id}</span>
              <span class="badge-status ${stn.status.toLowerCase().includes('oper') ? 'available' : 'charging'}">
                ${stn.status}
              </span>
            </div>

            <h5 class="fw-bold mb-1 text-dark">${stn.name}</h5>
            <p class="text-muted small mb-3">
              <i class="bi bi-geo-alt-fill text-danger me-1"></i>${stn.address}, ${stn.city}
            </p>

            <!-- Detailed counts box -->
            <div class="p-3 bg-light rounded-3 mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small text-secondary fw-semibold">Charger Availability</span>
                <span class="fw-bold ${available > 0 ? 'text-success' : 'text-danger'} font-monospace">
                  ${available} / ${total} Available
                </span>
              </div>
              <div class="progress mb-2" style="height: 6px;">
                <div class="progress-bar bg-success" style="width: ${availPercent}%;"></div>
              </div>
              
              <!-- Sub-counts row -->
              <div class="row g-1 text-center pt-1" style="font-size: 0.75rem;">
                <div class="col-4">
                  <span class="text-muted d-block">Available</span>
                  <strong class="text-success">${available}</strong>
                </div>
                <div class="col-4 border-start border-end">
                  <span class="text-muted d-block">Charging</span>
                  <strong class="text-info">${charging}</strong>
                </div>
                <div class="col-4">
                  <span class="text-muted d-block">Maint.</span>
                  <strong class="text-danger">${maintenance}</strong>
                </div>
              </div>
            </div>

            <div class="small text-secondary mb-3">
              <div><i class="bi bi-clock me-1 text-primary"></i> ${stn.operatingHours}</div>
              <div><i class="bi bi-telephone me-1 text-primary"></i> ${stn.contact}</div>
            </div>

            <div class="mt-auto border-top pt-3 d-flex justify-content-between align-items-center">
              <span class="fw-bold text-dark font-monospace">₹${stn.pricingRate.toFixed(2)}<small class="text-muted fw-normal">/kWh</small></span>
              <a href="station-details.html?id=${stn.id}" class="btn btn-sm btn-outline-dark rounded-pill px-3">
                Station Bays <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function handleAddStation(e) {
  e.preventDefault();

  const name = document.getElementById('stnInputName').value.trim();
  const city = document.getElementById('stnInputCity').value.trim();
  const address = document.getElementById('stnInputAddress').value.trim();
  const contact = document.getElementById('stnInputContact').value.trim();
  const hours = document.getElementById('stnInputHours').value.trim();
  const price = parseFloat(document.getElementById('stnInputPrice').value) || 15.0;
  const lat = parseFloat(document.getElementById('stnInputLat').value) || 11.0;
  const lng = parseFloat(document.getElementById('stnInputLng').value) || 76.9;

  const currentStations = evApp.getStations();
  const nextNum = currentStations.length + 1;
  const newId = 'STN-' + String(nextNum).padStart(3, '0');

  const newStation = {
    id: newId,
    name,
    city,
    address,
    contact,
    operatingHours: hours,
    status: 'Operational',
    latitude: lat,
    longitude: lng,
    totalChargers: 0,
    pricingRate: price
  };

  evApp.saveStation(newStation);
  showToast('Station Created', `${name} has been added successfully!`, 'success');

  // Dismiss modal
  const modalEl = document.getElementById('addStationModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  e.target.reset();
  renderStationsList();
}
