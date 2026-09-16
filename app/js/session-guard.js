(function () {
    'use strict';

    // Sin cédulas fijas: el rol lo define el login (primario del servidor o rol elegido).
    const cedula = sessionStorage.getItem('current_cedula');

    window.CenturiaAccess = Object.freeze({
        isAuthenticated: () => Boolean(sessionStorage.getItem('current_cedula')),
        isGeneralAdmin: () => sessionStorage.getItem('admin_general') === 'true',
        canAccess: () => Boolean(sessionStorage.getItem('current_cedula')),
        getRol: () => sessionStorage.getItem('rol') || '',
        getCedula: () => cedula || ''
    });
})();
