/* Тарифы для демонстрации. Здесь удобно менять цены без редактирования HTML. */
(function (root) {
  'use strict';
  const services = {
    regular: { title: 'Поддерживающая уборка', rate: 90, minimum: 3500 },
    general: { title: 'Генеральная уборка', rate: 160, minimum: 6500 },
    renovation: { title: 'Уборка после ремонта', rate: 210, minimum: 8500 }
  };
  const extras = {
    oven: { title: 'Духовка внутри', price: 600 },
    fridge: { title: 'Холодильник внутри', price: 500 },
    cabinets: { title: 'Кухонные шкафы внутри', price: 900 }
  };

  function calculateQuote(options) {
    const service = services[options.service];
    const area = Number(options.area);
    const bathrooms = Number(options.bathrooms);
    const windows = Number(options.windows);
    const selectedExtras = [...new Set(options.extras || [])];
    if (!service) throw new Error('Выберите формат уборки.');
    if (!Number.isInteger(area) || area < 20 || area > 250) throw new Error('Укажите целую площадь от 20 до 250 м².');
    if (!Number.isInteger(bathrooms) || bathrooms < 1 || bathrooms > 4) throw new Error('Выберите от 1 до 4 санузлов.');
    if (!Number.isInteger(windows) || windows < 0 || windows > 6) throw new Error('Выберите от 0 до 6 окон.');
    if (selectedExtras.some(key => !extras[key])) throw new Error('Неизвестная дополнительная услуга.');
    const calculatedBase = area * service.rate;
    const base = Math.max(calculatedBase, service.minimum);
    const additions = windows * 500 + (bathrooms - 1) * 700 + selectedExtras.reduce((sum, key) => sum + extras[key].price, 0);
    return { service: options.service, title: service.title, area, bathrooms, windows, extras: selectedExtras, base, additions, total: base + additions, minimumApplied: calculatedBase < service.minimum };
  }

  const api = { services, extras, calculateQuote };
  // Обычный script работает и при открытии index.html двойным щелчком в Windows.
  root.CleaningCalculator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
