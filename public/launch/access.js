(() => {
  const password = document.getElementById('password');
  const toggle = document.getElementById('toggle-password');
  if (password && toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const visible = password.type === 'password';
      password.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(visible));
      const label = visible ? 'Ascunde parola' : 'Arată parola';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
      toggle.querySelector('img').src = visible ? '/launch/eye-off.svg' : '/launch/eye.svg';
    });
  }
  document.getElementById('access-form')?.addEventListener('submit', event => {
    event.target.querySelector('button[type="submit"]').disabled = true;
  });
  window.addEventListener('pageshow', () => {
    const submit = document.querySelector('button[type="submit"]');
    if (submit) submit.disabled = false;
    if (password) password.value = '';
  });
})();
