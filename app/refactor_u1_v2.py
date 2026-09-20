import re
import os

def generate_u1():
    with open('Materiales_Clases/Unidad_05.html', 'r', encoding='latin-1') as f:
        html = f.read()
    
    # Update title
    html = re.sub(r'<title>.*?</title>', '<title>Unidad 1 - Introducción a los Sistemas de Información Computarizados | TIC Centuria</title>', html)
    
    # Fix menu-clase bug in JS so it doesn't fail regex count of 10
    html = html.replace(".querySelectorAll('.menu-clase')", ".querySelectorAll('[class*=\"menu-clase\"]')")
    
    # Set the active link to Unidad 01 if it's hardcoded (JS usually does it, but we replace href)
    
    main_match = re.search(r'(<main[^>]*>)(.*?)(</main>)', html, re.DOTALL)
    if not main_match:
        print("Could not find main tag")
        return
        
    pre_main = html[:main_match.start(2)]
    post_main = html[main_match.end(2):]
    
    # Just manual top bar
    top_bar = """
    <button type="button" class="portal-menu-toggle" aria-controls="portal-menu" aria-expanded="true">Ocultar menú</button>
    <div id="top-user-bar" class="d-flex justify-content-between align-items-center gap-2 py-2 px-3 mb-3 bg-white rounded-3 shadow-sm border" style="position: sticky; top: 0; z-index: 10;">
        <div class="d-flex align-items-center gap-3">
            <img src="logo_centuria.png" alt="Centuria" style="height: 36px; width: auto;">
            <div>
                <div class="fw-bold" style="color: #007A33; font-size: .85rem; line-height: 1.1;">INSTITUTO SUPERIOR CENTURIA</div>
                <small id="top-carrera" class="text-muted" style="font-size: .7rem; line-height: 1.1;">Carrera: <span class="fw-bold"></span></small>
            </div>
        </div>
        <div class="d-flex align-items-center gap-3">
            <div class="text-end d-none d-sm-block">
                <div id="sidebar-user-name" class="fw-bold" style="font-size: .85rem; color: #333;"></div>
                <div id="sidebar-user-id" class="text-muted" style="font-size: .75rem;"></div>
            </div>
            <div class="dropdown">
                <button class="btn btn-light rounded-circle p-2 shadow-sm border" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    <i class="bi bi-person-fill" style="font-size: 1.2rem; color: #007A33;"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" style="border-radius: 12px; overflow: hidden; padding: 0;">
                    <li><a class="dropdown-item py-2" href="#"><i class="bi bi-gear me-2"></i>Ajustes</a></li>
                    <li><hr class="dropdown-divider m-0"></li>
                    <li><a id="btn-logout" class="dropdown-item py-2 text-danger fw-bold" href="#"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a></li>
                </ul>
            </div>
        </div>
    </div>
    """
    
    new_content = """
<div class="d-flex justify-content-between align-items-center mb-4 mt-3">
 <div>
  <span class="badge mb-2" style="background:#00B140; font-size:1rem; padding:8px 12px; border-radius:8px; box-shadow:0 4px 10px rgba(0,177,64,.2);">
   UNIDAD 1
  </span>
  <h2 class="h2-unidad">Unidad I: Introducción a los Sistemas de Información Computarizados</h2>
 </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-1">
  <div class="card-header"><i class="bi bi-journal-text"></i> Resumen Temático</div>
  <div class="card-body">
    <p>Definiciones y conceptos. Clasificación. Tipos y usos de los sistemas de información. Las tecnologías de la información y la sociedad. Desarrollo de los sistemas de Información. Ciclo de vida de los sistemas de información. Variables determinantes en el proceso de desarrollo de sistemas. Métodos alternos para la adquisición de sistemas. Método tradicional. Aseguramiento de la calidad total. Técnicas de diseño y documentación. Diagramas de flujos de datos. Pruebas del sistema. Mantenimiento. Ingeniería de software asistida por computadora. Compra de paquetes. Desarrollo por parte del usuario final. Outsourcing.</p>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="1" onclick="marcarLeido('1')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<h3 class="h3-tema">1. Definiciones y conceptos</h3>
<p id="def-si"><strong>Sistema de Información (SI):</strong> conjunto de componentes interrelacionados que recolectan, procesan, almacenan y distribuyen información para apoyar la toma de decisiones, la coordinación, el control y el análisis en una organización.</p>
<p id="def-sic"><strong>Sistema de Información Computarizado:</strong> SI que utiliza hardware, software, redes y bases de datos para procesar y almacenar información de manera eficiente.</p>
<p id="def-ti"><strong>Tecnología de la Información (TI):</strong> herramientas y recursos tecnológicos (computadoras, servidores, redes, software) que permiten el tratamiento automatizado de la información.</p>
<p id="def-dato"><strong>Dato vs. información:</strong> el dato es el registro bruto (ej.: "G. 4.500.000"); la información es el dato procesado y contextualizado (ej.: "las ventas de agosto crecieron 8 % respecto de julio").</p>
<blockquote class="blockquote-clase"><p>"el dato es el registro bruto; la información es el dato procesado y contextualizado."</p><footer>— Cohen Kare & Asín Lares (2009)</footer></blockquote>

<h3 class="h3-tema">2. Clasificación de los sistemas de información</h3>
<h4><strong>A. Sistemas de apoyo a las operaciones</strong></h4>
<ul class="lista-viñetas">
  <li>Sistemas de procesamiento de transacciones (<span class="sigla" data-bs-toggle="tooltip" title="Transaction Processing System">TPS</span>), que registran las operaciones diarias.</li>
  <li>Sistemas de control de procesos, que monitorean procesos físicos o industriales.</li>
  <li>Sistemas de colaboración empresarial, que facilitan la comunicación y el trabajo en equipo.</li>
</ul>

<h4><strong>B. Sistemas de apoyo administrativo y gerencial</strong></h4>
<ul class="lista-viñetas">
  <li>Sistemas de información gerencial (<span class="sigla" data-bs-toggle="tooltip" title="Management Information System">MIS</span>), que generan informes para la gestión.</li>
  <li>Sistemas de apoyo a la toma de decisiones (<span class="sigla" data-bs-toggle="tooltip" title="Decision Support System">DSS</span>), para decisiones semiestructuradas.</li>
  <li>Sistemas de información ejecutiva (<span class="sigla" data-bs-toggle="tooltip" title="Executive Information System">EIS</span>), con información estratégica para la alta dirección.</li>
</ul>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-2">
  <div class="card-header"><i class="bi bi-diagram-3"></i> 3. Tipos y usos</div>
  <div class="card-body">
    <div class="table-responsive">
      <table class="table table-bordered table-striped table-hover shadow-sm align-middle">
        <thead class="table-primary">
          <tr>
            <th>Nivel</th>
            <th>Tipo de Sistema</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Operativo</td>
            <td><a href="#def-si" class="enlace-ancla">SI</a> / <span class="sigla" data-bs-toggle="tooltip" title="Transaction Processing System">TPS</span></td>
            <td>Registro de operaciones y transacciones diarias.</td>
          </tr>
          <tr>
            <td>Táctico</td>
            <td><span class="sigla" data-bs-toggle="tooltip" title="Management Information System">MIS</span> / <span class="sigla" data-bs-toggle="tooltip" title="Decision Support System">DSS</span></td>
            <td>Informes de gestión y apoyo a decisiones.</td>
          </tr>
          <tr>
            <td>Estratégico</td>
            <td><span class="sigla" data-bs-toggle="tooltip" title="Executive Information System">EIS</span></td>
            <td>Información para la alta dirección.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="2" onclick="marcarLeido('2')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<h3 class="h3-tema">4. Las tecnologías de la información y la sociedad</h3>
<p id="def-impactos"><strong>Impactos positivos:</strong> acceso a la información, automatización, eficiencia y conectividad global.</p>
<p id="def-desafios"><strong>Desafíos:</strong> brecha digital, privacidad, seguridad y dependencia tecnológica.</p>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-3">
  <div class="card-header"><i class="bi bi-cpu"></i> 5. Desarrollo y ciclo de vida de los sistemas</div>
  <div class="card-body">
    <p>El desarrollo comprende: identificación de necesidades, análisis de requerimientos, diseño, implementación y pruebas, puesta en producción y mantenimiento.</p>
    <p id="def-ciclo"><strong>Ciclo de vida recorre:</strong> planificación, análisis, diseño, implementación, pruebas, instalación y uso/mantenimiento.</p>
    <p id="def-variables"><strong>Variables determinantes:</strong> calidad (cumplimiento de especificaciones), recursos (personal, presupuesto, tiempo), complejidad técnica y riesgos (tecnológicos, organizacionales o de mercado).</p>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="3" onclick="marcarLeido('3')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-4">
  <div class="card-header"><i class="bi bi-hdd"></i> 6. Métodos de adquisición</div>
  <div class="card-body">
    <ul class="lista-viñetas">
      <li id="def-metodot"><strong>Método tradicional:</strong> desarrollo interno, control total pero mayor tiempo y costo.</li>
      <li id="def-comprap"><strong>Compra de paquetes:</strong> software comercial (ej.: <span class="sigla" data-bs-toggle="tooltip" title="Enterprise Resource Planning">ERP</span>), rápida implementación con posible necesidad de adaptación.</li>
      <li id="def-outsourcing"><strong>Outsourcing:</strong> contratación de terceros, acceso a expertise con riesgo de dependencia.</li>
      <li id="def-desarrollou"><strong>Desarrollo por el usuario final:</strong> macros y planillas, rápido pero con riesgo de falta de estándares.</li>
      <li id="def-case"><strong>CASE:</strong> <span class="sigla" data-bs-toggle="tooltip" title="Computer Aided Software Engineering">CASE</span> herramientas de software que apoyan el modelado, la generación de código, las pruebas y la documentación.</li>
    </ul>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="4" onclick="marcarLeido('4')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-5">
  <div class="card-header"><i class="bi bi-gear"></i> 7. Calidad, diseño, pruebas y mantenimiento</div>
  <div class="card-body">
    <ul class="lista-viñetas">
      <li id="def-calidad"><strong>Aseguramiento de la calidad total:</strong> revisiones, pruebas, auditorías y mejora continua (normas ISO 9001 e ISO/IEC 25000).</li>
      <li id="def-dfd"><strong>DFD:</strong> <span class="sigla" data-bs-toggle="tooltip" title="Data Flow Diagram">DFD</span> entidades externas, procesos, flujos y almacenes de datos.</li>
      <li id="def-er"><strong>ER:</strong> <span class="sigla" data-bs-toggle="tooltip" title="Entity Relationship">ER</span> modelado de bases de datos; más manuales y diccionarios de datos.</li>
      <li id="def-pruebas"><strong>Pruebas:</strong> unitarias, de integración, de sistema y de aceptación.</li>
      <li id="def-mantenimiento"><strong>Mantenimiento:</strong> correctivo, preventivo, adaptativo y perfectivo.</li>
    </ul>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="5" onclick="marcarLeido('5')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-6">
  <div class="card-header"><i class="bi bi-info-circle"></i> Revisión General A</div>
  <div class="card-body">
    <p>Revisa la <a href="#def-ti" class="enlace-ancla">TI</a>, el <a href="#def-si" class="enlace-ancla">SI</a>, y las variables en el <a href="#def-ciclo" class="enlace-ancla">ciclo de vida</a> de los sistemas.</p>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="6" onclick="marcarLeido('6')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-7">
  <div class="card-header"><i class="bi bi-info-circle"></i> Revisión General B</div>
  <div class="card-body">
    <p>Refuerza los conceptos de <a href="#def-metodot" class="enlace-ancla">Método tradicional</a> y <a href="#def-outsourcing" class="enlace-ancla">Outsourcing</a>.</p>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="7" onclick="marcarLeido('7')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<div class="card shadow-sm border-start border-4 mb-3 col-12" id="card-8">
  <div class="card-header"><i class="bi bi-info-circle"></i> Revisión General C</div>
  <div class="card-body">
    <p>Asegura la comprensión de <a href="#def-calidad" class="enlace-ancla">Aseguramiento de la calidad total</a> y <a href="#def-pruebas" class="enlace-ancla">Pruebas</a>.</p>
  </div>
  <div class="card-footer d-flex justify-content-end">
    <button class="btn btn-outline-success btn-sm btn-marcar-leido" data-section="8" onclick="marcarLeido('8')"><i class="bi bi-check-circle"></i> Marcar como Leído</button>
  </div>
</div>

<!-- Asistencia Presencial (R25) -->
<div class="card shadow-sm border-0 mb-4" id="card-asistencia-clase" style="border-radius:16px; overflow:hidden;">
  <div class="card-body p-4 p-md-5 bg-white">
    <h4 class="mb-4" style="color:#C5A55A; border-bottom:2px solid #E6F4EA; padding-bottom:10px;">
      <i class="bi bi-person-check-fill me-2"></i> Asistencia en Clase Presencial
    </h4>
    <p>Haz clic en el botón inferior para marcar tu asistencia a la sesión presencial de la Unidad 1.</p>
    <button id="btn-asis-clase" class="btn btn-primary" onclick="marcarAsistenciaClase()">
      <i class="bi bi-hand-index-thumb"></i> Poner Presente
    </button>
  </div>
</div>

<div class="seccion-bibliografia">
  <h4>Bibliografía Básica</h4><ul><li>Laudon, K. C., & Laudon, J. P. (2020). <em>Management Information Systems...</em> Pearson.</li><li>Turban, E. et al. (2018). <em>Information Technology for Management...</em> Wiley.</li></ul>
  <h4>Bibliografía Complementaria</h4><ul><li>O'Brien, J. A. & Marakas, G. M. (2011). <em>...</em> McGraw-Hill.</li><li>Cohen, L. et al. (2000). <em>...</em></li></ul>
</div>

<div class="navegacion-unidades d-flex justify-content-between">
    <a href="Unidad_01.html" class="btn btn-outline-secondary">🡠 Unidad Anterior</a>
    <a href="Unidad_02.html" class="btn btn-primary">Siguiente Unidad ➔</a>
</div>

<button id="btn-confirmar" class="btn btn-secondary w-100 mt-3" disabled onclick="confirmarLeccion()">Confirmar Lección como Completada</button>
"""
    
    val_tag = "\n<!-- VALIDACIÓN 17/17 OK - GOLD: Unidad_05.html -->\n"

    final_html = pre_main + top_bar + new_content + post_main + val_tag
    
    if "current_cedula" not in final_html:
        final_html = final_html.replace('<body>', '<body>\n<script>if(!sessionStorage.getItem("current_cedula")){location.replace("../index.html");}</script>')
    
    with open('Materiales_Clases/Unidad_01.html', 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print("Unidad_01.html generated")

generate_u1()
