/**
 * FuelBook - Storage Engine v3
 * Collections: vehicles, petrol_logs, service_records, settings
 */

const KEYS = {
  VEHICLES: 'fuelbook_vehicles',
  PETROL_LOGS: 'fuelbook_petrol_logs',
  SERVICE_RECORDS: 'fuelbook_services',
  SETTINGS: 'fuelbook_settings',
};

const isBrowser = () => typeof window !== 'undefined';

const getItem = (key, defaultValue = null) => {
  if (!isBrowser()) return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`FuelBook storage read error [${key}]:`, error);
    return defaultValue;
  }
};

const setItem = (key, value) => {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`FuelBook storage write error [${key}]:`, error);
    return false;
  }
};

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── VEHICLES ────────────────────────────────────────────────────────────────

export const vehicleStorage = {
  getAll: () => getItem(KEYS.VEHICLES, []),

  getById: (id) => {
    const vehicles = getItem(KEYS.VEHICLES, []);
    return vehicles.find((v) => v.id === id) || null;
  },

  add: (data) => {
    const vehicles = getItem(KEYS.VEHICLES, []);
    const newVehicle = {
      id: generateId('v'),
      nickname: data.nickname || '',
      model: data.model || '',
      type: data.type || 'bike',
      fuelType: data.fuelType || 'petrol',
      deliveryDate: data.deliveryDate || '',
      tankCapacity: parseFloat(data.tankCapacity) || 0,
      color: data.color || '',
      regNumber: data.regNumber || '',
      createdAt: new Date().toISOString(),
    };
    vehicles.push(newVehicle);
    setItem(KEYS.VEHICLES, vehicles);
    const settings = getItem(KEYS.SETTINGS, {});
    if (!settings.activeVehicleId) {
      setItem(KEYS.SETTINGS, { ...settings, activeVehicleId: newVehicle.id });
    }
    return newVehicle;
  },

  update: (id, data) => {
    const vehicles = getItem(KEYS.VEHICLES, []);
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    vehicles[idx] = { ...vehicles[idx], ...data };
    return setItem(KEYS.VEHICLES, vehicles);
  },

  delete: (id) => {
    const vehicles = getItem(KEYS.VEHICLES, []).filter((v) => v.id !== id);
    setItem(KEYS.VEHICLES, vehicles);
    const logs = getItem(KEYS.PETROL_LOGS, []).filter((l) => l.vehicleId !== id);
    setItem(KEYS.PETROL_LOGS, logs);
    const services = getItem(KEYS.SERVICE_RECORDS, []).filter((s) => s.vehicleId !== id);
    setItem(KEYS.SERVICE_RECORDS, services);
    return true;
  },

  hasVehicles: () => getItem(KEYS.VEHICLES, []).length > 0,
};

// ─── HELPER: Recalculate Chronological Mileage ────────────────────────────────
function recalculateVehicleMileages(vehicleId) {
  const allLogs = getItem(KEYS.PETROL_LOGS, []);
  const otherLogs = allLogs.filter((l) => l.vehicleId !== vehicleId);
  const vehicleLogs = allLogs.filter((l) => l.vehicleId === vehicleId);

  // Sort chronologically (oldest date first, then lowest odometer)
  vehicleLogs.sort((a, b) => {
    const dDiff = new Date(a.date) - new Date(b.date);
    if (dDiff !== 0) return dDiff;
    return a.odometerKm - b.odometerKm;
  });

  // Re-calculate mileage for each leg using the fuel from the PREVIOUS fill
  for (let i = 0; i < vehicleLogs.length; i++) {
    if (i === 0) {
      vehicleLogs[i].mileage = null;
    } else {
      const prev = vehicleLogs[i - 1];
      const kmDriven = vehicleLogs[i].odometerKm - prev.odometerKm;
      // Mileage = Distance Driven (current_odo - prev_odo) ÷ Previous Fill's Liters
      if (kmDriven > 0 && prev.liters > 0) {
        vehicleLogs[i].mileage = parseFloat((kmDriven / prev.liters).toFixed(2));
      } else {
        vehicleLogs[i].mileage = null;
      }
    }
  }

  const updatedAll = [...otherLogs, ...vehicleLogs];
  setItem(KEYS.PETROL_LOGS, updatedAll);
}

// ─── PETROL LOGS ─────────────────────────────────────────────────────────────

