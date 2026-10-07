/* JavaScript связывает поля, расчёт и демонстрационную форму заявки. */
'use strict';

const calculator = document.querySelector('#calculator');
const area = document.querySelector('#area');
const areaRange = document.querySelector('#area-range');
const error = document.querySelector('#calc-error');
const dialog = document.querySelector('#request-dialog');
const requestForm = document.querySelector('#request-form');
const requestResult = document.querySelector('#request-result');
const dateInput = document.querySelector('#request-date');
const phoneInput = document.querySelector('#customer-phone');
const phoneError = document.querySelector('#phone-error');
const formatMoney = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
let currentQuote = null;
let requestText = '';

function updateQuote() {
  const data = new FormData(calculator);
  try {
    currentQuote = CleaningCalculator.calculateQuote({
      service: data.get('cleaning'), area: data.get('area'),
      bathrooms: data.get('bathrooms'), windows: data.get('windows'), extras: data.getAll('extra')
    });
    document.querySelector('#quote-total').textContent = new Intl.NumberFormat('ru-RU').format(currentQuote.total);
    document.querySelector('#quote-description').textContent = currentQuote.title + ' · ' + currentQuote.area + ' м²';
    document.querySelector('#quote-base').textContent = formatMoney(currentQuote.base);
    document.querySelector('#quote-extras').textContent = formatMoney(currentQuote.additions);
    document.querySelector('#minimum-note').hidden = !currentQuote.minimumApplied;
    document.querySelector('#quote-request').disabled = false;
    error.hidden = true;
    area.removeAttribute('aria-invalid');
  } catch (exception) {
    currentQuote = null;
    error.textContent = exception.message;
    error.hidden = false;
    area.setAttribute('aria-invalid', 'true');
    document.querySelector('#quote-total').textContent = '—';
    document.querySelector('#quote-description').textContent = 'Проверьте параметры уборки';
    document.querySelector('#quote-base').textContent = '—';
    document.querySelector('#quote-extras').textContent = '—';
    document.querySelector('#minimum-note').hidden = true;
    document.querySelector('#quote-request').disabled = true;
  }
}

areaRange.addEventListener('input', () => { area.value = areaRange.value; updateQuote(); });
area.addEventListener('input', () => { if (area.validity.valid && area.value !== '') areaRange.value = area.value; });
calculator.addEventListener('input', updateQuote);
calculator.addEventListener('change', updateQuote);
calculator.addEventListener('submit', event => event.preventDefault());

document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    calculator.querySelector('[value="' + button.dataset.service + '"]').checked = true;
    updateQuote();
    document.querySelector('#cost').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});

// Мобильное меню: кнопка меняет только открытое/закрытое состояние.
const menuToggle = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Открыть меню'); }
menuToggle.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

function tomorrowString() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  return [nextDay.getFullYear(), String(nextDay.getMonth() + 1).padStart(2, '0'), String(nextDay.getDate()).padStart(2, '0')].join('-');
}

function showRequest() {
  updateQuote();
  if (!currentQuote) { area.focus(); return; }
  requestForm.reset();
  requestForm.hidden = false;
  requestResult.hidden = true;
  phoneInput.setCustomValidity('');
  phoneError.hidden = true;
  dateInput.min = tomorrowString();
  dateInput.value = dateInput.min;
  document.querySelector('#request-quote').textContent = currentQuote.title + ' · ' + currentQuote.area + ' м² · ' + formatMoney(currentQuote.total);
  dialog.showModal();
}
document.querySelectorAll('.js-request').forEach(button => button.addEventListener('click', showRequest));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rectangle = dialog.getBoundingClientRect();
  if (event.clientX < rectangle.left || event.clientX > rectangle.right || event.clientY < rectangle.top || event.clientY > rectangle.bottom) dialog.close();
});

function normalizedPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && ['7', '8'].includes(digits[0])) return '+7' + digits.slice(1);
  return null;
}
phoneInput.addEventListener('input', () => { phoneInput.setCustomValidity(''); phoneError.hidden = true; });
dateInput.addEventListener('input', () => dateInput.setCustomValidity(''));
document.querySelector('#customer-name').addEventListener('input', event => event.target.setCustomValidity(''));

requestForm.addEventListener('submit', event => {
  event.preventDefault();
  const nameInput = document.querySelector('#customer-name');
  const name = nameInput.value.trim();
  if (name.length < 2) { nameInput.setCustomValidity('Введите имя — минимум 2 символа.'); nameInput.reportValidity(); return; }
  const phone = normalizedPhone(phoneInput.value);
  if (!phone) {
    phoneError.textContent = 'Введите 10 цифр или 11 цифр с начальной 7 или 8.';
    phoneError.hidden = false;
    phoneInput.setCustomValidity(phoneError.textContent);
    phoneInput.reportValidity();
    return;
  }
  dateInput.min = tomorrowString();
  if (!dateInput.value || dateInput.value < dateInput.min) { dateInput.setCustomValidity('Выберите дату начиная с завтрашнего дня.'); dateInput.reportValidity(); return; }
  if (!requestForm.reportValidity() || !currentQuote) return;
  const data = new FormData(requestForm);
  const extras = currentQuote.extras.map(key => CleaningCalculator.extras[key].title);
  const readableDate = new Date(dateInput.value + 'T12:00:00').toLocaleDateString('ru-RU');
  requestText = [
    'ЧИСТО — ДЕМОНСТРАЦИОННАЯ ЗАЯВКА',
    'Заявка не отправлена. Реальная уборка не забронирована.', '',
    'Имя: ' + name, 'Телефон: ' + phone,
    'Формат: ' + currentQuote.title, 'Площадь: ' + currentQuote.area + ' м²',
    'Санузлы: ' + currentQuote.bathrooms, 'Окна: ' + currentQuote.windows,
    'Дополнительно: ' + (extras.join(', ') || 'не выбрано'),
    'Дата: ' + readableDate, 'Время: ' + data.get('time'),
    'Пример стоимости: ' + formatMoney(currentQuote.total),
    'Пожелания: ' + (String(data.get('comment')).trim() || 'нет')
  ].join('\n');
  // Пользовательский текст выводится через textContent, без вставки HTML.
  document.querySelector('#request-summary').textContent = requestText;
  requestForm.hidden = true;
  requestResult.hidden = false;
  document.querySelector('#download-request').focus();
});

document.querySelector('#edit-request').addEventListener('click', () => {
  requestResult.hidden = true; requestForm.hidden = false; document.querySelector('#customer-name').focus();
});
document.querySelector('#download-request').addEventListener('click', () => {
  const file = new Blob(['\uFEFF' + requestText], { type: 'text/plain;charset=utf-8' });
  const address = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = address; link.download = 'chisto-zayavka.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(address), 1000);
});

updateQuote();
