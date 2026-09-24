/* =====================================================================
   CONFIGURACIÓN — Grupo Pana · Gestión Digital SST · v04
   ATS (FOR-GHS-001 v01) y PETAR (FOR-GHS-002 v01) — sede Ate, área B&P
   ---------------------------------------------------------------------
   Todo el contenido de los formatos vive aquí. Cambiar una pregunta,
   su exigencia o un catálogo no requiere tocar la lógica.

   nivel:  'critico'   -> un "No" impide autorizar el PETAR
           'requerido' -> debe responderse; un "No" exige observación
   origen: 'FOR-GHS-002' -> pregunta del formato vigente de Grupo Pana
           'DS 42-F'     -> control adicional sugerido, recogido del D.S. 42-F
                            (NO forma parte del formato vigente; por validar con SST)
   ===================================================================== */

window.SST_CONFIG = {

  empresa: 'Grupo Pana',
  sistema: 'Gestión Digital SST',
  sede: 'Ate',
  areaPorDefecto: 'Planchado y pintura (B&P)',
  version: 'v04 (demo)',

  /* URL del flujo de Power Automate ("Cuando se recibe una solicitud HTTP").
     Vacía = la app funciona igual, pero no envía correo ni guarda en SharePoint. */
  flujoUrl: 'https://defaultd9dd2d8ba0324ef5885ff9e7fa6789.56.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/01/workflows/32c6eb63182b409ea7380faf8d1c6e5c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dUX0IYyYXs7ZUxe4ke-o62mlODfIURmXxz4XmJbGCTg',

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

    /* Sección I — tipos de trabajo. Solo "caliente" está habilitado en la demo. */
    tipos: [
      { id: 'confinado',   label: 'Trabajo en espacio confinado',   activo: false },
      { id: 'altura',      label: 'Trabajo en altura',              activo: false },
      { id: 'caliente',    label: 'Trabajo en caliente',            activo: true },
      { id: 'izamiento',   label: 'Trabajo de izamiento',           activo: false },
      { id: 'peligrosos',  label: 'Trabajo con materiales peligrosos', activo: false },
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
      { id: 'c_radio', label: '¿Se ha alejado y/o cubierto el material inflamable en un radio de 12 metros?', nivel: 'critico', origen: 'FOR-GHS-002' },
      { id: 'c_extintor', label: '¿Se cuenta con un extintor de PQS de no menos de 9 kg?', nivel: 'critico', origen: 'FOR-GHS-002' },
      { id: 'c_lel', label: 'En caso de ser un espacio cerrado: ¿se monitoreó el lugar de trabajo y el LEL (límite inferior de explosividad) es igual a 0%? ¿El área está ventilada?', nivel: 'critico', origen: 'FOR-GHS-002', admiteNA: true },
      { id: 'c_paredes', label: 'En caso el trabajo se realice sobre paredes o techos: ¿se identificó que la construcción no es combustible y no presenta revestimiento combustible por ningún lado?', nivel: 'critico', origen: 'FOR-GHS-002', admiteNA: true },
      { id: 'c_herramientas', label: '¿Las herramientas eléctricas y la máquina de soldar cuentan con cables y conexiones en buen estado, libres de empalmes, guardas de protección y puestas a tierra?', nivel: 'critico', origen: 'FOR-GHS-002', admiteNA: true },
      { id: 'c_biombos', label: '¿Se cuenta con biombos para realizar el trabajo?', nivel: 'critico', origen: 'FOR-GHS-002' }
    ],

    /* Controles adicionales sugeridos — NO están en FOR-GHS-002 (por validar con SST) */
    adicionales: [
      { id: 'a_pisos', label: 'Piso del punto de soldadura sin charcos ni humedad', nivel: 'requerido', origen: 'DS 42-F', ref: 'Art. 255' },
      { id: 'a_cilindros', label: 'Cilindros de oxicorte en posición vertical y sujetos con cadena o collar', nivel: 'requerido', origen: 'DS 42-F', ref: 'Art. 265 b, c, e' },
      { id: 'a_oxigeno', label: 'Cilindro y accesorios de oxígeno sin grasa ni aceite (no manipular con guantes grasientos)', nivel: 'requerido', origen: 'DS 42-F', ref: 'Art. 265 j' },
      { id: 'a_mesa', label: 'Piezas pequeñas o medianas sobre mesa o banco incombustible, no sobre piso de concreto', nivel: 'requerido', origen: 'DS 42-F', ref: 'Art. 262' }
    ],

    /* Sección VI — Protocolos de respuesta ante emergencia */
    emergencias: ['Emergencias médicas', 'Incendio', 'Tsunami', 'Sismo', 'Derrame de materiales'],
    equiposEmergencia: ['Botiquín de primeros auxilios', 'Camilla', 'Trípode para espacio confinado', 'Extintor', 'Equipos de comunicación para emergencias'],

    firmasAutorizacion: [
      { clave: 'supervisor', cargo: 'Supervisor del trabajo', ayuda: 'Supervisor o jefe de Grupo Pana, o responsable por los servicios que brinda el contratista' },
      { clave: 'area',       cargo: 'Responsable del área', ayuda: 'Donde se realizará el trabajo o usuario' },
      { clave: 'ejecutante', cargo: 'Ejecutante del trabajo', ayuda: '' }
    ],

    duracionMaxHoras: null   /* Grupo Pana define el máximo; hoy: "el día" */
  },

  /* Destino de los documentos en la demo */
  estados: {
    BORRADOR:   { etiqueta: 'Borrador',   tono: 'neutro' },
    REGISTRADO: { etiqueta: 'Registrado', tono: 'ok' },
    AUTORIZADO: { etiqueta: 'Autorizado', tono: 'ok' },
    VENCIDO:    { etiqueta: 'Vencido',    tono: 'mal' },
    CERRADO:    { etiqueta: 'Cerrado',    tono: 'frio' },
    CANCELADO:  { etiqueta: 'Cancelado',  tono: 'mal' }
  }
};
