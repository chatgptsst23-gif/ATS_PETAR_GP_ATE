/* =====================================================================
   CATÁLOGO DE TAREAS B&P — window.SST_CATALOGO · v08
   Generado desde catalogo_tareas_bp_v01.xlsx (derivado del IPERC B&P v03).
   Precarga el ATS: pasos, peligros, controles, EPP, herramientas y permisos.
   Pendiente de validación de SST: editar aquí no requiere tocar la lógica.
   ===================================================================== */
window.SST_CATALOGO = {
 "version": "bp-v1",
 "origen": "Catálogo de tareas B&P v01 (derivado del IPERC B&P v03). Pendiente de validación de SST.",
 "puestos": [
  "Ayudante de Carrocería",
  "Técnico de Carrocería",
  "Ayudante de Pintura",
  "Técnico de Pintura"
 ],
 "tareas": [
  {
   "codigo": "T01",
   "nombre": "Recibir y trasladar el vehículo a la bahía",
   "puestos": [
    "Ayudante de Carrocería",
    "Técnico de Carrocería",
    "Ayudante de Pintura",
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [],
   "epp": "Básico (zapatos de seguridad, ropa de trabajo)",
   "herramientas": "Vehículo, conos, cinta de señalización",
   "pasos": [
    {
     "paso": "Verificar si el vehículo enciende y si es híbrido",
     "evento": "Tocar el sistema de alto voltaje de un híbrido (cables naranjas) → electrocución",
     "critico": "si",
     "medidas": "Si es híbrido, avisar al técnico mecánico; no tocar cables ni componentes de alto voltaje. Si no enciende, trabajar donde está.",
     "iperc": "401"
    },
    {
     "paso": "Conducir el vehículo hasta una bahía libre",
     "evento": "Maniobra o retroceso con poca visibilidad → atropello o choque, golpes y fracturas",
     "critico": "si",
     "medidas": "Velocidad mínima dentro de la sede, cinturón puesto, aviso a viva voz y un compañero que guíe el retroceso. Solo conduce personal autorizado con licencia.",
     "iperc": "1254, 1255, 1213"
    },
    {
     "paso": "Si no hay bahía libre, preparar la zona donde quedó el vehículo",
     "evento": "Trabajar en la vía de circulación → atropello por otro vehículo",
     "critico": "si",
     "medidas": "Delimitar con conos o cinta antes de empezar, usar chaleco o ropa reflectiva y coordinar con asesores antes de mover otros vehículos.",
     "iperc": "217"
    }
   ]
  },
  {
   "codigo": "T02",
   "nombre": "Buscar y trasladar autopartes",
   "puestos": [
    "Ayudante de Carrocería"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes, zapatos de seguridad",
   "herramientas": "Carreta o soporte para piezas",
   "pasos": [
    {
     "paso": "Retirar la autoparte del vehículo, del almacén de partes o del área de pintura",
     "evento": "Pieza apilada o mal ubicada en el estante → caída de la pieza, golpes",
     "critico": "no",
     "medidas": "Retirar las piezas pesadas desde niveles bajos; no trepar estantes.",
     "iperc": "314"
    },
    {
     "paso": "Trasladar la autoparte a la bahía",
     "evento": "Levantar piezas grandes o pesadas (puertas, capó, parachoques) → lesión de espalda",
     "critico": "no",
     "medidas": "Piezas grandes entre dos personas o con carreta; doblar las rodillas y mantener la espalda recta.",
     "iperc": "1102"
    },
    {
     "paso": "Caminar por el taller con la pieza",
     "evento": "Pisos mojados, objetos en el suelo o vehículos en movimiento → caída o atropello",
     "critico": "no",
     "medidas": "Usar las vías peatonales, mirar por dónde se camina y respetar la circulación de vehículos.",
     "iperc": "305, 307, 303, 1213"
    }
   ]
  },
  {
   "codigo": "T03",
   "nombre": "Desensamblar piezas de carrocería",
   "puestos": [
    "Técnico de Carrocería",
    "Ayudante de Carrocería"
   ],
   "rutina": "R (técnico) / NR (ayudante)",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes anticorte, lentes, zapatos de seguridad",
   "herramientas": "Destornilladores, llaves, atornillador eléctrico o neumático",
   "pasos": [
    {
     "paso": "Identificar las zonas golpeadas y las piezas a desmontar",
     "evento": "Bordes filosos de piezas dañadas → cortes en manos",
     "critico": "no",
     "medidas": "Guantes anticorte y ropa de manga larga.",
     "iperc": "324"
    },
    {
     "paso": "Desmontar la pieza",
     "evento": "La pieza cae al soltar la última fijación → golpe en pies o manos",
     "critico": "no",
     "medidas": "Sujetar la pieza antes de retirar la última fijación; piezas grandes entre dos.",
     "iperc": "209"
    },
    {
     "paso": "Retirar y apoyar la pieza desmontada",
     "evento": "Cargar piezas pesadas o voluminosas → lesión de espalda",
     "critico": "no",
     "medidas": "Usar carreta o soporte; pedir ayuda para piezas grandes.",
     "iperc": "1102"
    }
   ]
  },
  {
   "codigo": "T04",
   "nombre": "Ensamblar piezas y verificar alineación y luces",
   "puestos": [
    "Ayudante de Carrocería"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes, lentes, zapatos de seguridad",
   "herramientas": "Destornilladores, martillo, atornillador eléctrico o neumático",
   "pasos": [
    {
     "paso": "Revisar las herramientas antes de usarlas",
     "evento": "Herramienta o cable en mal estado → golpe, corte o contacto eléctrico",
     "critico": "no",
     "medidas": "Revisar cables, mangueras y acoples; separar y reportar la herramienta dañada.",
     "iperc": "211, 401"
    },
    {
     "paso": "Ensamblar paneles, faros y demás piezas (incluye instalar el fender después del pulido)",
     "evento": "Golpes con herramientas y bordes filosos → golpes y cortes en manos",
     "critico": "no",
     "medidas": "Guantes de protección mecánica; usar la herramienta adecuada para cada pieza.",
     "iperc": "205, 324"
    },
    {
     "paso": "Verificar que las piezas queden alineadas y niveladas, y que las luces enciendan",
     "evento": "Trabajar agachado o en posturas forzadas → lesión muscular",
     "critico": "no",
     "medidas": "Usar banqueta de taller o rodilleras y hacer pausas.",
     "iperc": "1101"
    }
   ]
  },
  {
   "codigo": "T05",
   "nombre": "Trabajar debajo del vehículo (sin elevador)",
   "puestos": [
    "Ayudante de Carrocería",
    "Técnico de Carrocería"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "gorro_antigolpe",
    "guantes"
   ],
   "epp": "Lentes, guantes, gorro antigolpe",
   "herramientas": "Carro deslizante (camilla), cuñas, señal de advertencia",
   "pasos": [
    {
     "paso": "Asegurar el vehículo antes de meterse debajo",
     "evento": "Alguien mueve el vehículo con la persona debajo → aplastamiento",
     "critico": "si",
     "medidas": "Vehículo apagado, llave retirada y en poder de quien trabaja debajo, freno de mano, cuñas en las ruedas y señal \"Personal debajo del vehículo\".",
     "iperc": "217"
    },
    {
     "paso": "Ubicarse debajo del vehículo en el carro deslizante",
     "evento": "Trabajar echado en el suelo → lesión muscular; golpe con la estructura → golpe en la cabeza",
     "critico": "no",
     "medidas": "Usar carro deslizante y gorro antigolpe; hacer pausas.",
     "iperc": "1101"
    },
    {
     "paso": "Realizar el trabajo debajo del vehículo",
     "evento": "Caída de suciedad u óxido → lesión en los ojos",
     "critico": "no",
     "medidas": "Lentes de seguridad puestos todo el tiempo.",
     "iperc": "214"
    }
   ]
  },
  {
   "codigo": "T06",
   "nombre": "Planchar paneles con martillo y tas",
   "puestos": [
    "Técnico de Carrocería"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "auditiva"
   ],
   "epp": "Guantes, protección auditiva, lentes",
   "herramientas": "Martillo, tas",
   "pasos": [
    {
     "paso": "Revisar el martillo y el tas",
     "evento": "Mango o cabeza flojos → golpe en la mano",
     "critico": "no",
     "medidas": "Usar solo herramientas con mango y cabeza firmes.",
     "iperc": "205"
    },
    {
     "paso": "Golpear el panel para recuperar su forma",
     "evento": "Ruido de los golpes sobre metal → pérdida de audición",
     "critico": "no",
     "medidas": "Protección auditiva puesta durante el planchado.",
     "iperc": "811"
    },
    {
     "paso": "Repetir golpes por tiempo prolongado",
     "evento": "Movimientos repetitivos de brazo y hombro → lesión muscular",
     "critico": "no",
     "medidas": "Pausas y rotación de tareas.",
     "iperc": "1103"
    }
   ]
  },
  {
   "codigo": "T07",
   "nombre": "Planchar con spotter",
   "puestos": [
    "Técnico de Carrocería"
   ],
   "rutina": "R",
   "documento": "PETAR caliente",
   "permisos": {
    "caliente": true
   },
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes de cuero, lentes o careta, ropa de algodón de manga larga",
   "herramientas": "Spotter (equipo de soldadura por puntos)",
   "pasos": [
    {
     "paso": "Revisar el spotter, sus cables y el tomacorriente",
     "evento": "Cable dañado o sin puesta a tierra → electrocución",
     "critico": "si",
     "medidas": "Cables sin empalmes, tomacorriente con puesta a tierra; no usar el equipo si está dañado.",
     "iperc": "401"
    },
    {
     "paso": "Proteger los materiales que pueden encenderse cerca del punto de trabajo",
     "evento": "Chispas sobre tapizados, plásticos o productos inflamables → incendio",
     "critico": "si",
     "medidas": "Retirar o cubrir combustibles e inflamables en 12 m, revisar detrás del panel y tener el extintor a la mano.",
     "iperc": "325"
    },
    {
     "paso": "Aplicar los puntos y tirar la abolladura",
     "evento": "Puntos calientes y chispas → quemaduras y lesión en los ojos",
     "critico": "no",
     "medidas": "Guantes de cuero, lentes o careta; dejar enfriar antes de tocar.",
     "iperc": "216, 214"
    }
   ]
  },
  {
   "codigo": "T08",
   "nombre": "Esmerilar piezas o zonas de carrocería",
   "puestos": [
    "Técnico de Carrocería",
    "Ayudante de Carrocería"
   ],
   "rutina": "R (técnico) / NR (ayudante)",
   "documento": "PETAR caliente",
   "permisos": {
    "caliente": true
   },
   "eppIds": [
    "guantes",
    "auditiva",
    "resp_mediacara_filtro"
   ],
   "epp": "Careta para esmeril sobre lentes, guantes de cuero, protección auditiva, respirador con filtro para partículas, ropa de manga larga",
   "herramientas": "Esmeril angular con guarda y mango lateral",
   "pasos": [
    {
     "paso": "Revisar el esmeril y el disco",
     "evento": "Disco roto, vencido o de RPM incorrectas → rotura del disco y cortes graves",
     "critico": "si",
     "medidas": "Guarda puesta y mango lateral; disco compatible y vigente; no retirar la guarda.",
     "iperc": "213, 202"
    },
    {
     "paso": "Preparar la zona: retirar inflamables, extintor y biombos",
     "evento": "Chispas sobre materiales que pueden encenderse → incendio",
     "critico": "si",
     "medidas": "Retirar o cubrir combustibles e inflamables en 12 m, extintor PQS en el punto, biombos para proteger a los demás. No esmerilar cerca de pintura.",
     "iperc": "325, 214"
    },
    {
     "paso": "Esmerilar",
     "evento": "Partículas y chispas → lesión en ojos y cara; disco atrapa guante o ropa → corte o atrapamiento",
     "critico": "si",
     "medidas": "Careta sobre lentes, sin ropa suelta ni cabello suelto, sujetar con las dos manos.",
     "iperc": "214, 202"
    },
    {
     "paso": "Esmerilar por tiempo prolongado",
     "evento": "Ruido, vibración y polvo metálico → pérdida de audición, lesión en manos y afección respiratoria",
     "critico": "no",
     "medidas": "Protección auditiva, respirador con filtro para partículas y pausas.",
     "iperc": "811, 813, 905"
    }
   ]
  },
  {
   "codigo": "T09",
   "nombre": "Soldar piezas o paneles",
   "puestos": [
    "Técnico de Carrocería"
   ],
   "rutina": "R",
   "documento": "PETAR caliente",
   "permisos": {
    "caliente": true
   },
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Careta de soldar, guantes de cuero, mandil de cuero, escarpines, respirador para humos metálicos",
   "herramientas": "Máquina de soldar, extintor PQS, biombos",
   "pasos": [
    {
     "paso": "Revisar la soldadora, los cables, la pinza de masa y el cilindro de gas",
     "evento": "Cables dañados o equipo mal conectado → electrocución",
     "critico": "si",
     "medidas": "Cables sin empalmes, tomacorriente con puesta a tierra, cilindro sujeto y con regulador en buen estado.",
     "iperc": "401"
    },
    {
     "paso": "Preparar la zona: retirar inflamables, extintor, biombos y vigía",
     "evento": "Chispas y material caliente → incendio",
     "critico": "si",
     "medidas": "Retirar o cubrir combustibles e inflamables en 12 m, revisar ambas caras de la pieza, extintor PQS y vigía asignado. Sin pintura ni solventes cerca.",
     "iperc": "325"
    },
    {
     "paso": "Soldar",
     "evento": "Radiación del arco y humos → quemaduras, lesión en los ojos e intoxicación",
     "critico": "si",
     "medidas": "Careta de soldar, ropa de soldador, biombos para los demás, ventilación o extracción y respirador para humos.",
     "iperc": "810, 903"
    },
    {
     "paso": "Al terminar, revisar la zona",
     "evento": "Piezas calientes o brasas ocultas → quemaduras o incendio",
     "critico": "si",
     "medidas": "Dejar enfriar, revisar que no queden puntos calientes antes de retirarse.",
     "iperc": "216, 325"
    }
   ]
  },
  {
   "codigo": "T10",
   "nombre": "Guardar las partes reparadas para pintura",
   "puestos": [
    "Técnico de Carrocería"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes, zapatos de seguridad",
   "herramientas": "Caballetes o soportes",
   "pasos": [
    {
     "paso": "Trasladar y guardar las partes en la zona asignada",
     "evento": "Partes mal apiladas → caída de piezas y golpes; piezas pesadas → lesión de espalda",
     "critico": "no",
     "medidas": "Usar caballetes o soportes en la zona señalizada; piezas grandes entre dos.",
     "iperc": "314, 1102"
    }
   ]
  },
  {
   "codigo": "T11",
   "nombre": "Evaluar el vehículo y marcar las zonas a reparar",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes",
   "herramientas": "—",
   "pasos": [
    {
     "paso": "Revisar el vehículo y marcar óxido y zonas a pintar",
     "evento": "Bordes filosos o zonas oxidadas → cortes",
     "critico": "no",
     "medidas": "Guantes de protección mecánica.",
     "iperc": "324"
    }
   ]
  },
  {
   "codigo": "T12",
   "nombre": "Lijar superficies (primer, segundo y tercer lijado o correcciones)",
   "puestos": [
    "Ayudante de Pintura",
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "auditiva",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador con filtro para partículas, lentes, protección auditiva, guantes",
   "herramientas": "Lijadora con aspiración, lijas",
   "pasos": [
    {
     "paso": "Revisar la lijadora y su aspiración",
     "evento": "Lijadora o manguera en mal estado → golpes; aspiración apagada → más polvo",
     "critico": "no",
     "medidas": "Revisar la lijadora y encender la aspiración antes de lijar.",
     "iperc": "211"
    },
    {
     "paso": "Lijar la zona",
     "evento": "Polvo de pintura, masilla y óxido → afección respiratoria; partículas → lesión en los ojos",
     "critico": "no",
     "medidas": "Respirador con filtro para partículas y lentes; no limpiar con aire comprimido.",
     "iperc": "905, 214"
    },
    {
     "paso": "Lijar por tiempo prolongado",
     "evento": "Vibración, ruido y movimientos repetitivos → lesión en manos, pérdida de audición, lesión muscular",
     "critico": "no",
     "medidas": "Protección auditiva, guantes y pausas con rotación de tareas.",
     "iperc": "813, 811, 1112"
    }
   ]
  },
  {
   "codigo": "T13",
   "nombre": "Aplicar imprimante epóxico",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador con filtro para vapores orgánicos, lentes, guantes de nitrilo",
   "herramientas": "Brocha o pistola, recipientes rotulados",
   "pasos": [
    {
     "paso": "Revisar la hoja de seguridad (HDS) del producto",
     "evento": "No conocer el peligro del producto → irritación o intoxicación",
     "critico": "no",
     "medidas": "HDS disponible en el punto de uso; envases rotulados.",
     "iperc": "904"
    },
    {
     "paso": "Aplicar el producto",
     "evento": "Contacto con piel y ojos y vapores → irritación e intoxicación",
     "critico": "no",
     "medidas": "Guantes de nitrilo, lentes y respirador para vapores orgánicos; zona ventilada.",
     "iperc": "904, 903"
    },
    {
     "paso": "Mantener el producto lejos de chispas",
     "evento": "Producto inflamable cerca de esmerilado o soldadura → incendio",
     "critico": "si",
     "medidas": "No aplicar si hay trabajo en caliente cerca; extintor a la mano; no fumar.",
     "iperc": "501"
    }
   ]
  },
  {
   "codigo": "T14",
   "nombre": "Preparar y aplicar masilla",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador con filtro para vapores orgánicos, lentes, guantes de nitrilo",
   "herramientas": "Espátula, masilla y catalizador",
   "pasos": [
    {
     "paso": "Mezclar la masilla con su catalizador",
     "evento": "Contacto con piel y ojos → irritación",
     "critico": "no",
     "medidas": "Guantes de nitrilo y lentes; seguir la HDS.",
     "iperc": "904"
    },
    {
     "paso": "Aplicar la masilla y esperar el secado",
     "evento": "Vapores de la masilla → mareo o intoxicación",
     "critico": "no",
     "medidas": "Zona ventilada y respirador para vapores orgánicos.",
     "iperc": "903"
    }
   ]
  },
  {
   "codigo": "T15",
   "nombre": "Aplicar base con pistola fuera del horno",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador con filtro para vapores orgánicos (o el que indique la HDS), traje de pintura, guantes de nitrilo, lentes o máscara de cara completa",
   "herramientas": "Pistola de pintar, compresor",
   "pasos": [
    {
     "paso": "Delimitar la zona de aplicación",
     "evento": "Niebla de pintura que alcanza a otros trabajadores → intoxicación",
     "critico": "si",
     "medidas": "Delimitar y alejar a quien no participa; aplicar en la zona más ventilada.",
     "iperc": "903"
    },
    {
     "paso": "Verificar que no haya trabajo en caliente cerca",
     "evento": "Pulverizar producto inflamable cerca de chispas → incendio",
     "critico": "si",
     "medidas": "Prohibido esmerilar, soldar o usar llama en la zona durante la aplicación; extintor a la mano.",
     "iperc": "501"
    },
    {
     "paso": "Aplicar la base con pistola",
     "evento": "Niebla y vapores (posibles isocianatos según HDS) → intoxicación o daño respiratorio; contacto con ojos y piel",
     "critico": "si",
     "medidas": "Respirador indicado por la HDS, traje de pintura, guantes de nitrilo, lentes o máscara de cara completa; equipo con puesta a tierra.",
     "iperc": "903, 904, 403"
    }
   ]
  },
  {
   "codigo": "T16",
   "nombre": "Encerar y pulir el vehículo",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "auditiva"
   ],
   "epp": "Lentes, guantes de nitrilo, protección auditiva",
   "herramientas": "Pulidora rotativa",
   "pasos": [
    {
     "paso": "Revisar la pulidora",
     "evento": "Pulidora en mal estado o ropa suelta → atrapamiento de mano o ropa",
     "critico": "no",
     "medidas": "Pulidora con mango y en buen estado; sin ropa ni cabello suelto.",
     "iperc": "202"
    },
    {
     "paso": "Encerar y pulir",
     "evento": "Vibración, posturas forzadas y contacto con ceras → lesión en manos, lesión muscular e irritación",
     "critico": "no",
     "medidas": "Guantes, pausas; para el techo usar plataforma o banqueta adecuada, no pisar la carrocería.",
     "iperc": "813, 1101, 904"
    }
   ]
  },
  {
   "codigo": "T17",
   "nombre": "Preparar la pintura",
   "puestos": [
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador con filtro para vapores orgánicos (o el que indique la HDS), lentes, guantes de nitrilo",
   "herramientas": "Recipientes rotulados, balanza o regla de mezcla",
   "pasos": [
    {
     "paso": "Mezclar pintura, endurecedor y diluyente",
     "evento": "Vapores (posibles isocianatos según HDS) → intoxicación o daño respiratorio",
     "critico": "si",
     "medidas": "Zona o cuarto de mezcla ventilado, respirador indicado por la HDS.",
     "iperc": "903"
    },
    {
     "paso": "Trasvasar productos",
     "evento": "Salpicaduras → lesión en ojos y piel; productos inflamables → incendio",
     "critico": "si",
     "medidas": "Lentes y guantes de nitrilo, lavaojos accesible, recipientes cerrados y rotulados, sin fuentes de ignición.",
     "iperc": "904, 501"
    }
   ]
  },
  {
   "codigo": "T18",
   "nombre": "Llevar el vehículo a lavado o al horno",
   "puestos": [
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [],
   "epp": "Zapatos de seguridad antideslizantes",
   "herramientas": "Vehículo",
   "pasos": [
    {
     "paso": "Conducir el vehículo a lavado o hacia el horno",
     "evento": "Maniobra en espacio reducido → choque, atrapamiento o atropello",
     "critico": "si",
     "medidas": "Velocidad mínima, cinturón y un compañero que guíe la maniobra.",
     "iperc": "1254"
    },
    {
     "paso": "Caminar por la zona de lavado",
     "evento": "Piso mojado → caída al mismo nivel",
     "critico": "no",
     "medidas": "Calzado antideslizante y señalizar los pisos mojados.",
     "iperc": "307"
    }
   ]
  },
  {
   "codigo": "T19",
   "nombre": "Pintar dentro del horno",
   "puestos": [
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS (con procedimiento escrito)",
   "permisos": {},
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador indicado por la HDS, traje de pintura, guantes de nitrilo, protección ocular",
   "herramientas": "Pistola de pintar, horno con extracción",
   "pasos": [
    {
     "paso": "Verificar que la extracción del horno funcione",
     "evento": "Sin extracción → acumulación de vapores, intoxicación e incendio",
     "critico": "si",
     "medidas": "No pintar si la extracción no funciona; filtros en buen estado.",
     "iperc": "903, 501"
    },
    {
     "paso": "Ingresar sin fuentes de ignición",
     "evento": "Celulares, encendedores o herramientas no aptas → incendio o explosión",
     "critico": "si",
     "medidas": "Dejar fuera del horno toda fuente de ignición; extintor en el exterior.",
     "iperc": "501, 403"
    },
    {
     "paso": "Aplicar las capas de pintura",
     "evento": "Vapores y niebla → intoxicación; brazos elevados → lesión muscular",
     "critico": "si",
     "medidas": "Respirador indicado por la HDS, traje de pintura; pausas; plataforma para zonas altas.",
     "iperc": "903, 904, 1101"
    }
   ]
  },
  {
   "codigo": "T20",
   "nombre": "Apoyar el pintado dentro del horno (no rutinario)",
   "puestos": [
    "Ayudante de Pintura"
   ],
   "rutina": "NR",
   "documento": "PETAR materiales peligrosos (no rutinario)",
   "permisos": {
    "peligrosos": true
   },
   "eppIds": [
    "guantes",
    "resp_mediacara_filtro"
   ],
   "epp": "Respirador indicado por la HDS, traje de pintura, guantes de nitrilo, protección ocular",
   "herramientas": "Horno con extracción",
   "pasos": [
    {
     "paso": "Coordinar el ingreso con el técnico de pintura",
     "evento": "Ingresar sin conocer el producto ni el procedimiento → intoxicación",
     "critico": "si",
     "medidas": "Revisar la HDS, ingresar solo con la extracción operativa y con el EPP completo.",
     "iperc": "903"
    },
    {
     "paso": "Apoyar dentro del horno",
     "evento": "Vapores inflamables y superficies calientes → incendio y quemaduras",
     "critico": "si",
     "medidas": "Sin fuentes de ignición; esperar que enfríe antes de tocar el vehículo.",
     "iperc": "501, 222"
    }
   ]
  },
  {
   "codigo": "T21",
   "nombre": "Secar en el horno",
   "puestos": [
    "Técnico de Pintura"
   ],
   "rutina": "R",
   "documento": "Solo ATS",
   "permisos": {},
   "eppIds": [
    "guantes"
   ],
   "epp": "Guantes",
   "herramientas": "Horno de pintura",
   "pasos": [
    {
     "paso": "Encender el horno y esperar el secado",
     "evento": "Falla del horno o recipientes inflamables dentro → incendio",
     "critico": "si",
     "medidas": "Retirar recipientes con producto antes de encender; mantenimiento del horno al día; extintor cerca.",
     "iperc": "223"
    },
    {
     "paso": "Retirar el vehículo y revisar el acabado",
     "evento": "Superficies calientes → quemaduras",
     "critico": "no",
     "medidas": "Esperar el enfriamiento y usar guantes.",
     "iperc": "222"
    }
   ]
  },
  {
   "codigo": "T22",
   "nombre": "Trabajar en techos o zonas altas del vehículo (por identificar)",
   "puestos": [
    "Ayudante de Carrocería",
    "Técnico de Carrocería",
    "Ayudante de Pintura",
    "Técnico de Pintura"
   ],
   "rutina": "NR",
   "documento": "PETAR altura si el trabajo es desde 1,80 m (criterio provisional)",
   "permisos": {
    "altura": "desde18"
   },
   "eppIds": [],
   "epp": "Arnés y línea de anclaje cuando corresponda",
   "herramientas": "Plataforma con barandas o escalera inspeccionada",
   "pasos": [
    {
     "paso": "Elegir el medio de acceso",
     "evento": "Subirse sobre la carrocería o a una escalera en mal estado → caída de altura",
     "critico": "si",
     "medidas": "Usar plataforma con barandas o escalera inspeccionada; prohibido pisar la carrocería.",
     "iperc": "330, 310"
    },
    {
     "paso": "Subir y trabajar en altura",
     "evento": "Pérdida de equilibrio → caída de altura, fracturas",
     "critico": "si",
     "medidas": "Tres puntos de contacto, no trabajar desde los últimos peldaños; arnés y anclaje si corresponde.",
     "iperc": "330, 310"
    }
   ]
  }
 ],
 "ubicacionesPorSede": {
  "ATE": [
   {
    "nombre": "Nivel 1 – Bahía 1",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 2",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 3",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 4",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 5",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 6",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 7",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Bahía 8",
    "tipo": "abierta"
   },
   {
    "nombre": "Nivel 1 – Horno 1 (lado A)",
    "tipo": "horno"
   },
   {
    "nombre": "Nivel 1 – Horno 2 (lado A)",
    "tipo": "horno"
   },
   {
    "nombre": "Nivel 1 – Horno 3 (lado A)",
    "tipo": "horno"
   },
   {
    "nombre": "Nivel 1 – Horno 4 (lado B)",
    "tipo": "horno"
   },
   {
    "nombre": "Nivel 1 – Horno 5 (lado B)",
    "tipo": "horno"
   }
  ]
 }
};