export const petrolStorage = {
  getAll: (vehicleId = null) => {
    let logs = getItem(KEYS.PETROL_LOGS, []);
    if (vehicleId) logs = logs.filter((l) => l.vehicleId === vehicleId);
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getByVehicle: (vehicleId) => petrolStorage.getAll(vehicleId),

  add: (data) => {
    const logs = getItem(KEYS.PETROL_LOGS, []);

    let liters = parseFloat(data.liters) || 0;
    let totalCost = parseFloat(data.totalCost) || 0;
    const pricePerLiter = parseFloat(data.pricePerLiter) || 0;

    if (data.fillMode === 'amount' && totalCost > 0 && pricePerLiter > 0) {
      liters = parseFloat((totalCost / pricePerLiter).toFixed(3));
    } else if (liters > 0 && pricePerLiter > 0) {
      totalCost = parseFloat((liters * pricePerLiter).toFixed(2));
    }

    const newLog = {
      id: generateId('p'),
      vehicleId: data.vehicleId,
      date: data.date || new Date().toISOString().split('T')[0],
      odometerKm: parseFloat(data.odometerKm) || 0,
      liters,
      pricePerLiter,
      totalCost,
      mileage: null, // will be computed in recalculateVehicleMileages
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    logs.push(newLog);
    setItem(KEYS.PETROL_LOGS, logs);

    // Recalculate mileage for all logs of this vehicle in order
    recalculateVehicleMileages(data.vehicleId);

    return newLog;
  },

  update: (id, data) => {
    const logs = getItem(KEYS.PETROL_LOGS, []);
    const idx = logs.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    let liters = parseFloat(data.liters || logs[idx].liters) || 0;
    let totalCost = parseFloat(data.totalCost || logs[idx].totalCost) || 0;
    const pricePerLiter = parseFloat(data.pricePerLiter || logs[idx].pricePerLiter) || 0;

    if (data.fillMode === 'amount' && totalCost > 0 && pricePerLiter > 0) {
      liters = parseFloat((totalCost / pricePerLiter).toFixed(3));
    } else if (liters > 0 && pricePerLiter > 0) {
      totalCost = parseFloat((liters * pricePerLiter).toFixed(2));
    }

    logs[idx] = { ...logs[idx], ...data, liters, totalCost, pricePerLiter };
    setItem(KEYS.PETROL_LOGS, logs);

    recalculateVehicleMileages(logs[idx].vehicleId);
    return true;
  },

  delete: (id) => {
    const logs = getItem(KEYS.PETROL_LOGS, []);
    const target = logs.find((l) => l.id === id);
    if (!target) return false;

    const remaining = logs.filter((l) => l.id !== id);
    setItem(KEYS.PETROL_LOGS, remaining);

    recalculateVehicleMileages(target.vehicleId);
    return true;
  },

  getStats: (vehicleId) => {
    const logs = petrolStorage.getByVehicle(vehicleId);
    if (logs.length === 0)
      return { totalCost: 0, totalLiters: 0, totalFills: 0, avgMileage: 0, totalKm: 0, lastFill: null };

    const totalCost = logs.reduce((s, l) => s + l.totalCost, 0);
    const totalLiters = logs.reduce((s, l) => s + l.liters, 0);

    // Chronological order
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date) || a.odometerKm - b.odometerKm);
    const firstOdo = sorted[0]?.odometerKm || 0;
    const lastOdo = sorted[sorted.length - 1]?.odometerKm || 0;
    const totalKm = sorted.length > 1 ? lastOdo - firstOdo : 0;

    // Fuel consumed during completed legs = sum of liters of all fills EXCEPT the last current fill
    const fuelUsedForLegs = sorted.slice(0, -1).reduce((s, l) => s + l.liters, 0);

    const avgMileage = (totalKm > 0 && fuelUsedForLegs > 0)
      ? parseFloat((totalKm / fuelUsedForLegs).toFixed(2))
      : 0;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalLiters: parseFloat(totalLiters.toFixed(2)),
      totalFills: logs.length,
      avgMileage,
      totalKm,
      lastFill: logs[0] || null, // newest log
    };
  },

  getMonthlyStats: (vehicleId, year) => {
    const logs = petrolStorage.getByVehicle(vehicleId).filter(
      (l) => new Date(l.date).getFullYear() === year
    );
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, cost: 0, liters: 0, fills: 0 }));
    logs.forEach((l) => {
      const m = new Date(l.date).getMonth();
      months[m].cost += l.totalCost;
      months[m].liters += l.liters;
      months[m].fills += 1;
    });
    return months;
  },

  getLast6MonthsStats: (vehicleId) => {
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), cost: 0, liters: 0, fills: 0 });
    }
    const logs = petrolStorage.getByVehicle(vehicleId);
    logs.forEach((l) => {
      const ld = new Date(l.date);
      const slot = months.find((m) => m.year === ld.getFullYear() && m.month === ld.getMonth());
      if (slot) { slot.cost += l.totalCost; slot.liters += l.liters; slot.fills += 1; }
    });
    return months;
  },

  getFillDates: (vehicleId) => petrolStorage.getByVehicle(vehicleId).map((l) => l.date),

  /**
   * Estimate next refill odometer:
   * next_km = last_odo + (avg_mileage × avg_liters_per_fill)
   */
  getNextRefillEstimate: (vehicleId) => {
    const logs = petrolStorage.getByVehicle(vehicleId);
    if (!logs || logs.length === 0) return null;

    const vehicle = vehicleStorage.getById(vehicleId);
    const stats = petrolStorage.getStats(vehicleId);
    const lastLog = logs[0]; // Newest log

    let mileageToUse = stats.avgMileage;
    let isEstimated = false;

    if (!mileageToUse || mileageToUse <= 0) {
      isEstimated = true;
      const typeDefaults = { bike: 45, scooter: 40, car: 14, truck: 6 };
      mileageToUse = typeDefaults[vehicle?.type] || 35;
    }

    const avgLiters = (stats.totalFills > 0 && stats.totalLiters > 0)
      ? (stats.totalLiters / stats.totalFills)
      : (lastLog.liters || 5);

    const kmRange = Math.round(mileageToUse * avgLiters);
    const estimatedKm = lastLog.odometerKm + kmRange;

    return {
      estimatedKm,
      kmRange,
      avgMileage: parseFloat(mileageToUse.toFixed(1)),
      avgLiters: parseFloat(avgLiters.toFixed(1)),
      lastOdometer: lastLog.odometerKm,
      lastFillDate: lastLog.date,
      isEstimated,
    };
  },
};

