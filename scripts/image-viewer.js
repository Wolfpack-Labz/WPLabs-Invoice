(() => {
  'use strict';
  if (document.querySelector('dialog.image-viewer')) return;

  const viewer = document.createElement('dialog');
  if (typeof viewer.showModal !== 'function') return;
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-label', 'Image viewer');
  viewer.innerHTML = `
    <div class="image-viewer-toolbar">
      <button class="image-viewer-close" type="button" aria-label="Close image viewer" autofocus>×</button>
    </div>
    <div class="image-viewer-stage">
      <button class="image-viewer-previous" type="button" aria-label="Previous image">‹</button>
      <div class="image-viewer-media">
        <img class="image-viewer-image" alt="" />
        <p class="image-viewer-error" role="status" hidden>This image could not be loaded.</p>
      </div>
      <button class="image-viewer-next" type="button" aria-label="Next image">›</button>
    </div>
    <p class="image-viewer-caption" aria-live="polite" aria-atomic="true">
      <span class="image-viewer-description"></span>
      <span class="image-viewer-counter"></span>
    </p>`;
  document.body.append(viewer);
  const image = viewer.querySelector('.image-viewer-image');
  const error = viewer.querySelector('.image-viewer-error');
  const previous = viewer.querySelector('.image-viewer-previous');
  const next = viewer.querySelector('.image-viewer-next');
  const close = viewer.querySelector('.image-viewer-close');
  const description = viewer.querySelector('.image-viewer-description');
  const counter = viewer.querySelector('.image-viewer-counter');
  let entries = [], index = 0, opener;
  let wasScrollLocked = false;

  const gallerySelector = '.invoice-feature-previews, .invoice-screen-gallery, .wp-labs-invoice-screen-row, [data-image-gallery]';
  // Publisher logos keep their normal home links and never enter the gallery.
  const canPreview = img => !img.matches('.site-wolf-mark') && !viewer.contains(img);
  const isVisible = img => canPreview(img) && img.getClientRects().length > 0 && getComputedStyle(img).visibility !== 'hidden';
  function source(img) {
    const link = img.closest('a[href]');
    // Screenshot links may point at a larger original than the displayed image.
    if (link && /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(link.href)) return link.href;
    return img.currentSrc || img.src;
  }
  function label(img) {
    return img.alt.trim() || img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || img.closest('a')?.getAttribute('aria-label') || 'Image';
  }
  function render() {
    const entry = entries[index];
    error.hidden = true;
    image.hidden = false;
    image.alt = entry.label;
    image.src = entry.src;
    description.textContent = entry.label;
    counter.textContent = `${index + 1} / ${entries.length}`;
    previous.disabled = next.disabled = entries.length < 2;
  }
  function open(img) {
    const scope = img.closest(gallerySelector) || document;
    const unique = new Map();
    [...scope.querySelectorAll('img')].filter(isVisible).forEach(candidate => {
      const src = source(candidate);
      if (src && !unique.has(src)) unique.set(src, {src, label: label(candidate)});
    });
    entries = [...unique.values()];
    index = entries.findIndex(entry => entry.src === source(img));
    if (index < 0) return;
    opener = document.activeElement;
    wasScrollLocked = document.documentElement.classList.contains('image-viewer-open');
    render();
    document.documentElement.classList.add('image-viewer-open');
    viewer.showModal();
    close.focus({preventScroll: true});
  }
  function step(amount) {
    if (entries.length < 2) return;
    index = (index + amount + entries.length) % entries.length;
    render();
  }
  image.addEventListener('error', () => { image.hidden = true; error.hidden = false; });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    if (!wasScrollLocked) document.documentElement.classList.remove('image-viewer-open');
    if (opener?.isConnected) opener.focus({preventScroll: true});
    image.removeAttribute('src');
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
    // The modal dialog provides native Escape closing and background inertness.
    if (event.key === 'Tab') {
      const controls = [...viewer.querySelectorAll('button:not(:disabled)')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  // Click empty space to close; controls, captions and the image remain interactive.
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target.classList.contains('image-viewer-media')) viewer.close();
  });
  let touchStart;
  const media = viewer.querySelector('.image-viewer-media');
  media.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? {x: event.touches[0].clientX, y: event.touches[0].clientY} : null;
  }, {passive: true});
  media.addEventListener('touchmove', event => { if (event.touches.length !== 1) touchStart = null; }, {passive: true});
  media.addEventListener('touchcancel', () => { touchStart = null; }, {passive: true});
  media.addEventListener('touchend', event => {
    if (!touchStart) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touchStart.x, dy = end.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, {passive: true});

  function imageOnlyLink(link) {
    return link && !link.textContent.trim() && link.querySelectorAll('img').length === 1;
  }
  function prepare(img) {
    if (!canPreview(img) || img.classList.contains('image-viewer-trigger')) return;
    img.classList.add('image-viewer-trigger');
    const link = img.closest('a');
    if (imageOnlyLink(link)) {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-label', `View image: ${label(img)}`);
    } else {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      img.setAttribute('aria-label', `View image: ${label(img)}`);
    }
  }
  document.querySelectorAll('img').forEach(prepare);
  // Include images added later by page features without reattaching handlers.
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE || viewer.contains(node)) return;
    if (node.matches('img')) prepare(node);
    node.querySelectorAll('img').forEach(prepare);
  }))).observe(document.body, {childList: true, subtree: true});
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    const img = event.target.closest('img.image-viewer-trigger') || (imageOnlyLink(link) && link.querySelector('img.image-viewer-trigger'));
    if (!img || !isVisible(img)) return;
    event.preventDefault();
    open(img);
  });
  document.addEventListener('keydown', event => {
    if (!event.target.matches('img.image-viewer-trigger') || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    open(event.target);
  });
})();
