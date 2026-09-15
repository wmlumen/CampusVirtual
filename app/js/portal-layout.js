'use strict';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.portal-layout').forEach(layout => {
        const menu = layout.querySelector('.sidebar');
        const toggle = layout.querySelector('.portal-menu-toggle');
        if (!menu || !toggle) return;

        const setExpanded = expanded => {
            menu.hidden = !expanded;
            layout.classList.toggle('menu-hidden', !expanded);
            toggle.setAttribute('aria-expanded', String(expanded));
            const label = expanded ? 'Ocultar menú de unidades' : 'Mostrar menú de unidades';
            toggle.setAttribute('aria-label', label);
            toggle.title = label;
            toggle.textContent = expanded ? '‹' : '›';
        };

        setExpanded(true);
        toggle.addEventListener('click', () => setExpanded(menu.hidden));
    });
});
