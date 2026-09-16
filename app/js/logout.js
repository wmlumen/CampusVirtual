/**
 * logout.js — Función centralizada de cierre de sesión
 * Cierra la sesión únicamente cuando el usuario pulsa Salir.
 * 
 * Uso: onclick="centuriaLogout()" o al cargar la página
 */
function centuriaLogout(confirmar) {
    if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

    const token = localStorage.getItem('centuria_auth_token') || sessionStorage.getItem('token');

    // Raíz de la app (funciona en /app/, subcarpetas y GitHub /CampusVirtual/app/)
    let appRoot = './';
    try {
        const i = location.pathname.indexOf('/app/');
        appRoot = i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
    } catch (e) {}

    // Intentar cerrar la sesión del servidor antes de eliminar el token local.
    if (token) {
        let logoutUrl = appRoot + 'api/auth.php?action=logout';
        try {
            if (window.CenturiaAPI && CenturiaAPI.baseUrl) logoutUrl = CenturiaAPI.baseUrl + 'auth.php?action=logout';
        } catch (e) {}
        fetch(logoutUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    }

    // Limpiar sesión
    sessionStorage.clear();
    localStorage.removeItem('centuria_remember');
    localStorage.removeItem('centuria_token');
    localStorage.removeItem('centuria_auth_token');
    localStorage.removeItem('centuria_user');

    // Redirigir al index (replace para evitar botón "atrás")
    try {
        window.location.replace((typeof appUrl === 'function') ? appUrl('index.html') : (appRoot + 'index.html'));
    } catch (e) {
        window.location.replace(appRoot + 'index.html');
    }
}
