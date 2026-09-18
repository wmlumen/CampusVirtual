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
            const i = location.pathname.indexOf('/app/');
            const base = i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
            dest = base + 'index.html';
        }
    } catch (e) {}

    window.location.replace(dest);
}
