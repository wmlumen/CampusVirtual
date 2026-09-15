<?php
/**
 * Exams API — Exámenes dinámicos desde el banco de preguntas
 * Endpoints:
 *   GET  ?action=questions&unidad=X&tipo=parcial1|parcial2|final  → preguntas del examen
 *   GET  ?action=attempt&user_id=X&examen=X                      → intentos previos
 *   POST action=submit                                           → guardar intento
 *   POST action=seed                                             → sembrar preguntas (admin)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// GET — Preguntas del examen
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    if ($action === 'questions') {
        $tipo = $_GET['tipo'] ?? 'parcial1';
        $unidades = [];

        // Mapear tipo de examen a unidades
        if ($tipo === 'parcial1') $unidades = [1,2,3];
        else if ($tipo === 'parcial2') $unidades = [4,5,6];
        else if ($tipo === 'final') $unidades = [1,2,3,4,5,6,7,8,9,10];
        else { http_response_code(400); echo json_encode(['error'=>'Tipo de examen no válido']); exit; }

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

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

// POST — Guardar intento de examen
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action'])) {
    $action = $_REQUEST['action'];
    $pdo = db();

    if ($action === 'submit') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $user_id = intval($input['user_id'] ?? 0);
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

    if ($action === 'seed') {
        // Sembrar preguntas de ejemplo por unidad
        $seed_data = generarPreguntasSeed();
        $inserted = 0;
        foreach ($seed_data as $q) {
            $stmt = $pdo->prepare("INSERT INTO exam_questions (unidad, indicador, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta, dificultad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$q['unidad'],$q['indicador'],$q['pregunta'],$q['a'],$q['b'],$q['c'],$q['d'],$q['respuesta'],$q['dificultad']]);
            $inserted++;
        }
        echo json_encode(['ok'=>true,'mensaje'=>"Preguntas sembradas: $inserted"]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Método no permitido']);

// ═══ Función para generar preguntas seed por unidad ═══
function generarPreguntasSeed() {
    return [
        // === UNIDAD 1: Introducción a los SI ===
        ['unidad'=>1,'indicador'=>'Definiciones','pregunta'=>'¿Qué es un Sistema de Información?','a'=>'Solo hardware','b'=>'Conjunto de componentes que recolectan, procesan y distribuyen información','c'=>'Un programa de computadora','d'=>'Una red de computadoras','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>1,'indicador'=>'Clasificación','pregunta'=>'¿Qué tipo de sistema registra las operaciones diarias?','a'=>'DSS','b'=>'EIS','c'=>'TPS','d'=>'MIS','respuesta'=>3,'dificultad'=>'basica'],
        ['unidad'=>1,'indicador'=>'Clasificación','pregunta'=>'El TPS (Transaction Processing System) se usa para:','a'=>'Tomar decisiones estratégicas','b'=>'Registrar transacciones diarias','c'=>'Analizar tendencias del mercado','d'=>'Gestionar bases de datos','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>1,'indicador'=>'Ciclo de vida','pregunta'=>'¿Cuál es la primera fase del ciclo de vida de un SI?','a'=>'Implementación','b'=>'Mantenimiento','c'=>'Análisis','d'=>'Diseño','respuesta'=>3,'dificultad'=>'media'],
        ['unidad'=>1,'indicador'=>'Dato vs Información','pregunta'=>'La diferencia entre dato e información es:','a'=>'Son sinónimos','b'=>'El dato es bruto, la información es procesada y contextualizada','c'=>'La información es más rápida','d'=>'El dato siempre es numérico','respuesta'=>2,'dificultad'=>'basica'],

        // === UNIDAD 2: Estrategia de Negocios y TI ===
        ['unidad'=>2,'indicador'=>'Porter','pregunta'=>'¿Cuántas fuerzas de Porter existen?','a'=>'3','b'=>'4','c'=>'5','d'=>'6','respuesta'=>3,'dificultad'=>'basica'],
        ['unidad'=>2,'indicador'=>'Porter','pregunta'=>'La rivalidad entre competidores es una fuerza de Porter que se contrarresta con:','a'=>'CRM y análisis competitivo','b'=>'Reducción de personal','c'=>'Cierre de la empresa','d'=>'Aumento de precios','respuesta'=>1,'dificultad'=>'media'],
        ['unidad'=>2,'indicador'=>'SIE','pregunta'=>'Un Sistema de Información Estratégico se caracteriza por:','a'=>'Ser fácil de imitar','b'=>'No estar alineado con la estrategia','c'=>'Cambiar procesos y ser difícil de imitar','d'=>'Solo automatizar tareas','respuesta'=>3,'dificultad'=>'media'],
        ['unidad'=>2,'indicador'=>'Reingeniería','pregunta'=>'La reingeniería de procesos implica:','a'=>'Mejoras incrementales','b'=>'Rediseño radical para mejoras sustanciales','c'=>'Mantener los procesos actuales','d'=>'Eliminar toda la tecnología','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>2,'indicador'=>'Tecnologías','pregunta'=>'¿Cuál de estas NO es una tecnología de vanguardia?','a'=>'Cloud Computing','b'=>'Blockchain','c'=>'Máquina de escribir','d'=>'Inteligencia Artificial','respuesta'=>3,'dificultad'=>'basica'],

        // === UNIDAD 3: Administración de BD ===
        ['unidad'=>3,'indicador'=>'Modelo Relacional','pregunta'=>'En el modelo relacional, una tabla también se llama:','a'=>'Archivo','b'=>'Relación','c'=>'Lista','d'=>'Diccionario','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>3,'indicador'=>'Normalización','pregunta'=>'¿Cuál es el objetivo de la normalización?','a'=>'Aumentar el tamaño de la BD','b'=>'Eliminar redundancia de datos','c'=>'Crear más tablas','d'=>'Eliminar claves primarias','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>3,'indicador'=>'SQL','pregunta'=>'¿Qué sentencia SQL se usa para consultar datos?','a'=>'INSERT','b'=>'UPDATE','c'=>'SELECT','d'=>'DELETE','respuesta'=>3,'dificultad'=>'basica'],
        ['unidad'=>3,'indicador'=>'DBMS','pregunta'=>'¿Qué es un DBMS?','a'=>'Un tipo de virus','b'=>'Sistema de gestión de bases de datos','c'=>'Un lenguaje de programación','d'=>'Un dispositivo de almacenamiento','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>3,'indicador'=>'Claves','pregunta'=>'La clave primaria identifica:','a'=>'Cualquier fila de forma duplicada','b':'Una fila de forma única en una tabla','c'=>'Solo columnas de texto','d'=>'Relaciones entre tablas','respuesta':2,'dificultad'=>'media'],

        // === UNIDAD 4: ERP ===
        ['unidad'=>4,'indicador'=>'ERP','pregunta'=>'¿Qué significa ERP?','a'=>'Enterprise Resource Planning','b'=>'Electronic Resource Program','c'=>'External Relations Platform','d'=>'Employee Records Processing','respuesta'=>1,'dificultad'=>'basica'],
        ['unidad'=>4,'indicador'=>'ERP','pregunta'=>'Un módulo típico de ERP es:','a'=>'Solo contabilidad','b'=>'Recursos Humanos, finanzas, producción, logística','c'=>'Solo inventario','d'=>'Solo ventas','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>4,'indicador'=>'TCO','pregunta'=>'El TCO (Total Cost of Ownership) incluye:','a'=>'Solo el precio de compra','b'=>'Costo de adquisición + mantenimiento + capacitación + obsolescencia','c'=>'Solo el costo de electricidad','d'=>'Solo el salario del administrador','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>4,'indicador'=>'Evaluación','pregunta'=>'Al evaluar una propuesta de ERP, se debe considerar:','a'=>'Solo el precio más bajo','b'=>'Alineación con procesos, soporte, escalabilidad y costo total','c'=>'Solo la marca más conocida','d'=>'Solo la opinión del vendedor','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>4,'indicador'=>'ERP','pregunta'=>'SAP es un ejemplo de:','a'=>'Sistema operativo','b'=>'Software ERP','c')->__('Lenguaje de programación','d'=>'Red social','respuesta'=>2,'dificultad'=>'basica'],

        // === UNIDAD 5: Hardware y Software ===
        ['unidad'=>5,'indicador'=>'Hardware','pregunta'=>'¿Qué es la CPU?','a'=>'Almacenamiento permanente','b'=>'Unidad central de procesamiento','c'=>'Memoria temporal','d'=>'Dispositivo de entrada','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>5,'indicador'=>'Hardware','pregunta'=>'La RAM se caracteriza por:','a'=>'Ser permanente','b'=>'Perder datos al apagar la computadora','c'=>'Ser más lenta que el disco duro','d'=>'Almacenar datos de forma permanente','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>5,'indicador'=>'Software','pregunta'=>'¿Qué tipo de software administra el hardware?','a'=>'Software de aplicación','b'=>'Software de sistema (SO)','c'=>'Hoja de cálculo','d'=>'Navegador web','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>5,'indicador'=>'Clasificación','pregunta':'¿Cuál es una clasificación de computadoras?','a')">Solo personales','b')">Personales, servidores, mainframes','c')">Solo portátiles','d')">Solo de escritorio','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>5,'indicador'=>'Software','pregunta'=>'SaaS significa:','a')">Software as a Service','b')">System and Application Service','c')">Storage as a Solution','d')">Security as a Standard','respuesta'=>1,'dificultad'=>'media'],

        // === UNIDAD 6: Redes ===
        ['unidad'=>6,'indicador'=>'Redes','pregunta'=>'¿Qué es una LAN?','a')">Red de área amplia','b')">Red de área local','c')">Red inalámbrica','d')">Red virtual','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>6,'indicador'=>'Protocolos','pregunta'=>'TCP/IP es:','a')">Un sistema operativo','b')">Conjunto de protocolos de red','c')">Un tipo de virus','d')">Un lenguaje de programación','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>6,'indicador'=>'Internet','pregunta'=>'¿Qué protocolo usa la web (http)?','a')">FTP','b')">SMTP','c')">HTTP/HTTPS','d')">DNS','respuesta'=>3,'dificultad'=>'basica'],
        ['unidad'=>6,'indicador'=>'Dispositivos','pregunta'=>'Un router sirve para:','a')">Almacenar datos','b')">Conectar redes y dirigir tráfico','c')">Imprimir documentos','d')">Reproducir música','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>6,'indicador'=>'IoT','pregunta'=>'IoT (Internet of Things) se refiere a:','a')">Solo computadoras','b')">Dispositivos cotidianos conectados a internet','c')">Solo teléfonos','d')">Solo servidores','respuesta'=>2,'dificultad'=>'media'],

        // === UNIDAD 7: Tecnologías de Apoyo a Decisiones ===
        ['unidad'=>7,'indicador'=>'DSS','pregunta'=>'¿Qué es un DSS?','a')">Sistema de processamiento','b')">Sistema de soporte a decisiones','c')">Sistema de seguridad','d')">Sistema de almacenamiento','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>7,'indicador'=>'IA','pregunta'=>'La inteligencia artificial en negocios se usa para:','a')">Solo videojuegos','b')">Predicciones, automatización, análisis de datos','c')">Solo redes sociales','d')">Solo diseño gráfico','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>7,'indicador'=>'KPIs','pregunta'=>'Un KPI (Key Performance Indicator) es:','a')">Un tipo de virus','b')">Indicador clave de rendimiento','c')">Un software','d')">Una red','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>7,'indicador'=>'Dashboards','pregunta')">Un dashboard ejecutivo muestra:','a')">Solo gráficos decorativos','b')">Indicadores clave en tiempo real para la toma de decisiones','c')">Solo datos históricos','d')">Solo información de redes sociales','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>7,'indicador'=>'GDSS','pregunta'=>'GDSS facilita:','a')">El trabajo individual','b')">La toma de decisiones en grupo','c')">El almacenamiento de datos','d')">La impresión de documentos','respuesta'=>2,'dificultad'=>'basica'],

        // === UNIDAD 8: EIS ===
        ['unidad'=>8,'indicador'=>'EIS','pregunta'=>'¿Qué significa EIS?','a')">Executive Information System','b')">Electronic Integration System','c')">Enterprise Internal Server','d')">Employee Identification System','respuesta'=>1,'dificultad'=>'basica'],
        ['unidad'=>8,'indicador'=>'EIS','pregunta')">Un EIS está diseñado para:','a')">Operarios','b')">Ejecutivos y alta dirección','c')">Estudiantes','d')">Programadores','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>8,'indicador'=>'Factores','pregunta'=>'El factor de éxito más importante en un EIS es:','a')">El hardware más caro','b')">El compromiso de la alta dirección','c')">El número de usuarios','d')">La velocidad de internet','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>8,'indicador'=>'Pirámide','pregunta')">En la pirámide de información, los niveles estratégicos necesitan:','a')">Datos detallados y operativos','b')">Información resumida y tendencias','c')">Solo datos numéricos','d')">Información de clientes','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>8,'indicador'=>'EIS','pregunta')">La implantación de un EIS requiere:','a')">Solo Instalar el software','b')">Planificación, capacitación y cambio organizacional','c')">Solo comprar hardware','d')">Solo contratar programadores','respuesta'=>2,'dificultad'=>'basica'],

        // === UNIDAD 9: Paradigmas en Internet ===
        ['unidad'=>9,'indicador'=>'E-commerce','pregunta')">E-commerce B2B significa:','a')">Business to Consumer','b')">Business to Business','c')">Back to Basics','d')">Brand to Brand','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>9,'indicador'=>'Pagos','pregunta')">¿Qué es una pasarela de pago?','a')">Un tipo de tarjeta','b')">Sistema que procesa transacciones electrónicas','c')">Una cuenta de banco','d')">Un cajero automático','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>9,'indicador'=>'Legal','pregunta')">La firma digital sirve para:','a')">Firmar documentos físicos','b')">Autenticar la identidad en transacciones electrónicas','c')">Dibujar en pantalla','d')">Crear contraseñas','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>9,'indicador'=>'E-government','pregunta')">E-government permite:','a')">Solo entretenimiento','b')">Trámites públicos en línea','c')">Solo compras','d')">Solo redes sociales','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>9,'indicador'=>'Paradigmas','pregunta')">El comercio electrónico ha transformado los negocios porque:','a')">Eliminó todos los negocios físicos','b')">Permite vender 24/7 a nivel global','c')">Solo funciona en grandes empresas','d')">Requiere solo efectivo','respuesta'=>2,'dificultad'=>'media'],

        // === UNIDAD 10: Futuro de las TIC ===
        ['unidad'=>10,'indicador'=>'Big Data','pregunta')">Big Data se refiere a:','a')">Archivos pequeños','b')">Conjuntos de datos masivos que requieren herramientas especiales','c')">Solo bases de datos pequeñas','d')">Archivos de texto','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>10,'indicador'=>'Cloud','pregunta')">Cloud Computing permite:','a')">Solo almacenar archivos','b')">Acceder a recursos informáticos bajo demanda vía internet','c')">Solo enviar emails','d')">Solo ver videos','respuesta'=>2,'dificultad'=>'basica'],
        ['unidad'=>10,'indicador'=>'Blockchain','pregunta')">Blockchain garantiza:','a')">Velocidad máxima','b')">Integridad e inmutabilidad de datos','c')">Almacenamiento ilimitado','d')">Conexión gratuita','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>10,'indicador'=>'OLAP','pregunta')">OLAP permite:','a')">Solo almacenar datos','b')">Análisis multidimensional de datos','c')">Solo crear gráficos','d')">Solo enviar correos','respuesta'=>2,'dificultad'=>'media'],
        ['unidad'=>10,'indicador'=>'Futuro','pregunta')">La convergencia tecnológica implica:','a')">Separación de tecnologías','b')">Unión de telecomunicaciones, IT y consumo','c')">Eliminación de internet','d')">Solo uso de hardware','respuesta'=>2,'dificultad'=>'basica']
    ];
}
