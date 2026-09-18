# Campus Virtual Centuria

> Plataforma de Gestión de Aprendizaje (LMS Propio y Autónomo) optimizada para ejecución 100% estática en **GitHub Pages** con persistencia en **Infraestructura Cloud Serverless**.

**Instituto Superior Centuria**  
*“Formando líderes con tecnología y excelencia”*  
Copyright © 2026. Todos los derechos reservados.

---

## 🌐 Acceso a la Plataforma en Vivo

* **URL de Producción (GitHub Pages)**: [https://wmlumen.github.io/CampusVirtual/](https://wmlumen.github.io/CampusVirtual/)
* **Punto de Entrada Principal**: [`app/index.html`](app/index.html)
* **Punto de Redirección Raíz**: [`index.html`](index.html)

---

## 🚀 Características y Funcionalidades Principales

- **Autenticación y Registro Seguro**:
  - Registro de estudiantes y docentes con contraseña secreta individual (mínimo 6 caracteres).
  - Criptografía robusta: hasheo mediante **SHA-256** acoplado a un **Salt aleatorio único** por usuario.
  - Cero exposición: nunca se almacenan contraseñas en texto plano en almacenamiento local ni se transmiten sin protección.
  - Sesiones seguras: tokens criptográficos con tiempo de vida (TTL) de 8 horas y revocación inmediata al cerrar sesión.
- **Control de Acceso Basado en Roles (RBAC)**:
  - Guardián de sesiones universal ([`app/js/session-guard.js`](app/js/session-guard.js)) que valida permisos antes de renderizar cada vista.
  - Entornos aislados y protegidos para **Alumnos**, **Docentes**, **Coordinación Académica** y **Administradores**.
  - Prevención activa contra manipulación de roles en almacenamiento del navegador.
- **Gestión Académica Integral**:
  - **Libreta Digital de Calificaciones**: Visualización por períodos, materias, módulos y promedios en tiempo real.
  - **Registro de Asistencia Inteligente**: Validación mediante códigos temporales de sesión por geolocalización o presencial.
  - **Calendario Académico Dinámico**: Visualización de eventos, exámenes y clases con detección de conflictos horarios.
  - **Constructor y Editor Curricular**: Módulo interactivo para estructuración de programas, unidades didácticas y evaluaciones.
- **Materiales Didácticos y Contenidos**:
  - Catálogo interactivo de asignaturas alojado en [`app/Materiales_Clases/`](app/Materiales_Clases/).
  - Evaluaciones automáticas y simuladores de examen en línea.
- **Gestión de Trámites y Tesorería**:
  - Formulario de inscripción y rematriculación estudiantil en línea.
  - Registro y conciliación de aranceles, cuotas, comprobantes y números de factura.
- **Arquitectura 100% Serverless**:
  - Cero servidores web dedicados requeridos (sin Apache, sin Nginx, sin Node.js en producción).
  - Cero dependencias de bases de datos locales o motores de servidor.
  - Despliegue continuo y automático directo a la CDN global de **GitHub Pages**.

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnología | Descripción |
|---|---|---|
| **Frontend Estático** | HTML5, CSS3, JavaScript (ES6+), Alpine.js, Tailwind CSS, Bootstrap 5 | Interfaz moderna, responsiva, accesible y reactiva sin necesidad de empaquetador. |
| **Tipografía e Iconografía** | Montserrat (vía Bunny Fonts CDN privado), Bootstrap Icons | Identidad visual corporativa de alta legibilidad y componentes vectoriales. |
| **Capa de Abstracción API** | `app/js/api.js` (CenturiaAPI v12), `app/js/session-guard.js` | Conector universal asíncrono para consumo de endpoints serverless en la nube. |
| **Backend Cloud Serverless** | Web App Cloud Serverless ([`app/Backend_Scripts/01_Script_Cloud_Completo.gs`](app/Backend_Scripts/01_Script_Cloud_Completo.gs)) | API REST en la nube con `LockService` para control de concurrencia y hashing criptográfico. |
| **Base de Datos Cloud** | Base de Datos Cloud (`BasedeDatosCampus`) | Persistencia estructurada de usuarios, sesiones, calificaciones, pagos y matrículas. |
| **Almacenamiento Multimedia** | Almacenamiento Cloud Seguro | Almacenamiento institucional de fotos de perfil y respaldos documentales. |
| **Alojamiento y Despliegue** | GitHub Actions, GitHub Pages (HTTPS) | Distribución global estática de alta disponibilidad y tolerancia a fallos. |

---

## 📂 Estructura del Proyecto

```text
CampusVirtual/
├── index.html                   # Redirección estática raíz hacia app/index.html
├── iniciar.bat                  # Lanzador rápido en Windows (servidor local estático)
├── iniciar.ps1                  # Lanzador PowerShell (servidor local estático)
├── LICENSE                      # Licencia MIT institucional (Instituto Superior Centuria)
├── DERECHOS_DE_AUTOR.md         # Declaración de autoría, propiedad intelectual y alcance
├── THIRD_PARTY_LICENSES.md      # Registro y licencias de dependencias externas abiertas
├── README.md                    # Documentación principal del sistema
│
├── app/                         # Frontend estático desplegado en GitHub Pages
│   ├── index.html               # Portal de bienvenida, autenticación y registro
│   ├── dashboard.html           # Panel principal adaptativo según el rol
│   ├── perfil.html              # Consulta y actualización de datos de contacto
│   ├── docente.html             # Entorno de gestión y solicitudes del docente
│   ├── libreta.html             # Consulta de calificaciones del estudiante
│   ├── attendance.html          # Registro y verificación de asistencias por código
│   ├── calendario.html          # Calendario de clases, eventos y exámenes
│   ├── tesoreria.html           # Registro y control de pagos y aranceles
│   ├── formulario-matricula.html# Formulario de matriculación de estudiantes
│   ├── habilitar_asig.html      # Gestión de kits y habilitación de materias
│   ├── salud.html               # Monitor de estado de servicios y conexión cloud
│   │
│   ├── admin/                   # Panel de control para administradores
│   │   ├── index.html           # Dashboard del administrador
│   │   ├── sync_sheets.html     # Sincronización y diagnóstico de base de datos
│   │   ├── upload_alumnos.html  # Carga masiva de alumnos
│   │   ├── js/admin.js          # Lógica reactiva del administrador (Alpine.js)
│   │   └── sections/            # Componentes modulares (usuarios, asignaturas, etc.)
│   │
│   ├── academic/                # Módulos y herramientas curriculares
│   │   ├── examen_virtual.html  # Evaluaciones dinámicas
│   │   ├── examen_virtual_completo.html # Examen virtual con banco de ítems
│   │   ├── autoevaluacion_secuencial.html # Pruebas formativas guiadas
│   │   ├── asistencia_presencial.html   # Registro presencial rápido
│   │   ├── panel_docente_analytics.html # Analítica académica
│   │   └── glosario.html        # Diccionario terminológico
│   │
│   ├── constructor/             # Constructor y editor de programas curriculares
│   │   └── index.html
│   │
│   ├── js/                      # Bibliotecas y controladores del cliente
│   │   ├── api.js               # Cliente API centralizado (CenturiaAPI v12)
│   │   ├── session-guard.js     # Validador y guardián de sesiones RBAC
│   │   ├── logout.js            # Manejador seguro de cierre de sesión
│   │   └── teacher-registration.js # Controlador para altas docentes
│   │
│   ├── css/                     # Estilos visuales institucionales
│   │   └── prompt_unificado.css
│   │
│   ├── Materiales_Clases/       # Contenidos educativos y materias curriculares (PRESERVADOS)
│   │
│   └── Backend_Scripts/         # Código fuente de los controladores serverless
│       ├── 01_Script_Cloud_Completo.gs # Script de producción para backend cloud
│       └── LEER_INSTRUCCIONES.md# Guía de publicación y actualización del backend
│
└── tests/                       # Banco de pruebas automatizadas
    ├── auth_suite.test.cjs      # Suite de 20 casos de seguridad, auth y RBAC
    └── check_repo.cjs           # Auditoría de integridad estática del repositorio
```

---

## 💻 Requisitos y Ejecución Local

### Requisitos Mínimos
- **Navegador web moderno**: Chrome, Edge, Firefox, Safari u Opera con soporte JavaScript (ES6+).
- **Conexión a Internet**: Para interactuar con la Base de Datos Cloud en tiempo real.
- **Python 3** (opcional): Solo necesario si se desea levantar un servidor HTTP local en desarrollo.

### Instrucciones de Ejecución
1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/wmlumen/CampusVirtual.git
   cd CampusVirtual
   ```

2. **Ejecutar en entorno local**:
   - **En Windows**: Haz doble clic en `iniciar.bat` o ejecuta en PowerShell:
     ```powershell
     .\iniciar.ps1
     ```
     Esto levantará automáticamente el servidor estático local en `http://127.0.0.1:8080` y abrirá tu navegador.
   - **En Linux / macOS / Terminal**:
     ```bash
     python -m http.server 8080 --bind 127.0.0.1
     ```
     Luego ingresa a `http://127.0.0.1:8080` en tu navegador.
   - **Acceso directo**: También puedes abrir el archivo `index.html` directamente en tu navegador favorito.

---

## 🧪 Verificación y Pruebas Automatizadas (QA)

El proyecto cuenta con un entorno de verificación automatizada que valida la integridad de cada módulo antes de cualquier despliegue:

```bash
# 1. Auditoría estática: verifica cero dependencias residuales, coherencia de scripts y rutas
node tests/check_repo.cjs

# 2. Suite de seguridad y autenticación: valida los 20 flujos críticos de usuario y RBAC
node tests/auth_suite.test.cjs
```

### Cobertura de la Suite de Pruebas:
- **Casos 1 al 7**: Registro válido con salt y hash, rechazo de campos incompletos, validación de cédulas, formato de emails, fortaleza de contraseñas y detección de duplicados.
- **Casos 8 al 11**: Login exitoso con emisión de token, bloqueo ante contraseñas incorrectas, usuarios inexistentes y cuentas inactivas.
- **Casos 12 y 13**: Revocación de tokens en backend al cerrar sesión y vencimiento estricto tras 8 horas.
- **Casos 14 al 16**: Protección de rutas RBAC, bloqueo contra escalada de privilegios y persistencia de sesión segura tras recargas de página.
- **Casos 17 y 18**: Integridad de perfiles de usuario y actualización segura sin sobreescritura de datos curriculares.
- **Casos 19 y 20**: Tolerancia a fallas de conexión con mensajes amigables y almacenamiento protegido en el cliente.

---

## 📜 Propiedad Intelectual, Licenciamiento y Ética Tecnológica

- **Desarrollo Institucional**: El Campus Virtual Centuria es una creación del **Instituto Superior Centuria**, diseñado para proporcionar una experiencia de aprendizaje de nivel superior.
- **Licencia**: Distribuido bajo los términos de la **Licencia MIT**. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.
- **Declaración de Autoría**: Los alcances de autoría y las declaraciones de independencia técnica respecto a plataformas de terceros se encuentran formalizados en [`DERECHOS_DE_AUTOR.md`](DERECHOS_DE_AUTOR.md).
- **Atribución de Terceros**: Las bibliotecas de libre distribución integradas vía CDN conservan intactos sus avisos de licencia en [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

---

**Instituto Superior Centuria** · *“Formando líderes con tecnología y excelencia”*  
Asunción, Paraguay · 2026
