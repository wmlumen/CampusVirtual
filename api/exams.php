<?php
/**
 * Exams API — Exámenes dinámicos desde el banco de preguntas
 * Endpoints:
 *   GET  ?action=questions&tipo=parcial1|parcial2|final  → preguntas del examen
 *   GET  ?action=attempt&user_id=X&examen=X              → intentos previos
 *   GET  ?action=count                                   → total preguntas por unidad
 *   POST action=submit                                   → guardar intento
 *   POST action=seed                                     → sembrar 50 preguntas (admin)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// ═══════════════════════════════════════════════════════
// GET — Consultas
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    // ── Preguntas del examen ──
    if ($action === 'questions') {
        $tipo = $_GET['tipo'] ?? 'parcial1';
        $unidades = [];

        if ($tipo === 'parcial1') $unidades = [1,2,3];
        else if ($tipo === 'parcial2') $unidades = [4,5,6];
        else if ($tipo === 'final') $unidades = [1,2,3,4,5,6,7,8,9,10];
        else { http_response_code(400); echo json_encode(['error'=>'Tipo de examen no valido']); exit; }

        $placeholders = implode(',', array_fill(0, count($unidades), '?'));
        $stmt = $pdo->prepare("SELECT * FROM exam_questions WHERE unidad IN ($placeholders) AND activa=1 ORDER BY RANDOM()");
        $stmt->execute($unidades);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $questions = [];
        foreach ($rows as $r) {
            $questions[] = [
                'id'=>$r['id'],
                'unidad'=>$r['unidad'],
                'indicador'=>$r['indicador'],
                'pregunta'=>$r['pregunta'],
                'opcion_a'=>$r['opcion_a'],
                'opcion_b'=>$r['opcion_b'],
                'opcion_c'=>$r['opcion_c'],
                'opcion_d'=>$r['opcion_d'],
                'respuesta'=>$r['respuesta']
            ];
        }

        echo json_encode(['ok'=>true,'tipo'=>$tipo,'unidades'=>$unidades,'total'=>count($questions),'preguntas'=>$questions]);
        exit;
    }

    // ── Intentos previos ──
    if ($action === 'attempt') {
        $user_id = intval($_GET['user_id'] ?? 0);
        $examen = $_GET['examen'] ?? '';
        if (!$user_id || !$examen) { http_response_code(400); echo json_encode(['error'=>'user_id y examen requeridos']); exit; }
        $stmt = $pdo->prepare("SELECT * FROM exam_attempts WHERE user_id=? AND examen=? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$user_id, $examen]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attempts = [];
        foreach ($rows as $r) {
            $attempts[] = [
                'id'=>$r['id'],
                'puntuacion'=>$r['puntuacion'],
                'total'=>$r['total_preguntas'],
                'completado'=>intval($r['completado']),
                'fecha'=>$r['created_at']
            ];
        }
        echo json_encode(['ok'=>true,'intentos'=>$attempts,'total_intentos'=>count($attempts)]);
        exit;
    }

    // ── Conteo de preguntas por unidad ──
    if ($action === 'count') {
        $stmt = $pdo->query("SELECT unidad, COUNT(*) as total FROM exam_questions WHERE activa=1 GROUP BY unidad ORDER BY unidad");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['ok'=>true,'conteo'=>$rows]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Accion no valida']);
    exit;
}

// ═══════════════════════════════════════════════════════
// POST — Acciones de escritura
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Leer action de query, $_POST, o body JSON
    $action = $_REQUEST['action'] ?? null;
    if (!$action) {
        $json = json_decode(file_get_contents('php://input'), true);
        $action = $json['action'] ?? null;
    }
    if (!$action) { http_response_code(400); echo json_encode(['error'=>'Accion requerida']); exit; }

    $pdo = db();

    // ── Guardar intento de examen ──
    if ($action === 'submit') {
        $decoded = require_auth();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $user_id = intval($input['user_id'] ?? $decoded->user_id);
        $examen = $input['examen'] ?? '';
        $respuestas = $input['respuestas'] ?? [];
        $puntuacion = intval($input['puntuacion'] ?? 0);
        $total = intval($input['total_preguntas'] ?? 0);

        if (!$user_id || !$examen) {
            http_response_code(400);
            echo json_encode(['error'=>'user_id y examen requeridos']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO exam_attempts (user_id, examen, puntuacion, total_preguntas, respuestas, completado) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->execute([$user_id, $examen, $puntuacion, $total, json_encode($respuestas)]);

        echo json_encode(['ok'=>true,'mensaje'=>'Intento guardado','id'=>$pdo->lastInsertId()]);
        exit;
    }

    // ── Sembrar 50 preguntas (admin) ──
    if ($action === 'seed') {
        $seed_data = generarPreguntasSeed();

        // Evitar duplicados: verificar si ya hay preguntas
        $existing = $pdo->query("SELECT COUNT(*) FROM exam_questions")->fetchColumn();
        if ($existing > 0) {
            echo json_encode(['ok'=>true,'mensaje'=>"Ya existen $existing preguntas en la base. Seed omitido."]);
            exit;
        }

        $inserted = 0;
        foreach ($seed_data as $q) {
            $stmt = $pdo->prepare("INSERT INTO exam_questions (unidad, indicador, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta, dificultad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$q['u'],$q['i'],$q['p'],$q['a'],$q['b'],$q['c'],$q['d'],$q['r'],$q['d']]);
            $inserted++;
        }
        echo json_encode(['ok'=>true,'mensaje'=>"Preguntas sembradas: $inserted"]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Accion no valida']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Metodo no permitido']);

// ═══════════════════════════════════════════════════════
// Funcion: 50 preguntas semilla (5 por unidad, 10 unidades)
// ═══════════════════════════════════════════════════════
function generarPreguntasSeed() {
    return [
        // === UNIDAD 1: Introduccion a los SI ===
        ['u'=>1,'i'=>'Definiciones','p'=>'Que es un Sistema de Informacion?','a'=>'Solo hardware','b'=>'Conjunto de componentes que recolectan, procesan y distribuyen informacion','c'=>'Un programa de computadora','d'=>'Una red de computadoras','r'=>2,'d'=>'basica'],
        ['u'=>1,'i'=>'Clasificacion','p'=>'Que tipo de sistema registra las operaciones diarias?','a'=>'DSS','b'=>'EIS','c'=>'TPS','d'=>'MIS','r'=>3,'d'=>'basica'],
        ['u'=>1,'i'=>'Clasificacion','p'=>'El TPS (Transaction Processing System) se usa para:','a'=>'Tomar decisiones estrategicas','b'=>'Registrar transacciones diarias','c'=>'Analizar tendencias del mercado','d'=>'Gestionar bases de datos','r'=>2,'d'=>'media'],
        ['u'=>1,'i'=>'Ciclo de vida','p'=>'Cual es la primera fase del ciclo de vida de un SI?','a'=>'Implementacion','b'=>'Mantenimiento','c'=>'Analisis','d'=>'Diseno','r'=>3,'d'=>'media'],
        ['u'=>1,'i'=>'Dato vs Informacion','p'=>'La diferencia entre dato e informacion es:','a'=>'Son sinonimos','b'=>'El dato es bruto, la informacion es procesada y contextualizada','c'=>'La informacion es mas rapida','d'=>'El dato siempre es numerico','r'=>2,'d'=>'basica'],

        // === UNIDAD 2: Estrategia de Negocios y TI ===
        ['u'=>2,'i'=>'Alineacion estrategica','p'=>'La alineacion TI-Negocio implica:','a'=>'Que TI funcione sola','b'=>'Que la tecnologia soporte los objetivos del negocio','c'=>'Que el negocio ignore a TI','d'=>'Que TI tenga mas presupuesto que negocio','r'=>2,'d'=>'basica'],
        ['u'=>2,'i'=>'Ventaja competitiva','p'=>'Cadenas de valor de Porter ayudan a:','a'=>'Crear productos','b'=>'Identificar actividades que generan ventaja competitiva','c'=>'Deshacer competidores','d'=>'Cerrar empresas','r'=>2,'d'=>'basica'],
        ['u'=>2,'i'=>'Modelos de negocio','p'=>'El modelo Canvas describe:','a'=>'Solo finanzas','b'=>'9 bloques fundamentales del modelo de negocio','c'=>'Solo clientes','d'=>'Solo proveedores','r'=>2,'d'=>'basica'],
        ['u'=>2,'i'=>'Tecnologias','p'=>'Cual de estas NO es una tecnologia de vanguardia?','a'=>'Cloud Computing','b'=>'Blockchain','c'=>'Maquina de escribir','d'=>'Inteligencia Artificial','r'=>3,'d'=>'basica'],
        ['u'=>2,'i'=>'ROI','p'=>'El retorno de inversion (ROI) mide:','a'=>'El costo total','b'=>'La ganancia neta sobre la inversion','c'=>'El numero de empleados','d'=>'Las horas trabajadas','r'=>2,'d'=>'media'],

        // === UNIDAD 3: Administracion de BD ===
        ['u'=>3,'i'=>'Modelo Relacional','p'=>'En el modelo relacional, una tabla tambien se llama:','a'=>'Archivo','b'=>'Relacion','c'=>'Lista','d'=>'Diccionario','r'=>2,'d'=>'basica'],
        ['u'=>3,'i'=>'Normalizacion','p'=>'Cual es el objetivo de la normalizacion?','a'=>'Aumentar el tamano de la BD','b'=>'Eliminar redundancia de datos','c'=>'Crear mas tablas','d'=>'Eliminar claves primarias','r'=>2,'d'=>'media'],
        ['u'=>3,'i'=>'SQL','p'=>'Que sentencia SQL se usa para consultar datos?','a'=>'INSERT','b'=>'UPDATE','c'=>'SELECT','d'=>'DELETE','r'=>3,'d'=>'basica'],
        ['u'=>3,'i'=>'DBMS','p'=>'Que es un DBMS?','a'=>'Un tipo de virus','b'=>'Sistema de gestion de bases de datos','c'=>'Un lenguaje de programacion','d'=>'Un dispositivo de almacenamiento','r'=>2,'d'=>'basica'],
        ['u'=>3,'i'=>'Claves','p'=>'La clave primaria identifica:','a'=>'Cualquier fila de forma duplicada','b'=>'Una fila de forma unica en una tabla','c'=>'Solo columnas de texto','d'=>'Relaciones entre tablas','r'=>2,'d'=>'media'],

        // === UNIDAD 4: ERP ===
        ['u'=>4,'i'=>'ERP','p'=>'Que significa ERP?','a'=>'Enterprise Resource Planning','b'=>'Electronic Resource Program','c'=>'External Relations Platform','d'=>'Employee Records Processing','r'=>1,'d'=>'basica'],
        ['u'=>4,'i'=>'ERP','p'=>'Un modulo tipico de ERP es:','a'=>'Solo contabilidad','b'=>'Recursos Humanos, finanzas, produccion, logistica','c'=>'Solo inventario','d'=>'Solo ventas','r'=>2,'d'=>'basica'],
        ['u'=>4,'i'=>'TCO','p'=>'El TCO (Total Cost of Ownership) incluye:','a'=>'Solo el precio de compra','b'=>'Costo de adquisicion + mantenimiento + capacitacion + obsolescencia','c'=>'Solo el costo de electricidad','d'=>'Solo el salario del administrador','r'=>2,'d'=>'media'],
        ['u'=>4,'i'=>'Evaluacion','p'=>'Al evaluar una propuesta de ERP, se debe considerar:','a'=>'Solo el precio mas bajo','b'=>'Alineacion con procesos, soporte, escalabilidad y costo total','c'=>'Solo la marca mas conocida','d'=>'Solo la opinion del vendedor','r'=>2,'d'=>'media'],
        ['u'=>4,'i'=>'ERP','p'=>'SAP es un ejemplo de:','a'=>'Sistema operativo','b'=>'Software ERP','c'=>'Lenguaje de programacion','d'=>'Red social','r'=>2,'d'=>'basica'],

        // === UNIDAD 5: Hardware y Software ===
        ['u'=>5,'i'=>'Hardware','p'=>'Que es la CPU?','a'=>'Almacenamiento permanente','b'=>'Unidad central de procesamiento','c'=>'Memoria temporal','d'=>'Dispositivo de entrada','r'=>2,'d'=>'basica'],
        ['u'=>5,'i'=>'Hardware','p'=>'La RAM se caracteriza por:','a'=>'Ser permanente','b'=>'Perder datos al apagar la computadora','c'=>'Ser mas lenta que el disco duro','d'=>'Almacenar datos de forma permanente','r'=>2,'d'=>'basica'],
        ['u'=>5,'i'=>'Software','p'=>'Que tipo de software administra el hardware?','a'=>'Software de aplicacion','b'=>'Software de sistema (SO)','c'=>'Hoja de calculo','d'=>'Navegador web','r'=>2,'d'=>'basica'],
        ['u'=>5,'i'=>'Clasificacion','p'=>'Cual es una clasificacion de computadoras?','a'=>'Solo personales','b'=>'Personales, servidores, mainframes','c'=>'Solo portatiles','d'=>'Solo de escritorio','r'=>2,'d'=>'basica'],
        ['u'=>5,'i'=>'Software','p'=>'SaaS significa:','a'=>'Software as a Service','b'=>'System and Application Service','c'=>'Storage as a Solution','d'=>'Security as a Standard','r'=>1,'d'=>'media'],

        // === UNIDAD 6: Redes ===
        ['u'=>6,'i'=>'Redes','p'=>'Que es una LAN?','a'=>'Red de area amplia','b'=>'Red de area local','c'=>'Red inalambrica','d'=>'Red virtual','r'=>2,'d'=>'basica'],
        ['u'=>6,'i'=>'Protocolos','p'=>'TCP/IP es:','a'=>'Un sistema operativo','b'=>'Conjunto de protocolos de red','c'=>'Un tipo de virus','d'=>'Un lenguaje de programacion','r'=>2,'d'=>'basica'],
        ['u'=>6,'i'=>'Internet','p'=>'Que protocolo usa la web (http)?','a'=>'FTP','b'=>'SMTP','c'=>'HTTP/HTTPS','d'=>'DNS','r'=>3,'d'=>'basica'],
        ['u'=>6,'i'=>'Dispositivos','p'=>'Un router sirve para:','a'=>'Almacenar datos','b'=>'Conectar redes y dirigir trafico','c'=>'Imprimir documentos','d'=>'Reproducir musica','r'=>2,'d'=>'basica'],
        ['u'=>6,'i'=>'IoT','p'=>'IoT (Internet of Things) se refiere a:','a'=>'Solo computadoras','b'=>'Dispositivos cotidianos conectados a internet','c'=>'Solo telefonos','d'=>'Solo servidores','r'=>2,'d'=>'media'],

        // === UNIDAD 7: Tecnologias de Apoyo a Decisiones ===
        ['u'=>7,'i'=>'DSS','p'=>'Que es un DSS?','a'=>'Sistema de processamiento','b'=>'Sistema de soporte a decisiones','c'=>'Sistema de seguridad','d'=>'Sistema de almacenamiento','r'=>2,'d'=>'basica'],
        ['u'=>7,'i'=>'IA','p'=>'La inteligencia artificial en negocios se usa para:','a'=>'Solo videojuegos','b'=>'Predicciones, automatizacion, analisis de datos','c'=>'Solo redes sociales','d'=>'Solo diseno grafico','r'=>2,'d'=>'basica'],
        ['u'=>7,'i'=>'KPIs','p'=>'Un KPI (Key Performance Indicator) es:','a'=>'Un tipo de virus','b'=>'Indicador clave de rendimiento','c'=>'Un software','d'=>'Una red','r'=>2,'d'=>'basica'],
        ['u'=>7,'i'=>'Dashboards','p'=>'Un dashboard ejecutivo muestra:','a'=>'Solo graficos decorativos','b'=>'Indicadores clave en tiempo real para la toma de decisiones','c'=>'Solo datos historicos','d'=>'Solo informacion de redes sociales','r'=>2,'d'=>'media'],
        ['u'=>7,'i'=>'GDSS','p'=>'GDSS facilita:','a'=>'El trabajo individual','b'=>'La toma de decisiones en grupo','c'=>'El almacenamiento de datos','d'=>'La impresion de documentos','r'=>2,'d'=>'basica'],

        // === UNIDAD 8: EIS ===
        ['u'=>8,'i'=>'EIS','p'=>'Que significa EIS?','a'=>'Executive Information System','b'=>'Electronic Integration System','c'=>'Enterprise Internal Server','d'=>'Employee Identification System','r'=>1,'d'=>'basica'],
        ['u'=>8,'i'=>'EIS','p'=>'Un EIS esta disenado para:','a'=>'Operarios','b'=>'Ejecutivos y alta direccion','c'=>'Estudiantes','d'=>'Programadores','r'=>2,'d'=>'basica'],
        ['u'=>8,'i'=>'Factores','p'=>'El factor de exito mas importante en un EIS es:','a'=>'El hardware mas caro','b'=>'El compromiso de la alta direccion','c'=>'El numero de usuarios','d'=>'La velocidad de internet','r'=>2,'d'=>'media'],
        ['u'=>8,'i'=>'Piramide','p'=>'En la piramide de informacion, los niveles estrategicos necesitan:','a'=>'Datos detallados y operativos','b'=>'Informacion resumida y tendencias','c'=>'Solo datos numericos','d'=>'Informacion de clientes','r'=>2,'d'=>'media'],
        ['u'=>8,'i'=>'EIS','p'=>'La implantacion de un EIS requiere:','a'=>'Solo instalar el software','b'=>'Planificacion, capacitacion y cambio organizacional','c'=>'Solo comprar hardware','d'=>'Solo contratar programadores','r'=>2,'d'=>'basica'],

        // === UNIDAD 9: Paradigmas en Internet ===
        ['u'=>9,'i'=>'E-commerce','p'=>'E-commerce B2B significa:','a'=>'Business to Consumer','b'=>'Business to Business','c'=>'Back to Basics','d'=>'Brand to Brand','r'=>2,'d'=>'basica'],
        ['u'=>9,'i'=>'Pagos','p'=>'Que es una pasarela de pago?','a'=>'Un tipo de tarjeta','b'=>'Sistema que procesa transacciones electronicas','c'=>'Una cuenta de banco','d'=>'Un cajero automatico','r'=>2,'d'=>'basica'],
        ['u'=>9,'i'=>'Legal','p'=>'La firma digital sirve para:','a'=>'Firmar documentos fisicos','b'=>'Autenticar la identidad en transacciones electronicas','c'=>'Dibujar en pantalla','d'=>'Crear contrasenas','r'=>2,'d'=>'basica'],
        ['u'=>9,'i'=>'E-government','p'=>'E-government permite:','a'=>'Solo entretenimiento','b'=>'Tramites publicos en linea','c'=>'Solo compras','d'=>'Solo redes sociales','r'=>2,'d'=>'basica'],
        ['u'=>9,'i'=>'Paradigmas','p'=>'El comercio electronico ha transformado los negocios porque:','a'=>'Elimino todos los negocios fisicos','b'=>'Permite vender 24/7 a nivel global','c'=>'Solo funciona en grandes empresas','d'=>'Requiere solo efectivo','r'=>2,'d'=>'media'],

        // === UNIDAD 10: Futuro de las TIC ===
        ['u'=>10,'i'=>'Big Data','p'=>'Big Data se refiere a:','a'=>'Archivos pequenos','b'=>'Conjuntos de datos masivos que requieren herramientas especiales','c'=>'Solo bases de datos pequenas','d'=>'Archivos de texto','r'=>2,'d'=>'basica'],
        ['u'=>10,'i'=>'Cloud','p'=>'Cloud Computing permite:','a'=>'Solo almacenar archivos','b'=>'Acceder a recursos informaticos bajo demanda via internet','c'=>'Solo enviar emails','d'=>'Solo ver videos','r'=>2,'d'=>'basica'],
        ['u'=>10,'i'=>'Blockchain','p'=>'Blockchain garantiza:','a'=>'Velocidad maxima','b'=>'Integridad e inmutabilidad de datos','c'=>'Almacenamiento ilimitado','d'=>'Conexion gratuita','r'=>2,'d'=>'media'],
        ['u'=>10,'i'=>'OLAP','p'=>'OLAP permite:','a'=>'Solo almacenar datos','b'=>'Analisis multidimensional de datos','c'=>'Solo crear graficos','d'=>'Solo enviar correos','r'=>2,'d'=>'media'],
        ['u'=>10,'i'=>'Futuro','p'=>'La convergencia tecnologica implica:','a'=>'Separacion de tecnologias','b'=>'Union de telecomunicaciones, IT y consumo','c'=>'Eliminacion de internet','d'=>'Solo uso de hardware','r'=>2,'d'=>'basica']
    ];
}
