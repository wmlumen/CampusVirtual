(function () {
    'use strict';

    const ADMIN_GENERAL_CEDULA = '1340130';
    const cedula = sessionStorage.getItem('current_cedula');

    if (cedula === ADMIN_GENERAL_CEDULA) {
        sessionStorage.setItem('rol', 'admin');
        sessionStorage.setItem('admin_general', 'true');
        document.documentElement.dataset.adminGeneral = 'true';
    }

    window.CenturiaAccess = Object.freeze({
        isAuthenticated: () => Boolean(sessionStorage.getItem('current_cedula')),
        isGeneralAdmin: () => sessionStorage.getItem('current_cedula') === ADMIN_GENERAL_CEDULA,
        canAccess: () => Boolean(sessionStorage.getItem('current_cedula'))
    });
})();
