(() => {
  'use strict';
  const mobileQuery = window.matchMedia('(max-width: 860px)');

  document.querySelectorAll('.nav-accordion').forEach((menu) => {
    // A cached or duplicate script must never attach a second toggle handler.
    if (menu.dataset.menuReady === 'true') return;
    const toggle = menu.querySelector('.nav-toggle');
    const navigation = menu.querySelector('.nav');
    if (!toggle || !navigation) return;
    const icon = toggle.querySelector('[data-menu-icon]');
    let isOpen = false;

    function setOpen(nextOpen) {
      isOpen = mobileQuery.matches && nextOpen;
      menu.dataset.menuOpen = String(isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close primary navigation' : 'Open primary navigation');
      navigation.hidden = mobileQuery.matches && !isOpen;
      if (icon) icon.textContent = isOpen ? '×' : '☰';
    }

    toggle.hidden = false;
    menu.dataset.menuReady = 'true';
    setOpen(false);

    toggle.addEventListener('click', () => setOpen(!isOpen));
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    function closeOutside(event) {
      if (isOpen && !menu.contains(event.target)) setOpen(false);
    }
    // pointerdown handles touch before focus changes; click also supports
    // keyboards and browsers without Pointer Events.
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('click', closeOutside);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) {
        setOpen(false);
        toggle.focus();
      }
    });
    menu.addEventListener('focusout', () => {
      setTimeout(() => {
        if (isOpen && !menu.contains(document.activeElement)) setOpen(false);
      }, 0);
    });

    function resetForViewport() { setOpen(false); }
    if (typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', resetForViewport);
    else mobileQuery.addListener(resetForViewport);
    window.addEventListener('pageshow', resetForViewport);
    window.addEventListener('orientationchange', resetForViewport);
  });
})();
