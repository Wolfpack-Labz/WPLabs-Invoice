'use strict';
// A browser-only email composer. No network submission or persistent draft storage.
(function () {
  const address = 'support@wolfpack-labs.com';
  document.querySelectorAll('[data-email-composer]').forEach(function (form) {
    const panel = form.querySelector('[data-draft]');
    const text = form.querySelector('[data-draft-text]');
    const open = form.querySelector('[data-open-email]');
    const copy = form.querySelector('[data-copy-draft]');
    const status = form.querySelector('[data-draft-status]');
    function invalidate() {
      panel.hidden = true;
      text.value = '';
      open.href = 'mailto:' + address;
      status.textContent = 'Update the draft to include your latest changes.';
    }
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const type = String(fields.get('requestType') || 'Support').replace(/[\r\n]/g, ' ').trim();
      const email = String(fields.get('accountEmail') || '').trim();
      const message = String(fields.get('message') || '').trim();
      const subject = "WP Women's Health " + type;
      const body = 'App: WP Women\'s Health\nRequest: ' + type + '\nAccount email: ' + (email || '[add your account email if relevant]') + '\n\n' + (message || 'Please help me with the request identified above.');
      const uri = 'mailto:' + address + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      text.value = 'To: ' + address + '\nSubject: ' + subject + '\n\n' + body;
      open.href = uri;
      open.hidden = uri.length > 1800;
      panel.hidden = false;
      status.textContent = open.hidden ? 'Draft ready. Nothing has been sent. Copy this longer draft into your email service.' : 'Draft ready. Nothing has been sent. Review it and send it from your email app.';
    });
    copy.addEventListener('click', async function () {
      if (!text.value) return;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text.value);
        status.textContent = 'Draft copied. Paste it into your email service and send it to ' + address + '. Nothing has been sent here.';
      } catch (_) {
        text.focus();
        text.select();
        status.textContent = 'Select and copy the draft, then paste it into your email service. Nothing has been sent here.';
      }
    });
    // Keep controls unavailable until the submit guard is attached. With
    // JavaScript disabled, use the direct email links and noscript instructions.
    form.hidden = false;
  });
})();
