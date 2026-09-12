
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if(toggle && nav){
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }
})();


/* RSI · CONTACTO DIRECTO POR WHATSAPP
   Fase provisional sin backend/correo: botón flotante global. */
(() => {
  if (document.querySelector('.whatsapp-float')) return;
  const a = document.createElement('a');
  a.className = 'whatsapp-float';
  a.href = 'https://wa.me/34651518570?text=' + encodeURIComponent('Hola, contacto desde renersi.es. Quisiera solicitar información sobre un trabajo.');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'Contactar con RSI por WhatsApp');
  a.innerHTML = '<span aria-hidden="true">WA</span><strong>WhatsApp</strong>';
  document.body.appendChild(a);
})();