// ─── SERVICE RECORDS ─────────────────────────────────────────────────────────

export const serviceStorage = {
  getAll: (vehicleId = null) => {
    let records = getItem(KEYS.SERVICE_RECORDS, []);
    if (vehicleId) records = records.filter((s) => s.vehicleId === vehicleId);
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  add: (data) => {
    const records = getItem(KEYS.SERVICE_RECORDS, []);
    const newRecord = {
      id: generateId('s'),
      vehicleId: data.vehicleId,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'General Service',
      cost: parseFloat(data.cost) || 0,
      odometerKm: parseFloat(data.odometerKm) || 0,
      nextServiceKm: parseFloat(data.nextServiceKm) || 0,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    records.push(newRecord);
    setItem(KEYS.SERVICE_RECORDS, records);
    return newRecord;
  },

  update: (id, data) => {
    const records = getItem(KEYS.SERVICE_RECORDS, []);
    const idx = records.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    records[idx] = { ...records[idx], ...data };
    return setItem(KEYS.SERVICE_RECORDS, records);
  },

  delete: (id) => {
    const records = getItem(KEYS.SERVICE_RECORDS, []).filter((s) => s.id !== id);
    return setItem(KEYS.SERVICE_RECORDS, records);
  },

  getServiceDates: (vehicleId) => serviceStorage.getAll(vehicleId).map((s) => s.date),

  getMonthlyStats: (vehicleId, year) => {
    const records = serviceStorage.getAll(vehicleId).filter(
      (s) => new Date(s.date).getFullYear() === year
    );
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i, cost: 0, count: 0 }));
    records.forEach((s) => {
      const m = new Date(s.date).getMonth();
      months[m].cost += s.cost;
      months[m].count += 1;
    });
    return months;
  },

  getTypeBreakdown: (vehicleId) => {
    const records = serviceStorage.getAll(vehicleId);
    const map = {};
    records.forEach((s) => {
      if (!map[s.type]) map[s.type] = { count: 0, cost: 0 };
      map[s.type].count += 1;
      map[s.type].cost += s.cost;
    });
    return Object.entries(map).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.cost - a.cost);
  },
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingsStorage = {
  get: () => getItem(KEYS.SETTINGS, { activeVehicleId: null, theme: 'dark', currency: '₹' }),

  update: (data) => {
    const current = getItem(KEYS.SETTINGS, {});
    return setItem(KEYS.SETTINGS, { ...current, ...data });
  },

  getActiveVehicleId: () => {
    const s = getItem(KEYS.SETTINGS, {});
    return s.activeVehicleId || null;
  },

  setActiveVehicle: (vehicleId) => {
    const current = getItem(KEYS.SETTINGS, {});
    return setItem(KEYS.SETTINGS, { ...current, activeVehicleId: vehicleId });
  },

  getCurrency: () => {
    const s = getItem(KEYS.SETTINGS, {});
    return s.currency || '₹';
  },

  getTheme: () => {
    if (!isBrowser()) return 'dark';
    return localStorage.getItem('fuelbook_theme') || 'dark';
  },

  setTheme: (theme) => {
    if (!isBrowser()) return;
    localStorage.setItem('fuelbook_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  clearAll: () => {
    if (!isBrowser()) return false;
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem('fuelbook_theme');
      return true;
    } catch (e) { return false; }
  },
};
