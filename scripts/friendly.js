(() => {
  'use strict';
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...track.children];
    const dots = carousel.querySelector('.carousel-dots');
    const pause = carousel.querySelector('[data-carousel="pause"]');
    const count = carousel.querySelector('.carousel-count');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = motion.matches, hovering = false, focused = false, visible = true, index = 0, timer;
    const buttons = slides.map((slide, i) => {
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `Article ${i + 1} of ${slides.length}`);
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Show article ${i + 1}: ${slide.querySelector('h3').textContent}`);
      button.addEventListener('click', () => go(i));
      dots.append(button);
      return button;
    });
    const visibleCount = () => Math.max(1, Math.round(track.clientWidth / (slides[0].getBoundingClientRect().width + 24)));
    const lastStart = () => Math.max(0, slides.length - visibleCount());
    const updateControls = () => {
      buttons.forEach((b, i) => { b.setAttribute('aria-current', String(i === index)); b.hidden = i > lastStart(); });
      count.textContent = visibleCount() === 1 ? `${index + 1} / ${slides.length}` : `${index + 1}–${Math.min(index + visibleCount(), slides.length)} / ${slides.length}`;
      pause.textContent = paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-label', paused ? 'Play automatic article rotation' : 'Pause automatic article rotation');
    };
    const updateTimer = () => {
      clearInterval(timer);
      if (!paused && !hovering && !focused && visible && !document.hidden && slides.length > 1) timer = setInterval(() => go(index + 1), 6000);
    };
    function go(next) {
      index = (next + lastStart() + 1) % (lastStart() + 1);
      // offsetLeft can reference a different ancestor; bounding rectangles share coordinates.
      const left = track.scrollLeft + slides[index].getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({left, behavior: motion.matches ? 'auto' : 'smooth'});
      updateControls();
    }
    carousel.querySelector('[data-carousel="previous"]').addEventListener('click', () => go(index - 1));
    carousel.querySelector('[data-carousel="next"]').addEventListener('click', () => go(index + 1));
    pause.addEventListener('click', () => { paused = !paused; updateControls(); updateTimer(); });
    carousel.addEventListener('mouseenter', () => { hovering = true; updateTimer(); });
    carousel.addEventListener('mouseleave', () => { hovering = false; updateTimer(); });
    carousel.addEventListener('focusin', () => { focused = true; updateTimer(); });
    carousel.addEventListener('focusout', () => setTimeout(() => { focused = carousel.contains(document.activeElement); updateTimer(); }, 0));
    track.addEventListener('touchstart', () => { hovering = true; updateTimer(); }, {passive: true});
    track.addEventListener('touchend', () => { hovering = false; updateTimer(); }, {passive: true});
    track.addEventListener('touchcancel', () => { hovering = false; updateTimer(); }, {passive: true});
    // Track swipe/keyboard scroll without overwriting the selected index when the last cards share an end position.
    let scrolling;
    track.addEventListener('scroll', () => {
      clearTimeout(scrolling);
      scrolling = setTimeout(() => {
        const end = track.scrollWidth - track.clientWidth;
        if (Math.abs(track.scrollLeft - end) < 4) { index = lastStart(); updateControls(); return; }
        const origin = track.getBoundingClientRect().left;
        index = slides.reduce((best, slide, i) => Math.abs(slide.getBoundingClientRect().left - origin) < Math.abs(slides[best].getBoundingClientRect().left - origin) ? i : best, 0);
        updateControls();
      }, 180);
    }, {passive:true});
    addEventListener('resize', () => { index = Math.min(index, lastStart()); go(index); updateTimer(); });
    document.addEventListener('visibilitychange', updateTimer);
    motion.addEventListener('change', () => { if (motion.matches) paused = true; updateControls(); updateTimer(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateTimer(); }, {threshold: .15}).observe(track);
    updateControls(); updateTimer();
  }

  const browser = document.querySelector('.blog-browser');
  if (browser) {
    const input = browser.querySelector('#blog-search');
    const cards = [...browser.querySelectorAll('.story-card')];
    const filters = [...browser.querySelectorAll('[data-filter]')];
    const count = browser.querySelector('.search-count');
    const empty = browser.querySelector('.empty-state');
    let category = 'All articles';
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    function filter(updateUrl = true) {
      const terms = normalize(input.value).split(/\s+/).filter(Boolean);
      let total = 0;
      cards.forEach(card => {
        const matches = terms.every(term => normalize(card.dataset.search).includes(term)) && (category === 'All articles' || category === card.dataset.category);
        card.hidden = !matches;
        if (matches) total++;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(category === button.dataset.filter)));
      count.textContent = `${total} ${total === 1 ? 'article' : 'articles'}${input.value.trim() ? ' found' : ' to explore'}`;
      empty.hidden = total !== 0;
      if (updateUrl) {
        const url = new URL(location.href);
        input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
        category === 'All articles' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
        history.replaceState(null, '', url);
      }
    }
    function restoreUrl() {
      const params = new URLSearchParams(location.search);
      input.value = params.get('q') || '';
      category = filters.some(f => f.dataset.filter === params.get('category')) ? params.get('category') : 'All articles';
      filter(false);
    }
    input.addEventListener('input', () => filter());
    browser.querySelector('form').addEventListener('submit', event => { event.preventDefault(); filter(); });
    filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; filter(); }));
    browser.querySelector('.clear-search').addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
    browser.querySelector('[data-search-reset]').addEventListener('click', () => { input.value = ''; category = 'All articles'; filter(); input.focus(); });
    addEventListener('popstate', restoreUrl);
    restoreUrl();
  }

  const calculator = document.querySelector('[data-calculator]');
  if (calculator) {
    const form = calculator.querySelector('form');
    const label = calculator.querySelector('.result-label');
    const value = calculator.querySelector('.result-value');
    const detail = calculator.querySelector('.result-breakdown');
    const error = calculator.querySelector('.calc-error');
    const money = number => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(number);
    const percent = number => `${number.toFixed(2)}%`;
    const number = name => Number(form.elements[name].value);
    const fail = message => { value.textContent = '—'; detail.textContent = ''; error.textContent = message; error.hidden = false; };
    function calculate() {
      if (![...form.querySelectorAll('input')].every(i => i.value.trim() && i.validity.valid && Number.isFinite(Number(i.value)))) { fail('Enter a valid, non-negative number in each field.'); return; }
      error.hidden = true;
      const type = calculator.dataset.calculator;
      let result, lines;
      if (type === 'pricing') {
        const labor = number('hours') * number('rate');
        const costs = labor + number('materials') + number('travel') + number('overhead');
        const margin = number('margin') / 100;
        if (margin >= 1) { fail('Choose a target margin below 100%.'); return; }
        result = costs / (1 - margin);
        label.textContent = 'Estimated price before tax';
        lines = [`Total included costs: ${money(costs)}`, `Difference after costs: ${money(result - costs)}`, `Target margin: ${percent(margin * 100)}`];
      } else if (type === 'profit') {
        const revenue = number('revenue'), costs = number('cost');
        if (revenue <= 0) { fail('Enter a selling price greater than zero to calculate margin.'); return; }
        result = revenue - costs;
        label.textContent = result < 0 ? 'Loss on included costs' : 'Profit on included costs';
        lines = [`Margin: ${percent(result / revenue * 100)}`, `Markup: ${costs === 0 ? 'Not defined (zero cost)' : percent(result / costs * 100)}`, `Included costs: ${money(costs)}`];
      } else {
        const balance = number('balance'), rate = number('fee') / 100, days = number('days'), method = form.elements.method.value;
        result = balance * rate * (method === 'monthly' ? days / 30 : method === 'daily' ? days : days > 0 ? 1 : 0);
        label.textContent = 'Estimated late fee';
        lines = [`Balance plus fee: ${money(balance + result)}`, `Method: ${method === 'monthly' ? 'Monthly, prorated over 30 days' : method === 'daily' ? 'Daily, simple interest' : 'One-time percentage'}`, 'No compounding or automatic billing.'];
      }
      if (!Number.isFinite(result) || Math.abs(result) > 1e15) { fail('These numbers are too large to calculate reliably. Try smaller values.'); return; }
      value.textContent = money(result);
      detail.replaceChildren(...lines.map(line => { const item = document.createElement('div'); item.textContent = line; return item; }));
    }
    form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
    form.addEventListener('input', calculate);
    form.addEventListener('change', calculate);
    form.addEventListener('reset', () => setTimeout(calculate, 0));
    calculate();
  }
  document.querySelector('[data-print]')?.addEventListener('click', () => print());
})();
