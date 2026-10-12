/**
 * modelo-tic-data.js — Dataset del Modelo Completo de TIC (Tecnología de la Información y Comunicación)
 * Generado con las 10 Unidades temáticas completas, tarjetas enriquecidas, autoevaluaciones, tablas, SVGs y bibliografía.
 */
(function() {
    'use strict';
    const root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);

    root.MODELO_TIC_PROGRAMA = {
        fundamentacion: 'La combinación entre la tecnología informática con los sistemas de información se convierte en un factor estratégico. La gestión eficaz y eficiente de la información es sinónimo de éxito. El programa busca sistematizar estas variables para brindar al futuro profesional las herramientas teóricas y prácticas que exigen los negocios actuales.',
        objetivo_general: 'Brindar al futuro profesional las herramientas teóricas y prácticas de las tecnologías de la información y comunicación que exigen los negocios actuales.',
        objetivos_especificos: 'Conocer la perspectiva conceptual y estratégica de las TIC.\\nSeñalar la infraestructura de vanguardia organizacional.\\nAnalizar herramientas tecnológicas para la toma de decisiones.\\nExplicar enfoques basados en TI y nuevos paradigmas.',
        competencias: 'Integra las tecnologías de la información en la estrategia y la gestión de la organización.\\nSelecciona y evalúa soluciones tecnológicas (hardware, software, redes, ERP) con criterios técnicos y financieros.\\nUtiliza la información y los sistemas de apoyo a la decisión para resolver problemas de gestión.\\nActúa con ética y responsabilidad en el uso de la información, el comercio electrónico y la firma digital.\\nSe actualiza ante las tendencias tecnológicas y los nuevos modelos de negocio en internet.',
        capacidades: 'Distingue los tipos de sistemas de información (TPS, MIS, DSS, EIS) y su ciclo de vida.\\nAplica las cinco fuerzas de Porter y la matriz DESTEP para alinear la estrategia con las TIC.\\nDiseña un modelo relacional normalizado y formula consultas SQL básicas.\\nCompara sistemas ERP y estima su costo total de propiedad (TCO).\\nDescribe la arquitectura de una computadora y clasifica el software y sus licencias.\\nExplica los tipos de redes y protocolos de internet, intranet y extranet.\\nUsa indicadores clave (KPI) y tableros para apoyar decisiones empresariales.\\nDefine las características y los factores de éxito de un sistema de apoyo a ejecutivos.\\nAnaliza modelos de negocio en internet, medios de pago y firma digital.\\nIdentifica tendencias como big data, computación en la nube e inteligencia artificial.',
        metodologia: 'Clases magistrales teórico-prácticas con apoyo audiovisual interactivo.\\nAnálisis de material bibliográfico, casos reales y lecturas estructuradas.\\nEstudios de caso guiados y talleres prácticos.\\nPlataforma virtual con control de avance, evaluación formativa y sumativa.',
        requisitos: 'Asistencia presencial mínima del 80% requerida para derecho al examen final.\\nAprobación de los parciales y entrega de actividades prácticas conforme a la rúbrica institucional.',
        bibliografia: 'Cohen Kare, Daniel y Asín Lares, Enrique (2009). Tecnología de información en los negocios. México: McGraw-Hill.\\nAmor, Daniel (2000). La Revolución e-business. Argentina: Prentice Hall.\\nLaudon, Kenneth C. y Laudon, Jane P. (2020). Sistemas de información gerencial. Pearson.',
        aprobacion_pct: 70,
        asistencia_min_pct: 80,
        modalidad: 'presencial',
        duracion_horas: 120,
        nivel: 'GRADO',
        estado: 'ACTIVO'
    };

    root.MODELO_TIC_EVALUACIONES = [
        { nombre: 'Primer Examen Parcial', tipo: 'parcial', origen: 'examen_online', examen_id: 'TIC026-P1', puntaje_max: 10, ponderacion: 20, duracion_min: 60, intentos_max: 1, requisito: true },
        { nombre: 'Segundo Examen Parcial', tipo: 'parcial', origen: 'examen_online', examen_id: 'TIC026-P2', puntaje_max: 10, ponderacion: 20, duracion_min: 60, intentos_max: 1, requisito: true },
        { nombre: 'Entregas de Trabajos y Asistencia Presencial', tipo: 'asistencia', origen: 'asistencia', puntaje_max: 5, ponderacion: 10, requisito: false },
        { nombre: 'Examen Final Integrador', tipo: 'final', origen: 'manual', puntaje_max: 25, ponderacion: 50, duracion_min: 90, intentos_max: 1, requisito: true }
    ];

    root.MODELO_TIC_UNIDADES = [
  {
    "numero": 1,
    "titulo": "Introducción a los Sistemas de Información Computarizados",
    "resumen": "Definiciones y conceptos. Clasificación. Tipos y usos de los sistemas de información. Las tecnologías de la información y la sociedad. Desarrollo de los sistemas de Información. Ciclo de vida de los sistemas de información. Variables determinantes en el proceso de desarrollo de sistemas. Métodos alternos para la adquisición de sistemas. Método tradicional. Aseguramiento de la calidad total. Técnicas de diseño y documentación. Diagramas de flujos de datos. Pruebas del sistema. Mantenimiento. Ingeniería de software asistida por computadora. Compra de paquetes. Desarrollo por parte del usuario final. Outsourcing.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Definiciones y conceptos. Clasificación. Tipos y usos de los sistemas de información. Las tecnologías de la información y la sociedad. Desarrollo de los sistemas de Información. Ciclo de vida de los sistemas de información. Variables determinantes en el proceso de desarrollo de sistemas. Métodos alternos para la adquisición de sistemas. Método tradicional. Aseguramiento de la calidad total. Técnicas de diseño y documentación. Diagramas de flujos de datos. Pruebas del sistema. Mantenimiento. Ingeniería de software asistida por computadora. Compra de paquetes. Desarrollo por parte del usuario final. Outsourcing.</p>"
      },
      {
        "titulo": "Conceptos fundamentales",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">1. Definiciones y conceptos</h3>\n<p id=\"def-si\"><strong>Sistema de Información:</strong><span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Sistema de Información\">SI</span>  conjunto de componentes interrelacionados que recolectan, procesan, almacenan y distribuyen información para apoyar la toma de decisiones, la coordinación, el control y el análisis en una organización.</p>\n<p id=\"def-sic\"><strong>Sistema de Información Computarizado:</strong> SI que utiliza hardware, software, redes y bases de datos para procesar y almacenar información de manera eficiente.</p>\n<p id=\"def-ti\"><strong>Tecnología de la Información:</strong><span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Tecnología de la Información\">TI</span>  herramientas y recursos tecnológicos (computadoras, servidores, redes, software) que permiten el tratamiento automatizado de la información.</p>\n<p id=\"def-dato\"><strong>Dato vs. información:</strong> el dato es el registro bruto (ej.: \"G. 4.500.000\"); la información es el dato procesado y contextualizado (ej.: \"las ventas de agosto crecieron 8 % respecto de julio\").</p>\n<blockquote class=\"blockquote-clase\"><p>«Definiciones y conceptos. Clasificación. Tipos y usos de los sistemas de información.»</p><footer>— Plan de Estudio TIC, Unidad I (fuente institucional local).</footer></blockquote>"
      },
      {
        "titulo": "Clasificación de sistemas",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">2. Clasificación de los sistemas de información</h3>\n<h4 class=\"h4-subtema\"><strong>A. Sistemas de apoyo a las operaciones</strong></h4>\n<ul class=\"lista-viñetas\">\n<li id=\"def-tps\">Sistemas de procesamiento de transacciones (<span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Transaction Processing System (Sistema de Procesamiento de Transacciones)\">TPS</span>), que registran las operaciones diarias.</li>\n<li>Sistemas de control de procesos, que monitorean procesos físicos o industriales.</li>\n<li>Sistemas de colaboración empresarial, que facilitan la comunicación y el trabajo en equipo.</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>B. Sistemas de apoyo administrativo y gerencial</strong></h4>\n<ul class=\"lista-viñetas\">\n<li id=\"def-mis\">Sistemas de información gerencial (<span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Management Information System (Sistema de Información Gerencial)\">MIS</span>), que generan informes para la gestión.</li>\n<li id=\"def-dss\">Sistemas de apoyo a la toma de decisiones (<span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Decision Support System (Sistema de Apoyo a Decisiones)\">DSS</span>), para decisiones semiestructuradas.</li>\n<li id=\"def-eis\">Sistemas de información ejecutiva (<span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Executive Information System (Sistema de Información Ejecutiva)\">EIS</span>), con información estratégica para la alta dirección.</li>\n</ul>"
      },
      {
        "titulo": "3. Tipos y usos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"table-responsive\">\n<table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n<thead class=\"table-primary\">\n<tr>\n<th scope=\"col\">Nivel</th>\n<th scope=\"col\">Tipo de Sistema</th>\n<th scope=\"col\">Descripción</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Operativo</td>\n<td><a class=\"enlace-ancla\" href=\"#def-si\">SI</a> / <a class=\"enlace-ancla\" href=\"#def-tps\">TPS</a></td>\n<td>Registro de operaciones y transacciones diarias.</td>\n</tr>\n<tr>\n<td>Táctico</td>\n<td><a class=\"enlace-ancla\" href=\"#def-mis\">MIS</a> / <a class=\"enlace-ancla\" href=\"#def-dss\">DSS</a></td>\n<td>Informes de gestión y apoyo a decisiones.</td>\n</tr>\n<tr>\n<td>Estratégico</td>\n<td><a class=\"enlace-ancla\" href=\"#def-eis\">EIS</a></td>\n<td>Información para la alta dirección.</td>\n</tr>\n</tbody>\n</table>"
      },
      {
        "titulo": "Tecnología y sociedad",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">3. Las tecnologías de la información y la sociedad</h3>\n<p id=\"def-impactos\"><strong>Impactos positivos:</strong> acceso a la información, automatización, eficiencia y conectividad global.</p>\n<p id=\"def-desafios\"><strong>Desafíos:</strong> brecha digital, privacidad, seguridad y dependencia tecnológica.</p>"
      },
      {
        "titulo": "5. Desarrollo y ciclo de vida de los sistemas",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>El desarrollo comprende: identificación de necesidades, análisis de requerimientos, diseño, implementación y pruebas, puesta en producción y mantenimiento.</p>\n<p id=\"def-ciclo\"><strong>Ciclo de vida recorre:</strong> planificación, análisis, diseño, implementación, pruebas, instalación y uso/mantenimiento.</p>\n<p id=\"def-variables\"><strong>Variables determinantes:</strong> calidad (cumplimiento de especificaciones), recursos (personal, presupuesto, tiempo), complejidad técnica y riesgos (tecnológicos, organizacionales o de mercado).</p>"
      },
      {
        "titulo": "6. Métodos de adquisición",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ul class=\"lista-viñetas\">\n<li id=\"def-metodot\"><strong>Método tradicional:</strong> desarrollo interno, control total pero mayor tiempo y costo.</li>\n<li id=\"def-comprap\"><strong>Compra de paquetes:</strong> software comercial (ej.: <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Enterprise Resource Planning (Planificación de Recursos Empresariales)\">ERP</span>), rápida implementación con posible necesidad de adaptación.</li>\n<li id=\"def-outsourcing\"><strong>Outsourcing:</strong> contratación de terceros, acceso a expertise con riesgo de dependencia.</li>\n<li id=\"def-desarrollou\"><strong>Desarrollo por el usuario final:</strong> macros y planillas, rápido pero con riesgo de falta de estándares.</li>\n<li id=\"def-case\"><strong>CASE:</strong> <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Computer-Aided Software Engineering (Ingeniería de Software Asistida por Computadora)\">CASE</span> herramientas de software que apoyan el modelado, la generación de código, las pruebas y la documentación.</li>\n</ul>"
      },
      {
        "titulo": "7. Calidad, diseño, pruebas y mantenimiento",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ul class=\"lista-viñetas\">\n<li id=\"def-calidad\"><strong>Aseguramiento de la calidad total:</strong> revisiones, pruebas, auditorías y mejora continua (normas ISO 9001 e ISO/IEC 25000).</li>\n<li id=\"def-dfd\"><strong>DFD:</strong> <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Data Flow Diagram (Diagrama de Flujo de Datos)\">DFD</span> entidades externas, procesos, flujos y almacenes de datos.</li>\n<li id=\"def-er\"><strong>ER:</strong> <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Entity Relationship (Entidad-Relación)\">ER</span> modelado de bases de datos; más manuales y diccionarios de datos.</li>\n<li id=\"def-pruebas\"><strong>Pruebas:</strong> unitarias, de integración, de sistema y de aceptación.</li>\n<li id=\"def-mantenimiento\"><strong>Mantenimiento:</strong> correctivo, preventivo, adaptativo y perfectivo.</li>\n</ul>"
      },
      {
        "titulo": "Revisión General A",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Revisa la <a class=\"enlace-ancla\" href=\"#def-ti\">TI</a>, el <a class=\"enlace-ancla\" href=\"#def-si\">SI</a>, y las variables en el <a class=\"enlace-ancla\" href=\"#def-ciclo\">ciclo de vida</a> de los sistemas.</p>"
      },
      {
        "titulo": "Revisión General B",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Refuerza los conceptos de <a class=\"enlace-ancla\" href=\"#def-metodot\">Método tradicional</a> y <a class=\"enlace-ancla\" href=\"#def-outsourcing\">Outsourcing</a>.</p>"
      },
      {
        "titulo": "Revisión General C",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Asegura la comprensión de <a class=\"enlace-ancla\" href=\"#def-calidad\">Aseguramiento de la calidad total</a> y <a class=\"enlace-ancla\" href=\"#def-pruebas\">Pruebas</a>.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Laudon, K. C., &amp; Laudon, J. P. (2020). <em>Management Information Systems...</em> Pearson.</li><li>Turban, E. et al. (2018). <em>Information Technology for Management...</em> Wiley.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>O'Brien, J. A. &amp; Marakas, G. M. (2011). <em>...</em> McGraw-Hill.</li><li>Cohen, L. et al. (2000). <em>...</em></li></ul></div>"
      }
    ]
  },
  {
    "numero": 2,
    "titulo": "La Estrategia de Negocios a través de Tecnologías de Información",
    "resumen": "La estrategia en los negocios. Ventajas competitivas y los sistemas de información. Impulsos estratégicos. Fuerzas de la industria. Los sistemas de información estratégicos en la organización. Implantación de sistemas estratégicos. Reingeniería de procesos. Tecnologías de vanguardia en los negocios.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>La estrategia en los negocios. Ventajas competitivas y los sistemas de información. Impulsos estratégicos. Fuerzas de la industria. Los sistemas de información estratégicos en la organización. Implantación de sistemas estratégicos. Reingeniería de procesos. Tecnologías de vanguardia en los negocios.</p>"
      },
      {
        "titulo": "1. La estrategia en los negocios y la ventaja competitiva",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p id=\"def-estrategia\"><strong>Estrategia empresarial:</strong> conjunto de decisiones y acciones planificadas para alcanzar objetivos de largo plazo en un entorno competitivo. La <strong>ventaja competitiva</strong> es una diferenciación positiva, percibida por el cliente y perdurable: reducción de costos, diferenciación, enfoque e innovación.</p>\n<p id=\"def-objetivos-si\"><strong>Objetivos estratégicos de los SI:</strong> excelencia operativa; nuevos productos, servicios y modelos de negocio; relaciones estrechas con clientes y proveedores; mejor toma de decisiones; ventaja competitiva; y supervivencia en el mercado.</p>\n<blockquote class=\"blockquote-clase\"><p>«La estrategia en los negocios. Ventajas competitivas y los sistemas de información.»</p><footer>— Plan de Estudio TIC, Unidad II (fuente institucional local).</footer></blockquote>"
      },
      {
        "titulo": "2. Impulsos estratégicos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Iniciativas con las que las TI transforman la posición competitiva: automatización de procesos críticos, integración de la cadena de suministro, canales digitales de venta, inteligencia de negocios y adopción de tecnologías emergentes (nube, IA, IoT).</p>"
      },
      {
        "titulo": "3. Fuerzas de la industria (Porter)",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"table-responsive\">\n<table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n<thead class=\"table-primary\">\n<tr>\n<th scope=\"col\">Fuerza</th>\n<th scope=\"col\">Uso de las TI</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Rivalidad entre competidores</td>\n<td>Análisis competitivo y CRM avanzado</td>\n</tr>\n<tr>\n<td>Amenaza de nuevos entrantes</td>\n<td>Plataformas con altos costos de migración</td>\n</tr>\n<tr>\n<td>Productos sustitutos</td>\n<td>Recomendación y personalización</td>\n</tr>\n<tr>\n<td>Poder de proveedores</td>\n<td>Gestión de cadena de suministro (SCM)</td>\n</tr>\n<tr>\n<td>Poder de clientes</td>\n<td>Autoservicio y fidelización digital</td>\n</tr>\n</tbody>\n</table>"
      },
      {
        "titulo": "4. Sistemas de información estratégicos (SIE)",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p id=\"def-sie\">Modifican la manera de dirigir el negocio: están alineados con la estrategia, cambian procesos o relaciones y son difíciles de imitar. Ejemplos: <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Customer Relationship Management\">CRM</span>, <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Enterprise Resource Planning\">ERP</span>, comercio electrónico, inteligencia de negocios y plataformas de ecosistema.</p>"
      },
      {
        "titulo": "5. Implantación de sistemas estratégicos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p id=\"def-implantacion\"><strong>Fases:</strong> análisis estratégico, diseño, desarrollo o adquisición, implementación y evaluación.</p>\n<p id=\"def-factores\"><strong>Factores críticos:</strong> compromiso de la alta dirección, alineación TI-negocio, gestión del cambio e inversión sostenida en tecnología y talento.</p>"
      },
      {
        "titulo": "6. Reingeniería de procesos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p id=\"def-reingenieria\">Replanteo fundamental y rediseño radical para mejoras sustanciales en costo, calidad, servicio y rapidez: enfoque en procesos, eliminación de lo que no agrega valor, uso intensivo de tecnología y rediseño desde cero.</p>\n<p>Las TI aportan automatización, integración, nuevos canales y decisiones en tiempo real.</p>"
      },
      {
        "titulo": "7. Tecnologías de vanguardia",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ul class=\"lista-viñetas\">\n<li><strong>Nube:</strong> servicios bajo demanda sin infraestructura propia.</li>\n<li><strong>Inteligencia artificial y machine learning:</strong> modelos predictivos y automatización inteligente.</li>\n<li><strong>IoT:</strong> dispositivos conectados para datos en tiempo real.</li>\n<li><strong>Blockchain:</strong> registro distribuido e inmutable.</li>\n<li><strong>Big data y analítica:</strong> procesamiento de grandes volúmenes para decisiones.</li>\n<li><strong>RPA:</strong> automatización robótica de procesos.</li>\n<li><strong>Realidad aumentada/virtual:</strong> experiencias inmersivas.</li>\n</ul>\n<p><strong>Impacto:</strong> nuevos modelos de negocio, mejor experiencia del cliente, operaciones optimizadas e innovación continua.</p>"
      },
      {
        "titulo": "Autoevaluación: Tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> Defina ventaja competitiva y dé un ejemplo habilitado por TI.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Diferenciación percibida por el cliente y durable; ej.: CRM o tienda online propia.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> Enumere las 5 fuerzas de Porter.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Rivalidad, nuevos entrantes, sustitutos, proveedores y clientes.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Qué distingue a un SIE de un sistema común?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Alineado a la estrategia, cambia el negocio y es difícil de imitar.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> Mencione tres factores críticos de implantación.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Compromiso directivo, alineación TI-negocio y gestión del cambio.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> ¿Qué papel juegan las TI en la reingeniería?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Automatizar, integrar sistemas, abrir nuevos canales y operar en tiempo real.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Laudon, K. C., &amp; Laudon, J. P. (2020). <em>Management Information Systems...</em> Pearson.</li><li>Porter, M. (1980). <em>Competitive Strategy</em>. New York: Free Press.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. McGraw-Hill.</li><li>O'Brien, J. A. &amp; Marakas, G. M. (2011). <em>...</em> McGraw-Hill.</li></ul></div>"
      }
    ]
  },
  {
    "numero": 3,
    "titulo": "Fundamentos de Administración de Bases de Datos",
    "resumen": "Archivos convencionales. Definición de base de datos. Ventajas en el uso de base de datos. El manejo del sistema de base de datos (DBMS). El administrador de la base de datos (DBA). Tipos de modelos de base de datos. Bases de datos distribuidas. Data warehouse.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Archivos convencionales. Definición de base de datos. Ventajas en el uso de base de datos. El manejo del sistema de base de datos (DBMS). El administrador de la base de datos (DBA). Tipos de modelos de base de datos. Bases de datos distribuidas. Data warehouse.</p>"
      },
      {
        "titulo": "1. Archivos convencionales",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Conjuntos de registros gestionados por cada aplicación, sin integración centralizada y con acceso secuencial o indexado.</p>\n                        <p><strong>Limitaciones:</strong> redundancia, inconsistencia, dificultad de acceso, seguridad limitada y falta de integridad automática.</p>"
      },
      {
        "titulo": "2. Definición de base de datos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Conjunto de datos relacionados y organizados para facilitar acceso, gestión y actualización.</p>\n                        <p><strong>Elementos:</strong> datos, metadatos, tablas/registros/campos y relaciones.</p>"
      },
      {
        "titulo": "3. Ventajas del uso de bases de datos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"table-responsive\">\n                            <table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n                                <thead class=\"table-primary\">\n                                    <tr><th>Ventaja</th><th>Descripción</th></tr>\n                                </thead>\n                                <tbody>\n                                    <tr><td>Menor redundancia</td><td>Datos almacenados una sola vez</td></tr>\n                                    <tr><td>Consistencia</td><td>Actualizaciones centralizadas</td></tr>\n                                    <tr><td>Compartición</td><td>Múltiples usuarios y aplicaciones</td></tr>\n                                    <tr><td>Integridad y seguridad</td><td>Validación y control de acceso</td></tr>\n                                    <tr><td>Concurrencia e independencia</td><td>Trabajo simultáneo y separación lógica/física</td></tr>\n                                    <tr><td>Recuperación</td><td>Respaldo y restauración ante fallos</td></tr>\n                                </tbody>\n                            </table>"
      },
      {
        "titulo": "4. DBMS: manejo del sistema de base de datos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Funciones:</strong> definición (DDL), manipulación (DML), control de acceso, transacciones ACID, optimización de consultas, y respaldo/recuperación.</p>\n                        <p><strong>Componentes:</strong> DDL, DML, motor de almacenamiento, gestor de transacciones y catálogo de metadatos.</p>\n                        <p><strong>Ejemplos:</strong> MySQL, PostgreSQL, Oracle, SQL Server, MongoDB y servicios en la nube.</p>"
      },
      {
        "titulo": "5. El administrador de la base de datos (DBA)",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Funciones:</strong> diseño e implementación, seguridad, respaldo y recuperación, optimización, monitoreo, mantenimiento, gestión de usuarios, documentación y planes de contingencia.</p>\n                        <p><strong>Tipos:</strong> de sistemas, de desarrollo, de aplicaciones y arquitecto de datos.</p>"
      },
      {
        "titulo": "6. Modelos, distribución y data warehouse",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Modelos:</strong> jerárquico, de red, relacional (tablas + SQL), orientado a objetos, documental, multidimensional, deductivo y transaccional.</p>\n                        <p><strong>Distribuidas:</strong> datos en múltiples nodos con transparencia, autonomía y replicación; ganan disponibilidad y escalabilidad, con desafíos de consistencia, complejidad y costo.</p>\n                        <p><strong>Data warehouse:</strong> repositorio integrado, histórico y no volátil para análisis (ETL + BI); a diferencia de la BD transaccional (OLTP), se optimiza para lectura (OLAP).</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> Cite tres limitaciones de los archivos convencionales.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Redundancia, inconsistencia y acceso difícil.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> ¿Qué significan las siglas DBMS, DDL, DML y ACID?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> DBMS gestiona la BD; DDL define, DML manipula; ACID: atomicidad, consistencia, aislamiento y durabilidad.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> Mencione tres funciones del DBA.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Seguridad, respaldo y recuperación, y optimización.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> Diferencie el modelo relacional del documental.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Tablas con SQL vs. documentos JSON flexibles.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> Compare una BD transaccional con un data warehouse.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Operaciones diarias vs. análisis histórico consolidado.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n                            <svg viewBox=\"0 0 460 220\" width=\"100%\" style=\"max-width:460px\" role=\"img\" aria-label=\"Capas de un sistema de base de datos\">\n                                <defs><marker id=\"fl3\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"4\" orient=\"auto\"><polygon points=\"0,0 8,4 0,8\" fill=\"#C5A55A\"/></marker></defs>\n                                <g font-size=\"11\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n                                    <rect x=\"110\" y=\"8\" width=\"240\" height=\"48\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"230\" y=\"28\">Usuarios y aplicaciones</text><text x=\"230\" y=\"44\" font-size=\"9\" fill=\"#007A33\">consultas y programas</text>\n                                    <rect x=\"110\" y=\"86\" width=\"240\" height=\"48\" rx=\"8\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"230\" y=\"106\" fill=\"#fff\" font-weight=\"bold\">DBMS</text><text x=\"230\" y=\"122\" fill=\"#fff\" font-size=\"9\">DDL · DML · transacciones</text>\n                                    <rect x=\"110\" y=\"164\" width=\"240\" height=\"48\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"230\" y=\"184\">Base de datos</text><text x=\"230\" y=\"200\" font-size=\"9\" fill=\"#8a6d2b\">tablas y relaciones</text>\n                                    <g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"230\" y1=\"56\" x2=\"230\" y2=\"83\" marker-end=\"url(#fl3)\"/><line x1=\"230\" y1=\"134\" x2=\"230\" y2=\"161\" marker-end=\"url(#fl3)\"/></g>\n                                </g>\n                                <text x=\"230\" y=\"250\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 3. Capas de un sistema de base de datos</text>\n                            </svg>\n                        </figure>\n                        <p class=\"small\"><strong>Secuencia sugerida:</strong> Archivos → Base de datos → DBMS → DBA → Modelos → Data warehouse.</p>"
      },
      {
        "titulo": "Fuentes consultadas",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ol class=\"small\">\n                            <li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li>\n                            <li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li>\n                            <li>Documentación oficial de MySQL y PostgreSQL (lenguaje SQL y administración).</li>\n                        </ol>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4>\n                    <ul>\n                        <li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. McGraw-Hill.</li>\n                        <li>Laudon, K. C. & Laudon, J. P. (2020). <em>Management Information Systems</em>. Pearson.</li>\n                    </ul>\n                    <h4 class=\"h4-subtema\">Bibliografía Complementaria</h4>\n                    <ul>\n                        <li>Documentación oficial de MySQL (https://dev.mysql.com/doc/).</li>\n                        <li>Documentación oficial de PostgreSQL (https://www.postgresql.org/docs/).</li>\n                    </ul></div>"
      }
    ]
  },
  {
    "numero": 4,
    "titulo": "Sistemas Integrados de Gestión",
    "resumen": "Sistemas integradores de la administración de empresas o Enterprise Resource Planning (ERP). Actualización, costos de las tecnologías de la información. Determinación de requerimientos. Evaluación técnica de propuestas. Evaluación financiera de las propuestas. Actividades posteriores a la firma del contrato.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Sistemas integradores de la administración de empresas o Enterprise Resource Planning (ERP). Actualización, costos de las tecnologías de la información. Determinación de requerimientos. Evaluación técnica de propuestas. Evaluación financiera de las propuestas. Actividades posteriores a la firma del contrato.</p>"
      },
      {
        "titulo": "1. Sistemas ERP",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p id=\"def-erp\"><strong>ERP (Enterprise Resource Planning):</strong> gestión integrada de los procesos empresariales en tiempo real sobre una base de datos centralizada.</p>\n<h4 class=\"h4-subtema\"><strong>Características</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Integración total</li>\n<li>Dato único</li>\n<li>Tiempo real</li>\n<li>Automatización</li>\n<li>Modularidad</li>\n<li>Personalización</li>\n<li>Seguridad y escalabilidad</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Módulos típicos</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Finanzas y contabilidad</li>\n<li>Recursos humanos</li>\n<li>Logística y cadena de suministro</li>\n<li>Ventas y marketing</li>\n<li>Producción</li>\n<li>Proyectos e inteligencia de negocios</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Beneficios</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Información integrada</li>\n<li>Menores costos</li>\n<li>Mejores decisiones</li>\n<li>Automatización</li>\n<li>Visibilidad en tiempo real y trazabilidad</li>\n</ul>\n<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 540 230\" width=\"100%\" style=\"max-width:540px\" role=\"img\" aria-label=\"Módulos de un ERP alrededor de la base central\">\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"200\" y=\"88\" width=\"140\" height=\"54\" rx=\"10\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"270\" y=\"110\" fill=\"#fff\" font-weight=\"bold\">BASE CENTRAL</text><text x=\"270\" y=\"126\" fill=\"#fff\" font-size=\"9\">dato único</text>\n<rect x=\"30\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"46\">Finanzas</text>\n<rect x=\"380\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"445\" y=\"46\">RR. HH.</text>\n<rect x=\"30\" y=\"166\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"192\">Logística</text>\n<rect x=\"380\" y=\"166\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"445\" y=\"192\">Ventas</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"130\" y1=\"64\" x2=\"215\" y2=\"92\"/><line x1=\"410\" y1=\"64\" x2=\"325\" y2=\"92\"/><line x1=\"130\" y1=\"166\" x2=\"215\" y2=\"138\"/><line x1=\"410\" y1=\"166\" x2=\"325\" y2=\"138\"/></g>\n</g>\n<text x=\"270\" y=\"224\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 4. ERP: módulos integrados sobre una base central</text>\n</svg>\n</figure>"
      },
      {
        "titulo": "2. Actualización y costos de TI",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h4 class=\"h4-subtema\"><strong>Categorías de costo</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Licencias</li>\n<li>Hardware</li>\n<li>Implementación y consultoría</li>\n<li>Migración de datos</li>\n<li>Integraciones</li>\n<li>Capacitación</li>\n<li>Mantenimiento y desarrollos a medida</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Modelos</strong></h4>\n<ul class=\"lista-viñetas\">\n<li id=\"def-onpremise\"><strong>On-premise:</strong> mayor CAPEX, control total.</li>\n<li id=\"def-saas\"><strong>SaaS en la nube:</strong> OPEX recurrente, escalable.</li>\n<li><strong>Híbrido:</strong> combinación de ambos.</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>TCO (Total Cost of Ownership)</strong></h4>\n<p>Suma de adquisición, implementación, operación, mantenimiento, actualización y costos de oportunidad durante el ciclo de vida.</p>"
      },
      {
        "titulo": "3. Determinación de requerimientos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ul class=\"lista-viñetas\">\n<li>Análisis de procesos actuales y cuellos de botella</li>\n<li>Requisitos funcionales (módulos y funcionalidades por área)</li>\n<li>Requisitos técnicos (infraestructura, integraciones, seguridad, escalabilidad)</li>\n<li>Priorización crítico vs. deseable</li>\n<li>Documento <span class=\"sigla\" data-bs-toggle=\"tooltip\" title=\"Request for Proposal (Solicitud de Propuestas)\">RFP</span> considerando tamaño, sector, usuarios concurrentes, movilidad, idiomas y presupuesto</li>\n</ul>"
      },
      {
        "titulo": "4. Evaluación técnica de propuestas",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h4 class=\"h4-subtema\"><strong>Criterios de evaluación</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Funcionalidad</li>\n<li>Arquitectura</li>\n<li>Escalabilidad</li>\n<li>Integración</li>\n<li>Usabilidad</li>\n<li>Seguridad</li>\n<li>Soporte</li>\n<li>Referencias y proveedor</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Metodología</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Demos con escenarios reales</li>\n<li>Pruebas piloto</li>\n<li>Visitas a referencias</li>\n<li>Matriz de decisión ponderada</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Proveedores</strong></h4>\n<p>SAP, Oracle, Microsoft Dynamics, Infor, Epicor, Odoo y Zoho.</p>"
      },
      {
        "titulo": "5. Evaluación financiera",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h4 class=\"h4-subtema\"><strong>Indicadores</strong></h4>\n<ul class=\"lista-viñetas\">\n<li id=\"def-van\"><strong>VAN (Valor Actual Neto):</strong> mayor a 0 → viable.</li>\n<li id=\"def-tir\"><strong>TIR (Tasa Interna de Retorno):</strong> mayor a la tasa de oportunidad.</li>\n<li id=\"def-payback\"><strong>Payback:</strong> menor es mejor.</li>\n<li><strong>ROI</strong> y <strong>TCO</strong></li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Estimación</strong></h4>\n<p><strong>Costos:</strong> inversión, operación, oportunidad.</p>\n<p><strong>Beneficios:</strong> menores costos, productividad, menos errores, mejor servicio.</p>\n<p><strong>Análisis de sensibilidad:</strong> optimista / base / pesimista.</p>"
      },
      {
        "titulo": "6. Actividades posteriores al contrato",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ul class=\"lista-viñetas\">\n<li>Capacitación por roles</li>\n<li>Migración y limpieza de datos, carga histórica</li>\n<li>Configuración y personalización</li>\n<li>Pruebas (unitarias, integración, rendimiento, aceptación)</li>\n<li>Puesta en marcha (por fases o big bang)</li>\n<li>Soporte post-implementación</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Factores críticos</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Compromiso directivo</li>\n<li>Gestión del cambio</li>\n<li>Comunicación</li>\n<li>Plan con hitos</li>\n<li>Equipo dedicado</li>\n<li>Capacitación oportuna</li>\n</ul>\n<p class=\"small mt-3\"><strong>Secuencia sugerida:</strong> ERP → Costos y TCO → Requerimientos → Evaluación → Post-contrato.</p>"
      },
      {
        "titulo": "Autoevaluación: Tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> Defina ERP y mencione cuatro módulos.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Gestión integrada en tiempo real; finanzas, RRHH, logística y ventas.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> ¿Qué incluye el TCO?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Adquisición, implementación, operación, mantenimiento y actualización.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Qué contiene un RFP?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Documento para solicitar propuestas a proveedores.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> Diferencie VAN, TIR y Payback.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> VAN mayor a 0 viable; TIR mayor a la tasa; Payback es el tiempo de recupero.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> Enumere tres actividades post-contrato.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Capacitación, migración de datos y pruebas.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria.</li><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Documentación de SAP S/4HANA y Oracle ERP Cloud (módulos e implantación).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 5,
    "titulo": "Tecnologías de la Información. Hardware y Software",
    "resumen": "La computadora: definición, componentes básicos y clasificación. Concepto de software.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>La computadora: definición, componentes básicos y clasificación. Concepto de software.</p>"
      },
      {
        "titulo": "1. La computadora: definición y características",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Máquina electrónica capaz de recibir, procesar y almacenar datos y ejecutar instrucciones programadas de forma automática y rápida. Es <strong>electrónica, programable, automática, versátil y rápida</strong>.</p>"
      },
      {
        "titulo": "2. Hardware básico y complementario",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"table-responsive\">\n<table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n<thead class=\"table-primary\">\n<tr>\n<th scope=\"col\">Componente</th>\n<th scope=\"col\">Función</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>CPU</td>\n<td>Procesa instrucciones; «cerebro» del sistema (registros, ALU, unidad de control)</td>\n</tr>\n<tr>\n<td>RAM</td>\n<td>Almacenamiento temporal; se borra al apagar</td>\n</tr>\n<tr>\n<td>ROM</td>\n<td>Instrucciones básicas de arranque</td>\n</tr>\n<tr>\n<td>Placa madre</td>\n<td>Conecta todos los componentes</td>\n</tr>\n<tr>\n<td>Entrada / Salida</td>\n<td>Teclado, ratón, escáner / monitor, impresora, altavoces</td>\n</tr>\n<tr>\n<td>Almacenamiento</td>\n<td>HDD, SSD, unidades ópticas</td>\n</tr>\n<tr>\n<td>Fuente</td>\n<td>Suministro de energía</td>\n</tr>\n</tbody>\n</table>"
      },
      {
        "titulo": "3. Clasificación de las computadoras",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Por tamaño:</strong> supercomputadoras, mainframes, minicomputadoras y microcomputadoras. <strong>Por uso:</strong> PC, servidores, móviles y embebidas. <strong>Por arquitectura:</strong> analógicas, digitales (binarias) e híbridas.</p>"
      },
      {
        "titulo": "4. Concepto de software",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Conjunto de programas, instrucciones, reglas, documentación y datos. Es <strong>intangible, instruccional, funcional, dependiente del hardware, modificable</strong> y requerido: sin software el hardware es inútil.</p>"
      },
      {
        "titulo": "5. Tipos de software",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h5 class=\"mt-2 mb-2\" style=\"color:#007A33;\">A. Por función: ¿para qué sirve?</h5>\n<div class=\"table-responsive\">\n<table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n<thead class=\"table-primary\">\n<tr>\n<th scope=\"col\">Tipo</th>\n<th scope=\"col\">Qué hace</th>\n<th scope=\"col\">Ejemplos</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><strong>De sistema</strong></td>\n<td>Gestiona el hardware y da soporte a otros programas</td>\n<td>Sistemas operativos (Windows, Linux, Android), drivers, utilitarios</td>\n</tr>\n<tr>\n<td><strong>De programación</strong></td>\n<td>Herramientas para crear programas</td>\n<td>Editores, compiladores, intérpretes, depuradores, IDE</td>\n</tr>\n<tr>\n<td><strong>De aplicación</strong></td>\n<td>Tareas del usuario final</td>\n<td>Ofimática, navegadores, multimedia, comunicación, educación, negocios, diseño, videojuegos, seguridad</td>\n</tr>\n</tbody>\n</table>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> Diferencie RAM de ROM.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> RAM: temporal, se borra al apagar. ROM: arranque, permanente.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> Clasifique: servidor, smartphone y mainframe.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Servidor: provee servicios. Smartphone: móvil. Mainframe: múltiples usuarios.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Qué hace un sistema operativo?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Gestiona recursos, da interfaz y soporta otros programas.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> Diferencie software libre de SaaS.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Libre: código abierto. SaaS: nube por suscripción.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> Dé dos ejemplos de software de aplicación de negocios.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> ERP y CRM (o software contable).\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 540 210\" width=\"100%\" style=\"max-width:540px\" role=\"img\" aria-label=\"Bloques de una computadora\">\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"205\" y=\"78\" width=\"130\" height=\"54\" rx=\"10\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"270\" y=\"100\" fill=\"#fff\" font-weight=\"bold\">CPU</text><text x=\"270\" y=\"116\" fill=\"#fff\" font-size=\"9\">registros → ALU → CU</text>\n<rect x=\"30\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"46\">RAM / ROM</text>\n<rect x=\"380\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"445\" y=\"46\">Entrada</text>\n<rect x=\"30\" y=\"146\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"172\">Salida</text>\n<rect x=\"380\" y=\"146\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"445\" y=\"172\">Disco</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"130\" y1=\"64\" x2=\"215\" y2=\"92\"/><line x1=\"410\" y1=\"64\" x2=\"325\" y2=\"92\"/><line x1=\"130\" y1=\"146\" x2=\"215\" y2=\"132\"/><line x1=\"410\" y1=\"146\" x2=\"325\" y2=\"132\"/></g>\n</g>\n<text x=\"270\" y=\"204\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 5. Bloques de una computadora alrededor del CPU</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> Definición → Hardware → Clasificación → Software.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Documentación oficial de Microsoft Windows y del kernel Linux (sistemas operativos).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 6,
    "titulo": "Infraestructura de Redes y Sistemas Empresariales",
    "resumen": "Comunicación de datos. Hardware de apoyo a la comunicación. Conectividad. Redes computacionales. Internet. Dominios de internet. Servicios en internet. Intranet. Extranet. Protocolos inalámbricos para internet.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Comunicación de datos. Hardware de apoyo a la comunicación. Conectividad. Redes computacionales. Internet. Dominios de internet. Servicios en internet. Intranet. Extranet. Protocolos inalámbricos para internet.</p>"
      },
      {
        "titulo": "Comunicación de datos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">1. Comunicación de datos</h3>\n<p>Intercambio entre dispositivos mediante un medio y reglas comunes: <strong>emisor → medio → receptor</strong>, con mensaje (texto, imagen, audio, video, registros) y protocolo. Los datos viajan en <strong>bits</strong> (8 bits = 1 byte); la velocidad se mide en Kbps/Mbps/Gbps (no confundir MB con Mb). El <strong>ancho de banda</strong> es la capacidad y la <strong>latencia</strong> el retardo: son variables distintas.</p>"
      },
      {
        "titulo": "Hardware de apoyo y conectividad",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">2. Hardware de apoyo y conectividad</h3>\n<p><strong>NIC</strong> (Ethernet/Wi-Fi), <strong>switch</strong> (conecta dispositivos dentro de la red), <strong>router</strong> (comunica redes distintas), punto de acceso, módem y <strong>servidores</strong> (archivos, web, correo, aplicaciones, BD). La <strong>conectividad</strong> permite que sucursales, sistemas y la base central intercambien información consolidada.</p>"
      },
      {
        "titulo": "3. Redes: clasificación y topologías",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">3. Redes: clasificación y topologías</h3>\n<p><strong>PAN</strong> (personal, ej.: Bluetooth), <strong>LAN</strong> (oficina), <strong>MAN</strong> (ciudad) y <strong>WAN</strong> (países). <strong>Topologías:</strong> estrella, bus, anillo y malla. Modelo <strong>cliente-servidor:</strong> el cliente solicita y el servidor responde.</p>"
      },
      {
        "titulo": "Internet, dominios y servicios",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">4. Internet, dominios y servicios</h3>\n<p><strong>Internet</strong> es la infraestructura global; la <strong>Web</strong> es un servicio sobre ella. Direccionamiento <strong>IPv4/IPv6</strong>; <strong>dominios</strong> (ej.: ventas.empresa.com, .py en Paraguay) resueltos por <strong>DNS</strong>. <strong>Servicios:</strong> web, correo, transferencia de archivos, videoconferencia, mensajería, nube y comercio electrónico. En la empresa: comunicación, marketing, ventas, administración, atención y trabajo remoto.</p>"
      },
      {
        "titulo": "Intranet, Extranet y protocolos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">5. Intranet, Extranet y protocolos</h3>\n<p><strong>Intranet:</strong> entorno privado interno. <strong>Extranet:</strong> acceso controlado para proveedores/clientes autorizados. <strong>TCP/IP:</strong> direccionamiento y transporte confiable. <strong>HTTP/HTTPS:</strong> web, con TLS para proteger contraseñas, pagos y documentos. <strong>Inalámbricos:</strong> Wi-Fi, Bluetooth y redes móviles (4G/5G). <strong>Cableada</strong> (estable, predecible) vs. <strong>inalámbrica</strong> (móvil, flexible): suelen combinarse. <strong>Seguridad mínima:</strong> autenticación, permisos, actualizaciones, cifrado, segmentación, copias y monitoreo.</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> ¿Qué conecta un switch y qué comunica un router?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Switch dentro de la red; router entre redes.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> ¿Qué red corresponde a una oficina?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> LAN.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Qué resuelve el DNS?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Nombres de dominio a direcciones.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> Diferencie Intranet de Extranet.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Interna de empleados vs. acceso controlado a externos autorizados.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> Si hay gran ancho de banda pero demora en responder, ¿qué variable falla?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Latencia.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 660 150\" width=\"100%\" role=\"img\" aria-label=\"De la red local a Internet\">\n<defs><marker id=\"fl6\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"4\" orient=\"auto\"><polygon points=\"0,0 8,4 0,8\" fill=\"#C5A55A\"/></marker></defs>\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"6\" y=\"48\" width=\"120\" height=\"54\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"66\" y=\"70\">Red LAN</text><text x=\"66\" y=\"86\" font-size=\"9\" fill=\"#007A33\">switch · Wi-Fi</text>\n<rect x=\"186\" y=\"48\" width=\"120\" height=\"54\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"246\" y=\"70\">Router</text><text x=\"246\" y=\"86\" font-size=\"9\" fill=\"#007A33\">entre redes</text>\n<ellipse cx=\"426\" cy=\"75\" rx=\"90\" ry=\"42\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"426\" y=\"72\" fill=\"#fff\" font-weight=\"bold\">INTERNET</text><text x=\"426\" y=\"88\" fill=\"#fff\" font-size=\"9\">TCP/IP · DNS</text>\n<rect x=\"536\" y=\"28\" width=\"118\" height=\"40\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"595\" y=\"52\" font-size=\"9\">Intranet</text>\n<rect x=\"536\" y=\"82\" width=\"118\" height=\"40\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"595\" y=\"106\" font-size=\"9\">Extranet</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"126\" y1=\"75\" x2=\"183\" y2=\"75\" marker-end=\"url(#fl6)\"/><line x1=\"306\" y1=\"75\" x2=\"333\" y2=\"75\" marker-end=\"url(#fl6)\"/></g>\n</g>\n<text x=\"330\" y=\"142\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 6. De la red local a Internet, Intranet y Extranet</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> Datos → Red → Internet → Intranet/Extranet → Seguridad.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Caso Comercial Centuria S.A.: integración multisucursal (material de la unidad).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 7,
    "titulo": "Tecnologías de Apoyo a la Toma de Decisiones",
    "resumen": "Plataforma de sistemas transaccionales. El proceso de toma de decisiones. Definición y tipos de sistemas de apoyo a las decisiones. Características de los sistemas de apoyo para la toma de decisiones (DSS). Caso de aplicación de un DSS. Sistemas de apoyo para la toma de decisiones en grupo (GDSS). Características de los GDSS. Ventajas y desventajas del uso de GDSS. Diseño de salas. Usos prácticos de un GDSS. Casos de aplicación. Inteligencia artificial. Sistemas expertos. Beneficios que genera el uso de sistemas expertos y costos que involucra. El generador de sistemas expertos o Shell. Selección de aplicaciones para sistemas expertos.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Plataforma de sistemas transaccionales. El proceso de toma de decisiones. Definición y tipos de sistemas de apoyo a las decisiones. Características de los sistemas de apoyo para la toma de decisiones (DSS). Caso de aplicación de un DSS. Sistemas de apoyo para la toma de decisiones en grupo (GDSS). Características de los GDSS. Ventajas y desventajas del uso de GDSS. Diseño de salas. Usos prácticos de un GDSS. Casos de aplicación. Inteligencia artificial. Sistemas expertos. Beneficios que genera el uso de sistemas expertos y costos que involucra. El generador de sistemas expertos o Shell. Selección de aplicaciones para sistemas expertos.</p>"
      },
      {
        "titulo": "1. De registrar datos a decidir",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Los TPS registran operaciones (ventas, facturas, pagos, inventarios). Miles de operaciones acumuladas permiten analizar productos, clientes, horarios y tendencias.</p>\n<p><strong>Cadena de valor:</strong> transacciones → datos → BD → análisis → información → alternativas → decisión → acción.</p>\n<p>La tecnología mejora la información de quien decide; no siempre decide por sí misma.</p>"
      },
      {
        "titulo": "2. Proceso y tipos de decisión",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Etapas:</strong> identificación del problema, recolección de información, análisis, generación y evaluación de alternativas, selección, implementación y evaluación de resultados.</p>\n<p><strong>Tipos de decisión:</strong></p>\n<ul class=\"lista-viñetas\">\n<li><strong>Estructuradas:</strong> automatizables (ej.: reposición por mínimo).</li>\n<li><strong>Semiestructuradas:</strong> datos + juicio (ej.: cuánto comprar).</li>\n<li><strong>No estructuradas:</strong> ej.: ingresar a un nuevo mercado.</li>\n</ul>"
      },
      {
        "titulo": "3. DSS: apoyo a la decisión",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>DSS (Decision Support System):</strong> integra datos, modelos, software e interfaz para el decisor.</p>\n<p><strong>Herramientas:</strong> análisis <strong>what-if</strong> (¿qué pasaría si...?), sensibilidad y escenarios (optimista/probable/pesimista).</p>\n<p><strong>Caso:</strong> elegir sucursal comparando población, alquiler, competencia y ventas, simulando variaciones antes de invertir.</p>\n<p>Un DSS <strong>apoya</strong>, no sustituye automáticamente al gerente.</p>"
      },
      {
        "titulo": "4. GDSS: decisiones en grupo",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>GDSS:</strong> facilita decisiones colectivas (documentos, propuestas, votación, comparación, colaboración a distancia).</p>\n<p><strong>Ventajas:</strong> más alternativas, registro y estructuración.</p>\n<p><strong>Desventajas:</strong> resistencia, conflictos, dependencia y costos.</p>\n<p><strong>Salas:</strong> computadoras, pantalla, conectividad y software colaborativo (hoy también virtuales).</p>\n<p><strong>Usos:</strong> planificación, presupuestos, proveedores, proyectos y riesgos.</p>"
      },
      {
        "titulo": "5. Inteligencia artificial y sistemas expertos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>IA:</strong> reconocimiento, clasificación, predicción y recomendaciones (demanda, fraude, clientes).</p>\n<p><strong>Sistema experto:</strong> base de conocimiento + motor de inferencia + interfaz; ej.: SI liquidez baja Y endeudamiento alto ENTONCES riesgo elevado.</p>\n<p><strong>Beneficios:</strong> conserva conocimiento, consistencia y apoyo a no expertos.</p>\n<p><strong>Costos:</strong> adquisición, validación, actualización y mantenimiento.</p>\n<p><strong>Shell:</strong> entorno para construirlos sin partir de cero.</p>\n<p><strong>Selección:</strong> conocimiento identificable, reglas claras, problema repetitivo y valor económico.</p>\n<p><strong>Evolución:</strong> TPS → MIS → DSS → GDSS → IA.</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> ¿Qué registra un TPS?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Transacciones operativas.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> ¿Qué caracteriza a un DSS?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Apoya el análisis y evaluación de alternativas.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> Modificar el precio en un modelo para ver la utilidad es...\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Análisis what-if.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> ¿A qué se orienta un GDSS?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Decisiones grupales.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> ¿Qué hace el motor de inferencia?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Aplica reglas para concluir.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 660 140\" width=\"100%\" role=\"img\" aria-label=\"Del registro a la decisión\">\n<defs><marker id=\"fl7\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"4\" orient=\"auto\"><polygon points=\"0,0 8,4 0,8\" fill=\"#C5A55A\"/></marker></defs>\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"6\" y=\"28\" width=\"110\" height=\"48\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"61\" y=\"48\">TPS</text><text x=\"61\" y=\"63\" font-size=\"8\" fill=\"#007A33\">¿qué ocurrió?</text>\n<rect x=\"176\" y=\"28\" width=\"110\" height=\"48\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"231\" y=\"48\">Datos/BD</text><text x=\"231\" y=\"63\" font-size=\"8\" fill=\"#007A33\">historia</text>\n<rect x=\"346\" y=\"28\" width=\"110\" height=\"48\" rx=\"8\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"401\" y=\"48\" fill=\"#fff\" font-weight=\"bold\">DSS</text><text x=\"401\" y=\"63\" fill=\"#fff\" font-size=\"8\">¿qué pasaría si...?</text>\n<rect x=\"516\" y=\"28\" width=\"110\" height=\"48\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"571\" y=\"48\">Decisión</text><text x=\"571\" y=\"63\" font-size=\"8\" fill=\"#8a6d2b\">+ acción</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"116\" y1=\"52\" x2=\"173\" y2=\"52\" marker-end=\"url(#fl7)\"/><line x1=\"286\" y1=\"52\" x2=\"343\" y2=\"52\" marker-end=\"url(#fl7)\"/><line x1=\"456\" y1=\"52\" x2=\"513\" y2=\"52\" marker-end=\"url(#fl7)\"/></g>\n<path d=\"M 571 76 L 571 104 L 61 104 L 61 79\" fill=\"none\" stroke=\"#81C784\" stroke-width=\"2\" stroke-dasharray=\"5,4\" marker-end=\"url(#fl7)\"/>\n<text x=\"316\" y=\"120\" font-size=\"9\" fill=\"#007A33\">evaluación → nuevos datos</text>\n</g>\n<text x=\"330\" y=\"136\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 7. Del registro a la decisión, con retorno de evaluación</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> TPS → Proceso de decisión → DSS → GDSS → Inteligencia artificial.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li><li>Casos Supermercados Centuria y Distribuidora Paraguaya (material de la unidad).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 8,
    "titulo": "Sistemas de Apoyo a Ejecutivos (EIS)",
    "resumen": "Concepto. Características. Factores de éxito. Proceso de desarrollo. Implantación. Efecto del EIS en el proceso de planeación y control de la organización.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Concepto. Características. Factores de éxito. Proceso de desarrollo. Implantación. Efecto del EIS en el proceso de planeación y control de la organización.</p>"
      },
      {
        "titulo": "1. Concepto de EIS",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>EIS (Executive Information System):</strong> acceso rápido a información relevante, resumida y estratégica para planificación, seguimiento y control. Responde: ¿cómo está la organización?, ¿cumplimos objetivos?, ¿dónde hay problemas?, ¿qué tendencias aparecen? Transforma miles de operaciones en visión ejecutiva (ej.: ventas del día, variación, sucursal que más crece/cae, margen y cumplimiento de meta).</p>"
      },
      {
        "titulo": "2. Pirámide de información",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Operativo (TPS):</strong> ¿qué operación ocurrió? <strong>Gerencial (MIS/DSS):</strong> ¿cómo va el área? / ¿qué pasaría si...? <strong>Estratégico (EIS):</strong> ¿cómo va globalmente la organización y dónde enfocar la atención? A medida que se asciende, la información es más resumida, comparativa y orientada al futuro.</p>"
      },
      {
        "titulo": "3. Características, tableros y KPI",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Características:</strong> resumida, relevante, interpretable (indicadores, gráficos, alertas), oportuna, integrada y estratégica. <strong>Dashboard:</strong> organiza ventas, meta, cumplimiento, margen, clientes, morosidad y satisfacción con umbrales. <strong>KPI:</strong> indicador vinculado a objetivos (no cualquier dato); incluye datos internos y externos. <strong>Drill-down:</strong> de lo general al detalle (nacional → región → sucursal → producto). <strong>Alertas:</strong> destacan desviaciones (administración por excepción). Un valor aislado no basta: necesita <strong>meta, comparación, tendencia y contexto</strong>.</p>"
      },
      {
        "titulo": "4. Factores de éxito, desarrollo e implantación",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Éxito:</strong> apoyo directivo, requerimientos correctos, calidad de datos, integración, facilidad de uso, relevancia y actualización. <strong>Desarrollo:</strong> objetivos → necesidades → indicadores → fuentes → integración → presentación → pruebas → implantación → mejora. <strong>Implantación:</strong> personas, procesos, datos, tecnología, capacitación y gestión del cambio.</p>"
      },
      {
        "titulo": "5. Efecto en planeación y control",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Planeación:</strong> monitorear meta vs. avance (ej.: +15 % anual vs. +8 % actual). <strong>Control:</strong> objetivo → meta → indicador → resultado → comparación → desviación → acción correctiva. El EIS aporta visibilidad, seguimiento, integración y detección de tendencias; pero la calidad de la decisión sigue dependiendo de datos, interpretación y criterio.</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> ¿Qué significa KPI?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Key Performance Indicator.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> ¿Qué permite el drill-down?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Pasar de lo resumido al detalle.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> Meta G. 1.000 M y real G. 800 M: ¿cumplimiento?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> 80 %.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> ¿TPS vs. EIS?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Registro operativo vs. información estratégica.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> Con ventas +20 % pero margen y morosidad peores:\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Analizar varios indicadores antes de concluir.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 560 210\" width=\"100%\" style=\"max-width:560px\" role=\"img\" aria-label=\"Pirámide de información y tablero\">\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<polygon points=\"230,8 330,8 310,58 250,58\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"280\" y=\"30\" fill=\"#fff\" font-weight=\"bold\">EIS</text><text x=\"280\" y=\"45\" fill=\"#fff\" font-size=\"8\">estratégico</text>\n<polygon points=\"200,62 360,62 340,112 220,112\" fill=\"#81C784\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"280\" y=\"82\" fill=\"#fff\" font-weight=\"bold\">MIS / DSS</text><text x=\"280\" y=\"97\" fill=\"#fff\" font-size=\"8\">táctico</text>\n<polygon points=\"170,116 390,116 370,166 190,166\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"280\" y=\"138\" font-weight=\"bold\">TPS</text><text x=\"280\" y=\"153\" font-size=\"8\" fill=\"#007A33\">operativo</text>\n<rect x=\"420\" y=\"60\" width=\"120\" height=\"22\" rx=\"4\" fill=\"#00B140\"/><text x=\"480\" y=\"75\" fill=\"#fff\" font-size=\"9\">Ventas 95%</text>\n<rect x=\"420\" y=\"90\" width=\"96\" height=\"22\" rx=\"4\" fill=\"#C5A55A\"/><text x=\"468\" y=\"105\" fill=\"#fff\" font-size=\"9\">Margen 24%</text>\n<rect x=\"420\" y=\"120\" width=\"72\" height=\"22\" rx=\"4\" fill=\"#c0392b\"/><text x=\"456\" y=\"135\" fill=\"#fff\" font-size=\"9\">Mora 8,5%</text>\n<text x=\"480\" y=\"160\" font-size=\"9\" fill=\"#007A33\">tablero + alertas</text>\n</g>\n<text x=\"280\" y=\"190\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 8. Pirámide de información y tablero ejecutivo</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> Dato operativo → Pirámide → KPI y tablero → Planeación y control.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Caso Grupo Centuria: tablero ejecutivo (material de la unidad).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 9,
    "titulo": "Paradigmas Contemporáneos de Negocios en Internet",
    "resumen": "Introducción a los negocios por internet. Cómo preparar los «Negocios on line». Elección de tecnologías. Comercio electrónico: concepto, categorías, ventajas y problemáticas, sistemas de pago, aspectos legales. E-government. Firma digital.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Introducción a los negocios por internet. Cómo preparar los «Negocios on line». Elección de tecnologías. Comercio electrónico: concepto, categorías, ventajas y problemáticas, sistemas de pago, aspectos legales. E-government. Firma digital.</p>"
      },
      {
        "titulo": "1. Negocios por Internet",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Internet sostiene marketing, captación, venta, pago, entrega, posventa y fidelización. Negocio tradicional: local, consulta, pago y retiro presenciales. Negocio digital: plataforma, búsqueda, comparación, pedido, pago electrónico, entrega, seguimiento y calificación. <strong>E-business</strong> abarca todos los procesos digitales; el <strong>e-commerce</strong> es su parte comercial.</p>\n<h4 class=\"h4-subtema\"><strong>Categorías</strong></h4>\n<ul class=\"lista-viñetas\">\n<li><strong>B2C</strong> (empresa → consumidor)</li>\n<li><strong>B2B</strong> (empresa → empresa)</li>\n<li><strong>C2C</strong> (consumidor → consumidor)</li>\n<li><strong>C2B</strong> (consumidor → empresa)</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Modelos de negocio</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Venta directa</li>\n<li>Marketplace</li>\n<li>Suscripción</li>\n<li>Freemium</li>\n<li>Publicidad y comisión</li>\n</ul>"
      },
      {
        "titulo": "2. Preparar el negocio online y la plataforma",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h4 class=\"h4-subtema\"><strong>Pasos para preparar el negocio</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Propuesta de valor</li>\n<li>Cliente objetivo</li>\n<li>Productos o servicios</li>\n<li>Modelo de ingresos</li>\n<li>Proceso (carrito → pedido → pago → entrega → posventa)</li>\n<li>Tecnología según requerimientos</li>\n<li>Logística</li>\n<li>Atención al cliente</li>\n<li>Seguridad</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Plataforma</strong></h4>\n<p>Catálogo, buscador, carrito, pedidos, inventario, clientes, pagos, logística y analítica.</p>\n<h4 class=\"h4-subtema\"><strong>UX y conversión</strong></h4>\n<p>Proceso simple y medible; tasa = compras / visitantes × 100 (ej.: 400 / 10.000 = 4 %); analizar puntos de abandono.</p>"
      },
      {
        "titulo": "3. Ventajas, problemáticas y pagos",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h4 class=\"h4-subtema\"><strong>Ventajas</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Alcance global</li>\n<li>Disponibilidad 24/7</li>\n<li>Automatización de procesos</li>\n<li>Medición y analítica</li>\n<li>Personalización</li>\n<li>Escalabilidad</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Problemas</strong></h4>\n<ul class=\"lista-viñetas\">\n<li>Seguridad</li>\n<li>Privacidad</li>\n<li>Confianza del consumidor</li>\n<li>Logística (última milla)</li>\n<li>Dependencia tecnológica</li>\n<li>Competencia y fraude</li>\n</ul>\n<h4 class=\"h4-subtema\"><strong>Pagos</strong></h4>\n<p>Tarjetas, transferencias, billeteras y pasarelas (cliente → comercio → pasarela → autorización). Riesgos: fraude, suplantación e ingeniería social.</p>\n<h4 class=\"h4-subtema\"><strong>Confianza</strong></h4>\n<p>Identidad clara, políticas transparentes, seguridad y reputación.</p>"
      },
      {
        "titulo": "4. Aspectos legales, gobierno electrónico y firma digital",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Toda operación online está en el marco jurídico: identificación, contratación, consumidor, datos, comprobantes, pagos y tributos.</p>\n<h4 class=\"h4-subtema\"><strong>E-government</strong></h4>\n<p>TIC en servicios e interacciones del sector público (consultas, registros, pagos, expedientes).</p>\n<h4 class=\"h4-subtema\"><strong>Firma digital</strong></h4>\n<p>Mecanismos criptográficos de autenticidad e integridad (no es una imagen escaneada). Principios: autenticidad, integridad y vinculación, con certificados digitales y valor según la legislación.</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 5 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> ¿Relación e-business/e-commerce?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> E-commerce es parte del e-business.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> Tienda que vende al consumidor final:\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> B2C.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Función de la pasarela de pago?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Facilitar el procesamiento electrónico.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> 10.000 visitantes y 500 compras:\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> 5 %.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> ¿Qué es e-government?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> TIC en servicios del sector público.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 700 100\" width=\"100%\" role=\"img\" aria-label=\"Circuito del comercio electrónico\">\n<defs><marker id=\"fl9\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"4\" orient=\"auto\"><polygon points=\"0,0 8,4 0,8\" fill=\"#C5A55A\"/></marker></defs>\n<g font-size=\"9\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"6\" y=\"20\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"56\" y=\"48\">Cliente</text>\n<rect x=\"148\" y=\"20\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"198\" y=\"48\">Tienda</text>\n<rect x=\"290\" y=\"20\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"340\" y=\"48\" fill=\"#fff\" font-weight=\"bold\">Pago</text>\n<rect x=\"432\" y=\"20\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"482\" y=\"48\">Logística</text>\n<rect x=\"574\" y=\"20\" width=\"100\" height=\"46\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"624\" y=\"48\">Entrega</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"106\" y1=\"43\" x2=\"145\" y2=\"43\" marker-end=\"url(#fl9)\"/><line x1=\"248\" y1=\"43\" x2=\"287\" y2=\"43\" marker-end=\"url(#fl9)\"/><line x1=\"390\" y1=\"43\" x2=\"429\" y2=\"43\" marker-end=\"url(#fl9)\"/><line x1=\"532\" y1=\"43\" x2=\"571\" y2=\"43\" marker-end=\"url(#fl9)\"/></g>\n</g>\n<text x=\"350\" y=\"90\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 9. Circuito del comercio electrónico (+ posventa y datos)</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> Negocio → Comercio electrónico → Pagos → Aspectos legales → Firma digital.</p>"
      },
      {
        "titulo": "Nota",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"alert alert-success d-flex align-items-center\">\n<i class=\"bi bi-info-circle-fill me-3 fs-4\"></i>\n<div>\n<strong>Nota:</strong> Este es el material de lectura de la Unidad 9. El docente ampliará estos temas durante la clase presencial/virtual."
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Amor, D. (2000). <em>La Revolución e-business</em>. Argentina: Prentice Hall.</li><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li><li>Caso «Ánde Market»: negocio digital (material de la unidad).</li></ul></div>"
      }
    ]
  },
  {
    "numero": 10,
    "titulo": "Futuro de las TIC",
    "resumen": "Nuevas tendencias tecnológicas aplicadas a los negocios. Cubos de datos. Bases de datos post-relacionales. Redes de alta velocidad.",
    "bloques": [
      {
        "titulo": "Resumen Temático",
        "tipo": "resumen",
        "formato": "html",
        "contenido": "<p>Nuevas tendencias tecnológicas aplicadas a los negocios. Cubos de datos. Bases de datos post-relacionales. Redes de alta velocidad.</p>"
      },
      {
        "titulo": "Introducción: la aceleración del cambio",
        "tipo": "html",
        "formato": "html",
        "contenido": "<h3 class=\"h3-tema\">1. Introducción: la aceleración del cambio</h3>\n<p>Las tecnologías ya no cambian por décadas sino por años. Una empresa que planifica solo con lo que existe hoy puede quedar desfasada mañana. Por eso el programa cierra con las <strong>nuevas tendencias aplicadas a los negocios</strong>: no para formar especialistas en cada una, sino para que el futuro administrador sepa <strong>qué son, para qué sirven y cuándo convienen</strong>.</p>"
      },
      {
        "titulo": "2. Big Data",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Conjuntos de datos tan voluminosos y variados que superan las herramientas tradicionales. Se resume en las <strong>5 V</strong>: volumen, velocidad, variedad, veracidad y valor. <strong>Usos:</strong> predecir demanda, segmentar clientes, detectar fraude, optimizar inventarios y personalizar ofertas. El valor no está en acumular datos, sino en convertirlos en decisiones (enlace con las Unidades VII y VIII).</p>"
      },
      {
        "titulo": "3. Computación en la nube (Cloud)",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Infraestructura y software accesibles por red, por suscripción y escalables. <strong>Modelos:</strong> IaaS (servidores virtuales), PaaS (plataforma de desarrollo) y SaaS (aplicaciones listas, ej.: correo, ERP en la nube). <strong>Beneficios:</strong> menor inversión inicial, crecimiento por demanda, acceso remoto y actualizaciones del proveedor. <strong>Cuidados:</strong> dependencia del proveedor, conectividad, seguridad y costos acumulados.</p>"
      },
      {
        "titulo": "4. Blockchain",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Registro distribuido donde cada bloque enlaza al anterior, lo que da <strong>trazabilidad y transparencia</strong>. <strong>Usos empresariales:</strong> seguimiento de cadena de suministro, certificaciones, contratos y pagos. No es sinónimo de criptomonedas: la criptomoneda es solo una aplicación de esta tecnología.</p>"
      },
      {
        "titulo": "5. IA e IoT como tendencias transversales",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>La <strong>inteligencia artificial</strong> (Unidad VII) aporta predicción y automatización inteligente; el <strong>IoT</strong> (Unidad VI) conecta sensores y activos para monitoreo en tiempo real. Combinadas con Big Data y Cloud forman la base de la empresa digital actual.</p>"
      },
      {
        "titulo": "6. Cubos de datos (OLAP)",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Un <strong>cubo</strong> organiza la información por <strong>dimensiones</strong> (tiempo, producto, región, sucursal) para consultas analíticas rápidas. Ejemplo: ventas totales del año → por trimestre → por sucursal → por producto. Permite el <strong>drill-down</strong> ejecutivo (Unidad VIII) sin afectar los sistemas transaccionales: se consulta el cubo, no la caja registradora.</p>"
      },
      {
        "titulo": "7. Bases de datos post-relacionales",
        "tipo": "html",
        "formato": "html",
        "contenido": "<div class=\"table-responsive\">\n<table class=\"table table-bordered table-striped table-hover shadow-sm align-middle\">\n<thead class=\"table-primary\">\n<tr>\n<th scope=\"col\">Tipo</th>\n<th scope=\"col\">Idea</th>\n<th scope=\"col\">Cuándo conviene</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Documental (JSON)</td>\n<td>Documentos flexibles sin esquema fijo</td>\n<td>Catálogos, contenidos, apps web</td>\n</tr>\n<tr>\n<td>Clave-valor</td>\n<td>Acceso ultrarrápido por clave</td>\n<td>Sesiones, carritos, caché</td>\n</tr>\n<tr>\n<td>Grafos</td>\n<td>Nodos y relaciones</td>\n<td>Redes sociales, fraude, rutas</td>\n</tr>\n<tr>\n<td>Series temporales</td>\n<td>Datos con marca de tiempo</td>\n<td>Sensores, monitoreo, finanzas</td>\n</tr>\n</tbody>\n</table>"
      },
      {
        "titulo": "8. Redes de alta velocidad",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>Fibra óptica:</strong> gran capacidad y estabilidad para enlaces troncales. <strong>5G:</strong> alta velocidad y baja latencia móvil para operaciones en campo, logística y sucursales. <strong>Wi-Fi de nuevas generaciones:</strong> más dispositivos simultáneos en oficinas y locales. <strong>Efecto:</strong> videocolaboración, nube, IoT, comercio en tiempo real y trabajo remoto. Recuerde: capacidad (ancho de banda) no es lo mismo que retardo (latencia).</p>"
      },
      {
        "titulo": "9. Criterio administrativo de inversión",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Ante cada tendencia, el administrador debe evaluar: <strong>disponibilidad</strong> (¿estará operativa cuando se necesite?), <strong>rendimiento</strong> (¿soporta usuarios y operaciones?), <strong>escalabilidad</strong> (¿crece con la empresa?), <strong>seguridad</strong> (¿protege la información?), <strong>costos</strong> (¿adquisición + operación + mantenimiento?) y <strong>continuidad</strong> (¿qué pasa si falla?). La tecnología es <strong>inversión</strong> cuando responde al negocio, no moda.</p>"
      },
      {
        "titulo": "10. Caso de estudio: Distribuidora Guaraní",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Una distribuidora con 3 depósitos quiere modernizarse. Diagnóstico: inventarios desactualizados, pedidos por teléfono, sin historial analizable. <strong>Propuesta por etapas:</strong> 1) base de datos central + red entre locales; 2) cubo de ventas por producto/región/mes para decisiones; 3) catálogo documental para 2.000 productos; 4) nube para no comprar servidores; 5) sensores IoT en cámaras de frío. Cada etapa responde a un problema real, no a la moda.</p>"
      },
      {
        "titulo": "11. Actividad práctica",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>En grupos, elijan una empresa local y propongan <strong>dos tendencias</strong> aplicables: qué problema resuelven, qué datos necesitan, qué red exigen y cuánto costaría aproximadamente la primera etapa. Presentar en 5 minutos defendiendo por qué esas dos y no otras.</p>"
      },
      {
        "titulo": "12. Preguntas de discusión",
        "tipo": "html",
        "formato": "html",
        "contenido": "<ol>\n<li>¿Toda empresa necesita Big Data, o basta una buena planilla bien usada?</li>\n<li>¿Qué riesgos aparecen al subir toda la información a la nube?</li>\n<li>¿En qué casos una BD documental supera a la relacional?</li>\n<li>¿Mayor velocidad de Internet significa automáticamente mejor infraestructura?</li>\n<li>¿Cómo se conecta esta unidad con DSS, EIS y comercio electrónico?</li>\n</ol>"
      },
      {
        "titulo": "Síntesis de la unidad",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p><strong>DATOS → NUBE/CUBOS → ANÁLISIS → RED DE ALTA VELOCIDAD → DECISIONES.</strong> Las tendencias valen cuando resuelven problemas del negocio con criterio de disponibilidad, seguridad y costo.</p>"
      },
      {
        "titulo": "Síntesis del curso",
        "tipo": "html",
        "formato": "html",
        "contenido": "<p>Del dato a la decisión: <strong>TPS → BD → MIS/DSS → EIS → estrategia</strong>, sobre hardware, software y redes, con ERP integrando la gestión y el comercio digital abriendo nuevos canales. La ventaja no está en la tecnología por sí misma, sino en cómo la organización la usa para crear valor.</p>"
      },
      {
        "titulo": "Autoevaluación: tarjetas",
        "tipo": "autoevaluacion",
        "formato": "html",
        "contenido": "\n    <div class=\"flashcards-widget\" style=\"background:#f4fbf6; border:1px solid #c8e6c9; border-radius:12px; padding:16px; margin:16px 0;\">\n        <div class=\"d-flex justify-content-between align-items-center mb-3\">\n            <span class=\"badge\" style=\"background:#007A33; font-size:.85rem;\">Autoevaluación · 10 Tarjetas de Estudio</span>\n            <small class=\"text-muted\"><i class=\"bi bi-info-circle me-1\"></i>Haz clic en cada tarjeta para comprobar tu respuesta</small>\n        </div>\n        \n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">1</span> ¿Qué significa que el Big Data tenga variedad?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Combina textos, imágenes, transacciones, sensores, etc.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">2</span> Diferencie SaaS de on-premise.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Suscripción en nube vs. instalado propio.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">3</span> ¿Qué aporta blockchain a una cadena de suministro?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Trazabilidad y transparencia.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">4</span> ¿Qué es un cubo OLAP?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Datos por dimensiones para análisis rápido.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">5</span> ¿Cuándo conviene una BD de grafos?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Datos muy relacionados (redes, fraude, rutas).\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">6</span> ¿Qué mide la latencia?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> El retardo de respuesta, distinto del ancho de banda.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">7</span> ¿Qué es el drill-down?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Pasar de lo resumido al detalle.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">8</span> Mencione tres criterios para invertir en una tendencia.\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Disponibilidad, seguridad, costos, etc.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">9</span> ¿La nube elimina la necesidad de administrar la información?\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> No, cambia dónde y cómo se administra.\n            </div>\n        </details>\n        <details class=\"flashcard-item mb-2\" style=\"border:1px solid #c8e6c9; border-radius:8px; padding:10px 14px; background:#fff;\">\n            <summary style=\"cursor:pointer; font-weight:600; color:#007a33; list-style:none;\">\n                <span class=\"badge\" style=\"background:#007A33; margin-right:8px;\">10</span> Complete: la ventaja está en cómo la organización usa la tecnología para…\n            </summary>\n            <div class=\"flashcard-answer mt-2 pt-2\" style=\"border-top:1px dashed #dcedc8; color:#333; font-size:.9rem; line-height:1.5;\">\n                <strong style=\"color:#007A33;\">Respuesta:</strong> Crear valor.\n            </div>\n        </details>\n    </div>"
      },
      {
        "titulo": "Mapa visual",
        "tipo": "mapa",
        "formato": "html",
        "contenido": "<figure class=\"text-center my-3\">\n<svg viewBox=\"0 0 540 230\" width=\"100%\" style=\"max-width:540px\" role=\"img\" aria-label=\"Tendencias alrededor de la empresa\">\n<g font-size=\"10\" text-anchor=\"middle\" fill=\"#2D2D2D\" font-family=\"Montserrat,Segoe UI,sans-serif\">\n<rect x=\"200\" y=\"88\" width=\"140\" height=\"54\" rx=\"10\" fill=\"#007A33\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"270\" y=\"110\" fill=\"#fff\" font-weight=\"bold\">EMPRESA</text><text x=\"270\" y=\"126\" fill=\"#fff\" font-size=\"9\">valor del negocio</text>\n<rect x=\"30\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"46\">Big Data</text>\n<rect x=\"380\" y=\"20\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"445\" y=\"46\">Cloud</text>\n<rect x=\"30\" y=\"166\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#E6F4EA\" stroke=\"#007A33\" stroke-width=\"2\"/><text x=\"95\" y=\"192\">Blockchain</text>\n<rect x=\"380\" y=\"166\" width=\"130\" height=\"44\" rx=\"8\" fill=\"#FFF8E1\" stroke=\"#C5A55A\" stroke-width=\"2\"/><text x=\"445\" y=\"192\">IA + IoT</text>\n<g stroke=\"#C5A55A\" stroke-width=\"2\"><line x1=\"130\" y1=\"64\" x2=\"215\" y2=\"92\"/><line x1=\"410\" y1=\"64\" x2=\"325\" y2=\"92\"/><line x1=\"130\" y1=\"166\" x2=\"215\" y2=\"138\"/><line x1=\"410\" y1=\"166\" x2=\"325\" y2=\"138\"/></g>\n</g>\n<text x=\"270\" y=\"224\" font-size=\"10\" text-anchor=\"middle\" fill=\"#007A33\" font-family=\"Montserrat,Segoe UI,sans-serif\">Figura 10. Tendencias al servicio del valor del negocio</text>\n</svg>\n</figure>\n<p class=\"small\"><strong>Secuencia sugerida:</strong> Tendencias → Cubos de datos → Post-relacional → Redes → Inversión.</p>"
      },
      {
        "titulo": "Bibliografía y Referencias",
        "tipo": "bibliografia",
        "formato": "html",
        "contenido": "<div class=\"seccion-bibliografia\"><h4 class=\"h4-subtema\">Bibliografía Básica</h4><ul><li>Programa oficial de la asignatura TIC (ADE18), Instituto Superior Centuria. (Fuente primaria del curso.)</li><li>Amor, D. (2000). <em>La Revolución e-business</em>. Argentina: Prentice Hall.</li></ul>\n<h4 class=\"h4-subtema\">Bibliografía Complementaria</h4><ul><li>Cohen Kare, D. y Asín Lares, E. (2009). <em>Tecnología de información en los Negocios</em>. México: McGraw-Hill.</li><li>Caso Distribuidora Guaraní: modernización por etapas (material de la unidad).</li></ul></div>"
      }
    ]
  }
];

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            MODELO_TIC_PROGRAMA: root.MODELO_TIC_PROGRAMA,
            MODELO_TIC_EVALUACIONES: root.MODELO_TIC_EVALUACIONES,
            MODELO_TIC_UNIDADES: root.MODELO_TIC_UNIDADES
        };
    }
})();
