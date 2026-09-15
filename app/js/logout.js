/**
 * logout.js — Función centralizada de cierre de sesión
 * Limpia sessionStorage, localStorage y redirige al index
 * 
 * Uso: onclick="centuriaLogout()" o al cargar la página
 */
function centuriaLogout(confirmar) {
    if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    
    // Limpiar sesión
    sessionStorage.clear();
    localStorage.removeItem('centuria_remember');
    localStorage.removeItem('centuria_token');
    
    // Intentar cerrar sesión en API (fire-and-forget)
    try {
        const token = sessionStorage.getItem('token');
        if (token) {
            fetch('api/auth.php?action=logout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            }).catch(() => {});
        }
    } catch(e) {}
    
    // Redirigir al index (replace para evitar botón "atrás")
    window.location.replace('index.html');
}

// Cerrar sesión al cerrar pestaña/navegador (opcional)
window.addEventListener('beforeunload', function(e) {
    // Solo limpiar si hay sesión activa
    if (sessionStorage.getItem('current_cedula')) {
        sessionStorage.clear();
    }
});
