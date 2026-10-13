(function () {
  // Цены из карточки Яндекс Карт: легковая, паркетник, внедорожник, минивэн, газель.
  // null — для этого класса цены в прайсе нет, уточняем по телефону.
  // min — сколько минут бокс занят для легковой (предварительно, сверить с владельцем).
  // Мойка выбирается одна, дополнительные услуги — любые.
  var WASHES = [
    { id: 'contactless', name: 'Бесконтактная мойка и\u00A0коврики', short: 'Бесконтактная', prices: [900, 1000, 1100, 1300, 1400], min: 30 },
    { id: 'lux', name: 'Мойка люкс', short: 'Люкс', prices: [1600, 1800, 2000, 2400, 2800], min: 60 },
    { id: 'premium', name: 'Мойка премиум люкс', short: 'Премиум люкс', prices: [2100, 2250, null, 2600, 3000], min: 90 },
    { id: 'tech', name: 'Техническая мойка', short: 'Техническая', prices: [600, 700, null, null, 800], min: 20 }
  ];
  var EXTRAS = [
    { id: 'quartz', name: 'Кварцевое покрытие кузова', short: 'кварц', prices: [1300, 1500, 1700, 1900, 2100], min: 40 },
    { id: 'wax', name: 'Твёрдый воск', short: 'воск', prices: [2500, 2700, 2900, 3100, 3300], min: 90 },
    { id: 'leather', name: 'Обработка кожаных сидений', short: 'кожа', prices: [800, 900, 1000, 1100, 1200], min: 40 },
    { id: 'engine', name: 'Мойка двигателя', short: 'двигатель', prices: [700, 900, 1100, 1300, 1500], min: 40 },
    { id: 'dry', name: 'Химчистка салона', short: 'химчистка', text: 'по\u00A0фото салона', block: 360, long: 'Машина у\u00A0нас 4–6 часов' },
    { id: 'polish', name: 'Полировка кузова', short: 'полировка', text: 'после осмотра', block: 600, long: 'Машина у\u00A0нас целый день' },
    { id: 'tires', name: 'Шиномонтаж', short: 'шиномонтаж', text: 'по\u00A0радиусу колёс', min: 40, fixed: true }
  ];
  var ALL = WASHES.concat(EXTRAS);
  var CLASS_K = [1, 1.15, 1.3, 1.4, 1.5];
  var CARS = ['легковая', 'паркетник', 'внедорожник', 'минивэн', 'газель или\u00A0микроавтобус'];
  var OPEN = 9 * 60, CLOSE = 22 * 60 + 30, STEP = 30;
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  var $ = function (id) { return document.getElementById(id); };
  var form = $('booking'), car = $('car'), date = $('date'), time = $('time'), price = $('price');
  var step1 = $('step1'), step2 = $('step2'), done = $('done'), stepLabel = $('booking-step');
  var summary = $('summary'), phone = $('phone'), nameInput = $('name');
  var svcBtn = $('svc-btn'), svcPop = $('svc-pop'), svcSum = $('svc-sum');

  // Что выбрано: одна мойка (или пусто) и набор дополнительных
  var picked = { wash: 'contactless', extras: [] };

  function rub(n) { return n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽'; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(m) { return Math.floor(m / 60) + ':' + pad(m % 60); }
  function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  function byId(id) { return ALL.filter(function (x) { return x.id === id; })[0]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function chosen() {
    var list = picked.wash ? [byId(picked.wash)] : [];
    EXTRAS.forEach(function (x) { if (picked.extras.indexOf(x.id) > -1) list.push(x); });
    return list;
  }

  function itemMinutes(s, c) { return s.fixed ? s.min : Math.round(s.min * CLASS_K[c] / 10) * 10; }
  function itemPrice(s, c) { return s.prices ? s.prices[c] : null; }

  // Итог: сумма известных цен, что уточняется отдельно и на сколько занят бокс
  function totals() {
    var c = +car.value, list = chosen();
    var sum = 0, unknown = [], unknownNames = [], minutes = 0, long = null;
    list.forEach(function (s) {
      var p = itemPrice(s, c);
      if (p) sum += p; else { unknown.push(s.text || 'уточним по\u00A0телефону'); unknownNames.push(s.short.toLowerCase() + ' ' + (s.text || 'уточним')); }
      if (s.block) { if (!long || s.block > long.block) long = s; }
      else minutes += itemMinutes(s, c);
    });
    // Пока идёт химчистка или полировка, остальное успевают сделать в тот же день
    var occupy = long ? Math.max(long.block, minutes) : minutes;
    return { list: list, sum: sum, unknown: unknown, unknownNames: unknownNames, minutes: occupy, long: long };
  }

  function durText(t) {
    if (t.long) return t.long.long;
    var h = Math.floor(t.minutes / 60), r = t.minutes % 60;
    return 'около\u00A0' + (h ? h + '\u00A0ч' + (r ? ' ' + r + '\u00A0мин' : '') : r + '\u00A0мин');
  }

  function sumText(t) {
    if (!t.sum) return t.unknown.length === 1 ? cap(t.unknown[0]) : 'Назовём при\u00A0записи';
    return (t.unknown.length ? 'от\u00A0' : '') + rub(t.sum);
  }

  // ── Список услуг во всплывающем меню ──
  function rowHtml(s, type, c) {
    var p = itemPrice(s, c);
    var checked = type === 'radio' ? picked.wash === s.id : picked.extras.indexOf(s.id) > -1;
    return '<li><label class="svc-row">' +
      '<input type="' + type + '" name="' + (type === 'radio' ? 'wash' : 'extra') + '" value="' + s.id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="svc-row__name">' + s.name + '</span>' +
      '<span class="svc-row__price">' + (p ? rub(p) : s.text || 'уточним') + '</span>' +
      '</label></li>';
  }

  function renderList() {
    var c = +car.value;
    $('svc-wash').innerHTML = WASHES.map(function (s) { return rowHtml(s, 'radio', c); }).join('') +
      '<li><label class="svc-row"><input type="radio" name="wash" value=""' + (picked.wash ? '' : ' checked') + '>' +
      '<span class="svc-row__name">Без\u00A0мойки</span><span class="svc-row__price"></span></label></li>';
    $('svc-extra').innerHTML = EXTRAS.map(function (s) { return rowHtml(s, 'checkbox', c); }).join('');
  }

  svcPop.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'wash') picked.wash = t.value;
    if (t.name === 'extra') {
      picked.extras = [].map.call(svcPop.querySelectorAll('input[name="extra"]:checked'), function (x) { return x.value; });
    }
    update();
  });

  function openPop(open) {
    svcPop.hidden = !open;
    svcBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      renderList();
      var first = svcPop.querySelector('input:checked') || svcPop.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    }
  }
  svcBtn.addEventListener('click', function () { openPop(svcPop.hidden); });
  $('svc-ok').addEventListener('click', function () { openPop(false); svcBtn.focus(); });
  document.addEventListener('click', function (e) {
    if (!svcPop.hidden && !e.target.closest('.field--svc')) openPop(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !svcPop.hidden) { openPop(false); svcBtn.focus(); }
  });

  // ── Даты и время ──
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var firstToday = Math.ceil((nowMin + 30) / STEP) * STEP;
  for (var i = 0; i < 8; i++) {
    if (i === 0 && firstToday > CLOSE - 60) continue;
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    var o = document.createElement('option');
    o.value = i;
    o.textContent = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()];
    o.dataset.label = d.getDate() + ' ' + MONTHS[d.getMonth()];
    date.appendChild(o);
  }

  function fillTimes(t) {
    var keep = time.value;
    time.innerHTML = '';
    var start = date.value === '0' ? Math.max(OPEN, firstToday) : OPEN;
    var need = Math.max(t.minutes, STEP);
    // последнее время начала — чтобы закончить до закрытия
    for (var m = start; m <= CLOSE - need; m += STEP) {
      var o = document.createElement('option');
      o.value = hm(m); o.textContent = hm(m);
      time.appendChild(o);
    }
    // Сегодня уже не успеваем — переключаем на завтра
    if (!time.options.length && date.value === '0' && date.options.length > 1) {
      date.value = date.options[1].value;
      return fillTimes(t);
    }
    if (!time.options.length) {
      var e = document.createElement('option');
      e.value = ''; e.textContent = 'Не\u00A0успеем';
      time.appendChild(e);
    }
    if (keep && [].some.call(time.options, function (x) { return x.value === keep; })) time.value = keep;
  }

  function update() {
    var t = totals();
    var shorts = t.list.map(function (s) { return s.short; });
    if (shorts.length) shorts[0] = cap(shorts[0]);
    svcBtn.textContent = shorts.length ? shorts.join(' + ') : 'Выберите услуги';
    svcBtn.classList.toggle('is-empty', !shorts.length);

    price.innerHTML = '<span class="booking__sum">' + (t.list.length ? sumText(t) : '—') + '</span>' +
      '<span class="booking__dur">' + (t.list.length ? durText(t) : '&nbsp;') + '</span>';
    price.classList.toggle('is-text', t.list.length > 0 && !t.sum);

    svcSum.innerHTML = t.list.length
      ? 'Итого: <b>' + (t.sum ? sumText(t) : 'цену назовём') + '</b>' + (t.sum && t.unknownNames.length ? ' + ' + t.unknownNames.join(', ') : '') + ', ' + durText(t).replace(/^М/, 'м')
      : 'Отметьте хотя\u00A0бы\u00A0одну услугу';
    fillTimes(t);
  }

  car.addEventListener('change', function () { if (!svcPop.hidden) renderList(); update(); });
  date.addEventListener('change', function () { fillTimes(totals()); });
  update();

  // ── Шаги формы ──
  function show(step) {
    step1.hidden = step !== 1;
    step2.hidden = step !== 2;
    done.hidden = step !== 3;
    stepLabel.textContent = step === 3 ? 'Заявка принята' : 'Шаг ' + step + ' из\u00A02';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!step1.hidden) {
      var t = totals();
      if (!t.list.length) { openPop(true); return; }
      if (!time.value) { time.focus(); return; }
      openPop(false);
      var names = t.list.map(function (s) { return s.name; }).join(' + ');
      summary.innerHTML = '<b>' + names + '</b>, ' + CARS[+car.value] + '<br>' +
        date.options[date.selectedIndex].dataset.label + ' в\u00A0' + time.value +
        (t.long ? ', ' + t.long.long.toLowerCase() : ', будет готова около\u00A0' + hm(toMin(time.value) + t.minutes)) +
        ' · <b>' + sumText(t) + '</b>' + (t.sum && t.unknownNames.length ? ' + ' + t.unknownNames.join(', ') : '');
      show(2);
      nameInput.focus();
      return;
    }
    if (!step2.hidden) {
      var digits = phone.value.replace(/\D/g, '');
      var ok = digits.length === 11;
      phone.closest('.field').classList.toggle('is-error', !ok);
      if (!ok) { phone.focus(); return; }
      show(3);
    }
  });

  $('back').addEventListener('click', function () { show(1); });
  $('again').addEventListener('click', function () {
    form.reset(); phone.closest('.field').classList.remove('is-error');
    picked = { wash: 'contactless', extras: [] };
    update(); show(1);
  });

  // Маска телефона
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = d ? '+7' : '';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    phone.value = out;
  });

  // Меню на телефоне
  var burger = document.querySelector('.burger');
  var nav = $('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Кнопки, которые ведут к записи с нужной услугой или полем
  document.querySelectorAll('[data-service], [data-focus]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.dataset.service === 'tires') { picked = { wash: '', extras: ['tires'] }; update(); show(1); }
      var target = a.dataset.focus === 'car' ? car : a.dataset.service ? date : svcBtn;
      setTimeout(function () { target.focus({ preventScroll: true }); }, 450);
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();
