/*
 * ТИХО, ЭТО ТЕБЕ, КАРИША 💌
 * Статический сайт без библиотек / трекеров / внешних ресурсов.
 * Пароль 1205 — романтическая игровая механика, не настоящая защита данных.
 */
'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const STORAGE_KEY = 'karisha-letter-v1';
  const prefersLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chapterNames = ['письмо прибыло', 'маленький секрет', 'главный вопрос', 'вкусная глава', 'планы на вечер', 'письмо от сердца', 'приглашение готово'];
  const foodInfo = {
    sushi: { label: '🍣 Суши', text: 'Кариша, у нас сегодня свидание с палочками? 🥢' },
    pizza: { label: '🍕 Пицца', text: 'Только пообещай оставить мне хотя бы один кусочек 😭' },
    pasta: { label: '🍝 Паста', text: 'Ого, итальянская романтика! Мамма миа, Кариша! 🇮🇹' },
    burger: { label: '🍔 Бургеры', text: 'Вот теперь свидание официально станет очень вкусным. И немножко в соусе.' },
    ramen: { label: '🍜 Рамен', text: 'Уют, горячий бульон и ты напротив. Мне уже нравится.' },
    dessert: { label: '🍰 Кофе и десерты', text: 'Самая сладкая здесь всё равно ты. Но тортик тоже возьмём 🤭' },
    cozy: { label: '🥐 Что-нибудь уютное', text: 'Кариша, главное — чтобы было вкусно, тепло и вместе.' },
    surprise: { label: '💗 Выбери за меня', text: 'Хорошо. Беру ответственность за вкусняшки на себя! 🫡' },
    custom: { label: '✨ Свой вариант', text: 'Специальный заказ от самой Кариши. Принято!' }
  };
  const moodInfo = {
    city: { label: '🌆 Вечерний город', text: 'Огоньки, вечер, ты рядом… Я уже представил этот кадр.' },
    rain: { label: '🌧️ Уютное свидание под дождём', text: 'Возьму зонтик. Или два. Но под одним романтичнее.' },
    cinema: { label: '🎬 Кино и вкусняшки', text: 'Половину фильма будем выбирать, что посмотреть. Идеально!' },
    walk: { label: '🌷 Прогулка за ручку', text: 'У меня для твоей руки уже забронировано место.' },
    cafe: { label: '🕯️ Красивое романтическое кафе', text: 'Красиво будет всё. Особенно ты напротив меня.' },
    adventure: { label: '🎡 Маленькое приключение', text: 'Кариша, на этот случай у нас будет целая история!' },
    gift: { label: '🎁 Сюрприз от меня', text: 'Интрига принята! Ничего не скажу. Даже котику.' }
  };
  const funnyNo = [
    'Кариша, ты промахнулась 😭',
    'Ой, эта кнопка временно ушла пить чай 🤭',
    'Ошибка 404: серьёзный отказ не найден 💗',
    'Ладно-ладно, ещё одна попытка. Но без фокусов! 😏'
  ];
  const fortunes = [
    'Предсказание: кто-то будет слишком долго смотреть на твою улыбку.',
    'Твой счастливый билет: ещё одно «давай увидимся».',
    'В прогнозе: 100% вероятность обнимашек, когда захочешь.',
    'Секрет дня: свидание особенно красивое, когда на нём ты.',
    'Из бюро чудес: сегодня разрешается смеяться над моими шутками.'
  ];
  const postmanLines = [
    'Мяу! Я вообще-то важный сотрудник почты. 🐾',
    'Кариша, я лично проверил письмо на милоту!',
    'За доставку полагается одна улыбка. Можно две.',
    'Я не сплетничаю, но кто-то очень тебя любит. 🤫',
    'Мур. Нажми ещё — и я, кажется, покраснею.'
  ];
  const defaultState = () => ({ step: 0, unlocked: false, consent: null, food: null, mood: null, stars: [], letterOpened: false, secretSeen: false });
  const validFoodKeys = Object.keys(foodInfo);
  const validMoodKeys = Object.keys(moodInfo);

  function restoreState() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return defaultState(); }
    if (!saved || typeof saved !== 'object') return defaultState();
    const result = defaultState();
    result.unlocked = saved.unlocked === true;
    result.consent = saved.consent === 'yes' ? 'yes' : saved.consent === 'no' ? 'no' : null;
    if (saved.food && validFoodKeys.includes(saved.food.id) && typeof saved.food.label === 'string') {
      result.food = { id: saved.food.id, label: saved.food.label.slice(0, 94) };
    }
    result.mood = validMoodKeys.includes(saved.mood) ? saved.mood : null;
    result.stars = Array.isArray(saved.stars) ? [...new Set(saved.stars.filter(s => ['intro','food','letter'].includes(s)))] : [];
    result.letterOpened = saved.letterOpened === true;
    result.secretSeen = saved.secretSeen === true;
    result.step = Number.isInteger(saved.step) ? Math.min(6, Math.max(0, saved.step)) : 0;
    return result;
  }

  let state = restoreState();
  let activeStep = 0;
  let inTransition = false;
  let editingFromFinal = false;
  let noAttempts = 0;
  let wrongAttempts = 0;
  let postmanClicks = 0;
  let fortuneIndex = -1;
  let toastTimeout;
  let bubbleTimeout;
  let transitionTimeout;

  function store() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Недоступное хранилище не мешает работе. */ }
  }
  function clampStep(step) {
    if (step > 1 && !state.unlocked) return 1;
    if (step > 2 && state.consent !== 'yes') return 2;
    if (step > 3 && !state.food) return 3;
    if (step > 4 && !state.mood) return 4;
    if (step > 5 && !state.letterOpened) return 5;
    return Math.max(0, Math.min(6, step));
  }
  function updateProgress(step) {
    const value = step + 1;
    const percentage = step / 6 * 100;
    $('chapter-label').innerHTML = `глава ${String(value).padStart(2,'0')} <span class="meta-divider">/</span> 07`;
    $('progress-fill').style.width = percentage + '%';
    $('progress-track').style.setProperty('--progress', percentage + '%');
    $('progress-track').setAttribute('aria-valuenow', value);
    $('chapter-name').textContent = chapterNames[step];
    $('bottom-index').textContent = `${String(value).padStart(2,'0')} — 07`;
    document.body.dataset.step = String(step);
  }
  function showStep(requestedStep, animated = true) {
    const nextStep = clampStep(requestedStep);
    if (inTransition) return;
    if (nextStep === activeStep && animated) {
      updateProgress(activeStep);
      return;
    }
    const current = $(`scene-${activeStep}`);
    const next = $(`scene-${nextStep}`);
    const finish = () => {
      $$('.scene').forEach(s => { s.hidden = s !== next; s.classList.remove('is-leaving', 'is-active'); });
      next.hidden = false;
      next.classList.add('is-active');
      activeStep = nextStep;
      state.step = nextStep;
      store();
      updateProgress(nextStep);
      renderStep(nextStep);
      window.scrollTo(0, 0);
      inTransition = false;
      // Focus an actual heading for keyboard/screen-reader navigation.
      const heading = next.querySelector('h1,h2');
      if (heading && animated) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    clearTimeout(transitionTimeout);
    if (!animated || prefersLessMotion.matches || current.hidden) { finish(); return; }
    inTransition = true;
    current.classList.add('is-leaving');
    transitionTimeout = setTimeout(finish, 255);
  }
  function renderStep(step) {
    if (step === 2) renderQuestion();
    if (step === 3) renderFood();
    if (step === 4) renderMood();
    if (step === 5) renderLetter();
    if (step === 6) renderFinal();
    $$('.collect-star').forEach(btn => btn.classList.toggle('is-collected', state.stars.includes(btn.dataset.star)));
    updateStars();
    // The mascot only speaks when invited, so it never covers the main CTA.
  }
  function showToast(text, time = 3000) {
    const node = $('toast');
    clearTimeout(toastTimeout);
    node.textContent = text;
    node.classList.add('is-visible');
    toastTimeout = setTimeout(() => node.classList.remove('is-visible'), time);
  }
  function showBubble(text, time = 3100) {
    const bubble = $('postman-bubble');
    clearTimeout(bubbleTimeout);
    bubble.textContent = text;
    bubble.classList.add('is-visible');
    bubbleTimeout = setTimeout(() => bubble.classList.remove('is-visible'), time);
  }
  function updateStars() {
    const n = state.stars.length;
    $('star-number').textContent = String(n);
    $('star-counter').setAttribute('aria-label', `Собрано искорок: ${n} из 3`);
  }

  // Floating paper fragments / special-date effects. Transform/opacity only.
  function particleBurst(type, count = 18, origin = null) {
    if (prefersLessMotion.matches) return;
    const layer = $('fx-layer');
    const isRain = type === 'rain';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'fx-particle';
      if (isRain) el.classList.add('is-rain');
      if (origin) el.classList.add('is-glitter');
      let glyph = '✦';
      if (type === 'hearts') glyph = ['♥','♡','✦','✿'][i % 4];
      if (type === 'petals') glyph = ['✿','❀','✾'][i % 3];
      if (type === 'stars') glyph = ['✦','⋆','✧'][i % 3];
      if (type === 'kiss') glyph = ['♡','♥','✧'][i % 3];
      el.textContent = isRain ? '' : glyph;
      const x = origin ? origin.x : Math.random() * 100;
      el.style.setProperty('--x', origin ? x + 'px' : x + '%');
      el.style.setProperty('--y', origin ? origin.y + 'px' : '0px');
      el.style.setProperty('--size', (12 + Math.random() * 18) + 'px');
      el.style.setProperty('--delay', (isRain ? Math.random() * .65 : Math.random() * .55) + 's');
      const dur = origin ? (0.8 + Math.random() * .8) : (isRain ? 1.15 + Math.random() * .8 : 2.8 + Math.random() * 1.3);
      el.style.setProperty('--dur', dur + 's');
      el.style.setProperty('--drift', origin ? ((Math.random() - .5) * 330) + 'px' : ((Math.random() - .5) * 185) + 'px');
      el.style.setProperty('--fall', ((Math.random() - .5) * 260 - 80) + 'px');
      el.style.setProperty('--rot', (200 + Math.random() * 520) + 'deg');
      el.style.setProperty('--color', type === 'petals' ? '#d99cb4' : i % 3 === 0 ? '#e6b59d' : '#bb869f');
      layer.appendChild(el);
      setTimeout(() => el.remove(), (dur + 1) * 1000);
    }
  }

  // Password: intentionally playful and local, not real authentication.
  $('secret-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0,4);
    $('password-message').classList.remove('is-error');
  });
  $('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('secret-code');
    const msg = $('password-message');
    if (input.value === '1205') {
      input.blur();
      state.unlocked = true;
      store();
      msg.textContent = 'Ну конечно, это ты. Кого же я ещё здесь ждал? 💗';
      msg.className = 'feedback-line is-success';
      $('lock-graphic').classList.add('is-unlocked');
      $('unlock-btn').disabled = true;
      particleBurst('hearts', 13, { x: window.innerWidth * .72, y: window.innerHeight * .52 });
      setTimeout(() => {
        $('unlock-btn').disabled = false;
        if (activeStep === 1) showStep(2);
      }, prefersLessMotion.matches ? 80 : 1170);
    } else {
      const errors = [
        'Каришааа, ну ты чего 😭 Попробуй ещё раз.',
        'Подсказка: день, когда всё началось 💌',
        'Ты точно моя Кариша? Подозрительно… 🤨',
        'Кот Моти утверждает, что это не те четыре цифры 🐾'
      ];
      msg.textContent = errors[wrongAttempts % errors.length];
      wrongAttempts++;
      msg.className = 'feedback-line is-error';
      input.classList.remove('is-wrong');
      void input.offsetWidth;
      input.classList.add('is-wrong');
      input.select();
      if (wrongAttempts % 3 === 0) showBubble('Мяу. Я бы подсказал, но я кот. 🐾');
    }
  });

  // Question: playful at first, real consent is always possible.
  function resetQuestion() {
    noAttempts = 0;
    const btn = $('no-btn');
    btn.textContent = 'Нет 🙄';
    btn.classList.remove('is-genuine');
    btn.style.left = '';
    btn.style.top = '';
    btn.style.fontSize = '';
    $('no-reaction').textContent = '(обе кнопки пока притворяются нормальными)';
  }
  function renderQuestion() {
    const result = state.consent === 'yes';
    const decline = state.consent === 'no';
    $('question-main').hidden = result || decline;
    $('question-result').hidden = !result;
    $('question-decline').hidden = !decline;
    if (!result && !decline) resetQuestion();
  }
  function noTeasing() {
    if (state.consent !== null) return;
    if (noAttempts >= 4) { declineDate(); return; }
    const btn = $('no-btn');
    const playground = $('no-playground');
    $('no-reaction').textContent = funnyNo[noAttempts];
    noAttempts += 1;
    const maxX = Math.max(0, playground.clientWidth - btn.offsetWidth - 4);
    const maxY = Math.max(0, playground.clientHeight - btn.offsetHeight - 3);
    const positions = [[.92,.08],[.05,.82],[.88,.74],[.48,.35]];
    const spot = positions[(noAttempts - 1) % positions.length];
    btn.style.left = Math.round(maxX * spot[0]) + 'px';
    btn.style.top = Math.round(maxY * spot[1]) + 'px';
    btn.textContent = ['Не-а 🙃','Ой! 👀','Это не я 🫣','Нет, серьёзно'][noAttempts - 1];
    if (noAttempts === 3) btn.style.fontSize = '12px';
    if (noAttempts === 4) {
      btn.style.fontSize = '';
      btn.classList.add('is-genuine');
      $('no-reaction').textContent = 'А теперь без шуток: выбор всегда за тобой. 💗';
      btn.style.left = Math.round(maxX * .4) + 'px';
      btn.style.top = Math.round(maxY * .4) + 'px';
    }
  }
  function declineDate() {
    state.consent = 'no';
    store();
    renderQuestion();
    showBubble('Уважаем решение Кариши. Всегда. 🌷');
  }
  $('no-btn').addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse' && window.matchMedia('(hover:hover) and (pointer:fine)').matches && noAttempts < 4) noTeasing();
  });
  $('no-btn').addEventListener('click', () => noTeasing());
  $('yes-btn').addEventListener('click', () => {
    state.consent = 'yes';
    store();
    renderQuestion();
    particleBurst('hearts', 37);
    showBubble('МЯУРА! Письмо сработало! 🎉');
  });
  $('question-next').addEventListener('click', () => showStep(3));
  $('decline-back').addEventListener('click', () => { state.consent = null; store(); renderQuestion(); });
  $('decline-exit').addEventListener('click', () => { state.consent = null; store(); showStep(0); });

  // Menu: accessible selectable cards, plus a real custom choice.
  function renderFood() {
    const selected = state.food?.id || null;
    $$('.food-card').forEach(btn => {
      const isSelected = btn.dataset.food === selected;
      btn.classList.toggle('is-selected', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });
    $('custom-food').hidden = selected !== 'custom';
    if (selected === 'custom') $('custom-food-input').value = state.food.label.replace(/^✨ /,'');
    $('food-next').disabled = !state.food;
    $('food-next').innerHTML = editingFromFinal ? 'Сохранить изменения <span class="btn-icon">↗</span>' : 'Забираем этот вариант <span class="btn-icon">↗</span>';
    $('food-message').textContent = selected ? foodInfo[selected].text : 'Выбирай сердцем. Или желудком. Оба варианта хорошие.';
  }
  $$('.food-card').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.food;
    if (key === 'custom') {
      state.food = null;
      renderFood();
      $('custom-food').hidden = false;
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
      $('food-message').textContent = 'Твой вариант — самый интересный. Запиши его чуть ниже! ✎';
      $('custom-food-input').focus();
      store();
      return;
    }
    let label = foodInfo[key].label;
    if (key === 'surprise') {
      const options = ['sushi','pizza','pasta','burger','ramen','dessert','cozy'];
      const randomChoice = options[Math.floor(Math.random() * options.length)];
      label = `🎁 Сюрприз от меня (${foodInfo[randomChoice].label})`;
    }
    state.food = { id:key, label };
    store();
    renderFood();
    showBubble(key === 'surprise' ? 'Это секрет! Я всё организую. 🤫' : 'Записываю заказ, Кариша! 🐾');
  }));
  $('save-custom-food').addEventListener('click', saveCustomFood);
  $('custom-food-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCustomFood(); } });
  function saveCustomFood() {
    const value = $('custom-food-input').value.replace(/\s+/g,' ').trim();
    if (!value) {
      $('custom-error').textContent = 'Напиши, чего хочется, моя хорошая 💗';
      $('custom-food-input').focus();
      return;
    }
    $('custom-error').textContent = '';
    state.food = {id:'custom',label:`✨ ${value.slice(0,70)}`};
    store();
    renderFood();
    showToast('Особенный заказ Кариши записан! ✎');
  }
  $('food-next').addEventListener('click', () => {
    if (!state.food) return;
    if (editingFromFinal && state.mood && state.letterOpened) { editingFromFinal = false; showStep(6); }
    else { editingFromFinal = false; showStep(4); }
  });

  // Date atmosphere, each choice summons its own little weather.
  function renderMood() {
    $$('.mood-card').forEach(btn => {
      const selected = btn.dataset.mood === state.mood;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    $('mood-next').disabled = !state.mood;
    $('mood-next').innerHTML = editingFromFinal ? 'Сохранить изменения <span class="btn-icon">↗</span>' : 'Кажется, придумали! <span class="btn-icon">↗</span>';
    $('mood-message').textContent = state.mood ? moodInfo[state.mood].text : 'Здесь нет неправильных ответов. Только наши варианты.';
  }
  $$('.mood-card').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.mood;
    state.mood = key;
    store();
    renderMood();
    const effect = { city:'stars',rain:'rain',cinema:'stars',walk:'petals',cafe:'stars',adventure:'stars',gift:'hearts' };
    particleBurst(effect[key], key === 'rain' ? 34 : 15);
    if (key === 'gift') showBubble('От меня не выпытать ни слова! 🤐');
  }));
  $('mood-next').addEventListener('click', () => {
    if (!state.mood) return;
    if (editingFromFinal && state.letterOpened) { editingFromFinal = false; showStep(6); }
    else { editingFromFinal = false; showStep(5); }
  });

  // The letter is also swipeable (while retaining a proper button fallback).
  function renderLetter() {
    const isOpen = state.letterOpened;
    $('envelope-scene').classList.toggle('is-open', isOpen);
    $('hidden-letter').setAttribute('aria-hidden', String(!isOpen));
    $('letter-next').disabled = !isOpen;
    $('letter-instruction').textContent = isOpen ? 'Псс… на письме есть маленькая звёздочка. Её тоже можно открыть.' : 'Письмо ждёт тебя. Если что — оно немного волнуется.';
    $('secret-star').disabled = !isOpen;
    $('secret-phrase').hidden = !state.secretSeen;
    $('secret-star').textContent = state.secretSeen ? '♥' : '✧';
  }
  function openLetter() {
    if (state.letterOpened) return;
    state.letterOpened = true;
    store();
    renderLetter();
    showBubble('Письмо доставлено прямо в сердечко. 📬');
    particleBurst('stars', 13, {x:window.innerWidth / 2,y:window.innerHeight * .48});
  }
  $('open-letter').addEventListener('click', openLetter);
  $('secret-star').addEventListener('click', () => {
    if (!state.letterOpened) return;
    state.secretSeen = true;
    if (!state.stars.includes('letter')) state.stars.push('letter');
    store();
    renderLetter();
    updateStars();
    particleBurst('hearts', 15, {x:window.innerWidth*.7,y:window.innerHeight*.5});
    showToast('Внутри пряталась ещё одна маленькая правда 💗');
  });
  let swipeStart = null;
  $('hidden-letter').addEventListener('pointerdown', (e) => { swipeStart = {x:e.clientX,y:e.clientY}; });
  $('hidden-letter').addEventListener('pointerup', (e) => {
    if (!state.letterOpened || !swipeStart || state.secretSeen) { swipeStart = null; return; }
    const distance = Math.hypot(e.clientX-swipeStart.x,e.clientY-swipeStart.y);
    swipeStart = null;
    if (distance > 90 && distance < 700) $('secret-star').click();
  });
  $('letter-next').addEventListener('click', () => { if (state.letterOpened) showStep(6); });

  // Final postcard actions: Unicode-safe copied text and dependency-free PNG.
  function renderFinal() {
    $('summary-food').textContent = state.food?.label ?? '—';
    $('summary-mood').textContent = moodInfo[state.mood]?.label ?? '—';
    if (state.stars.length === 3 && fortuneIndex === -1) $('fortune-text').textContent = 'Ты нашла все три искорки! У тебя глаз на маленькие чудеса. ✦';
  }
  function invitationText() {
    return [
      '💌 НАШЕ МАЛЕНЬКОЕ СВИДАНИЕ',
      'Для: моей Кариши',
      `Меню: ${state.food?.label || 'ещё выбираем'}`,
      `Атмосфера: ${moodInfo[state.mood]?.label || 'ещё выбираем'}`,
      'Компания: ты + я ♡',
      '12 мая — начало нашей истории',
      'Осталось только одно — наконец тебя обнять. 💗'
    ].join('\n');
  }
  async function copyInvite() {
    const content = invitationText();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(content);
      showToast('Приглашение скопировано. Теперь оно твоё! 💌');
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
      document.body.append(textarea);
      textarea.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) { /* Ignore. */ }
      textarea.remove();
      showToast(ok ? 'Приглашение скопировано 💌' : 'Скопировать не вышло. Попробуй ещё раз.');
    }
  }
  $('copy-invite').addEventListener('click', copyInvite);

  function roundRect(ctx,x,y,w,h,r) {
    const radius = Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
    ctx.lineTo(x+w,y+h-radius);ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
    ctx.lineTo(x+radius,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
    ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
  }
  function spacedText(ctx, text, x, y, spacing) {
    let pos = x;
    for (const char of [...text]) { ctx.fillText(char,pos,y);pos += ctx.measureText(char).width + spacing; }
  }
  function wrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines=3) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
    });
    if (line) lines.push(line);
    // Very long single words are handled by shrinking until the drawn text fits.
    lines.slice(0,maxLines).forEach((part,index) => {
      if (index === maxLines-1 && lines.length > maxLines) part += '…';
      ctx.save();
      const base = parseInt(ctx.font.match(/\d+px/)?.[0],10) || 40;
      let fontSize = base;
      while (ctx.measureText(part).width > maxWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = ctx.font.replace(/\d+px/,`${fontSize}px`);
      }
      ctx.fillText(part,x,y+index*lineHeight);
      ctx.restore();
    });
    return Math.min(lines.length,maxLines);
  }
  function drawTicket() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const c = canvas.getContext('2d');
    if (!c) throw new Error('Canvas is unavailable');
    const w = canvas.width, h = canvas.height;
    let gradient = c.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,'#fffaf5');gradient.addColorStop(.62,'#fffcf9');gradient.addColorStop(1,'#f7e5e7');
    c.fillStyle = gradient;c.fillRect(0,0,w,h);
    let glow = c.createRadialGradient(1030,145,15,1030,145,570);
    glow.addColorStop(0,'rgba(226,180,197,.6)');glow.addColorStop(1,'rgba(226,180,197,0)');
    c.fillStyle = glow;c.fillRect(0,0,w,h);
    glow = c.createRadialGradient(100,1300,10,100,1300,430);
    glow.addColorStop(0,'rgba(255,219,190,.55)');glow.addColorStop(1,'rgba(255,219,190,0)');
    c.fillStyle = glow;c.fillRect(0,0,w,h);
    c.lineWidth = 2;c.strokeStyle = '#e3c6cf';roundRect(c,45,45,1110,1410,22);c.stroke();
    c.strokeStyle = '#eedfe2';roundRect(c,68,68,1064,1364,16);c.stroke();
    c.fillStyle = '#aa8394';c.font = '25px Arial, sans-serif';spacedText(c,'БЮРО МАЛЕНЬКИХ ЧУДЕС',125,148,3);
    c.textAlign='right';c.font='22px Arial, sans-serif';c.fillText('№ 1205 / VIP',1075,148);c.textAlign='left';
    c.fillStyle = '#cfabbb';c.font = '102px Georgia, serif';c.fillText('✳',980,310);
    c.fillStyle = '#b88398';c.font='italic 44px Georgia, serif';c.fillText('личное приглашение',123,350);
    c.fillStyle = '#674f61';c.font = '126px Georgia, serif';c.fillText('Наше',116,500);
    c.fillStyle = '#b1768f';c.font='italic 120px Georgia, serif';c.fillText('маленькое',116,628);
    c.fillStyle = '#674f61';c.font='123px Georgia, serif';c.fillText('свидание',116,765);
    c.fillStyle = '#bf8299';c.font='66px Georgia, serif';c.fillText('♡',940,758);
    c.beginPath();c.strokeStyle='#d7b5c3';c.lineWidth=2;c.setLineDash([10,10]);c.moveTo(115,833);c.lineTo(1080,833);c.stroke();c.setLineDash([]);
    function field(key,value,y,fontSize=50) {
      c.fillStyle = '#b08ba0';c.font = 'bold 21px Arial, sans-serif';spacedText(c,key,126,y,2);
      c.fillStyle = '#6d5263';c.font = `italic ${fontSize}px Georgia, serif`;
      wrappedText(c,value,126,y+69,930,54,2);
    }
    field('ДЛЯ','моей Кариши',885,49);
    field('БУДЕМ КУШАТЬ',state.food?.label || 'ещё выбираем',1008,41);
    field('АТМОСФЕРА',moodInfo[state.mood]?.label || 'ещё выбираем',1164,35);
    field('КОМПАНИЯ','ты + я ♡',1287,36);
    c.strokeStyle='#edd9df';c.beginPath();c.moveTo(118,1380);c.lineTo(1070,1380);c.stroke();
    c.fillStyle='#aa8394';c.font='italic 27px Georgia, serif';c.fillText('12 мая — начало нашей истории',120,1417);
    c.beginPath();c.strokeStyle='#c59aa9';c.lineWidth=4;c.arc(1000,1392,51,0,Math.PI*2);c.stroke();
    c.fillStyle='#b88398';c.font='italic 23px Georgia, serif';c.textAlign='center';c.fillText('с любовью',1000,1388);c.font='39px Georgia, serif';c.fillText('♡',1000,1425);
    c.textAlign='left';
    return canvas.toDataURL('image/png');
  }
  $('save-image').addEventListener('click', () => {
    try {
      const imageUrl = drawTicket();
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'Приглашение_для_Кариши.png';
      document.body.append(link);
      link.click();
      link.remove();
      showToast('Открытка готова! Если она открылась в Safari — удержи её и сохрани в Фото. 💌',5200);
    } catch (_) { showToast('Не удалось сохранить изображение. Попробуй скопировать приглашение.'); }
  });
  $$('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    editingFromFinal = true;
    showStep(btn.dataset.edit === 'food' ? 3 : 4);
  }));
  $('fortune-btn').addEventListener('click', () => {
    fortuneIndex = (fortuneIndex + 1) % fortunes.length;
    $('fortune-text').textContent = fortunes[fortuneIndex];
    particleBurst('stars',9,{x:window.innerWidth*.45,y:window.innerHeight*.75});
  });

  function resetAdventure() {
    state = defaultState();
    editingFromFinal = false;
    wrongAttempts = 0;
    $('secret-code').value = '';
    $('password-message').textContent = 'И нет, пароль не «люблю тебя». Хотя близко.';
    $('password-message').className = 'feedback-line';
    $('lock-graphic').classList.remove('is-unlocked');
    $('custom-food-input').value = '';
    $('custom-food').hidden = true;
    $('custom-error').textContent = '';
    $('secret-phrase').hidden = true;
    $('envelope-scene').classList.remove('is-open');
    $('fortune-text').textContent = 'А это ещё не всё…';
    fortuneIndex = -1;
    store();
    showStep(0);
    showToast('Наша история начинается с первой странички 💗');
  }
  $('restart').addEventListener('click', resetAdventure);

  // Mini secrets: 12 May, collectibles, kitty head-pats.
  $$('.collect-star').forEach(button => button.addEventListener('click', () => {
    if (state.stars.includes(button.dataset.star)) return;
    state.stars.push(button.dataset.star);
    button.classList.add('is-collected');
    store();
    updateStars();
    const rect = button.getBoundingClientRect();
    particleBurst('stars',11,{x:rect.left+rect.width/2,y:rect.top+rect.height/2});
    if (state.stars.length === 3) showToast('Три из трёх! Кариша нашла все спрятанные искорки ✦');
    else showToast(`Искорка найдена! ${state.stars.length} из 3 ✦`);
  }));
  $('postman-button').addEventListener('click', () => {
    postmanClicks++;
    showBubble(postmanClicks % 3 === 0 ? 'МУРР! Лови воздушный поцелуй, Кариша! 😽💗' : postmanLines[(postmanClicks - 1) % postmanLines.length]);
    if (postmanClicks % 3 === 0) {
      const rect = $('postman-button').getBoundingClientRect();
      particleBurst('kiss',15,{x:rect.left+rect.width/2,y:rect.top+rect.height/2});
    }
  });
  function closeDate() { $('date-popover').hidden = true; $('date-secret').setAttribute('aria-expanded','false'); }
  $('date-secret').addEventListener('click', () => {
    const shouldOpen = $('date-popover').hidden;
    $('date-popover').hidden = !shouldOpen;
    $('date-secret').setAttribute('aria-expanded',String(shouldOpen));
  });
  $('date-close').addEventListener('click',closeDate);
  document.addEventListener('pointerdown', (event) => {
    if (!$('date-popover').hidden && !$('date-popover').contains(event.target) && !$('date-secret').contains(event.target)) closeDate();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDate(); });
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.go))));

  // Resume interrupted adventures. Saved stage cannot bypass required choices.
  showStep(clampStep(state.step), false);
})();
