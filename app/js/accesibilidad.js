/* ============================================================
   ACCESIBILIDAD - Campus Virtual Centuria
   Panel de configuración visual + Alto contraste
   Versión: 1.0
   ============================================================ */

(function() {
  'use strict';

  // ── Configuración por defecto ──
  const DEFAULTS = {
    fontSize: 100,        // porcentaje (100 = normal)
    highContrast: false
  };

  const STORAGE_KEY = 'acenturia_accesibilidad';
  const MIN_FONT = 80;
  const MAX_FONT = 150;
  const FONT_STEP = 10;

  // ── Estado actual ──
  let settings = loadSettings();

  // ── Cargar preferencias ──
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fontSize: parsed.fontSize || DEFAULTS.fontSize,
          highContrast: parsed.highContrast || DEFAULTS.highContrast
        };
      }
    } catch (e) {
      // Si hay error, usar defaults
    }
    return { ...DEFAULTS };
  }

  // ── Guardar preferencias ──
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // Silently fail
    }
  }

  // ── Aplicar configuración visual ──
  function applySettings() {
    // Tamaño de fuente
    document.documentElement.style.fontSize = settings.fontSize + '%';

    // Alto contraste
    if (settings.highContrast) {
      document.documentElement.classList.add('alto-contraste');
      document.body.classList.add('alto-contraste');
    } else {
      document.documentElement.classList.remove('alto-contraste');
      document.body.classList.remove('alto-contraste');
    }

    // Actualizar display del panel si existe
    updatePanelDisplay();
  }

  // ── Actualizar display del panel ──
  function updatePanelDisplay() {
    const fontVal = document.getElementById('acenturia-font-val');
    const contrastBtn = document.getElementById('acenturia-contrast-btn');

    if (fontVal) {
      fontVal.textContent = settings.fontSize + '%';
    }
    if (contrastBtn) {
      if (settings.highContrast) {
        contrastBtn.textContent = 'ON';
        contrastBtn.classList.add('active');
      } else {
        contrastBtn.textContent = 'OFF';
        contrastBtn.classList.remove('active');
      }
    }
  }

  // ── Cambiar tamaño de fuente ──
  function changeFontSize(delta) {
    settings.fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, settings.fontSize + delta));
    saveSettings();
    applySettings();
  }

  // ── Alternar alto contraste ──
  function toggleHighContrast() {
    settings.highContrast = !settings.highContrast;
    saveSettings();
    applySettings();
  }

  // ── Restaurar valores por defecto ──
  function resetDefaults() {
    settings = { ...DEFAULTS };
    saveSettings();
    applySettings();
  }

  // ── Crear HTML del panel de configuración ──
  function createPanelHTML() {
    return `
      <div class="acenturia-settings-backdrop" id="acenturia-settings-backdrop"></div>
      <div class="acenturia-settings-box">
        <div class="acenturia-settings-header">
          <h6><i class="bi bi-universal-access me-2"></i>Configuración Visual</h6>
          <button type="button" class="btn-close" id="acenturia-settings-close" aria-label="Cerrar"></button>
        </div>
        <div class="acenturia-settings-body">
          <!-- Tamaño de fuente -->
          <div class="acenturia-setting-row">
            <span class="acenturia-label">Tamaño de texto</span>
            <div class="acenturia-controls">
              <button class="acenturia-btn-sm" id="acenturia-font-minus" title="Reducir texto">A−</button>
              <span class="acenturia-val" id="acenturia-font-val">${settings.fontSize}%</span>
              <button class="acenturia-btn-sm" id="acenturia-font-plus" title="Aumentar texto">A+</button>
            </div>
          </div>
          <!-- Alto contraste -->
          <div class="acenturia-setting-row">
            <span class="acenturia-label">Alto contraste</span>
            <div class="acenturia-controls">
              <button class="acenturia-btn-toggle ${settings.highContrast ? 'active' : ''}" id="acenturia-contrast-btn">
                ${settings.highContrast ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <!-- Restaurar -->
          <div class="acenturia-setting-row" style="border-bottom: none;">
            <button class="acenturia-btn-reset" id="acenturia-reset-btn">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar valores por defecto
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Crear botón de configuración ──
  function createSettingsButton() {
    const btn = document.createElement('button');
    btn.id = 'acenturia-settings-btn';
    btn.className = 'btn btn-outline-secondary btn-sm';
    btn.title = 'Configuración de accesibilidad';
    btn.innerHTML = '<i class="bi bi-gear-fill"></i>';
    btn.setAttribute('aria-label', 'Abrir configuración de accesibilidad');
    btn.setAttribute('data-bs-toggle', 'tooltip');
    btn.setAttribute('data-bs-placement', 'left');
    return btn;
  }

  // ── Crear panel de configuración ──
  function createPanel() {
    const existing = document.getElementById('acenturia-settings-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'acenturia-settings-panel';
    panel.innerHTML = createPanelHTML();
    document.body.appendChild(panel);

    // Event listeners del panel
    bindPanelEvents();
  }

  // ── Cerrar panel ──
  function closePanel() {
    const panel = document.getElementById('acenturia-settings-panel');
    if (panel) {
      panel.remove();
    }
  }

  // ── Vincular eventos del panel ──
  function bindPanelEvents() {
    // Cerrar
    const closeBtn = document.getElementById('acenturia-settings-close');
    const backdrop = document.getElementById('acenturia-settings-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);

    // Tamaño de fuente
    const fontMinus = document.getElementById('acenturia-font-minus');
    const fontPlus = document.getElementById('acenturia-font-plus');
    if (fontMinus) fontMinus.addEventListener('click', () => changeFontSize(-FONT_STEP));
    if (fontPlus) fontPlus.addEventListener('click', () => changeFontSize(FONT_STEP));

    // Alto contraste
    const contrastBtn = document.getElementById('acenturia-contrast-btn');
    if (contrastBtn) contrastBtn.addEventListener('click', toggleHighContrast);

    // Restaurar
    const resetBtn = document.getElementById('acenturia-reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetDefaults);

    // Tecla Escape para cerrar
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  // ── Insertar botón en la interfaz ──
  function insertSettingsButton() {
    // Buscar el botón de salir o la barra de navegación
    const logoutBtn = document.querySelector('#logout-btn, .logout-btn, [onclick*="logout"]');
    if (logoutBtn && logoutBtn.parentNode) {
      const btn = createSettingsButton();
      logoutBtn.parentNode.insertBefore(btn, logoutBtn);
      btn.addEventListener('click', createPanel);

      // Inicializar tooltip de Bootstrap si está disponible
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        new bootstrap.Tooltip(btn);
      }
    }
  }

  // ── Inicializar al cargar ──
  function init() {
    // Aplicar configuración guardada inmediatamente
    applySettings();

    // Insertar botón cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        insertSettingsButton();
      });
    } else {
      insertSettingsButton();
    }
  }

  // ── Ejecutar ──
  init();

})();
