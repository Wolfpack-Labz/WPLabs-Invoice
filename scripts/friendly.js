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
    const pagination = browser.querySelector('.blog-pagination');
    const numbers = pagination?.querySelector('.page-numbers');
    const previous = pagination?.querySelector('[data-page-step="-1"]');
    const next = pagination?.querySelector('[data-page-step="1"]');
    const summary = pagination?.querySelector('.page-summary');
    const pageSize = 12;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let category = 'All articles', page = 1, pageCount = 1;
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    function updateUrl(push = false) {
      const url = new URL(location.href);
      input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
      category === 'All articles' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
      page > 1 ? url.searchParams.set('page', String(page)) : url.searchParams.delete('page');
      if (url.href !== location.href) history[push ? 'pushState' : 'replaceState'](null, '', url);
    }

    function render() {
      const terms = normalize(input.value).split(/\s+/).filter(Boolean);
      const matches = cards.filter(card => terms.every(term => normalize(card.dataset.search).includes(term)) && (category === 'All articles' || category === card.dataset.category));
      // Older cached blog markup remains usable during a rollout.
      pageCount = pagination ? Math.max(1, Math.ceil(matches.length / pageSize)) : 1;
      page = Math.min(Math.max(1, page), pageCount);
      const start = pagination ? (page - 1) * pageSize : 0;
      const visible = new Set(matches.slice(start, pagination ? start + pageSize : matches.length));
      cards.forEach(card => { card.hidden = !visible.has(card); });
      filters.forEach(button => button.setAttribute('aria-pressed', String(category === button.dataset.filter)));
      const noun = matches.length === 1 ? 'article' : 'articles';
      count.textContent = matches.length ? `Showing ${start + 1}–${start + visible.size} of ${matches.length} ${noun}${input.value.trim() ? ' found' : ''}` : 'No articles found';
      empty.hidden = matches.length !== 0;
      if (!pagination) return;
      pagination.hidden = pageCount <= 1;
      previous.disabled = page === 1;
      next.disabled = page === pageCount;
      summary.textContent = `Page ${page} of ${pageCount}`;
      numbers.replaceChildren();
      // Keep the widget compact as the archive grows, with first/last pages always available.
      const pages = [...new Set([1, pageCount, ...Array.from({length: 5}, (_, i) => page + i - 2)])].filter(value => value >= 1 && value <= pageCount).sort((a, b) => a - b);
      pages.forEach((value, index) => {
        if (index && value - pages[index - 1] > 1) {
          const gap = document.createElement('span');
          gap.className = 'page-gap';
          gap.textContent = '…';
          gap.setAttribute('aria-hidden', 'true');
          numbers.append(gap);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-button';
        button.dataset.page = value;
        button.textContent = value;
        button.setAttribute('aria-label', `Page ${value}`);
        button.setAttribute('aria-controls', 'blog-article-list');
        if (value === page) button.setAttribute('aria-current', 'page');
        numbers.append(button);
      });
    }

    function jumpToArticles() {
      count.focus({preventScroll: true});
      count.scrollIntoView({block: 'start', behavior: motion.matches ? 'instant' : 'smooth'});
    }

    function filter() {
      page = 1;
      render();
      updateUrl();
    }

    function restoreUrl(scroll = false) {
      const params = new URLSearchParams(location.search);
      input.value = params.get('q') || '';
      category = filters.some(f => f.dataset.filter === params.get('category')) ? params.get('category') : 'All articles';
      const requested = Number(params.get('page'));
      page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
      render();
      updateUrl();
      if (scroll) jumpToArticles();
    }

    pagination?.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled || !pagination.contains(button)) return;
      const requested = button.dataset.page ? Number(button.dataset.page) : page + Number(button.dataset.pageStep);
      if (!Number.isInteger(requested) || requested === page || requested < 1 || requested > pageCount) return;
      page = requested;
      render();
      updateUrl(true);
      jumpToArticles();
    });
    input.addEventListener('input', filter);
    browser.querySelector('form').addEventListener('submit', event => { event.preventDefault(); filter(); });
    filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; filter(); }));
    browser.querySelector('.clear-search').addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
    browser.querySelector('[data-search-reset]').addEventListener('click', () => { input.value = ''; category = 'All articles'; filter(); input.focus(); });
    addEventListener('popstate', () => restoreUrl(true));
    // Native history restoration can otherwise undo the widget's scroll-to-results behavior.
    if (pagination && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
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
