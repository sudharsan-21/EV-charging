/**
 * EV Charging Station Management System
 * Core State Management & Data Layer (Stage 1 - Simulated Persistence with localStorage)
 * Updated with Comprehensive Coimbatore EV Charging Points & Luxury EV Models
 */

// Storage Version & Keys
const STORAGE_VERSION = 'v2_luxury_coimbatore';
const STORAGE_KEYS = {
  VERSION: 'ev_data_version',
  STATIONS: 'ev_stations',
  CHARGERS: 'ev_chargers',
  VEHICLES: 'ev_vehicles',
  RESERVATIONS: 'ev_reservations',
  SESSIONS: 'ev_sessions',
  MAINTENANCE: 'ev_maintenance',
  NOTIFICATIONS: 'ev_notifications',
  CURRENT_USER: 'ev_current_user',
  PRICING: 'ev_pricing'
};

// Seed Users
const DEFAULT_USERS = [
  { id: 'USR-001', name: 'Rajesh Sharma', email: 'admin@evcharge.com', role: 'ADMIN', phone: '+91 98450 12345' },
  { id: 'USR-002', name: 'Kavitha Raman', email: 'manager@evcharge.com', role: 'STATION_MANAGER', phone: '+91 98450 67890' },
  { id: 'USR-003', name: 'Arun Kumar', email: 'tech@evcharge.com', role: 'TECHNICIAN', phone: '+91 98450 54321' },
  { id: 'USR-004', name: 'Priya Sundaram', email: 'customer@evcharge.com', role: 'CUSTOMER', phone: '+91 98450 99887' }
];

