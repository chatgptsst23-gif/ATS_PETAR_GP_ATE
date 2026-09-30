/* =====================================================================
   CONFIGURACIÓN — Grupo Pana · Gestión Digital SST · v07.1
   ATS y PETAR — sede Ate, área B&P
   ---------------------------------------------------------------------
   Todo el contenido de los formatos vive aquí. Cambiar una pregunta,
   su exigencia o un catálogo no requiere tocar la lógica.

   nivel:  'critico'   -> un "No" impide autorizar el PETAR
           'requerido' -> debe responderse; un "No" exige observación
   ===================================================================== */

window.SST_CONFIG = {

  empresa: 'Grupo Pana',
  sistema: 'Gestión Digital SST',
  sede: 'Ate',
  areaPorDefecto: 'Planchado y pintura (B&P)',
  version: 'v07.1 (piloto operativo)',

  /* URL del flujo de Power Automate ("Cuando se recibe una solicitud HTTP").
     Vacía = la app funciona igual, pero no envía correo ni guarda en SharePoint. */
  flujoUrl: '',
  claveArea: '', /* Solo se carga desde Ajustes; nunca publicar una clave real aquí. */
  modoPrueba: false,

  /* Momentos en que se envía el documento a SST */
  enviarAl: { atsRegistrado: true, petarAutorizado: true, petarCerrado: true },

  /* ============================ ATS ============================== */
  ats: {
    codigo: 'FOR-GHS-001',
    versionFormato: '01',
    titulo: 'ANÁLISIS DE TRABAJO SEGURO (ATS)',
    maxPersonal: 16,
    maxPasos: 10,
    permisos: [
      { id: 'caliente',   label: 'Caliente' },
      { id: 'altura',     label: 'Altura' },
      { id: 'confinado',  label: 'Espacios confinados' },
      { id: 'electrico',  label: 'Trabajo eléctrico' },
      { id: 'excavacion', label: 'Excavación / zanjas' },
      { id: 'otro',       label: 'Otro' }
    ],
    epp: [
      { id: 'basico',   label: 'Básico (casco y zapatos de seguridad)', fijo: true },
      { id: 'guantes',  label: 'Guantes' },
      { id: 'lentes',   label: 'Lentes de seguridad' },
      { id: 'auditiva', label: 'Protección auditiva' },
      { id: 'mameluco', label: 'Ropa de trabajo / mameluco' },
      { id: 'arnes',    label: 'Arnés de seguridad' }
    ],
    pasosEjemplo: [
      { paso: 'Preparar el área y retirar materiales inflamables', evento: 'Incendio causado por chispas sobre material combustible', critico: 'si', medidas: 'Retirar o cubrir combustibles en radio de 12 m; extintor PQS en el punto; biombos', responsable: '' },
      { paso: 'Soldar / cortar la pieza', evento: 'Quemaduras y lesión ocular causadas por radiación y proyección', critico: 'si', medidas: 'Careta de soldar, guantes y mandil de cuero; biombo para terceros', responsable: '' }
    ]
  },

  /* =========================== PETAR ============================= */
  petar: {
    codigo: 'FOR-GHS-002',
    versionFormato: '01',
    titulo: 'PERMISO DE EJECUCIÓN DE TRABAJOS DE ALTO RIESGO (PETAR)',
    validez: 'Válido para: el día - hora - equipo y trabajos indicados',
    leyendaAlarma: 'Este permiso queda cancelado al escucharse la alarma o aviso de emergencia',
    maxParticipantes: 10,

    /* Sección I — tipos de trabajo habilitados en el piloto: caliente, altura,
       materiales peligrosos (solo tareas no rutinarias) y no rutinario. */
    tipos: [
      { id: 'confinado',   label: 'Trabajo en espacio confinado',   activo: false },
      { id: 'altura',      label: 'Trabajo en altura',              activo: true },
      { id: 'caliente',    label: 'Trabajo en caliente',            activo: true },
      { id: 'izamiento',   label: 'Trabajo de izamiento',           activo: false },
      { id: 'peligrosos',  label: 'Trabajo con materiales peligrosos (no rutinario)', activo: true },
      { id: 'energia',     label: 'Trabajo con energía peligrosa',  activo: false },
      { id: 'excavacion',  label: 'Trabajo de excavación y/o perforación', activo: false },
      { id: 'no_rutinario',label: 'Trabajo no rutinario',           activo: true }
    ],

    /* Sección III — EPP */
    epp: [
      { grupo: 'Equipos básicos de protección personal', items: [
        { id: 'casco', label: 'Casco de seguridad', sugerido: true },
        { id: 'zapatos', label: 'Zapatos de seguridad', sugerido: true },
        { id: 'ropa', label: 'Ropa de trabajo', sugerido: true },
        { id: 'lentes', label: 'Lentes de seguridad', sugerido: true },
        { id: 'auditiva', label: 'Tapones / orejeras de oído' },
        { id: 'guantes_cuero', label: 'Guantes de cuero', sugerido: true }
      ]},
      { grupo: 'Trabajo en caliente', items: [
        { id: 'careta_soldar', label: 'Careta de soldar', sugerido: true },
        { id: 'careta_esmerilar', label: 'Careta para esmerilar' },
        { id: 'lentes_oxicorte', label: 'Lentes de oxicorte', sugerido: true },
        { id: 'guantes_soldar', label: 'Guantes para soldar', sugerido: true },
        { id: 'mandil', label: 'Máscara, mandil y escarpines', sugerido: true }
      ]},
      { grupo: 'Protección respiratoria', items: [
        { id: 'resp_media', label: 'Respirador media cara' },
        { id: 'resp_filtro', label: 'Respirador con filtro' },
        { id: 'filtro_humos', label: 'Filtro para humos metálicos' },
        { id: 'filtro_vapores', label: 'Filtro para vapores orgánicos' },
        { id: 'filtro_gases', label: 'Filtro para gases ácidos' },
        { id: 'filtro_polvo', label: 'Filtro para polvos' }
      ]},
      { grupo: 'Altura / espacio confinado', items: [
        { id: 'arnes', label: 'Arnés' },
        { id: 'linea_doble', label: 'Línea de anclaje doble' }
      ]},
      { grupo: 'Dispositivos complementarios', items: [
        { id: 'guantes_quimicos', label: 'Guantes para químicos' },
        { id: 'lentes_ventilacion', label: 'Lentes con ventilación indirecta' },
        { id: 'botas_jebe', label: 'Botas de jebe' },
        { id: 'mandil_jebe', label: 'Mandil de jebe' }
      ]},
      { grupo: 'EPP especiales', items: [
        { id: 'dielectricos', label: 'Guantes dieléctricos' },
        { id: 'epra', label: 'EPRA' }
      ]}
    ],

    /* Sección IV — Requisitos de seguridad (supervisor responsable del trabajo) */
    requisitos: [
      { id: 'r_ats', label: '¿El ATS se ha realizado con la participación de todos los integrantes del trabajo?', nivel: 'critico' },
      { id: 'r_calificadas', label: 'Las personas que efectuarán el trabajo, ¿se encuentran calificadas para desarrollar este tipo de labores?', nivel: 'critico' },
      { id: 'r_instruidas', label: '¿Las personas han sido instruidas en relación con los riesgos que puedan presentarse durante este trabajo?', nivel: 'critico' },
      { id: 'r_epp', label: '¿Todos cuentan con sus equipos de protección personal (EPP) en su totalidad y éstos se encuentran en buenas condiciones?', nivel: 'critico' },
      { id: 'r_delimitada', label: '¿El área de trabajo se ha delimitado y/o aislado convenientemente?', nivel: 'critico' },
      { id: 'r_equipos', label: '¿Los equipos y/o herramientas se encuentran revisados y en buen estado?', nivel: 'critico' },
      { id: 'r_externos', label: '¿Los factores externos (dirección del viento, condiciones atmosféricas, etc.) permiten que el trabajo se realice con seguridad?', nivel: 'critico' },
      { id: 'r_electricas', label: '¿Existen conexiones eléctricas convenientes para la tarea a realizar?', nivel: 'critico' }
    ],

    /* Sección V — Trabajo en caliente (supervisor del trabajo) */
    caliente: [
      { id: 'c_radio', label: '¿Se ha alejado y/o cubierto el material inflamable en un radio de 12 metros?', nivel: 'critico', evidencia: 'Área despejada en radio de 12 m' },
      { id: 'c_extintor', label: '¿Se cuenta con un extintor de PQS de no menos de 9 kg?', nivel: 'critico', evidencia: 'Extintor PQS en el punto de trabajo' },
      { id: 'c_lel', label: 'En caso de ser un espacio cerrado: ¿se monitoreó el lugar de trabajo y el LEL (límite inferior de explosividad) es igual a 0%? ¿El área está ventilada?', nivel: 'critico', admiteNA: true },
      { id: 'c_paredes', label: 'En caso el trabajo se realice sobre paredes o techos: ¿se identificó que la construcción no es combustible y no presenta revestimiento combustible por ningún lado?', nivel: 'critico', admiteNA: true },
      { id: 'c_herramientas', label: '¿Las herramientas eléctricas y la máquina de soldar cuentan con cables y conexiones en buen estado, libres de empalmes, guardas de protección y puestas a tierra?', nivel: 'critico', admiteNA: true, evidencia: 'Equipo de soldar o cilindros de oxicorte' },
      { id: 'c_biombos', label: '¿Se cuenta con biombos para realizar el trabajo?', nivel: 'critico', evidencia: 'Biombos instalados' }
    ],

    /* Controles adicionales del trabajo en caliente */
    adicionales: [
      { id: 'a_pisos', label: 'Piso del punto de soldadura sin charcos ni humedad', nivel: 'requerido' },
      { id: 'a_cilindros', label: 'Cilindros de oxicorte en posición vertical y sujetos con cadena o collar', nivel: 'requerido' },
      { id: 'a_oxigeno', label: 'Cilindro y accesorios de oxígeno sin grasa ni aceite (no manipular con guantes grasientos)', nivel: 'requerido' },
      { id: 'a_mesa', label: 'Piezas pequeñas o medianas sobre mesa o banco incombustible, no sobre piso de concreto', nivel: 'requerido' }
    ],

    /* Sección V — Trabajo en altura */
    altura: [
      { id: 'h_andamios', label: '¿Los andamios y plataformas están asegurados para evitar su caída, desmoronamiento o deslizamiento?', nivel: 'critico', admiteNA: true, evidencia: 'Andamio o plataforma armada' },
      { id: 'h_anclaje', label: '¿Existen puntos de anclaje adecuados para que el trabajador se enganche?', nivel: 'critico', admiteNA: true, evidencia: 'Punto de anclaje o línea de vida' },
      { id: 'h_arnes', label: '¿Cada persona que realizará el ascenso/descenso utilizará arnés y líneas de anclaje certificados y de acuerdo al estándar de la empresa?', nivel: 'critico', admiteNA: true, evidencia: 'Trabajador con arnés y línea de anclaje puestos' },
      { id: 'h_capacitacion', label: '¿Cada persona ha recibido la capacitación para trabajo en altura?', nivel: 'critico' },
      { id: 'h_inspeccion', label: '¿Se ha realizado la inspección del sistema de detención de caídas (arnés y línea de anclaje: estado de correas, hebillas, ganchos, etc.)?', nivel: 'critico', admiteNA: true },
      { id: 'h_aptitud', label: '¿Las personas que realizarán trabajos en altura cuentan con aptitud médica para realizar la actividad?', nivel: 'critico' }
    ],
    notaAltura: 'Para trabajar sobre techos de vehículos, acceder desde andamio o plataforma con barandas; no pisar la carrocería. Las plataformas portátiles deben ser sólidas, estables y contar con protección contra caídas.',

    /* Uso de escaleras */
    escaleras: [
      { id: 'e_estado', label: 'Escalera en buenas condiciones e inspeccionada (peldaños, largueros y zapatas antideslizantes sin daños)', nivel: 'critico', evidencia: 'Escalera en el punto de trabajo' },
      { id: 'e_angulo', label: 'Escalera de apoyo colocada con la base separada de la pared 1/4 de su largo', nivel: 'requerido', admiteNA: true },
      { id: 'e_cierres', label: 'Escalera de extensión con sus dos cierres automáticos operativos', nivel: 'requerido', admiteNA: true },
      { id: 'e_tijera', label: 'Escalera de tijera de no más de 6 m de altura', nivel: 'requerido', admiteNA: true },
      { id: 'e_superficie', label: 'Apoyada sobre superficie firme, nivelada y seca', nivel: 'requerido' },
      { id: 'e_contacto', label: 'Se mantienen tres puntos de contacto y no se trabaja desde los últimos peldaños', nivel: 'requerido' }
    ],

    /* Sección V — Trabajo con materiales peligrosos. Solo tareas no rutinarias:
       la aplicación rutinaria de pintura en cabina u horno se gestiona con IPERC, PETS, HDS y ATS. */
    peligrosos: [
      { id: 'q_ventilacion', label: '¿El lugar donde se realizará el trabajo cuenta con ventilación adecuada?', nivel: 'critico', evidencia: 'Ventilación o extracción funcionando' },
      { id: 'q_hds', label: '¿Los trabajadores conocen el contenido de las Hojas de Seguridad (HDS/MSDS) de los materiales que usan y estas se encuentran en el lugar de trabajo?', nivel: 'critico' },
      { id: 'q_envases', label: '¿Los envases son originales y están correctamente identificados y rotulados con el nombre del producto?', nivel: 'critico', evidencia: 'Envases rotulados y HDS disponible' },
      { id: 'q_nfpa', label: '¿El producto cuenta con la identificación del rombo de la NFPA?', nivel: 'critico' },
      { id: 'q_atmosfera', label: '¿Se ha realizado la evaluación o medición de atmósferas peligrosas y el área se encuentra ventilada? (N/A: área abierta y ventilada, sin equipo de medición)', nivel: 'critico', admiteNA: true },
      { id: 'q_epp', label: '¿El trabajador que manipulará los productos químicos tiene sus EPP correspondientes según lo indica la Hoja de Seguridad?', nivel: 'critico' },
      { id: 'q_respiradores', label: '¿Los respiradores y filtros son los adecuados para el riesgo expuesto al trabajador?', nivel: 'critico', evidencia: 'Trabajador con EPP respiratorio' }
    ],

    /* EPP que se marca automáticamente al activar un tipo de trabajo (se puede desmarcar). */
    eppPorTipo: {
      caliente: ['auditiva', 'guantes_cuero', 'careta_soldar', 'lentes_oxicorte', 'guantes_soldar', 'mandil'],
      altura: ['arnes', 'linea_doble'],
      peligrosos: ['resp_media', 'filtro_vapores', 'guantes_quimicos', 'lentes_ventilacion']
    },

    /* Evidencias mínimas por tipo de trabajo. No se exige una foto por pregunta. */
    evidenciasPorTipo: {
      caliente: [
        { id: 'area', label: 'Área de trabajo acondicionada', ayuda: 'Vista general: zona despejada, delimitación y condiciones del entorno.' },
        { id: 'control', label: 'Equipos y medios de control', ayuda: 'Equipo de trabajo y controles relevantes, por ejemplo extintor, biombo o conexiones.' }
      ],
      altura: [
        { id: 'acceso', label: 'Sistema de acceso y trabajo', ayuda: 'Escalera, andamio o plataforma realmente utilizada para la tarea.' },
        { id: 'caidas', label: 'Protección contra caídas', ayuda: 'Arnés, línea de anclaje y punto de anclaje o línea de vida aplicable.' }
      ],
      peligrosos: [
        { id: 'producto', label: 'Producto e identificación', ayuda: 'Envases rotulados y HDS disponible para los productos utilizados.' },
        { id: 'control', label: 'Controles de exposición', ayuda: 'Ventilación/extracción y EPP respiratorio o químico aplicable.' }
      ]
    },

    /* Fotos optimizadas: Blob en IndexedDB, miniaturas y máximo 8 por permiso. */
    fotos: { maxPorEvidencia: 2, maxTotal: 8, anchoMaximoPx: 1024, miniaturaPx: 240, calidadJpeg: 0.65, calidadMiniatura: 0.58 },

    /* Sección VI — Protocolos de respuesta ante emergencia */
    emergencias: ['Emergencias médicas', 'Incendio', 'Tsunami', 'Sismo', 'Derrame de materiales'],
    equiposEmergencia: ['Botiquín de primeros auxilios', 'Camilla', 'Trípode para espacio confinado', 'Extintor', 'Equipos de comunicación para emergencias'],

    firmasAutorizacion: [
      { clave: 'supervisor', cargo: 'Supervisor del trabajo', ayuda: 'Supervisor o jefe de Grupo Pana, o responsable por los servicios que brinda el contratista' },
      { clave: 'area',       cargo: 'Responsable del área', ayuda: 'Donde se realizará el trabajo o usuario' },
      { clave: 'ejecutante', cargo: 'Ejecutante del trabajo', ayuda: 'Técnico líder o ejecutante. Debe ser una persona distinta del supervisor del trabajo.' }
    ],

    duracionMaxHoras: null   /* Grupo Pana define el máximo; hoy: "el día" */
  },

  /* Estados visibles del piloto */
  estados: {
    BORRADOR:   { etiqueta: 'Borrador',   tono: 'neutro' },
    REGISTRADO: { etiqueta: 'Registrado', tono: 'ok' },
    AUTORIZADO: { etiqueta: 'Autorizado', tono: 'ok' },
    PROGRAMADO: { etiqueta: 'Autorizado · aún no vigente', tono: 'frio' },
    VENCIDO:    { etiqueta: 'Vencido',    tono: 'mal' },
    CERRADO:    { etiqueta: 'Cerrado',    tono: 'frio' },
    CANCELADO:  { etiqueta: 'Cancelado',  tono: 'mal' }
  }
};
