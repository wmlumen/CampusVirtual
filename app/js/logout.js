/**
 * logout.js — Función centralizada de cierre de sesión
 * Cierra la sesión de forma segura revocando el token en backend y limpiando el almacenamiento.
 * 
 * Uso: onclick="centuriaLogout()" o centuriaLogout(true) con confirmación
 */
function centuriaLogout(confirmar) {
    if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

    try {
        if (window.CenturiaAPI && typeof CenturiaAPI.logout === 'function') {
            CenturiaAPI.logout();
        }
    } catch (e) {}

    // Limpiar toda la sesión y tokens
    try { sessionStorage.clear(); } catch (e) {}
    try {
        localStorage.removeItem('centuria_auth_token');
        localStorage.removeItem('centuria_token');
        localStorage.removeItem('centuria_user');
        localStorage.removeItem('centuria_cedula');
        localStorage.removeItem('centuria_nombre');
        localStorage.removeItem('centuria_apellido');
        localStorage.removeItem('centuria_rol');
        localStorage.removeItem('centuria_carrera');
        localStorage.removeItem('centuria_filial');
        localStorage.removeItem('centuria_remember'); // no guardar contraseñas
    } catch (e) {}

    // Redirigir al index sin dejar historial
    let dest = 'index.html';
    try {
        if (typeof appUrl === 'function') {
            dest = appUrl('index.html');
        } else {
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
            dest = new URL(prefix + 'index.html', document.baseURI).href;
        }
    } catch (e) {}

    window.location.replace(dest);
}

// Objeto usado por los dashboards nuevos (dashboard-admin.html): CenturiaLogout.salir()
window.CenturiaLogout = window.CenturiaLogout || {
    salir: function (confirmar) {
        if (typeof centuriaLogout === 'function') {
            centuriaLogout(confirmar !== false);
        } else {
            try { sessionStorage.clear(); } catch (e) {}
            try {
                localStorage.removeItem('centuria_auth_token');
                localStorage.removeItem('centuria_user');
            } catch (e) {}
            window.location.replace('index.html');
        }
    },
    logout: function () { this.salir(true); }
};
