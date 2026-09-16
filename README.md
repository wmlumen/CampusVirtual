# Campus Virtual

> Sistema académico digital con roles múltiples, panel administrativo y respaldo en la nube.

Portal web académico con sistema multi-roles, panel administrativo, dashboards por rol, formularios de matrícula, asistencia, calendario y gestión de asignaturas.

---

## Funciones principales

- Login con autenticación por cédula y contraseña institucional
- Sistema multi-roles (Alumno, Docente, Académico, Administrador)
- Panel administrativo con gestión de usuarios, catálogos y reportes
- Dashboard adaptativo según el rol del usuario
- Formulario de matrícula con guardado en base de datos
- Sistema de asistencia con códigos únicos por evento
- Calendario académico con detección de conflictos
- Gestión de asignaturas y docentes
- Calificaciones y planilla de avance por unidad
- Exámenes dinámicos con banco de preguntas
- Tablero de tesorería con facturas
- Sincronización con Google Sheets como respaldo

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript, Alpine.js, Tailwind CSS, Bootstrap 5 |
| Backend | PHP 7.4+, SQLite 3 |
| Respaldos | Google Apps Script, Google Sheets |
| Despliegue | GitHub Actions, GitHub Pages |

## Requisitos mínimos

- PHP 7.4 o superior con extensiones `pdo_sqlite`, `json`, `mbstring`
- Git
- Navegador web moderno

## Descarga y ejecución

```bash
git clone https://github.com/wmlumen/CampusVirtual.git
cd CampusVirtual
```

En Windows, ejecutar:

```text
iniciar.bat
```

O manualmente:

```bash
php -S 0.0.0.0:8080 -t . index.php
```

Abrir en el navegador: `http://localhost:8080`

## Almacenamiento temporal

Google Sheets funciona como base de datos accesible por internet mientras no se disponga de un servidor web permanente. SQLite mantiene una copia local completa en la PC. Ambas fuentes utilizan UUID, fechas de actualización y control de sincronización. La arquitectura está preparada para migrar a un servidor PHP sin rehacer el frontend.

## Estructura principal

```text
CampusVirtual/
├── index.php              ← Router principal
├── iniciar.bat            ← Inicio del servidor
├── app/                   ← Frontend (páginas, estilos, scripts)
│   ├── index.html         ← Login
│   ├── dashboard.html     ← Dashboard por rol
│   ├── perfil.html        ← Perfil de usuario
│   ├── formulario-matricula.html ← Formulario de matrícula
│   ├── tesoreria.html     ← Tablero de tesorería
│   ├── admin/             ← Panel administrativo
│   ├── academic/          ← Módulos académicos
│   ├── Formatos/          ← Formatos del docente
│   ├── Materiales_Clases/ ← Contenido de clases
│   ├── js/                ← Scripts compartidos
│   └── css/               ← Estilos compartidos
├── api/                   ← Backend PHP
│   ├── config.php         ← Configuración general
│   ├── db.php             ← Esquema SQLite
│   ├── auth.php           ← Autenticación
│   ├── usuarios.php       ← Gestión de usuarios
│   ├── matriculaciones.php ← Formulario de matrícula
│   ├── attendance.php     ← Asistencia
│   ├── calendar.php       ← Calendario
│   └── ...                ← Otros endpoints
└── Backend_Scripts/       ← Google Apps Script
```

## Estado actual

El sistema cuenta con autenticación, roles múltiples, panel administrativo, dashboards, formularios de matrícula, asistencia, calendario, tesorería y gestión de asignaturas. El frontend está desplegado en GitHub Pages. El backend PHP requiere un servidor local o futuro alojamiento web.

## GitHub Pages

GitHub Pages publica únicamente el frontend (archivos HTML, CSS y JS). Las funciones que dependen de PHP (login, base de datos, APIs) requieren un servidor local con PHP. Para usar el sistema completo, ejecutar el servidor local con `iniciar.bat`.

## Documentación técnica

La documentación técnica completa se encuentra en:

- `app/docs/PROMPT_MAESTRO.md` — Arquitectura, APIs, base de datos, sincronización, roadmap
- `app/docs/prompt_maestro_materiales.md` — Guía de generación de materiales de clase

---

Creado por **wmlumen@gmail.com** © 2026
