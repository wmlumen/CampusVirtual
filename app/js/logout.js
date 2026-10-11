/**
 * logout.js — Función centralizada de cierre de sesión
 * Cierra la sesión de Firebase Auth, limpia el almacenamiento y vuelve al inicio.
 * v2026-10-11: espera a que termine el cierre en Firebase antes de redirigir (antes la redirección lo cortaba
 * y la sesión quedaba guardada en el navegador) y borra también los datos personales guardados por el login.
 *
 * Uso: onclick="centuriaLogout()" o centuriaLogout(true) con confirmación
 */
function centuriaLogoutDestino() {
    try {
        if (typeof appUrl === 'function') return appUrl('index.html');
        // Sin api.js (p. ej. falló al cargar): la ruta a la raíz se deduce de este mismo <script src="../js/logout.js">,
        // igual que hace api.js; así "Salir" vuelve al inicio desde cualquier subcarpeta (academic/, admin/...).
        let prefix = null;
        const scripts = document.getElementsByTagName('script');
        for (let k = 0; k < scripts.length; k++) {
            const m = (scripts[k].getAttribute('src') || '').match(/^((?:\.\.\/)*)js\/logout\.js/);
            if (m) { prefix = m[1] || './'; break; }
        }
        if (prefix === null) {
            const i = location.pathname.indexOf('/app/');
            prefix = i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
        }
        return new URL(prefix + 'index.html', document.baseURI).href;
    } catch (e) { return 'index.html'; }
}

function centuriaLogout(confirmar) {
    if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    const dest = centuriaLogoutDestino();
    let cierre = null;
    try {
        if (window.CenturiaAPI && typeof CenturiaAPI.logout === 'function') cierre = CenturiaAPI.logout();
    } catch (e) {}
    if (!cierre || typeof cierre.then !== 'function') {
        // Sin api.js: se limpia igual la sesión local.
        try { sessionStorage.clear(); } catch (e) {}
        try {
            const conservar = ['centuria_dark', 'centuria_remember_cedula', 'centuria_custom_evals', 'tic026_dispositivo_id'];
            Object.keys(localStorage).forEach(function (k) {
                if ((k.indexOf('centuria_') === 0 || k === 'token') && conservar.indexOf(k) < 0) localStorage.removeItem(k);
            });
        } catch (e) {}
        cierre = Promise.resolve();
    }
    // Redirigir al inicio sin dejar historial, cuando el cierre terminó (o falló).
    cierre.then(function () { window.location.replace(dest); }, function () { window.location.replace(dest); });
}

// Objeto usado por los dashboards nuevos (dashboard-admin.html): CenturiaLogout.salir()
window.CenturiaLogout = {
    salir: function (confirmar) { centuriaLogout(confirmar !== false); },
    logout: function () { this.salir(true); }
};
