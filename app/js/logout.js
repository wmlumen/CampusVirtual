/**
 * logout.js — Función centralizada de cierre de sesión
 * Cierra la sesión únicamente cuando el usuario pulsa Salir.
 * 
 * Uso: onclick="centuriaLogout()" o al cargar la página
 */
function centuriaLogout(confirmar) {
    if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

    const token = localStorage.getItem('centuria_auth_token') || sessionStorage.getItem('token');

    // Intentar cerrar la sesión del servidor antes de eliminar el token local.
    if (token) {
        fetch('/api/auth.php?action=logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        }).catch(() => {});
    }

    // Limpiar sesión
    sessionStorage.clear();
    localStorage.removeItem('centuria_remember');
    localStorage.removeItem('centuria_token');
    localStorage.removeItem('centuria_auth_token');
    localStorage.removeItem('centuria_user');

    // Redirigir al index (replace para evitar botón "atrás")
    window.location.replace('/index.html');
}