// Comprehensive Coimbatore Stations + Key Intercity Hubs
const DEFAULT_STATIONS = [
  // 1. Central Coimbatore
  {
    id: 'STN-001',
    name: 'Coimbatore Central EV Hub',
    address: 'Avinashi Road, Near Collectorate',
    city: 'Coimbatore',
    contact: '+91 422 2301980',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0018,
    longitude: 76.9629,
    totalChargers: 6,
    pricingRate: 15.00
  },
  // 2. Peelamedu / PSG Tech
  {
    id: 'STN-002',
    name: 'Avinashi Road EV Station',
    address: 'Near PSG Tech, Peelamedu',
    city: 'Coimbatore',
    contact: '+91 422 2572177',
    operatingHours: '06:00 AM - 11:00 PM',
    status: 'Operational',
    latitude: 11.0264,
    longitude: 77.0089,
    totalChargers: 5,
    pricingRate: 14.50
  },
  // 3. Gandhipuram
  {
    id: 'STN-003',
    name: 'Gandhipuram Charging Point',
    address: 'Cross Cut Road, Gandhipuram',
    city: 'Coimbatore',
    contact: '+91 422 2490123',
    operatingHours: '24/7 Open',
    status: 'Busy',
    latitude: 11.0168,
    longitude: 76.9682,
    totalChargers: 4,
    pricingRate: 15.50
  },
  // 4. RS Puram
  {
    id: 'STN-004',
    name: 'RS Puram EV Hub',
    address: 'DB Road, RS Puram West',
    city: 'Coimbatore',
    contact: '+91 422 2541188',
    operatingHours: '06:00 AM - 10:00 PM',
    status: 'Operational',
    latitude: 11.0089,
    longitude: 76.9486,
    totalChargers: 4,
    pricingRate: 15.00
  },
  // 5. Peelamedu Express
  {
    id: 'STN-005',
    name: 'Peelamedu Express Station',
    address: 'Aerodrome Post, Near CIT',
    city: 'Coimbatore',
    contact: '+91 422 2605555',
    operatingHours: '24/7 Open',
    status: 'Partially Available',
    latitude: 11.0298,
    longitude: 77.0321,
    totalChargers: 4,
    pricingRate: 16.00
  },
  // 6. Saravanampatti IT Corridor
  {
    id: 'STN-006',
    name: 'Saravanampatti IT Park EV Station',
    address: 'CHIL SEZ IT Park, Keeranatham Road',
    city: 'Coimbatore',
    contact: '+91 422 2668100',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0825,
    longitude: 76.9945,
    totalChargers: 6,
    pricingRate: 15.50
  },
  // 7. Singanallur Bus Terminal
  {
    id: 'STN-007',
    name: 'Singanallur Junction Charging Hub',
    address: 'Near Bus Stand, Trichy Road',
    city: 'Coimbatore',
    contact: '+91 422 2591234',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0012,
    longitude: 77.0210,
    totalChargers: 5,
    pricingRate: 14.50
  },
  // 8. Ukkadam Lakeview
  {
    id: 'STN-008',
    name: 'Ukkadam Lakeview EV Hub',
    address: 'Near Ukkadam Bus Stand, Pollachi Road',
    city: 'Coimbatore',
    contact: '+91 422 2390888',
    operatingHours: '05:00 AM - 11:30 PM',
    status: 'Operational',
    latitude: 10.9880,
    longitude: 76.9602,
    totalChargers: 4,
    pricingRate: 14.00
  },
  // 9. Ganapathy / Sathy Road
  {
    id: 'STN-009',
    name: 'Ganapathy Sathy Road EV Station',
    address: 'Near Ganapathy Bus Stand, Sathy Road',
    city: 'Coimbatore',
    contact: '+91 422 2534567',
    operatingHours: '06:00 AM - 11:00 PM',
    status: 'Operational',
    latitude: 11.0375,
    longitude: 76.9782,
    totalChargers: 4,
    pricingRate: 15.00
  },
  // 10. Prozone Mall Charging Plaza
  {
    id: 'STN-010',
    name: 'Prozone Mall EV Charging Plaza',
    address: 'Sathy Road, Saravanampatti',
    city: 'Coimbatore',
    contact: '+91 422 6628000',
    operatingHours: '10:00 AM - 11:00 PM',
    status: 'Operational',
    latitude: 11.0545,
    longitude: 76.9930,
    totalChargers: 6,
    pricingRate: 16.50
  },
  // 11. Brookefields Mall EV Park
  {
    id: 'STN-011',
    name: 'Brookefields Mall EV Hub',
    address: 'Dr. Krishnasamy Mudaliar Road',
    city: 'Coimbatore',
    contact: '+91 422 2255555',
    operatingHours: '09:30 AM - 11:00 PM',
    status: 'Operational',
    latitude: 11.0092,
    longitude: 76.9575,
    totalChargers: 6,
    pricingRate: 16.50
  },
  // 12. Coimbatore International Airport
  {
    id: 'STN-012',
    name: 'Coimbatore Airport Fast-Charge Hub',
    address: 'Civil Aerodrome Post, Peelamedu',
    city: 'Coimbatore',
    contact: '+91 422 2571941',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0290,
    longitude: 77.0434,
    totalChargers: 6,
    pricingRate: 17.00
  },
  // 13. Kuniyamuthur (Palakkad Road)
  {
    id: 'STN-013',
    name: 'Kuniyamuthur EV Junction',
    address: 'Palakkad Main Road, Kuniyamuthur',
    city: 'Coimbatore',
    contact: '+91 422 2673344',
    operatingHours: '06:00 AM - 10:30 PM',
    status: 'Operational',
    latitude: 10.9602,
    longitude: 76.9450,
    totalChargers: 4,
    pricingRate: 14.50
  },
  // 14. Thudiyalur (Mettupalayam Road)
  {
    id: 'STN-014',
    name: 'Thudiyalur Express Charging Hub',
    address: 'Mettupalayam Road, Near Thudiyalur Junction',
    city: 'Coimbatore',
    contact: '+91 422 2642111',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0780,
    longitude: 76.9410,
    totalChargers: 4,
    pricingRate: 15.00
  },
  // 15. Eachanari Industrial / Pollachi Bypass
  {
    id: 'STN-015',
    name: 'Eachanari Industrial EV Station',
    address: 'Pollachi Main Road, Near Eachanari Temple',
    city: 'Coimbatore',
    contact: '+91 422 2611000',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 10.9255,
    longitude: 76.9695,
    totalChargers: 5,
    pricingRate: 14.50
  },
  // 16. Vadavalli (Marudhamalai Road)
  {
    id: 'STN-016',
    name: 'Vadavalli EV Charging Point',
    address: 'Marudhamalai Main Road, Vadavalli',
    city: 'Coimbatore',
    contact: '+91 422 2423322',
    operatingHours: '06:00 AM - 10:00 PM',
    status: 'Operational',
    latitude: 11.0280,
    longitude: 76.9020,
    totalChargers: 4,
    pricingRate: 15.00
  },
  // 17. Kovaipudur
  {
    id: 'STN-017',
    name: 'Kovaipudur Green Mobility Hub',
    address: 'Kovaipudur Main Road, Near Krishna College',
    city: 'Coimbatore',
    contact: '+91 422 2607890',
    operatingHours: '06:00 AM - 10:00 PM',
    status: 'Operational',
    latitude: 10.9380,
    longitude: 76.9320,
    totalChargers: 4,
    pricingRate: 14.50
  },
  // 18. Hope College (Avinashi Road)
  {
    id: 'STN-018',
    name: 'Hope College EV Fast Charging Bay',
    address: 'Avinashi Road, Near Fun Republic Mall',
    city: 'Coimbatore',
    contact: '+91 422 2510200',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.0315,
    longitude: 77.0185,
    totalChargers: 4,
    pricingRate: 15.50
  },
  // 19. Saibaba Colony
  {
    id: 'STN-019',
    name: 'Saibaba Colony EV Hub',
    address: 'NSR Road, Saibaba Colony',
    city: 'Coimbatore',
    contact: '+91 422 2445566',
    operatingHours: '06:00 AM - 11:00 PM',
    status: 'Operational',
    latitude: 11.0250,
    longitude: 76.9450,
    totalChargers: 4,
    pricingRate: 15.00
  },
  // 20. Kurichi / Sundarapuram
  {
    id: 'STN-020',
    name: 'Sundarapuram Industrial EV Bay',
    address: 'Pollachi Road, SIDCO Industrial Estate',
    city: 'Coimbatore',
    contact: '+91 422 2672345',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 10.9510,
    longitude: 76.9750,
    totalChargers: 4,
    pricingRate: 14.50
  },
  // 21. Tiruppur Corridor
  {
    id: 'STN-021',
    name: 'Tiruppur Cotton City Supercharger',
    address: 'Avinashi-Tiruppur Bypass Road',
    city: 'Tiruppur',
    contact: '+91 421 2233445',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.1085,
    longitude: 77.3411,
    totalChargers: 6,
    pricingRate: 15.00
  },
  // 22. Salem Highway
  {
    id: 'STN-022',
    name: 'Salem Highway NH544 EV Plaza',
    address: 'NH 544 Express Highway Corridor',
    city: 'Salem',
    contact: '+91 427 2441122',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 11.6643,
    longitude: 78.1460,
    totalChargers: 6,
    pricingRate: 15.50
  },
  // 23. Chennai OMR
  {
    id: 'STN-023',
    name: 'Chennai OMR Tech Supercharger',
    address: 'Rajiv Gandhi Salai, Sholinganallur',
    city: 'Chennai',
    contact: '+91 44 24501234',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 12.9010,
    longitude: 80.2279,
    totalChargers: 6,
    pricingRate: 16.50
  },
  // 24. Bengaluru Koramangala
  {
    id: 'STN-024',
    name: 'Bengaluru Koramangala Green Hub',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    contact: '+91 80 25531234',
    operatingHours: '24/7 Open',
    status: 'Operational',
    latitude: 12.9352,
    longitude: 77.6245,
    totalChargers: 6,
    pricingRate: 16.00
  }
];

