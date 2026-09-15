<?php
/**
 * Database module for Centuria API
 * SQLite schema and connection utilities
 * 
 * Tables:
 * - users (id, username, password, firstname, lastname, email, course_id, role, created_at)
 * - courses (id, name, shortname, description, created_by, created_at)
 * - grades (id, user_id, course_id, component, score, max_score, created_at)
 * - attendance (id, user_id, course_id, date, status, created_at)
 * - calendar (id, title, description, start_date, end_date, all_day, created_by, created_at)
 * - sessions (id, token, user_id, expires, created_at)
 */

// Singleton database connection
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $dbPath = dirname(__FILE__) . '/../../../../CenturiaDB/centuria.db';
        // Normalize path for both development and production
        if (!file_exists($dbPath)) {
            $dbPath = dirname(__FILE__) . '/centuria.db';
        }
        if (!file_exists($dbPath)) {
            $dbPath = __DIR__ . '/centuria.db';
        }
        
        $this->pdo = new PDO("sqlite:$dbPath");
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec("PRAGMA journal_mode=WAL");
        $this->pdo->exec("PRAGMA foreign_keys=ON");
        $this->pdo->exec("PRAGMA encoding='UTF-8'");
        
        $this->create_tables();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getPdo() {
        return $this->pdo;
    }
    
    private function create_tables() {
        $schema = [
            // users table
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                email TEXT DEFAULT '',
                course_id INTEGER,
                role TEXT DEFAULT 'student',
                telefono TEXT DEFAULT '',
                grado TEXT DEFAULT '',
                carrera TEXT DEFAULT '',
                seccion TEXT DEFAULT '',
                foto TEXT DEFAULT '',
                estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo','pendiente','inactivo')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                uuid TEXT DEFAULT '',
                deleted_at DATETIME,
                sync_version INTEGER DEFAULT 1,
                sync_status TEXT DEFAULT 'sincronizado',
                FOREIGN KEY (course_id) REFERENCES courses(id)
            )",
            
            // courses table
            "CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                shortname TEXT UNIQUE NOT NULL,
                description TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )",
            
            // grades table
            "CREATE TABLE IF NOT EXISTS grades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                component VARCHAR(100) NOT NULL,
                score REAL DEFAULT 0,
                max_score REAL DEFAULT 100,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (course_id) REFERENCES courses(id)
            )",
            
            // attendance table
            "CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (course_id) REFERENCES courses(id),
                UNIQUE(user_id, course_id, date)
            )",
            
            // calendar table
            "CREATE TABLE IF NOT EXISTS calendar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                start_date DATETIME NOT NULL,
                end_date DATETIME,
                all_day BOOLEAN DEFAULT 0,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )",
            
            // documentos table (actas, planillas, registros y planes del docente)
            "CREATE TABLE IF NOT EXISTS documentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL CHECK (tipo IN ('acta', 'planilla', 'registro', 'plan')),
                curso TEXT DEFAULT '',
                periodo TEXT DEFAULT '',
                datos TEXT DEFAULT '{}',
                docente TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tipo, curso, periodo)
            )",

            // sessions table
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                expires DATETIME NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",

            // ═══ NUEVAS TABLAS: Perfil, Multi-roles, Roles ═══

            // user_roles: soporte multi-rol por usuario
            "CREATE TABLE IF NOT EXISTS user_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                rol TEXT NOT NULL,
                carrera TEXT DEFAULT '',
                seccion TEXT DEFAULT '',
                asignatura TEXT DEFAULT '',
                estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo','inactivo','pendiente')),
                asignado_por TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )",

            // roles_config: catálogo de roles con permisos JSON
            "CREATE TABLE IF NOT EXISTS roles_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                descripcion TEXT DEFAULT '',
                permisos TEXT DEFAULT '{}',
                color TEXT DEFAULT '#64748b',
                icono TEXT DEFAULT 'bi-person',
                activo INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",

            // usuarios_registrados: cola de aprobación para nuevos registros
            "CREATE TABLE IF NOT EXISTS usuarios_pendientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cedula TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                email TEXT DEFAULT '',
                telefono TEXT DEFAULT '',
                grado TEXT DEFAULT '',
                carrera TEXT DEFAULT '',
                seccion TEXT DEFAULT '',
                foto TEXT DEFAULT '',
                estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente','aprobado','rechazado')),
                observaciones TEXT DEFAULT '',
                revisado_por TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_at DATETIME
            )",

            // filiales: sedes/branchs de la institución
            "CREATE TABLE IF NOT EXISTS filiales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                direccion TEXT DEFAULT '',
                telefono TEXT DEFAULT '',
                estado TEXT DEFAULT 'activo',
                creado_por TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",

            // subject_kit: control de completitud del kit de cada asignatura
            "CREATE TABLE IF NOT EXISTS subject_kit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asignatura TEXT NOT NULL,
                componente TEXT NOT NULL,
                completado INTEGER DEFAULT 0,
                datos TEXT DEFAULT '{}',
                completado_por TEXT DEFAULT '',
                completado_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(asignatura, componente)
            )",

            // ═══ TABLAS: Progreso de Unidades + Exámenes Dinámicos ═══

            // unit_progress: progreso de lectura por unidad por alumno
            "CREATE TABLE IF NOT EXISTS unit_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                unidad INTEGER NOT NULL,
                secciones_leidas TEXT DEFAULT '[]',
                total_secciones INTEGER DEFAULT 10,
                completada INTEGER DEFAULT 0,
                asistencia INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, unidad)
            )",

            // exam_questions: banco de preguntas por unidad/indicador
            "CREATE TABLE IF NOT EXISTS exam_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unidad INTEGER NOT NULL,
                indicador TEXT DEFAULT '',
                pregunta TEXT NOT NULL,
                opcion_a TEXT NOT NULL,
                opcion_b TEXT NOT NULL,
                opcion_c TEXT NOT NULL,
                opcion_d TEXT NOT NULL,
                respuesta INTEGER NOT NULL,
                tipo TEXT DEFAULT 'multiple',
                dificultad TEXT DEFAULT 'media',
                activa INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",

            // exam_attempts: intentos de examen por alumno
            "CREATE TABLE IF NOT EXISTS exam_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                examen TEXT NOT NULL,
                puntuacion INTEGER DEFAULT 0,
                total_preguntas INTEGER DEFAULT 0,
                respuestas TEXT DEFAULT '{}',
                completado INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )",

            // ═══ TABLAS: Formularios por Carrera + Completitud de Alumnos ═══

            // formularios_carrera: plantillas de formularios asociados a una carrera
            "CREATE TABLE IF NOT EXISTS formularios_carrera (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                carrera TEXT DEFAULT '',
                tipo TEXT DEFAULT 'matricula' CHECK(tipo IN ('matricula','inscripcion','constancia','otro')),
                campos_json TEXT DEFAULT '[]',
                activo INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",

            // formularios_alumno: datos completados por cada alumno + estado
            "CREATE TABLE IF NOT EXISTS formularios_alumno (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                formulario_id INTEGER NOT NULL,
                cedula TEXT DEFAULT '',
                estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente','completado','aprobado')),
                datos_json TEXT DEFAULT '{}',
                completado_at DATETIME,
                revisado_por TEXT DEFAULT '',
                revisado_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (formulario_id) REFERENCES formularios_carrera(id),
                UNIQUE(user_id, formulario_id)
            )",

            // ═══ TABLA: Matrículas (formulario completo por alumno) ═══
            "CREATE TABLE IF NOT EXISTS matriculaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                -- Control
                codigo_formulario TEXT DEFAULT 'CEN-AS-SM-AGP005',
                legajo_numero TEXT DEFAULT '',
                fecha_inscripcion TEXT DEFAULT '',
                -- Identificación
                nombres TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                cedula TEXT NOT NULL,
                -- Nacimiento
                lugar_nacimiento TEXT DEFAULT '',
                fecha_nacimiento TEXT DEFAULT '',
                pais TEXT DEFAULT 'ECUADOR',
                -- Domicilio
                direccion TEXT DEFAULT '',
                ciudad TEXT DEFAULT '',
                departamento TEXT DEFAULT '',
                barrio_compania TEXT DEFAULT '',
                -- Contacto
                telefono_fijo TEXT DEFAULT '',
                telefono_movil TEXT DEFAULT '',
                correo_electronico TEXT DEFAULT '',
                -- Estudios previos
                titulo_bachiller TEXT DEFAULT '',
                institucion_origen TEXT DEFAULT '',
                ciudad_pais_estudio TEXT DEFAULT '',
                anio_promocion TEXT DEFAULT '',
                -- Matrícula
                semestre TEXT DEFAULT '',
                carrera TEXT DEFAULT '',
                tipo_alumno TEXT DEFAULT 'nuevo' CHECK(tipo_alumno IN ('nuevo','antiguo','transferencia')),
                -- Pagos
                matricula_guaranies TEXT DEFAULT '',
                mensualidad TEXT DEFAULT '',
                plan_pago TEXT DEFAULT '',
                -- Académico
                asignaturas_pendientes TEXT DEFAULT '',
                semestres_pendientes TEXT DEFAULT '',
                -- Adicional
                informacion_adicional TEXT DEFAULT '',
                -- Validación
                acepta_declaracion INTEGER DEFAULT 0,
                firma TEXT DEFAULT '',
                estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente','completado','aprobado','rechazado')),
                registrado_por TEXT DEFAULT '',
                observaciones TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )"
        ];

        // ═══ Tabla calendar_events (extendida para planificación docente) ═══
        try {
            $this->pdo->exec("CREATE TABLE IF NOT EXISTS calendar_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                event_type TEXT NOT NULL DEFAULT 'clase',
                date TEXT NOT NULL,
                start_time TEXT DEFAULT '',
                end_time TEXT DEFAULT '',
                is_virtual INTEGER DEFAULT 0,
                virtual_link TEXT DEFAULT '',
                career TEXT DEFAULT '',
                modality TEXT DEFAULT '',
                group_name TEXT DEFAULT '',
                course_id INTEGER DEFAULT 0,
                created_by INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )");
            // Índices para conflictos y filtrado
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_cal_ev_date ON calendar_events(date)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_cal_ev_career ON calendar_events(career)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_cal_ev_creator ON calendar_events(created_by)");
        } catch (Exception $e) {
            // Tabla puede ya existir
        }

        // ═══ Tabla attendance_events (eventos con código único) ═══
        try {
            $this->pdo->exec("CREATE TABLE IF NOT EXISTS attendance_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                event_type TEXT DEFAULT 'clase',
                career TEXT DEFAULT '',
                modality TEXT DEFAULT 'presencial',
                start_time TEXT DEFAULT '',
                end_time TEXT DEFAULT '',
                location TEXT DEFAULT '',
                created_by INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME DEFAULT NULL
            )");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ae_code ON attendance_events(event_code)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ae_active ON attendance_events(is_active)");
        } catch (Exception $e) {}

        // ═══ Tabla attendance_records (registros con fecha+hora+minutos) ═══
        try {
            $this->pdo->exec("CREATE TABLE IF NOT EXISTS attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                event_code TEXT NOT NULL,
                cedula TEXT NOT NULL,
                nombre TEXT NOT NULL,
                carrera TEXT DEFAULT '',
                seccion TEXT DEFAULT '',
                grado TEXT DEFAULT '',
                estado TEXT DEFAULT 'presente',
                fecha TEXT NOT NULL,
                hora TEXT NOT NULL,
                observacion TEXT DEFAULT '',
                recorded_by INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES attendance_events(id)
            )");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ar_event ON attendance_records(event_id)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ar_code ON attendance_records(event_code)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ar_cedula ON attendance_records(cedula)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ar_fecha ON attendance_records(fecha)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_ar_carrera ON attendance_records(carrera)");
        } catch (Exception $e) {}

        // ═══ Tabla formularios_carrera + formularios_alumno (índices) ═══
        try {
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fc_carrera ON formularios_carrera(carrera)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fc_tipo ON formularios_carrera(tipo)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fa_user ON formularios_alumno(user_id)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fa_form ON formularios_alumno(formulario_id)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fa_estado ON formularios_alumno(estado)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_fa_cedula ON formularios_alumno(cedula)");
        } catch (Exception $e) {}

        // ═══ Tabla matriculaciones (índices) ═══
        try {
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_mat_user ON matriculaciones(user_id)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_mat_cedula ON matriculaciones(cedula)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_mat_estado ON matriculaciones(estado)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_mat_carrera ON matriculaciones(carrera)");
            $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_mat_fecha ON matriculaciones(fecha_inscripcion)");
        } catch (Exception $e) {}

        foreach ($schema as $sql) {
            $this->pdo->exec($sql);
        }

        // ═══ Migración: columnas que el login y la sync necesitan en users ═══
        // (el UPDATE de last_login en auth.php daba 500 si la columna no existía)
        try {
            $cols = [];
            foreach ($this->pdo->query("PRAGMA table_info(users)") as $r) { $cols[] = $r['name']; }
            $faltantes = [
                'uuid'        => "ALTER TABLE users ADD COLUMN uuid TEXT DEFAULT ''",
                'last_login'  => "ALTER TABLE users ADD COLUMN last_login DATETIME",
                'deleted_at'  => "ALTER TABLE users ADD COLUMN deleted_at DATETIME",
                'sync_version'=> "ALTER TABLE users ADD COLUMN sync_version INTEGER DEFAULT 1",
                'sync_status' => "ALTER TABLE users ADD COLUMN sync_status TEXT DEFAULT 'sincronizado'",
            ];
            foreach ($faltantes as $c => $sql) {
                if (!in_array($c, $cols)) { $this->pdo->exec($sql); }
            }
        } catch (Exception $e) {}
    }
}

// Convenience function to get DB instance
function db() {
    return Database::getInstance()->getPdo();
}