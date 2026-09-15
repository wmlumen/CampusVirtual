# Campus Virtual Centuria

> **Instituto Superior Centuria** — Sistema Académico Digital v2.0

Portal web académico completo con sistema multi-roles, panel administrativo SPA, dashboards adaptativos por rol y despliegue en GitHub Pages.

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Desplegado-brightgreen)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple)
![SQLite](https://img.shields.io/badge/SQLite-3-blue)
![Alpine.js](https://img.shields.io/badge/Alpine.js-v3-yellow)

---

## Características Principales

- **Sistema Multi-Roles:** Una misma cédula puede tener múltiples roles (Alumno, Docente, Académico, Administrador, etc.)
- **Panel Administrativo SPA:** Carga dinámica de secciones con Alpine.js
- **Dashboards Adaptativos:** Vistas personalizadas según el rol del usuario
- **Formularios de Registro:** Carga dinámica de grados, carreras y secciones desde la base de datos
- **Gestión de Filiales:** CRUD completo de sedes con asignación de administradores
- **Sistema de Aprobación:** Cola de usuarios pendientes con flujo de aprobación/rechazo
- **Login Premium:** Diseño glassmorphism con autenticación de 2 fases
- **Responsive:** Diseño 2 columnas (PC) / 1 columna (móvil)
- **Impresión:** Formatos optimizados para impresión (@media print)

---

## Estructura del Proyecto

```
CampusVirtual/
├── index.php                              ← Router principal
├── iniciar.bat / iniciar.ps1              ← Scripts de inicio
├── .github/workflows/deploy-pages.yml     ← GitHub Actions (Pages)
│
├── app/
│   ├── index.html                         ← Login premium (glassmorphism)
│   ├── dashboard.html                     ← Dashboard adaptativo por rol
│   ├── docente.html                       ← Perfil docente (todos los formatos)
│   ├── perfil.html                        ← Perfil de usuario
│   ├── libreta.html                       ← Libreta de calificaciones
│   │
│   ├── images/                            ← Logo Centuria (PNG)
│   ├── favicon_io/                        ← Favicon package
│   │
│   ├── js/
│   │   ├── api.js                         ← Cliente API (CenturiaAPI)
│   │   ├── centuria-plugins.js            ← Alpine.js plugins
│   │   ├── marcar_leido.js                ← Marcar lecciones leídas
│   │   └── view-as-admin.js               ← Botón "Volver al Admin"
│   │
│   ├── admin/
│   │   ├── index.html                     ← Panel admin (SPA shell)
│   │   ├── js/admin.js                    ← Lógica admin (Alpine.js)
│   │   └── sections/
│   │       ├── usuarios.html              ← Gestión usuarios + roles + filiales
│   │       ├── catalogos.html             ← CRUD catálogos
│   │       ├── reportes.html              ← Dashboard analítico
│   │       ├── config.html                ← Configuración sistema
│   │       └── vistas.html                ← Vista previa por rol
│   │
│   ├── Formatos/                          ← Formatos del docente
│   │   ├── teacher_panel.html             ← Panel docente
│   │   ├── planilla.html                  ← Planilla calificaciones
│   │   ├── plan_clases.html               ← Planificación docente
│   │   ├── registro_clases.html           ← Registro de clases
│   │   ├── acta.html                      ← Acta de calificaciones
│   │   └── documentos.html                ← Documentos del docente
│   │
│   ├── academic/                          ← Módulos académicos
│   │   ├── asistencia_presencial.html
│   │   ├── autoevaluacion_secuencial.html
│   │   ├── criterios_evaluacion.html
│   │   ├── examen_final_escrito.html
│   │   ├── examen_final_virtual.html
│   │   ├── examen_parcial1.html
│   │   ├── examen_parcial2.html
│   │   ├── examen_virtual.html
│   │   ├── glosario.html
│   │   ├── indicadores_por_unidad.html
│   │   └── monografia.html
│   │
│   └── Materiales_Clases/                 ← Contenido de clases
│       ├── index.html
│       ├── programa.html
│       └── Unidad_01.html ... Unidad_10.html
│
├── api/
│   ├── config.php                         ← CORS, JWT, helpers
│   ├── db.php                             ← SQLite schema completo
│   ├── centuria.db                        ← Base de datos SQLite
│   ├── auth.php                           ← Login, register, validate, logout
│   ├── usuarios.php                       ← CRUD usuarios + multi-roles
│   ├── roles.php                          ← Catálogo de roles con permisos
│   ├── catalogos.php                      ← CRUD catálogos académicos
│   ├── filiales.php                       ← CRUD filiales/sedes
│   ├── admin.php                          ← Admin legacy
│   ├── secciones.php                      ← Secciones académicas
│   ├── courses.php                        ← CRUD cursos
│   ├── grades.php                         ← Calificaciones
│   ├── attendance.php                     ← Asistencia
│   ├── calendar.php                       ← Eventos calendario
│   ├── documentos.php                     ← Documentos docente
│   └── upload.php                         ← Importación CSV
│
└── Backend_Scripts/
    └── 01_Script_Google_Completo.gs       ← Google Apps Script (backup)
```

---

## Base de Datos

### Tablas Principales

| Tabla | Descripción |
|:------|:------------|
| `users` | Usuarios principales (cédula, nombre, rol, carrera, sección) |
| `user_roles` | Multi-rol por usuario (rol, carrera, sección, asignatura, filial) |
| `roles_config` | Catálogo de roles con permisos JSON |
| `filiales` | Sedes/filiales del instituto |
| `usuarios_pendientes` | Cola de aprobación para nuevos registros |
| `courses` | Cursos registrados |
| `grades` | Calificaciones de alumnos |
| `attendance` | Registro de asistencia |
| `calendar` | Eventos del calendario |
| `documentos` | Documentos del docente |
| `catalogo_*` | Catálogos: grados, carreras, secciones, programas, modalidades |

### Datos Sembrados

- **9 roles:** Administrador General, Administrador de Plataforma, Alumno, Docente, Administrador, Acceso Académico, Acceso Administrativo, Acceso Documental, Acceso Tesorería
- **5 filiales:** Sede Central (SC), Norte (FN), Sur (FS), Este (FE), Oeste (FO)
- **2 usuarios demo:** Admin (`1340130`/`Ck1340130*`) y Docente (`1340125`/`Nk1340125*`)

---

## APIs REST

### Base URL
```
Local:    http://127.0.0.1:8080/api/
Producción: https://wmlumen.github.io/CampusVirtual/api/
```

### Endpoints Principales

| Archivo | Métodos | Descripción |
|:--------|:--------|:------------|
| `auth.php` | login, register, validate, logout, find_user | Autenticación |
| `usuarios.php` | list, pendientes, get, update, aprobar, rechazar, add_role, remove_role | Gestión usuarios |
| `roles.php` | list, create, update, delete | Catálogo de roles |
| `catalogos.php` | list, create, update, delete | Catálogos académicos |
| `filiales.php` | list, create, toggle, delete, assign-admin, admins-by-filial | Filiales |
| `courses.php` | CRUD completo | Cursos |
| `grades.php` | CRUD completo | Calificaciones |
| `attendance.php` | mark, list | Asistencia |
| `calendar.php` | CRUD completo | Eventos |

---

## Usuarios Demo

| Cédula | Nombre | Contraseña | Rol |
|:-------|:-------|:-----------|:----|
| `1340130` | Christhian Keim | `Ck1340130*` | Administrador |
| `1340125` | Natalie Keim | `Nk1340125*` | Docente |

**Regla de contraseñas:** Primera letra Nombre (Mayús) + primera letra Apellido (minús) + cédula(sin puntos) + `*`

---

## Instalación y Ejecución

### Requisitos
- PHP 7.4+ con extensiones: `pdo_sqlite`, `json`, `mbstring`
- Git

### Inicio del Servidor

```bash
# Clonar el repositorio
git clone https://github.com/wmlumen/CampusVirtual.git
cd CampusVirtual

# Iniciar servidor (Windows)
iniciar.bat

# O manualmente
php -S 0.0.0.0:8080 -t . index.php

# Abrir en navegador
# http://localhost:8080
```

### Despliegue GitHub Pages
El sitio se despliega automáticamente vía GitHub Actions al hacer push a la rama `main`.

**URL:** https://wmlumen.github.io/CampusVirtual/

---

## Paleta Institucional

| Variable | Valor | Uso |
|:---------|:------|:----|
| `--verde-oscuro` | `#007A33` | Verde principal |
| `--verde-medio` | `#00B140` | Botones/links |
| `--verde-claro` | `#E6F4EA` | Fondos suaves |
| `--dorado` | `#C5A55A` | Labels premium |
| `--texto-oscuro` | `#2D2D2D` | Texto principal |

---

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript, Alpine.js v3, Tailwind CSS, Bootstrap 5
- **Backend:** PHP 7.4+, SQLite 3
- ** Herramientas:** Google Apps Script, GitHub Actions, GitHub Pages
- **Fuentes:** Google Fonts (Montserrat), Bootstrap Icons

---

## Licencia

Instituto Superior Centuria © 2026 — Sistema Académico Digital v2.0