// Rich Charger Network across all stations
const DEFAULT_CHARGERS = [
  // STN-001 (Coimbatore Central)
  { id: 'CH-001', stationId: 'STN-001', code: 'CH-001', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 18.5 },
  { id: 'CH-002', stationId: 'STN-001', code: 'CH-002', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-10', totalHoursUsed: 21.0, currentSessionProgress: 68 },
  { id: 'CH-003', stationId: 'STN-001', code: 'CH-003', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-15', totalHoursUsed: 14.2 },
  { id: 'CH-004', stationId: 'STN-001', code: 'CH-004', connectorType: 'CCS2', powerKw: 150, status: 'Maintenance', installedDate: '2025-03-01', totalHoursUsed: 9.0 },
  { id: 'CH-005', stationId: 'STN-001', code: 'CH-005', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-03-10', totalHoursUsed: 11.5 },
  { id: 'CH-006', stationId: 'STN-001', code: 'CH-006', connectorType: 'GB/T', powerKw: 30, status: 'Reserved', installedDate: '2025-03-12', totalHoursUsed: 8.0 },

  // STN-002 (Avinashi Road)
  { id: 'CH-007', stationId: 'STN-002', code: 'CH-007', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 16.4 },
  { id: 'CH-008', stationId: 'STN-002', code: 'CH-008', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-20', totalHoursUsed: 19.8, currentSessionProgress: 44 },
  { id: 'CH-009', stationId: 'STN-002', code: 'CH-009', connectorType: 'Type 2', powerKw: 7.4, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 7.2 },
  { id: 'CH-010', stationId: 'STN-002', code: 'CH-010', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 12.0 },
  { id: 'CH-011', stationId: 'STN-002', code: 'CH-011', connectorType: 'Type 2', powerKw: 22, status: 'Offline', installedDate: '2025-02-10', totalHoursUsed: 4.5 },

  // STN-003 (Gandhipuram)
  { id: 'CH-012', stationId: 'STN-003', code: 'CH-012', connectorType: 'CCS2', powerKw: 60, status: 'Charging', installedDate: '2025-01-15', totalHoursUsed: 22.4, currentSessionProgress: 82 },
  { id: 'CH-013', stationId: 'STN-003', code: 'CH-013', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-15', totalHoursUsed: 20.1, currentSessionProgress: 91 },
  { id: 'CH-014', stationId: 'STN-003', code: 'CH-014', connectorType: 'Type 2', powerKw: 22, status: 'Charging', installedDate: '2025-02-12', totalHoursUsed: 17.5, currentSessionProgress: 35 },
  { id: 'CH-015', stationId: 'STN-003', code: 'CH-015', connectorType: 'CHAdeMO', powerKw: 60, status: 'Available', installedDate: '2025-02-25', totalHoursUsed: 13.0 },

  // STN-004 (RS Puram)
  { id: 'CH-016', stationId: 'STN-004', code: 'CH-016', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-03-01', totalHoursUsed: 15.0 },
  { id: 'CH-017', stationId: 'STN-004', code: 'CH-017', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-03-01', totalHoursUsed: 14.2 },
  { id: 'CH-018', stationId: 'STN-004', code: 'CH-018', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-03-05', totalHoursUsed: 8.5 },
  { id: 'CH-019', stationId: 'STN-004', code: 'CH-019', connectorType: 'GB/T', powerKw: 30, status: 'Maintenance', installedDate: '2025-03-10', totalHoursUsed: 6.0 },

  // STN-005 (Peelamedu Express)
  { id: 'CH-020', stationId: 'STN-005', code: 'CH-020', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-05', totalHoursUsed: 18.0 },
  { id: 'CH-021', stationId: 'STN-005', code: 'CH-021', connectorType: 'CCS2', powerKw: 60, status: 'Maintenance', installedDate: '2025-01-05', totalHoursUsed: 5.0 },
  { id: 'CH-022', stationId: 'STN-005', code: 'CH-022', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 11.0 },
  { id: 'CH-023', stationId: 'STN-005', code: 'CH-023', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-01-12', totalHoursUsed: 9.5 },

  // STN-006 (Saravanampatti IT Park)
  { id: 'CH-024', stationId: 'STN-006', code: 'CH-024', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-15', totalHoursUsed: 19.5 },
  { id: 'CH-025', stationId: 'STN-006', code: 'CH-025', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-15', totalHoursUsed: 22.0, currentSessionProgress: 58 },
  { id: 'CH-026', stationId: 'STN-006', code: 'CH-026', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-15', totalHoursUsed: 14.0 },
  { id: 'CH-027', stationId: 'STN-006', code: 'CH-027', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 10.5 },
  { id: 'CH-028', stationId: 'STN-006', code: 'CH-028', connectorType: 'Type 2', powerKw: 7.4, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 8.0 },
  { id: 'CH-029', stationId: 'STN-006', code: 'CH-029', connectorType: 'GB/T', powerKw: 30, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 6.5 },

  // STN-007 (Singanallur)
  { id: 'CH-030', stationId: 'STN-007', code: 'CH-030', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 17.0 },
  { id: 'CH-031', stationId: 'STN-007', code: 'CH-031', connectorType: 'CCS2', powerKw: 60, status: 'Charging', installedDate: '2025-02-01', totalHoursUsed: 15.5, currentSessionProgress: 75 },
  { id: 'CH-032', stationId: 'STN-007', code: 'CH-032', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 9.0 },
  { id: 'CH-033', stationId: 'STN-007', code: 'CH-033', connectorType: 'Type 2', powerKw: 7.4, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 5.5 },
  { id: 'CH-034', stationId: 'STN-007', code: 'CH-034', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-02-10', totalHoursUsed: 7.5 },

  // STN-010 (Prozone Mall)
  { id: 'CH-035', stationId: 'STN-010', code: 'CH-035', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-02-15', totalHoursUsed: 20.0 },
  { id: 'CH-036', stationId: 'STN-010', code: 'CH-036', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-02-15', totalHoursUsed: 18.0 },
  { id: 'CH-037', stationId: 'STN-010', code: 'CH-037', connectorType: 'CCS2', powerKw: 60, status: 'Charging', installedDate: '2025-02-15', totalHoursUsed: 16.5, currentSessionProgress: 88 },
  { id: 'CH-038', stationId: 'STN-010', code: 'CH-038', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-20', totalHoursUsed: 11.0 },
  { id: 'CH-039', stationId: 'STN-010', code: 'CH-039', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-20', totalHoursUsed: 12.0 },
  { id: 'CH-040', stationId: 'STN-010', code: 'CH-040', connectorType: 'GB/T', powerKw: 30, status: 'Available', installedDate: '2025-02-20', totalHoursUsed: 7.0 },

  // STN-011 (Brookefields Mall)
  { id: 'CH-041', stationId: 'STN-011', code: 'CH-041', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-25', totalHoursUsed: 23.0 },
  { id: 'CH-042', stationId: 'STN-011', code: 'CH-042', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-25', totalHoursUsed: 21.0, currentSessionProgress: 62 },
  { id: 'CH-043', stationId: 'STN-011', code: 'CH-043', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-25', totalHoursUsed: 17.5 },
  { id: 'CH-044', stationId: 'STN-011', code: 'CH-044', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 14.0 },
  { id: 'CH-045', stationId: 'STN-011', code: 'CH-045', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 13.0 },
  { id: 'CH-046', stationId: 'STN-011', code: 'CH-046', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 8.5 },

  // STN-012 (Coimbatore Airport)
  { id: 'CH-047', stationId: 'STN-012', code: 'CH-047', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-01', totalHoursUsed: 23.5 },
  { id: 'CH-048', stationId: 'STN-012', code: 'CH-048', connectorType: 'CCS2', powerKw: 150, status: 'Charging', installedDate: '2025-01-01', totalHoursUsed: 24.0, currentSessionProgress: 79 },
  { id: 'CH-049', stationId: 'STN-012', code: 'CH-049', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-05', totalHoursUsed: 18.0 },
  { id: 'CH-050', stationId: 'STN-012', code: 'CH-050', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 15.0 },
  { id: 'CH-051', stationId: 'STN-012', code: 'CH-051', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 14.5 },
  { id: 'CH-052', stationId: 'STN-012', code: 'CH-052', connectorType: 'GB/T', powerKw: 30, status: 'Available', installedDate: '2025-01-15', totalHoursUsed: 9.0 },

  // STN-014 (Thudiyalur)
  { id: 'CH-053', stationId: 'STN-014', code: 'CH-053', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-02-10', totalHoursUsed: 15.0 },
  { id: 'CH-054', stationId: 'STN-014', code: 'CH-054', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-02-10', totalHoursUsed: 13.5 },
  { id: 'CH-055', stationId: 'STN-014', code: 'CH-055', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-15', totalHoursUsed: 8.0 },
  { id: 'CH-056', stationId: 'STN-014', code: 'CH-056', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-02-15', totalHoursUsed: 6.5 },

  // STN-015 (Eachanari)
  { id: 'CH-057', stationId: 'STN-015', code: 'CH-057', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-18', totalHoursUsed: 19.0 },
  { id: 'CH-058', stationId: 'STN-015', code: 'CH-058', connectorType: 'CCS2', powerKw: 60, status: 'Charging', installedDate: '2025-01-18', totalHoursUsed: 16.0, currentSessionProgress: 40 },
  { id: 'CH-059', stationId: 'STN-015', code: 'CH-059', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 11.5 },
  { id: 'CH-060', stationId: 'STN-015', code: 'CH-060', connectorType: 'GB/T', powerKw: 30, status: 'Available', installedDate: '2025-01-20', totalHoursUsed: 7.0 },

  // STN-018 (Hope College)
  { id: 'CH-061', stationId: 'STN-018', code: 'CH-061', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 17.0 },
  { id: 'CH-062', stationId: 'STN-018', code: 'CH-062', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-02-01', totalHoursUsed: 14.5 },
  { id: 'CH-063', stationId: 'STN-018', code: 'CH-063', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 9.0 },
  { id: 'CH-064', stationId: 'STN-018', code: 'CH-064', connectorType: 'CHAdeMO', powerKw: 50, status: 'Available', installedDate: '2025-02-05', totalHoursUsed: 6.0 },

  // STN-023 (Chennai OMR)
  { id: 'CH-065', stationId: 'STN-023', code: 'CH-065', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-01', totalHoursUsed: 22.0 },
  { id: 'CH-066', stationId: 'STN-023', code: 'CH-066', connectorType: 'CCS2', powerKw: 120, status: 'Charging', installedDate: '2025-01-01', totalHoursUsed: 20.5, currentSessionProgress: 53 },
  { id: 'CH-067', stationId: 'STN-023', code: 'CH-067', connectorType: 'CCS2', powerKw: 60, status: 'Available', installedDate: '2025-01-05', totalHoursUsed: 17.0 },
  { id: 'CH-068', stationId: 'STN-023', code: 'CH-068', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 13.5 },
  { id: 'CH-069', stationId: 'STN-023', code: 'CH-069', connectorType: 'GB/T', powerKw: 30, status: 'Reserved', installedDate: '2025-01-15', totalHoursUsed: 12.0 },

  // STN-024 (Bengaluru Koramangala)
  { id: 'CH-070', stationId: 'STN-024', code: 'CH-070', connectorType: 'CCS2', powerKw: 150, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 21.0 },
  { id: 'CH-071', stationId: 'STN-024', code: 'CH-071', connectorType: 'CCS2', powerKw: 120, status: 'Available', installedDate: '2025-01-10', totalHoursUsed: 19.5 },
  { id: 'CH-072', stationId: 'STN-024', code: 'CH-072', connectorType: 'Type 2', powerKw: 22, status: 'Available', installedDate: '2025-01-15', totalHoursUsed: 14.0 }
];

// Rich EV Fleet: Mainstream + Premium Luxury Brands (Porsche, Mercedes, BMW, Audi, Volvo, Jaguar, Tesla)
const DEFAULT_VEHICLES = [
  // Luxury & Premium Segment
  { id: 'VEH-001', userId: 'USR-004', number: 'TN 38 BZ 4021', model: 'Tata Nexon EV', batteryCapacity: 40.5, currentBattery: 25, maxChargingPower: 60, connectorType: 'CCS2' },
  { id: 'VEH-002', userId: 'USR-004', number: 'TN 37 CY 8812', model: 'MG ZS EV', batteryCapacity: 50.3, currentBattery: 42, maxChargingPower: 80, connectorType: 'CCS2' },
  { id: 'VEH-003', userId: 'USR-001', number: 'TN 01 AB 9000', model: 'Hyundai Ioniq 5', batteryCapacity: 72.6, currentBattery: 60, maxChargingPower: 150, connectorType: 'CCS2' },
  { id: 'VEH-004', userId: 'USR-002', number: 'TN 38 KL 1122', model: 'BYD Atto 3', batteryCapacity: 60.48, currentBattery: 35, maxChargingPower: 80, connectorType: 'CCS2' },
  { id: 'VEH-005', userId: 'USR-004', number: 'TN 39 DX 5544', model: 'Tata Tiago EV', batteryCapacity: 24.0, currentBattery: 18, maxChargingPower: 25, connectorType: 'CCS2' },
  
  // Luxury Brands
  { id: 'VEH-006', userId: 'USR-004', number: 'TN 38 EQ 5500', model: 'Mercedes-Benz EQS 580', batteryCapacity: 107.8, currentBattery: 48, maxChargingPower: 200, connectorType: 'CCS2' },
  { id: 'VEH-007', userId: 'USR-001', number: 'TN 38 IX 7700', model: 'BMW iX xDrive50', batteryCapacity: 111.5, currentBattery: 55, maxChargingPower: 195, connectorType: 'CCS2' },
  { id: 'VEH-008', userId: 'USR-002', number: 'TN 37 GT 9999', model: 'Audi e-tron GT', batteryCapacity: 93.4, currentBattery: 32, maxChargingPower: 270, connectorType: 'CCS2' },
  { id: 'VEH-009', userId: 'USR-001', number: 'TN 01 TY 0001', model: 'Porsche Taycan 4S', batteryCapacity: 93.4, currentBattery: 65, maxChargingPower: 270, connectorType: 'CCS2' },
  { id: 'VEH-010', userId: 'USR-004', number: 'TN 38 VR 4488', model: 'Volvo XC40 Recharge', batteryCapacity: 78.0, currentBattery: 40, maxChargingPower: 150, connectorType: 'CCS2' },
  { id: 'VEH-011', userId: 'USR-002', number: 'TN 38 IP 3322', model: 'Jaguar I-PACE', batteryCapacity: 90.0, currentBattery: 38, maxChargingPower: 100, connectorType: 'CCS2' },
  { id: 'VEH-012', userId: 'USR-004', number: 'TN 37 TS 8800', model: 'Tesla Model 3 Long Range', batteryCapacity: 75.0, currentBattery: 52, maxChargingPower: 250, connectorType: 'CCS2' },
  { id: 'VEH-013', userId: 'USR-001', number: 'TN 38 I4 6600', model: 'BMW i4 eDrive40', batteryCapacity: 83.9, currentBattery: 30, maxChargingPower: 205, connectorType: 'CCS2' }
];

const DEFAULT_RESERVATIONS = [
  {
    id: 'RES-2026-001',
    userId: 'USR-004',
    customerName: 'Priya Sundaram',
    stationId: 'STN-001',
    stationName: 'Coimbatore Central EV Hub',
    chargerId: 'CH-006',
    chargerCode: 'CH-006',
    vehicleId: 'VEH-006',
    vehicleName: 'Mercedes-Benz EQS (TN 38 EQ 5500)',
    date: '2026-10-02',
    startTime: '10:30',
    duration: 45,
    status: 'Upcoming',
    createdAt: '2026-10-01 19:20'
  },
  {
    id: 'RES-2026-002',
    userId: 'USR-004',
    customerName: 'Priya Sundaram',
    stationId: 'STN-002',
    stationName: 'Avinashi Road EV Station',
    chargerId: 'CH-007',
    chargerCode: 'CH-007',
    vehicleId: 'VEH-002',
    vehicleName: 'MG ZS EV (TN 37 CY 8812)',
    date: '2026-10-01',
    startTime: '16:00',
    duration: 60,
    status: 'Completed',
    createdAt: '2026-10-01 14:10'
  },
  {
    id: 'RES-2026-003',
    userId: 'USR-001',
    customerName: 'Rajesh Sharma',
    stationId: 'STN-012',
    stationName: 'Coimbatore Airport Fast-Charge Hub',
    chargerId: 'CH-047',
    chargerCode: 'CH-047',
    vehicleId: 'VEH-009',
    vehicleName: 'Porsche Taycan (TN 01 TY 0001)',
    date: '2026-10-02',
    startTime: '14:00',
    duration: 30,
    status: 'Upcoming',
    createdAt: '2026-10-01 21:00'
  }
];

const DEFAULT_SESSIONS = [
  {
    id: 'SES-2026-0051',
    reservationId: 'RES-2026-002',
    userId: 'USR-004',
    customerName: 'Priya Sundaram',
    vehicleName: 'Tata Nexon EV',
    stationId: 'STN-001',
    stationName: 'Coimbatore Central EV Hub',
    chargerId: 'CH-002',
    chargerCode: 'CH-002',
    startTime: '2026-10-01 18:15',
    endTime: '2026-10-01 18:53',
    energyConsumed: 24.8,
    durationMinutes: 38,
    cost: 372.00,
    serviceFee: 20.00,
    tax: 35.28,
    total: 427.28,
    status: 'Completed',
    paymentStatus: 'Paid'
  },
  {
    id: 'SES-2026-0052',
    reservationId: null,
    userId: 'USR-004',
    customerName: 'Priya Sundaram',
    vehicleName: 'Mercedes-Benz EQS 580',
    stationId: 'STN-001',
    stationName: 'Coimbatore Central EV Hub',
    chargerId: 'CH-002',
    chargerCode: 'CH-002',
    startTime: '2026-10-01 21:40',
    endTime: null,
    energyConsumed: 46.2,
    durationMinutes: 28,
    cost: 693.00,
    serviceFee: 20.00,
    tax: 64.17,
    total: 777.17,
    status: 'Active',
    paymentStatus: 'Pending'
  }
];

const DEFAULT_MAINTENANCE = [
  {
    id: 'MNT-2026-01',
    chargerId: 'CH-004',
    chargerCode: 'CH-004',
    stationId: 'STN-001',
    stationName: 'Coimbatore Central EV Hub',
    technicianId: 'USR-003',
    technicianName: 'Arun Kumar',
    issue: 'High-voltage connector overheating and intermittent latch fault',
    priority: 'High',
    reportedDate: '2026-09-29',
    startDate: '2026-09-30',
    completionDate: null,
    status: 'In Progress',
    remarks: 'Replacement DC contactor pin ordered from OEM.'
  },
  {
    id: 'MNT-2026-02',
    chargerId: 'CH-021',
    chargerCode: 'CH-021',
    stationId: 'STN-005',
    stationName: 'Peelamedu Express Station',
    technicianId: 'USR-003',
    technicianName: 'Arun Kumar',
    issue: 'Display touchscreen firmware crash and payment terminal unresponsive',
    priority: 'Medium',
    reportedDate: '2026-09-30',
    startDate: '2026-10-01',
    completionDate: null,
    status: 'Reported',
    remarks: 'Scheduled firmware reflash and diagnostic check.'
  },
  {
    id: 'MNT-2026-03',
    chargerId: 'CH-019',
    chargerCode: 'CH-019',
    stationId: 'STN-004',
    stationName: 'RS Puram EV Hub',
    technicianId: 'USR-003',
    technicianName: 'Arun Kumar',
    issue: 'Grounding insulation resistance below safety threshold',
    priority: 'Critical',
    reportedDate: '2026-10-01',
    startDate: '2026-10-01',
    completionDate: null,
    status: 'In Progress',
    remarks: 'Earthing pit inspected and re-bonded.'
  }
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'NOTIF-1', title: 'Reservation Confirmed', message: 'Your charging slot for CH-006 starts at 10:30 AM tomorrow.', type: 'info', time: '10 mins ago', read: false },
  { id: 'NOTIF-2', title: 'Charger Maintenance Alert', message: 'Charger CH-004 placed under maintenance for safety inspection.', type: 'warning', time: '2 hours ago', read: false },
  { id: 'NOTIF-3', title: 'Payment Successful', message: 'Invoice INV-2026-0051 paid ₹427.28 successfully.', type: 'success', time: '4 hours ago', read: true }
];

// State Manager Initializer
class EVStateManager {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);

    // If version changed or not initialized, update storage with rich new data
    if (currentVersion !== STORAGE_VERSION) {
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(DEFAULT_STATIONS));
      localStorage.setItem(STORAGE_KEYS.CHARGERS, JSON.stringify(DEFAULT_CHARGERS));
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(DEFAULT_MAINTENANCE));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.STATIONS)) {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(DEFAULT_STATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHARGERS)) {
      localStorage.setItem(STORAGE_KEYS.CHARGERS, JSON.stringify(DEFAULT_CHARGERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(DEFAULT_SESSIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(DEFAULT_MAINTENANCE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
    }
  }

  // Generic Get / Set
  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Users & Roles
  getCurrentUser() {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : DEFAULT_USERS[0];
  }

  setCurrentUser(roleKey) {
    const target = DEFAULT_USERS.find(u => u.role === roleKey) || DEFAULT_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
    return target;
  }

  isHttp() {
    return window.location.protocol.startsWith('http');
  }

  getApiBase() {
    const p = window.location.pathname;
    if (p.includes('/pages/')) return '../api';
    return 'api';
  }

  async syncWithBackend() {
    if (!this.isHttp()) return;
    try {
      const base = this.getApiBase();
      const [resStn, resChg, resVeh, resRes, resSes, resMnt] = await Promise.allSettled([
        fetch(`${base}/stations.php`).then(r => r.json()),
        fetch(`${base}/chargers.php`).then(r => r.json()),
        fetch(`${base}/vehicles.php`).then(r => r.json()),
        fetch(`${base}/reservations.php`).then(r => r.json()),
        fetch(`${base}/charging.php`).then(r => r.json()),
        fetch(`${base}/maintenance.php`).then(r => r.json())
      ]);

      if (resStn.status === 'fulfilled' && resStn.value.success && Array.isArray(resStn.value.data)) {
        const mappedStations = resStn.value.data.map(s => ({
          id: s.station_code || ('STN-' + String(s.station_id).padStart(3, '0')),
          dbId: s.station_id,
          name: s.station_name,
          address: s.address,
          city: s.city,
          contact: s.contact_number,
          operatingHours: s.operating_hours,
          status: s.status,
          totalChargers: parseInt(s.total_chargers) || 4,
          pricingRate: parseFloat(s.price_per_kwh) || 15.0
        }));
        if (mappedStations.length > 0) this.set(STORAGE_KEYS.STATIONS, mappedStations);
      }

      if (resChg.status === 'fulfilled' && resChg.value.success && Array.isArray(resChg.value.data)) {
        const mappedChargers = resChg.value.data.map(c => ({
          id: c.charger_code,
          dbId: c.charger_id,
          stationId: c.station_code || ('STN-' + String(c.station_id).padStart(3, '0')),
          stationDbId: c.station_id,
          code: c.charger_code,
          connectorType: c.connector_type,
          powerKw: parseFloat(c.charging_power),
          status: c.status,
          installedDate: c.installed_date,
          totalHoursUsed: parseFloat(c.total_hours_used) || 0
        }));
        if (mappedChargers.length > 0) this.set(STORAGE_KEYS.CHARGERS, mappedChargers);
      }

      if (resVeh.status === 'fulfilled' && resVeh.value.success && Array.isArray(resVeh.value.data)) {
        const mappedVehicles = resVeh.value.data.map(v => ({
          id: 'VEH-' + String(v.vehicle_id).padStart(3, '0'),
          dbId: v.vehicle_id,
          userId: 'USR-' + String(v.user_id).padStart(3, '0'),
          model: v.vehicle_model,
          number: v.vehicle_number,
          batteryCapacity: parseFloat(v.battery_capacity),
          currentPercentage: parseInt(v.current_battery_percentage) || 50,
          connectorType: v.connector_type,
          maxChargingPower: parseFloat(v.max_charging_power)
        }));
        if (mappedVehicles.length > 0) this.set(STORAGE_KEYS.VEHICLES, mappedVehicles);
      }

      if (resRes.status === 'fulfilled' && resRes.value.success && Array.isArray(resRes.value.data)) {
        const mappedRes = resRes.value.data.map(r => ({
          id: r.reservation_code,
          dbId: r.reservation_id,
          userId: 'USR-' + String(r.user_id).padStart(3, '0'),
          customerName: r.customer_name,
          stationId: r.station_code || ('STN-' + String(r.station_id).padStart(3, '0')),
          stationName: r.station_name,
          chargerId: r.charger_code,
          chargerCode: r.charger_code,
          vehicleId: 'VEH-' + String(r.vehicle_id).padStart(3, '0'),
          vehicleName: `${r.vehicle_model} (${r.vehicle_number})`,
          date: r.reservation_date,
          startTime: (r.start_time || '').substring(0, 5),
          duration: parseInt(r.duration_minutes),
          status: r.status,
          createdAt: r.created_at
        }));
        if (mappedRes.length > 0) this.set(STORAGE_KEYS.RESERVATIONS, mappedRes);
      }

      if (resSes.status === 'fulfilled' && resSes.value.success && Array.isArray(resSes.value.data)) {
        const mappedSessions = resSes.value.data.map(s => ({
          id: s.session_code,
          dbId: s.session_id,
          customerName: s.customer_name,
          stationId: s.station_code || ('STN-' + String(s.station_id).padStart(3, '0')),
          stationName: s.station_name,
          chargerCode: s.charger_code,
          vehicleName: `${s.vehicle_model} (${s.vehicle_number})`,
          startTime: s.start_time,
          endTime: s.end_time,
          energyConsumed: parseFloat(s.energy_consumed),
          durationMinutes: parseInt(s.duration_minutes),
          cost: parseFloat(s.energy_cost),
          serviceFee: parseFloat(s.service_fee),
          tax: parseFloat(s.tax_amount),
          total: parseFloat(s.total_cost),
          status: s.status,
          paymentStatus: s.payment_status || 'Paid'
        }));
        if (mappedSessions.length > 0) this.set(STORAGE_KEYS.SESSIONS, mappedSessions);
      }

      if (resMnt.status === 'fulfilled' && resMnt.value.success && Array.isArray(resMnt.value.data)) {
        const mappedMnt = resMnt.value.data.map(m => ({
          id: m.maintenance_code,
          dbId: m.maintenance_id,
          chargerId: m.charger_code,
          chargerCode: m.charger_code,
          stationName: m.station_name,
          technicianName: m.technician_name,
          issue: m.issue,
          priority: m.priority,
          reportedDate: m.reported_date,
          status: m.status,
          remarks: m.remarks
        }));
        if (mappedMnt.length > 0) this.set(STORAGE_KEYS.MAINTENANCE, mappedMnt);
      }

      window.dispatchEvent(new CustomEvent('evDataSynced'));
    } catch (e) {
      console.warn('Backend sync failed, continuing in offline/cached mode:', e);
    }
  }

  // Stations
  getStations() { return this.get(STORAGE_KEYS.STATIONS); }
  getStationById(id) { return this.getStations().find(s => s.id === id || s.dbId === id); }
  async saveStation(station) {
    const list = this.getStations();
    const idx = list.findIndex(s => s.id === station.id);
    if (idx >= 0) list[idx] = station;
    else list.push(station);
    this.set(STORAGE_KEYS.STATIONS, list);

    if (this.isHttp()) {
      try {
        const base = this.getApiBase();
        await fetch(`${base}/stations.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_name: station.name,
            address: station.address,
            city: station.city,
            contact_number: station.contact,
            operating_hours: station.operatingHours,
            total_chargers: station.totalChargers,
            status: station.status,
            price_per_kwh: station.pricingRate || 15.0
          })
        });
      } catch (err) {
        console.warn('Async station sync error:', err);
      }
    }
  }

  // Chargers
  getChargers() { return this.get(STORAGE_KEYS.CHARGERS); }
  getChargerById(id) { return this.getChargers().find(c => c.id === id || c.code === id || c.dbId === id); }
  getChargersByStation(stationId) { return this.getChargers().filter(c => c.stationId === stationId); }
  async saveCharger(charger) {
    const list = this.getChargers();
    const idx = list.findIndex(c => c.id === charger.id);
    if (idx >= 0) list[idx] = charger;
    else list.push(charger);
    this.set(STORAGE_KEYS.CHARGERS, list);
    this.updateStationCounts(charger.stationId);

    if (this.isHttp()) {
      try {
        const base = this.getApiBase();
        const stn = this.getStationById(charger.stationId);
        await fetch(`${base}/chargers.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_id: stn?.dbId || 1,
            charger_code: charger.code,
            connector_type: charger.connectorType,
            charging_power: charger.powerKw,
            status: charger.status,
            installed_date: charger.installedDate || new Date().toISOString().split('T')[0]
          })
        });
      } catch (err) {
        console.warn('Async charger sync error:', err);
      }
    }
  }

  async updateChargerStatus(chargerId, status) {
    const list = this.getChargers();
    const c = list.find(item => item.id === chargerId || item.code === chargerId || item.dbId === chargerId);
    if (c) {
      c.status = status;
      this.set(STORAGE_KEYS.CHARGERS, list);
    }

    if (this.isHttp() && c) {
      try {
        const base = this.getApiBase();
        await fetch(`${base}/chargers.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_status',
            charger_id: c.dbId || 1,
            status: status
          })
        });
      } catch (err) {
        console.warn('Async charger status sync error:', err);
      }
    }
  }

  updateStationCounts(stationId) {
    const stations = this.getStations();
    const stn = stations.find(s => s.id === stationId);
    if (stn) {
      const chs = this.getChargersByStation(stationId);
      stn.totalChargers = chs.length;
      this.set(STORAGE_KEYS.STATIONS, stations);
    }
  }

  // Vehicles
  getVehicles() { return this.get(STORAGE_KEYS.VEHICLES); }
  async saveVehicle(veh) {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === veh.id);
    if (idx >= 0) list[idx] = veh;
    else list.push(veh);
    this.set(STORAGE_KEYS.VEHICLES, list);

    if (this.isHttp()) {
      try {
        const base = this.getApiBase();
        await fetch(`${base}/vehicles.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 4,
            vehicle_model: veh.model,
            vehicle_number: veh.number,
            battery_capacity: veh.batteryCapacity,
            current_battery_percentage: veh.currentPercentage,
            connector_type: veh.connectorType,
            max_charging_power: veh.maxChargingPower
          })
        });
      } catch (err) {
        console.warn('Async vehicle sync error:', err);
      }
    }
  }

  // Reservations
  getReservations() { return this.get(STORAGE_KEYS.RESERVATIONS); }
  async saveReservation(res) {
    const list = this.getReservations();
    list.unshift(res);
    this.set(STORAGE_KEYS.RESERVATIONS, list);
    this.updateChargerStatus(res.chargerId, 'Reserved');

    if (this.isHttp()) {
      try {
        const base = this.getApiBase();
        const ch = this.getChargerById(res.chargerId);
        const stn = this.getStationById(res.stationId);
        const veh = this.getVehicles().find(v => v.id === res.vehicleId);

        const payload = {
          user_id: 4,
          vehicle_id: veh?.dbId || 1,
          station_id: stn?.dbId || 1,
          charger_id: ch?.dbId || 1,
          reservation_date: res.date,
          start_time: res.startTime,
          duration_minutes: res.duration
        };

        const resp = await fetch(`${base}/reservations.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await resp.json();
        if (!result.success) {
          showToast('Database Notice', result.message || 'Conflict detected in MySQL', 'warning');
        } else {
          console.log('Reservation saved to MySQL database successfully.');
        }
      } catch (err) {
        console.warn('Async MySQL reservation sync error:', err);
      }
    }
  }

  checkConflict(chargerId, date, startTime, durationMins) {
    const reservations = this.getReservations().filter(
      r => (r.chargerId === chargerId || r.chargerCode === chargerId) && r.date === date && r.status !== 'Cancelled'
    );
    const newStart = this.timeToMinutes(startTime);
    const newEnd = newStart + parseInt(durationMins);

    for (let r of reservations) {
      const rStart = this.timeToMinutes(r.startTime);
      const rEnd = rStart + parseInt(r.duration);
      if (newStart < rEnd && newEnd > rStart) {
        return true; // Overlap detected!
      }
    }
    return false;
  }

  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  // Sessions
  getSessions() { return this.get(STORAGE_KEYS.SESSIONS); }
  async saveSession(sess) {
    const list = this.getSessions();
    const idx = list.findIndex(s => s.id === sess.id);
    if (idx >= 0) list[idx] = sess;
    else list.unshift(sess);
    this.set(STORAGE_KEYS.SESSIONS, list);

    if (this.isHttp() && sess.status === 'Completed') {
      try {
        const base = this.getApiBase();
        const ch = this.getChargerById(sess.chargerCode || sess.chargerId);
        const stn = this.getStationById(sess.stationId);
        await fetch(`${base}/charging.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            session_id: sess.dbId || 1,
            user_id: 4,
            station_id: stn?.dbId || 1,
            charger_id: ch?.dbId || 1,
            energy_consumed: sess.energyConsumed,
            duration_minutes: sess.durationMinutes
          })
        });
      } catch (err) {
        console.warn('Async session sync error:', err);
      }
    }
  }

  // Maintenance
  getMaintenance() { return this.get(STORAGE_KEYS.MAINTENANCE); }
  async saveMaintenance(mnt) {
    const list = this.getMaintenance();
    const idx = list.findIndex(m => m.id === mnt.id);
    if (idx >= 0) list[idx] = mnt;
    else list.unshift(mnt);
    this.set(STORAGE_KEYS.MAINTENANCE, list);

    if (mnt.status === 'Reported' || mnt.status === 'In Progress') {
      this.updateChargerStatus(mnt.chargerId, 'Maintenance');
    } else if (mnt.status === 'Completed') {
      this.updateChargerStatus(mnt.chargerId, 'Available');
    }

    if (this.isHttp()) {
      try {
        const base = this.getApiBase();
        const ch = this.getChargerById(mnt.chargerId);
        await fetch(`${base}/maintenance.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'report',
            charger_id: ch?.dbId || 1,
            issue: mnt.issue,
            priority: mnt.priority,
            technician_id: 3,
            remarks: mnt.remarks || ''
          })
        });
      } catch (err) {
        console.warn('Async maintenance sync error:', err);
      }
    }
  }

  // Notifications
  getNotifications() { return this.get(STORAGE_KEYS.NOTIFICATIONS); }
  addNotification(title, message, type = 'info') {
    const list = this.getNotifications();
    list.unshift({
      id: 'NOTIF-' + Date.now(),
      title,
      message,
      type,
      time: 'Just now',
      read: false
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Calculation formulas
  calculateChargingMetrics(batteryCap, currentPct, targetPct, chargerPower, pricePerKwh = 15.0) {
    const capacity = parseFloat(batteryCap) || 40;
    const current = parseFloat(currentPct) || 0;
    const target = parseFloat(targetPct) || 100;
    const power = parseFloat(chargerPower) || 60;
    const price = parseFloat(pricePerKwh) || 15;

    const deltaPct = Math.max(0, target - current);
    const energyRequired = (capacity * deltaPct) / 100; // kWh

    const idealHours = power > 0 ? (energyRequired / power) : 0;
    const minutes = Math.round(idealHours * 60);

    const estimatedCost = energyRequired * price;

    return {
      capacity,
      current,
      target,
      energyRequired: parseFloat(energyRequired.toFixed(2)),
      idealHours: parseFloat(idealHours.toFixed(2)),
      durationMinutes: minutes,
      durationFormatted: minutes >= 60 ? `${Math.floor(minutes/60)}h ${minutes%60}m` : `${minutes} mins`,
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      pricePerKwh: price
    };
  }

  calculateUtilization(chargerId, operatingHours = 24) {
    const charger = this.getChargerById(chargerId);
    if (!charger) return 0;
    const usedHours = charger.totalHoursUsed || 12;
    const util = (usedHours / operatingHours) * 100;
    return Math.min(100, Math.round(util * 10) / 10);
  }
}

// Global instance
const evApp = new EVStateManager();

// UI Utility Helpers
function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(title, message, type = 'info') {
  let toastContainer = document.getElementById('evToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'evToastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  const iconMap = {
    success: 'bi-check-circle-fill text-success',
    warning: 'bi-exclamation-triangle-fill text-warning',
    danger: 'bi-x-circle-fill text-danger',
    info: 'bi-info-circle-fill text-info'
  };

  const toastEl = document.createElement('div');
  toastEl.className = 'toast ev-toast align-items-center shadow-lg';
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="toast-header bg-dark text-white border-bottom border-secondary">
      <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
      <strong class="me-auto">${title}</strong>
      <small class="text-secondary">Just now</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body text-light">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toastEl);
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  }
}

// Role Switcher & Initialization setup on page load
document.addEventListener('DOMContentLoaded', () => {
  // Sync with MySQL database if running on Apache
  if (evApp.isHttp()) {
    evApp.syncWithBackend();
  }

  const user = evApp.getCurrentUser();
  const roleDisplay = document.querySelectorAll('.current-user-role-display');
  roleDisplay.forEach(el => el.textContent = user.role.replace('_', ' '));

  const userNameDisplay = document.querySelectorAll('.current-user-name-display');
  userNameDisplay.forEach(el => el.textContent = user.name);

  const roleSelectInputs = document.querySelectorAll('.role-switcher-select');
  roleSelectInputs.forEach(select => {
    select.value = user.role;
    select.addEventListener('change', (e) => {
      evApp.setCurrentUser(e.target.value);
      showToast('Role Switched', `Active view updated to ${e.target.value}`, 'info');
      setTimeout(() => window.location.reload(), 300);
    });
  });

  // Mobile sidebar toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.querySelector('.app-sidebar');
  if (sidebarToggleBtn && sidebar) {
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      backdrop.classList.toggle('show');
    });
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }
});
