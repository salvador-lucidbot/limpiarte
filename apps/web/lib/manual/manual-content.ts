/**
 * Contenido del Manual de funciones del panel de administración.
 *
 * Las secciones del grupo "operacion" provienen del documento interno
 * "PREGUNTAS FRECUENTES LINEA HOGAR" (05/10/2026) y son las respuestas que el
 * equipo entrega a los clientes; están redactadas para poder copiarse y enviarse.
 * Las del grupo "plataforma" documentan el uso del Superadmin.
 *
 * `aliases` no se muestra en pantalla: alimenta el buscador para que una misma
 * duda se encuentre aunque el cliente la haya formulado de otra manera.
 */

export type ManualGroup = "operacion" | "plataforma";

export interface ManualEntry {
  id: string;
  question: string;
  aliases?: string[];
  answer: string[];
}

export interface ManualSection {
  id: string;
  group: ManualGroup;
  title: string;
  summary: string;
  entries: ManualEntry[];
}

export const MANUAL_GROUPS: { id: ManualGroup; title: string; summary: string }[] = [
  {
    id: "operacion",
    title: "Operación del servicio",
    summary: "Respuestas oficiales para clientes de la línea hogar. Listas para copiar y enviar."
  },
  {
    id: "plataforma",
    title: "Uso de la plataforma",
    summary: "Cómo operar cada sección del Superadmin."
  }
];

export const MANUAL_SECTIONS: ManualSection[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "jornadas",
    group: "operacion",
    title: "Jornadas y horarios",
    summary: "Duración de los servicios, horas de ingreso, almuerzo y días de atención.",
    entries: [
      {
        id: "jornada-completa",
        question: "¿A qué hora inicia el servicio de jornada completa?",
        aliases: ["8 horas", "hora de inicio", "a qué hora llega", "cuánto dura la jornada"],
        answer: [
          "Nuestro servicio de jornada completa tiene una duración efectiva de 7 horas y 12 minutos de servicio, más 1 hora de almuerzo para la profesional. Es decir, desde su ingreso hasta la finalización transcurren aproximadamente 8 horas y 12 minutos.",
          "Puedes programar el inicio del servicio a las 7:00 a. m., 7:30 a. m. o máximo a las 8:00 a. m., según lo que mejor se ajuste a tu rutina.",
          "Siempre recomendamos elegir el horario más temprano posible, ya que esto facilita el desplazamiento de la profesional y nos ayuda a garantizar una llegada mucho más puntual."
        ]
      },
      {
        id: "ya-no-hay-8-horas",
        question: "¿Tienen disponibilidad para un servicio de 8 horas?",
        aliases: ["servicio de 8 horas", "turno de 8 horas", "sábado 8 horas"],
        answer: [
          "Actualmente ya no manejamos servicios de 8 horas. Debido a la reducción de la jornada laboral, nuestra jornada completa es de 7 horas y 12 minutos de servicio efectivo.",
          "Este servicio de 7 horas y 12 minutos se presta exclusivamente de lunes a viernes.",
          "Para los días sábado manejamos únicamente el servicio de 6 horas, normalmente de 7:00 a. m. a 1:00 p. m."
        ]
      },
      {
        id: "seis-horas-entre-semana",
        question: "¿Puedo tomar 6 horas un lunes y empezar a las 10:00 a. m.?",
        aliases: ["6 horas lunes a viernes", "empezar a las 10", "jornada de 6 horas entre semana"],
        answer: [
          "Para los días lunes a viernes no manejamos jornadas de 6 horas. Ese servicio está disponible únicamente los días sábado.",
          "De lunes a viernes puedes tomar nuestra jornada completa de 7 horas y 12 minutos de servicio, y el horario de ingreso puede ser a las 7:00 a. m., 7:30 a. m. o máximo a las 8:00 a. m. Por esta razón, no sería posible iniciar a las 10:00 a. m.",
          "Si necesitas una jornada más corta para el lunes, también contamos con nuestro servicio de medio tiempo, que podemos revisar de acuerdo con la disponibilidad."
        ]
      },
      {
        id: "medio-tiempo",
        question: "¿Manejan servicios de medio día o de 4 horas?",
        aliases: ["medio tiempo", "jornada corta", "solo 4 horas", "poco tiempo"],
        answer: [
          "De lunes a viernes contamos con una alternativa de medio tiempo para clientes que necesitan una jornada más corta.",
          "Esta opción puede ser ideal para apartamentos pequeños, mantenimientos puntuales o cuando deseas concentrar el servicio en determinadas zonas.",
          "La profesional realizará durante ese tiempo las actividades que establezcas como prioritarias, teniendo siempre presente que nuestro servicio se presta por tiempo y no por cantidad de tareas. Al ser una jornada más corta, es muy importante definir las prioridades desde el inicio."
        ]
      },
      {
        id: "escoger-hora",
        question: "¿Puedo escoger la hora en la que quiero que llegue la persona?",
        aliases: ["elegir horario", "horario a la medida", "hora de llegada"],
        answer: [
          "Contamos con horarios establecidos según la jornada contratada, por lo que no es posible seleccionar cualquier hora del día.",
          "Para nuestra jornada completa de lunes a viernes, los ingresos pueden programarse a las 7:00 a. m., 7:30 a. m. o máximo a las 8:00 a. m. Recomendamos siempre el horario más temprano posible para facilitar el desplazamiento y la puntualidad de la profesional.",
          "Los sábados, nuestra jornada de 6 horas normalmente se realiza de 7:00 a. m. a 1:00 p. m."
        ]
      },
      {
        id: "llegar-mas-temprano",
        question: "¿Puedo solicitar que la profesional llegue un poco más temprano?",
        aliases: ["adelantar la hora", "llegar antes", "6:30 de la mañana"],
        answer: [
          "Nuestros horarios de ingreso están previamente establecidos y, para la jornada completa de lunes a viernes, normalmente manejamos ingresos a las 7:00 a. m., 7:30 a. m. o máximo a las 8:00 a. m.",
          "Sin embargo, si se trata de un caso puntual o de una única vez, podemos revisar la posibilidad de que la profesional llegue un poco más temprano. Por ejemplo, si ese día necesitas que llegue a las 6:30 a. m. en lugar de las 7:00 a. m., puedes conversarlo con ella y, si está de acuerdo, también debes informarnos previamente a nosotros.",
          "Es muy importante que Limpiarte tenga conocimiento de ese cambio para poder hacer seguimiento y estar atentos a que el horario acordado se cumpla correctamente."
        ]
      },
      {
        id: "almuerzo-profesional",
        question: "¿La profesional tiene tiempo de almuerzo? ¿Se alarga su hora de salida?",
        aliases: ["hora de almuerzo", "descanso", "hora de salida", "8 horas y 12 minutos"],
        answer: [
          "En nuestra jornada completa, la profesional cuenta con 1 hora de almuerzo, que es su espacio de descanso y no hace parte de las 7 horas y 12 minutos efectivos de servicio.",
          "Por esta razón, la hora de salida se extiende una hora. Es decir, la profesional permanece en tu hogar un total de 8 horas y 12 minutos. Por ejemplo, si inicia a las 7:00 a. m., su jornada finalizaría aproximadamente a las 3:12 p. m.",
          "Los sábados, la jornada es de 6 horas continuas, normalmente de 7:00 a. m. a 1:00 p. m., por lo que no se contempla una hora adicional de almuerzo.",
          "La profesional lleva su propio almuerzo, por lo que como cliente no tienes que proporcionárselo."
        ]
      },
      {
        id: "desayuno-almuerzo",
        question: "¿Hay que darle desayuno o almuerzo a la profesional?",
        aliases: ["darle comida", "alimentación", "hay que darle de comer"],
        answer: [
          "No es obligatorio que le brindes desayuno ni almuerzo a la profesional.",
          "En algunos casos, la profesional puede llevar algo para desayunar y tomar aproximadamente 10 minutos en la mañana para consumirlo. Este tiempo posteriormente lo repone, para que no afecte el tiempo efectivo de tu servicio.",
          "Para su almuerzo, la profesional siempre debe llevar su propia alimentación, por lo que el cliente no tiene que suministrársela.",
          "Si deseas ofrecerle un café, un refrigerio o incluso compartirle el almuerzo, puedes hacerlo con toda tranquilidad, pero es un gesto completamente voluntario y en ningún momento es una obligación para ti como cliente."
        ]
      },
      {
        id: "domingos-festivos",
        question: "¿Prestan servicio los domingos o festivos? ¿Tienen recargo?",
        aliases: ["domingo en la tarde", "días festivos", "recargo dominical", "fin de semana"],
        answer: [
          "Por el momento no prestamos servicios los días domingos ni festivos, por lo tanto tampoco manejamos una tarifa adicional o recargo para esos días.",
          "Nuestras profesionales trabajan durante la semana y los días sábado, por eso reservamos los domingos y festivos como días de descanso, para que puedan recuperarse después de una jornada exigente y, sobre todo, tener tiempo para compartir con sus familias.",
          "Nuestros servicios de jornada completa de 7 horas y 12 minutos se prestan de lunes a viernes, y los sábados contamos con jornadas de 6 horas. Con mucho gusto podemos ayudarte a programar tu servicio de lunes a sábado."
        ]
      },
      {
        id: "aumentar-horas",
        question: "¿Puedo aumentar las horas del servicio solo por esta semana?",
        aliases: ["extender la jornada", "horas adicionales", "que se quede más tiempo"],
        answer: [
          "Podemos revisarlo, pero aumentar las horas de una jornada no es un cambio que podamos confirmar automáticamente, porque primero debemos validar si la profesional que tienes asignada puede y desea apoyarnos con ese tiempo adicional.",
          "Actualmente nuestras jornadas están organizadas teniendo en cuenta la reducción de la jornada laboral. La idea es que nuestras profesionales puedan ingresar temprano, cumplir con su jornada y también salir a una hora adecuada, considerando que muchas de ellas deben realizar desplazamientos largos desde el lugar del servicio hasta sus hogares.",
          "Cualquier extensión de horario debe revisarse previamente con la profesional y, si es posible, acordarse de manera organizada sin afectar sus tiempos de descanso ni su programación. Cuéntanos cuántas horas adicionales necesitas y para qué día, y revisaremos si es viable."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "alcance",
    group: "operacion",
    title: "Qué incluye el servicio",
    summary: "Actividades cubiertas, límites por seguridad y el principio de servicio por tiempo.",
    entries: [
      {
        id: "servicio-por-tiempo",
        question: "¿Qué comprende la jornada? ¿Qué es una limpieza completa?",
        aliases: [
          "qué hace la persona",
          "turno de 7 horas qué incluye",
          "limpieza completa",
          "limpieza profunda qué incluye",
          "detallar el servicio"
        ],
        answer: [
          "Durante el servicio, la profesional puede apoyarte con las diferentes labores de aseo, limpieza y organización de tu hogar, siempre teniendo en cuenta las prioridades que tengas para ese día.",
          "Dentro de la jornada puede realizar actividades como limpieza de cocina y baños, habitaciones, zonas comunes, pisos, superficies, muebles, puertas, paredes, organización general, lavado de ropa y limpieza de ventanas de fácil acceso. Si deseas planchado, la profesional puede dedicar la última hora del servicio a esta actividad.",
          "Es importante tener presente que nuestro servicio se presta por tiempo y no por cantidad de actividades. Por eso, al iniciar te recomendamos indicarle a la profesional cuáles son las labores más importantes para ti, para que pueda organizar su jornada y avanzar primero con tus prioridades.",
          "Aunque podemos realizar una limpieza detallada, no podemos garantizar que todas las actividades solicitadas queden terminadas en una sola jornada, ya que dependerá del tamaño y las condiciones del hogar."
        ]
      },
      {
        id: "planchado",
        question: "¿Hacen planchado? ¿Puedo pedir un día completo de planchado?",
        aliases: [
          "planchar ropa",
          "día completo planchado",
          "cuánto planchan",
          "más ropa para planchar",
          "una hora de planchado"
        ],
        answer: [
          "Nuestros servicios están enfocados principalmente en el aseo, limpieza y organización general del hogar, y dentro de la jornada también podemos apoyarte con el lavado de ropa.",
          "El planchado sí lo realizamos, pero tenemos establecido un tiempo máximo de 1 hora por servicio, que se realiza durante la última hora de la jornada. Esta medida la manejamos pensando en el bienestar y cuidado de nuestras profesionales de limpieza.",
          "Por esta razón, no podríamos ofrecerte un día completo dedicado únicamente a planchar. Lo que sí podemos hacer es organizar las prioridades del servicio para aprovechar muy bien el tiempo.",
          "Si tienes bastante ropa para planchar, te recomendamos indicárselo desde el inicio para que la profesional, al llegar a la última hora, priorice las prendas que para ti sean más importantes. Aunque haya más ropa pendiente, no podemos extender el planchado por más de una hora: es una actividad repetitiva y físicamente exigente."
        ]
      },
      {
        id: "misma-persona-plancha",
        question: "¿La misma persona plancha el mismo día del aseo?",
        aliases: ["quién plancha", "cómo se organiza la jornada con planchado"],
        answer: [
          "Sí, la misma profesional que realiza el aseo es quien se encarga también del planchado.",
          "La jornada se organiza de manera que la profesional realiza primero las actividades de aseo, limpieza, organización y demás tareas que hayas priorizado y, durante la última hora del servicio, se dedica al planchado.",
          "De esta manera podemos ayudarte con diferentes labores del hogar durante una misma visita, procurando aprovechar muy bien el tiempo y, al mismo tiempo, cuidar el bienestar de nuestra profesional."
        ]
      },
      {
        id: "vidrios-ventanas",
        question: "¿Limpian vidrios y ventanas? ¿También por fuera?",
        aliases: [
          "limpieza de vidrios",
          "ventanas por fuera",
          "ventanales",
          "limpieza en alturas",
          "piso 15",
          "balcón"
        ],
        answer: [
          "Podemos realizar la limpieza de las ventanas por dentro y por fuera, siempre que ambas partes sean de fácil y seguro acceso para la profesional desde el interior.",
          "No realizamos limpieza de ventanas ubicadas en balcones, fachadas o zonas donde exista riesgo de caída. Tampoco permitimos que la profesional se asome, se suba a bordes, sillas, escaleras o estructuras para intentar alcanzar la parte exterior.",
          "Esta medida la manejamos porque una caída desde altura puede generar un accidente muy grave e incluso poner en riesgo la vida de la profesional. Con esta política buscamos proteger a nuestra profesional, protegerte a ti como cliente y evitar cualquier situación de riesgo.",
          "No contamos con personal especializado para trabajos en fachadas o ventanales en altura. Para ese tipo de trabajo exterior recomendamos contratar una empresa especializada en limpieza de vidrios y trabajos en alturas, con personal certificado, equipos de protección y herramientas adecuadas.",
          "Para nosotros, ninguna actividad de limpieza justifica poner en riesgo la vida de una persona."
        ]
      },
      {
        id: "paredes",
        question: "¿La limpieza de paredes está incluida?",
        aliases: ["limpiar paredes", "paredes en limpieza profunda"],
        answer: [
          "La limpieza de paredes puede realizarse dentro del servicio, siempre que sean zonas de fácil acceso y que puedan limpiarse de manera segura por nuestra profesional.",
          "Como el servicio se presta por tiempo, si deseas que ese día se haga una limpieza más detallada de las paredes, te recomendamos indicarlo como una de tus prioridades al iniciar la jornada.",
          "Por seguridad, no realizamos trabajos que impliquen alturas o actividades que puedan poner en riesgo a la profesional."
        ]
      },
      {
        id: "lavado-ropa",
        question: "¿Pueden lavar, doblar y lavar a mano la ropa?",
        aliases: ["lavar ropa", "lavado a mano", "doblar ropa", "lavandería", "prendas delicadas"],
        answer: [
          "El lavado y la organización básica de la ropa pueden hacer parte de las actividades del servicio. La profesional puede utilizar la lavadora o realizar lavado a mano de algunas prendas, según tus indicaciones, y posteriormente ayudarte a doblarlas y organizarlas dentro del tiempo disponible.",
          "El lavado a mano aplica especialmente para aquellas prendas que por su cuidado o delicadeza prefieras no colocar en la lavadora. Te recomendamos informarle a la profesional al iniciar el servicio cuáles prendas deseas lavar a mano.",
          "Se trata de lavado doméstico de prendas. No realizamos procesos especializados de lavandería, lavado en seco ni tratamientos que requieran productos, equipos o técnicas especiales.",
          "Si además necesitas planchado, recuerda que manejamos máximo una hora y siempre al finalizar la jornada."
        ]
      },
      {
        id: "organizacion",
        question: "¿Puede recoger y organizar la casa, closets y camas?",
        aliases: ["organizar closets", "tender camas", "recoger la casa", "cambio de sábanas", "orden"],
        answer: [
          "La organización básica del hogar hace parte de las actividades de la jornada. La profesional puede ayudarte a recoger y organizar diferentes espacios mientras realiza el aseo, incluyendo la organización básica de closets.",
          "Tender y organizar las camas también hace parte de las actividades habituales. Si deseas cambio de sábanas o ropa de cama, puedes dejar los elementos disponibles e indicárselo a la profesional.",
          "Recuerda que todas estas actividades consumen tiempo de la jornada contratada. La organización de closets, en particular, puede tomar bastante tiempo dependiendo de la cantidad de ropa, por lo que te recomendamos establecerla como una prioridad específica para ese día."
        ]
      },
      {
        id: "muebles-colchones",
        question: "¿Limpian muebles y colchones?",
        aliases: ["lavado de muebles", "sofás", "tapizados", "lavar colchón", "extracción de manchas"],
        answer: [
          "La profesional puede realizar la limpieza exterior y superficial de los muebles como parte del aseo general, utilizando los productos y elementos adecuados que tengas disponibles en tu hogar. También puede realizar la limpieza superficial del colchón.",
          "Lo que no realizamos es lavado profundo de muebles tapizados o colchones, extracción de manchas con maquinaria, lavado con vapor ni procesos especializados, ya que nuestras profesionales no trabajan con este tipo de equipos.",
          "Si buscas un lavado profundo, lo recomendable es contratar una empresa especializada en ese procedimiento."
        ]
      },
      {
        id: "cortinas",
        question: "¿Las cortinas se pueden incluir dentro del servicio?",
        aliases: ["limpiar cortinas", "desmontar cortinas", "rieles"],
        answer: [
          "Podemos realizar limpieza básica de las cortinas siempre que sea una actividad segura y no implique trabajos en altura, desmontajes complejos o procedimientos especializados.",
          "Es muy importante que las cortinas, rieles, soportes y mecanismos se encuentren en buen estado. En algunas ocasiones una cortina puede tener desgaste, soportes flojos o falta de mantenimiento y, al moverla normalmente para realizar la limpieza, puede desprenderse o presentar alguna avería.",
          "Si notas que la cortina tiene alguna falla, está floja o requiere mantenimiento, te recomendamos informarlo previamente y evitar su manipulación. Cuando se requiera desmontar, instalar, reparar o realizar un mantenimiento profundo, lo más recomendable es contratar a un profesional especializado."
        ]
      },
      {
        id: "nevera-estufa-horno",
        question: "¿Limpian la nevera, la estufa y el horno?",
        aliases: ["limpieza de nevera", "limpiar estufa", "limpiar horno", "grasa de cocina", "electrodomésticos"],
        answer: [
          "Sí, las tres actividades pueden incluirse dentro de la jornada y no generan un cobro adicional: se realizan dentro de las horas que tienes contratadas.",
          "Te recomendamos informarle a la profesional desde el inicio si deseas priorizarlas, especialmente si la nevera necesita una limpieza detallada en el interior o si la estufa y el horno tienen acumulación importante de grasa, ya que pueden consumir una parte importante del tiempo disponible.",
          "Para la nevera es muy importante que, antes de comenzar, le indiques de manera muy clara qué alimentos puede desechar y cuáles debe conservar. La profesional no debe tomar por su cuenta la decisión de desechar alimentos.",
          "No realizamos desarme técnico de electrodomésticos ni procedimientos que requieran equipos especializados."
        ]
      },
      {
        id: "cocinar",
        question: "¿La profesional puede cocinar?",
        aliases: [
          "preparación de alimentos",
          "que cocine",
          "incluye cocina",
          "cocinar 3 días",
          "cocinar 4 o 5 días",
          "12 servicios al mes"
        ],
        answer: [
          "La profesional sí puede apoyarte con la preparación básica de alimentos, pero este beneficio está disponible únicamente en el Plan Frecuente, cuando tienes programados mínimo 3 días de servicio a la semana en jornada completa, es decir, aproximadamente 12 servicios al mes.",
          "Para servicios esporádicos, de única vez o con una frecuencia menor a 3 días por semana, el servicio está enfocado en las labores de aseo y limpieza, por lo que no incluye preparación de alimentos.",
          "Esta condición busca cuidar tu inversión y garantizar la calidad del servicio. Por nuestra experiencia, cuando la profesional dispone de muy pocos días para realizar al mismo tiempo el aseo del hogar y la preparación de alimentos, alguna de las dos actividades puede quedar incompleta o no alcanzar el nivel de calidad que esperamos.",
          "Ten en cuenta la diferencia: 4 o 5 días por semana son 16 o 20 servicios al mes y sí permiten incluir cocina; 4 o 5 días en todo el mes equivalen a un servicio por semana y no la incluyen."
        ]
      },
      {
        id: "mascotas",
        question: "¿Prestan el servicio si tengo mascotas?",
        aliases: ["mascota", "perro", "gato", "pasear la mascota", "informar mascota"],
        answer: [
          "Tener mascotas en casa no impide que podamos realizar tu servicio de limpieza. No es obligatorio informarlo al reservar: este tema hace parte de la capacitación que reciben nuestras profesionales antes de iniciar operación.",
          "Sí te pedimos avisarnos si alguna requiere un manejo particular. Durante el servicio es importante que permanezcan en condiciones seguras para evitar accidentes, escapes o situaciones que puedan poner en riesgo a la mascota o a nuestra profesional. Si es una mascota muy inquieta o territorial, te recomendamos mantenerla en un espacio seguro mientras se realizan las actividades.",
          "La profesional no puede salir a pasear la mascota ni hacerse responsable de sacarla del hogar, ya que podría presentarse una situación de riesgo, como un accidente, una pérdida o incluso un hurto, tanto para la mascota como para la profesional."
        ]
      },
      {
        id: "mudanza-entrega",
        question: "¿Hacen limpieza después de una mudanza o antes de entregar un inmueble?",
        aliases: ["post mudanza", "entrega de apartamento", "apartamento desocupado", "obra", "escombros"],
        answer: [
          "Podemos ayudarte con la limpieza de un inmueble después de una mudanza, antes de entregarlo o cuando ha permanecido desocupado.",
          "Es importante que nos cuentes previamente en qué estado se encuentra, ya que este tipo de limpieza suele requerir bastante más tiempo que un mantenimiento habitual y puede existir acumulación de polvo o necesidad de mayor detalle.",
          "Si se trata de una limpieza para entrega, infórmanos, porque normalmente se requiere mayor detalle en cocina, baños, pisos, paredes e interiores accesibles.",
          "Como trabajamos por tiempo contratado, te recomendamos escoger una jornada acorde con las condiciones reales del inmueble y establecer las prioridades desde el inicio. No realizamos retiro de escombros, residuos de obra, trabajos en altura ni actividades que requieran maquinaria especializada."
        ]
      },
      {
        id: "casa-dos-pisos",
        question: "¿El servicio se puede solicitar para una casa de dos pisos?",
        aliases: ["casa grande", "dos niveles", "casa de dos plantas"],
        answer: [
          "Podemos prestar el servicio en una casa de dos pisos sin ningún inconveniente.",
          "Lo importante es tener presente que nuestro servicio se presta por tiempo y no por cantidad de actividades. El tamaño de la vivienda, su estado de aseo y el nivel de detalle que necesites determinarán cuánto puede avanzar la profesional durante la jornada.",
          "Te recomendamos indicarle al iniciar cuáles son tus prioridades, para que pueda organizar el tiempo de la mejor manera."
        ]
      },
      {
        id: "metros-cuadrados",
        question: "¿El servicio depende del área o los metros cuadrados?",
        aliases: ["metros cuadrados", "tamaño del apartamento", "cuánto se demora el aseo"],
        answer: [
          "Nuestros servicios no se contratan por los metros cuadrados, sino principalmente por el tiempo de servicio que necesitas.",
          "Sin embargo, el tamaño del hogar sí es importante para orientarte sobre cuál jornada puede ser más conveniente. Un apartamento más grande, con varias habitaciones y baños, normalmente requerirá más tiempo que un espacio pequeño, especialmente si buscas una limpieza detallada.",
          "También influyen el estado del inmueble, la cantidad de actividades y el nivel de detalle que deseas. Una casa pequeña con acumulación de suciedad puede necesitar más tiempo que un espacio más grande que recibe mantenimiento frecuente.",
          "Si nos indicas aproximadamente cuántos metros cuadrados tiene, cuántas habitaciones y baños y qué tipo de limpieza necesitas, podemos recomendarte la jornada más adecuada."
        ]
      },
      {
        id: "priorizar",
        question: "¿Puedo pedir que prioricen ciertas zonas o actividades?",
        aliases: ["enfocarse en cocina y baños", "prioridades", "si no alcanza el tiempo", "limpieza profunda un día"],
        answer: [
          "De hecho, te recomendamos que al iniciar el servicio le indiques a la profesional cuáles son las actividades o espacios más importantes para ti, para que pueda organizar la jornada de acuerdo con tus prioridades.",
          "Por ejemplo, puedes indicarle que primero priorice baños y cocina y, una vez finalizados, continúe con las demás áreas según el tiempo disponible. Así, si el tiempo contratado no alcanza para completar todo lo solicitado, las actividades más importantes para ti habrán sido atendidas primero.",
          "Lo mismo aplica si un día deseas una limpieza mucho más detallada de determinadas zonas: dedicar más tiempo a ciertos espacios puede significar que otras actividades no alcancen a realizarse.",
          "Preferimos realizar un trabajo bien hecho y detallado en las zonas que permita la jornada, antes que intentar cubrir toda la vivienda rápidamente y afectar la calidad del servicio."
        ]
      },
      {
        id: "dos-profesionales",
        question: "¿Puedo solicitar dos profesionales para el mismo servicio?",
        aliases: ["dos personas", "más de una profesional", "dos servicios el mismo día"],
        answer: [
          "Sí es posible solicitar dos profesionales para un mismo servicio, siempre que contemos con disponibilidad para la fecha que necesitas.",
          "Debes tener presente que cada profesional corresponde a un servicio independiente, por lo que se realiza el pago de la jornada contratada para cada una. Es decir, si solicitas dos profesionales, se facturan dos servicios.",
          "Esta opción puede ser muy útil cuando tienes un espacio amplio, varias zonas por atender o deseas avanzar más actividades durante el mismo periodo de tiempo.",
          "Si deseas esta opción, solo debes informarnos al momento de realizar la reserva para que podamos validar la disponibilidad de dos profesionales para el mismo día."
        ]
      },
      {
        id: "salir-a-comprar",
        question: "¿La profesional puede salir durante el servicio a comprar algo?",
        aliases: ["mandarla a la tienda", "hacer diligencias", "mercado", "salir del domicilio"],
        answer: [
          "La profesional puede salir únicamente de manera puntual y muy cerca del lugar del servicio, por ejemplo a la tienda de la esquina si hace falta algún producto o elemento de aseo de última hora.",
          "Lo que no está permitido es enviarla a hacer mercado, diligencias, pagos, compras extensas o recorridos fuera del sector, ya que su actividad laboral y la cobertura de riesgos están asociadas principalmente al lugar donde está prestando el servicio.",
          "En resumen: sí puede realizar una compra rápida y cercana relacionada con el servicio, pero no puede salir a hacer diligencias o compras que impliquen desplazamientos mayores."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "insumos",
    group: "operacion",
    title: "Productos e implementos",
    summary: "Qué debe tener el cliente disponible el día del servicio.",
    entries: [
      {
        id: "quien-lleva-productos",
        question: "¿La profesional lleva los productos o los debe tener el cliente?",
        aliases: ["implementos de aseo", "ustedes traen los productos", "quién pone los productos"],
        answer: [
          "Los implementos y productos de aseo deben estar disponibles en el hogar. La profesional no lleva consigo los productos ni los elementos para realizar la limpieza, ya que no los transporta de un hogar a otro.",
          "Esto también nos permite utilizar los productos que tú prefieres y que son adecuados para los materiales y superficies de tu hogar.",
          "Si tienes dudas sobre qué productos deberías tener para el día del servicio, con mucho gusto podemos orientarte."
        ]
      },
      {
        id: "lista-productos",
        question: "¿Qué productos e implementos se necesitan?",
        aliases: ["lista de productos", "qué debo comprar", "jabón en polvo y cloro", "qué hace falta"],
        answer: [
          "Como productos básicos te recomendamos contar con limpiador o desinfectante para pisos y superficies, desengrasante para la cocina, limpiavidrios, jabón para baños, lavaplatos, detergente para ropa y cloro si acostumbras utilizarlo.",
          "En cuanto a implementos, es ideal tener escoba, recogedor, trapero, balde, paños o bayetillas, esponjas y guantes de limpieza en buen estado.",
          "Si ya cuentas con jabón en polvo y cloro, tienes una buena parte de lo básico; lo que normalmente hace falta es el desengrasante, el limpiavidrios y el jabón para baños."
        ]
      },
      {
        id: "marcas",
        question: "¿Necesitan una marca específica de productos?",
        aliases: ["marca especial", "limpiavidrios marca", "desengrasante marca", "qué marca"],
        answer: [
          "No necesitas comprar una marca específica. Puedes utilizar los productos que normalmente manejas en tu hogar o la marca de tu preferencia.",
          "Lo más importante es que sean adecuados para las superficies que tienes en casa y que estén disponibles al momento de iniciar el servicio.",
          "Nuestra profesional utilizará los productos que tú le suministres, siguiendo tus indicaciones y procurando darles el mejor uso durante la limpieza. Si tienes algún material que requiera un cuidado especial, te recomendamos informárselo antes de comenzar."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "planes",
    group: "operacion",
    title: "Planes y tarifas",
    summary: "Plan Esporádico y Plan Frecuente, diferencias de precio y continuidad.",
    entries: [
      {
        id: "tipos-de-plan",
        question: "¿Qué planes manejan y en qué se diferencian?",
        aliases: [
          "plan esporádico",
          "plan frecuente",
          "plan recurrente",
          "el valor cambia por número de días",
          "otra tarifa si tomo más días",
          "solo un día o plan"
        ],
        answer: [
          "Manejamos dos tipos de plan y la tarifa cambia según la frecuencia con la que necesites el servicio.",
          "Plan Esporádico: si necesitas el servicio solo una vez, de manera ocasional o para una fecha específica. Tiene una tarifa un poco más alta porque corresponde a servicios puntuales y sujetos a la disponibilidad de profesionales, y la profesional se asigna según la disponibilidad de cada fecha.",
          "Plan Frecuente o Recurrente: si vas a necesitar el servicio varios días de manera semanal. Cuenta con una tarifa más económica por servicio y buscamos asignarte la misma profesional en los días programados, lo que permite mayor continuidad, confianza y conocimiento de tu hogar y de tus preferencias.",
          "No tienes que adquirir obligatoriamente un plan mensual: puedes contratar desde un solo servicio o programar servicios semanales de manera recurrente. Si nos indicas cuántos días a la semana necesitas, con mucho gusto te explicamos cuál te conviene más."
        ]
      },
      {
        id: "tarifa-consulta",
        question: "¿Cuánto cuesta el servicio? ¿Hacen algún descuento?",
        aliases: ["precio", "valor", "tarifas", "descuento especial", "cotización", "cuánto vale"],
        answer: [
          "Con mucho gusto te compartimos nuestras tarifas. Para darte el valor correcto, primero necesitamos confirmar dos datos, ya que nuestros precios varían según la ciudad y el tipo de plan:",
          "¿En qué ciudad necesitas el servicio? Bogotá o Medellín.",
          "¿Qué tipo de servicio buscas? Plan Esporádico, si es de única vez u ocasional, o Plan Frecuente, si lo necesitas todas las semanas.",
          "Una vez nos indiques la ciudad y cuál de los dos planes necesitas, te compartimos inmediatamente las tarifas correspondientes para que puedas elegir la jornada que mejor se adapte a ti."
        ]
      },
      {
        id: "servicio-quincenal",
        question: "¿Y si necesito el servicio una vez cada 15 días?",
        aliases: ["quincenal", "cada 15 días", "dos veces al mes"],
        answer: [
          "Si necesitas el servicio una vez cada 15 días, lo podemos manejar a través de nuestro Plan Esporádico, ya que no requiere una programación semanal permanente.",
          "El valor dependerá de la jornada que necesites: servicio de 7 horas y 12 minutos de lunes a viernes, o de 6 horas los días sábado.",
          "Ten presente que, al ser un servicio quincenal, la profesional asignada puede variar de acuerdo con nuestra disponibilidad en cada fecha. Si más adelante deseas contar con una profesional fija y una tarifa más económica, puedes pasar al Plan Frecuente programando el servicio semanalmente."
        ]
      },
      {
        id: "sabado-tarifa",
        question: "¿El sábado tiene un valor diferente?",
        aliases: ["tarifa sábado", "precio del sábado"],
        answer: [
          "Los sábados manejamos una jornada especial de 6 horas, normalmente de 7:00 a. m. a 1:00 p. m., por lo que su tarifa es diferente a las jornadas disponibles de lunes a viernes.",
          "Además, el valor puede variar dependiendo de tu ciudad y de si necesitas un servicio esporádico o de única vez, o un Plan Frecuente o semanal."
        ]
      },
      {
        id: "vigencia-tarifas",
        question: "¿El precio se mantiene si sigo tomando el servicio todos los meses?",
        aliases: ["sube el precio", "incremento", "vigencia de tarifas", "aumento"],
        answer: [
          "Nuestras tarifas se establecen una vez al año, a partir del 1 de enero, y tienen vigencia hasta el 31 de diciembre del mismo año.",
          "Durante ese periodo las tarifas se mantienen fijas tanto en Bogotá como en Medellín, y aplican de la misma manera para los servicios esporádicos y para los Planes Frecuentes.",
          "Si continúas tomando el servicio mes a mes, puedes tener la tranquilidad de que el valor no estará cambiando durante el año. Cuando se realiza una actualización de tarifas, esta entra en vigencia con el nuevo año y se comunica previamente a nuestros clientes."
        ]
      },
      {
        id: "transporte",
        question: "¿El precio incluye el transporte de la profesional?",
        aliases: ["transporte", "pasajes", "taxi", "cobro adicional de transporte", "zona alejada"],
        answer: [
          "El valor que pagas por tu servicio ya incluye el transporte habitual de la profesional, tanto para desplazarse hasta el lugar donde prestará el servicio como para regresar posteriormente a su hogar. Por este transporte normal no debes pagar ningún valor adicional.",
          "Existe una situación especial: si tu domicilio se encuentra en una zona donde, después de bajarse del sistema de transporte público, la profesional necesita tomar un transporte adicional —por ejemplo, taxi u otro medio— para poder llegar hasta tu vivienda, ese desplazamiento adicional deberá ser asumido por el cliente.",
          "Si tu domicilio es accesible normalmente mediante el sistema de transporte público dentro de nuestra zona de cobertura, no tendrás ningún cobro adicional.",
          "Por eso es muy importante proporcionarnos la dirección y las indicaciones de llegada de manera correcta. Si identificamos que existe un desplazamiento adicional, te lo informaremos para que tengas claridad sobre ese costo."
        ]
      },
      {
        id: "servicio-mensual",
        question: "¿Tienen servicio mensual o por varios meses?",
        aliases: ["plan mensual", "contratar varios meses", "renovación mensual"],
        answer: [
          "Contamos con el Plan Frecuente, Recurrente o Semanal, pensado para clientes que desean mantener el servicio de manera continua durante el mes.",
          "Tú nos indicas cuántos días a la semana necesitas el servicio y, de acuerdo con la disponibilidad, te asignamos una profesional para esa programación, buscando que sea la misma en tus días habituales.",
          "El plan se maneja mediante renovaciones mensuales y pago anticipado. Cada mes realizamos la liquidación de los servicios correspondientes a tus días habituales y, una vez efectuado el pago, queda programado el nuevo periodo.",
          "De esta manera puedes continuar mes tras mes durante el tiempo que necesites, manteniendo una programación recurrente y la continuidad de tu profesional."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "reservas",
    group: "operacion",
    title: "Reservas, pagos y facturación",
    summary: "Proceso de agendamiento, medios de pago y confirmación de servicios.",
    entries: [
      {
        id: "como-agendar",
        question: "¿Cómo hago para agendar un servicio?",
        aliases: ["agendar", "reservar", "proceso de reserva", "cómo contratar"],
        answer: [
          "Todo el proceso lo puedes realizar directamente con nosotros por este chat.",
          "Primero te solicitaremos algunos datos básicos como nombre, correo electrónico, ciudad, dirección, fecha y jornada que necesitas. Con esta información verificamos la disponibilidad de nuestras profesionales para el día solicitado.",
          "Una vez confirmemos que tenemos disponibilidad, te compartiremos el enlace de pago seguro. La reserva queda confirmada cuando recibimos el pago total del servicio y nos envías el soporte de pago.",
          "Como último paso, te solicitaremos la ubicación de tu hogar y unas indicaciones sencillas para llegar. Y antes de tu servicio te compartiremos la información de la profesional asignada."
        ]
      },
      {
        id: "anticipacion",
        question: "¿Con cuánta anticipación debo reservar?",
        aliases: ["con cuánto tiempo", "anticipación", "para mañana", "fecha específica", "cupos"],
        answer: [
          "Puedes solicitar tu servicio en cualquier momento. Trabajamos con un sistema de reservas, por lo que los cupos se van ocupando de acuerdo con la disponibilidad que tengamos para cada día.",
          "Lo ideal es reservar con la mayor anticipación posible, especialmente si necesitas una fecha o un día específico. Entre más pronto realices tu solicitud y confirmes el pago, mayores posibilidades tendremos de encontrar disponibilidad para el día que necesitas.",
          "Si necesitas un servicio para una fecha muy cercana, también podemos revisar la disponibilidad que tengamos en ese momento y, si contamos con un cupo, con mucho gusto te ayudamos a programarlo. Si ese día ya está completo, te indicaremos cuál es la fecha más cercana disponible."
        ]
      },
      {
        id: "pago-anticipado",
        question: "¿El pago es anticipado? ¿Puedo abonar una parte?",
        aliases: ["abono", "pago parcial", "pagar después", "pagar al final del mes", "crédito"],
        answer: [
          "Para reservar nuestros servicios, el pago se realiza de manera anticipada y por el valor total del servicio. No manejamos abonos, pagos parciales ni pagos a crédito, y tampoco acumulamos servicios para cobrarlos al finalizar el mes.",
          "La reserva queda confirmada únicamente cuando recibimos el pago completo.",
          "Si tienes un Plan Frecuente, realizamos previamente una liquidación de todos los servicios del mes. Por ejemplo, si necesitas servicio todos los martes y jueves, calculamos todos los martes y jueves correspondientes a ese mes y te enviamos la liquidación completa.",
          "Ten presente que los cupos y las profesionales disponibles se van asignando en el orden en que se confirman los pagos."
        ]
      },
      {
        id: "medios-de-pago",
        question: "¿Cómo puedo pagar? ¿Aceptan tarjeta o transferencia?",
        aliases: ["tarjeta de crédito", "transferencia", "PSE", "Wompi", "link de pago", "número de cuenta"],
        answer: [
          "Al momento de reservar te compartiremos un link de pago seguro y confiable, respaldado por Bancolombia, PSE y Wompi.",
          "Desde ese enlace puedes diligenciar tus datos y escoger entre diferentes medios de pago, como tarjeta débito, tarjeta de crédito y pagos desde más de 30 entidades financieras vinculadas a PSE.",
          "No manejamos pagos por transferencia directa a un número de cuenta bancaria. Por seguridad y trazabilidad, el enlace es nuestro mecanismo oficial de pago y no suministramos números de cuenta.",
          "Una vez el pago sea aprobado, solo debes enviarnos el soporte o comprobante para confirmar tu reserva y continuar con la programación de la profesional."
        ]
      },
      {
        id: "facturacion",
        question: "¿La facturación tiene un costo adicional?",
        aliases: ["factura", "IVA", "factura electrónica", "cobro por facturar"],
        answer: [
          "La facturación no tiene ningún costo adicional. El valor que te informamos por el servicio ya incluye los impuestos correspondientes, incluido el IVA, por lo que no tendrás que pagar ningún valor extra por solicitar la factura.",
          "La factura electrónica se envía directamente al correo electrónico que hayas registrado durante el proceso de reserva."
        ]
      },
      {
        id: "cotizacion",
        question: "¿Me pueden enviar una cotización antes de agendar?",
        aliases: ["cotización formal", "liquidación previa", "presupuesto"],
        answer: [
          "Para servicios de hogar, más que una cotización formal, lo que hacemos es una liquidación previa del servicio para que puedas revisar el valor antes de tomar una decisión.",
          "Si necesitas un servicio esporádico o de única vez, la tarifa es fija según la jornada que elijas, por lo que te informamos directamente el valor correspondiente.",
          "Si estás interesado en un Plan Frecuente, podemos prepararte una liquidación con los días que deseas contratar y el valor estimado de tu programación, para que puedas revisar con calma cuánto pagarías."
        ]
      },
      {
        id: "confirmacion",
        question: "¿Cómo me confirman que el servicio quedó agendado?",
        aliases: ["confirmación", "quedó programado", "está confirmado mi servicio", "servicios del mes programados"],
        answer: [
          "Una vez validemos disponibilidad y recibamos el pago total del servicio, tu reserva queda confirmada y nuestro equipo te envía la confirmación con la información de tu programación.",
          "Adicionalmente, el día anterior al servicio debes recibir un enlace con la carpeta de la profesional asignada. Esa carpeta funciona como parte de la confirmación operativa de tu servicio.",
          "Si tienes un Plan Frecuente y ya realizaste la renovación y el pago del mes, todos los servicios incluidos en tu liquidación quedan programados sin que tengas que solicitarlos nuevamente.",
          "Recuerda que consultar disponibilidad no significa que el cupo quede reservado: la asignación se confirma una vez se completa el proceso de reserva y pago."
        ]
      },
      {
        id: "programar-mes-completo",
        question: "¿Puedo dejar programados los servicios de todo el mes?",
        aliases: ["programación mensual", "todo el mes", "no reservar cada semana"],
        answer: [
          "Esa es una de las principales ventajas del Plan Frecuente: desde el momento en que realizamos la liquidación y renovación de tu plan, quedan programados todos tus servicios del mes.",
          "Por ejemplo, si tienes contratado el servicio todos los martes y jueves, liquidaremos todos los martes y jueves correspondientes a ese mes. Una vez realizado el pago anticipado, esos días quedan establecidos dentro de tu programación.",
          "Cuando llegue el momento de renovar el mes siguiente, volvemos a liquidar los mismos días, conservando tu programación y dando continuidad a la profesional asignada."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "profesionales",
    group: "operacion",
    title: "Profesionales y seguridad",
    summary: "Selección, documentación, identificación e ingreso al domicilio.",
    entries: [
      {
        id: "perfil-anticipado",
        question: "¿Puedo conocer el perfil de la profesional antes del servicio?",
        aliases: [
          "datos de la persona",
          "quién va a venir",
          "carpeta de la profesional",
          "perfil por seguridad",
          "cómo se llama la profesional"
        ],
        answer: [
          "Entendemos que permitir el ingreso de una persona a tu hogar requiere muchísima confianza, y por eso la seguridad es una de nuestras mayores prioridades.",
          "El día anterior al servicio, normalmente durante las horas de la tarde, nuestro Departamento de Operaciones te comparte un enlace con la carpeta de la profesional asignada. Allí podrás consultar su fotografía, la carta de presentación, sus afiliaciones a salud, pensión, riesgos laborales y caja de compensación, además de su examen médico y los certificados de capacitación.",
          "La carpeta se comparte el día anterior y no con varios días de anticipación, porque la operación puede presentar ajustes de último momento por incapacidades, calamidades u otras novedades. Así nos aseguramos de entregarte la información de la profesional que efectivamente asistirá.",
          "Si tu servicio es mañana y aún no has recibido la carpeta, permítenos unos minutos mientras revisamos con el Departamento de Operaciones y te enviamos el enlace correspondiente."
        ]
      },
      {
        id: "vinculacion-antecedentes",
        question: "¿La profesional está vinculada con ustedes? ¿Verifican antecedentes?",
        aliases: ["es de confianza", "estudio de seguridad", "antecedentes", "visita domiciliaria", "contrato"],
        answer: [
          "Todas nuestras profesionales están vinculadas directamente con Limpiarte y, antes de ingresar a operación, pasan por un riguroso proceso de selección y estudio de seguridad.",
          "Ese proceso incluye verificación de antecedentes, validación de referencias laborales, visita domiciliaria y recopilación de la información personal y familiar necesaria para conocer de manera integral a la profesional antes de su contratación.",
          "Además, cuentan con sus afiliaciones correspondientes y se presentan debidamente uniformadas e identificadas.",
          "Sabemos que abrir las puertas de tu casa requiere mucha confianza, por eso este proceso no lo tomamos a la ligera."
        ]
      },
      {
        id: "contacto-cedula",
        question: "¿Me comparten su número de contacto o su cédula?",
        aliases: ["teléfono de la profesional", "número personal", "copia de la cédula", "documento de identidad"],
        answer: [
          "Por privacidad y protección de datos personales no compartimos el número de teléfono personal de la profesional ni enviamos copia de su cédula por el chat.",
          "Toda la comunicación y cualquier novedad del servicio se maneja directamente a través de los canales oficiales de Limpiarte, para mantener la trazabilidad y brindarte acompañamiento durante toda la prestación.",
          "Dentro de la carpeta que te compartimos el día anterior encontrarás su certificado de riesgos laborales, en el cual podrás visualizar el número de identificación de la profesional y verificar que corresponde a la persona que llegará a tu hogar."
        ]
      },
      {
        id: "uniforme-identificacion",
        question: "¿La profesional llega con uniforme e identificación?",
        aliases: ["uniforme", "carné", "identificación de la empresa", "cambiarse"],
        answer: [
          "La profesional se desplaza hasta tu hogar vestida de particular y lleva en su morral el uniforme y los zapatos de trabajo que utilizará durante el servicio.",
          "Una vez llegue, te pedimos por favor facilitarle un espacio privado y adecuado donde pueda cambiarse y guardar de manera segura su ropa y su morral mientras realiza la jornada.",
          "En cuanto a la identificación, la manejamos de forma completamente digital, por lo que no utilizamos carné físico: el día anterior al servicio te compartimos el enlace con su carpeta digital para que puedas verificar previamente quién llegará a tu hogar."
        ]
      },
      {
        id: "audio-indicaciones",
        question: "¿Por qué piden un audio con indicaciones para llegar?",
        aliases: ["audio", "indicaciones de llegada", "cómo llegar", "ubicación"],
        answer: [
          "El audio con las indicaciones para llegar nos ayuda a que la profesional pueda ubicar tu domicilio de una manera mucho más fácil y segura el día del servicio.",
          "Aunque contamos con la dirección y ubicación, en algunos conjuntos, edificios o sectores existen detalles que el GPS no muestra: qué portería utilizar, por dónde ingresar, cuál torre o interior buscar, puntos de referencia o indicaciones especiales de acceso.",
          "Este audio queda como apoyo para la profesional y nos permite disminuir retrasos, evitar que se pierda y facilitar que llegue puntualmente, especialmente si es la primera vez que presta el servicio en tu dirección.",
          "Solo necesitas enviarlo una vez, con indicaciones sencillas y claras de cómo llegar desde un punto de referencia cercano."
        ]
      },
      {
        id: "ingreso-conjunto",
        question: "¿Cómo manejan el ingreso de la profesional al conjunto o edificio?",
        aliases: ["portería", "autorizar ingreso", "control de acceso", "vigilancia"],
        answer: [
          "Como previamente te compartimos la información de la profesional asignada, es muy importante que coordines con anticipación con la portería, empresa de vigilancia o personal encargado del acceso y dejes autorizada su entrada.",
          "La idea es que, cuando ella llegue a la portería, pueda ingresar sin demoras ni pérdida de tiempo, ya que desde ese momento comienza el proceso de llegada a tu servicio.",
          "Con una autorización previa y unas indicaciones claras de acceso, facilitamos que la profesional pueda llegar a tu apartamento oportunamente y aprovechar al máximo el tiempo de la jornada."
        ]
      },
      {
        id: "no-estoy-en-casa",
        question: "¿Pueden hacer la limpieza si no estoy en casa?",
        aliases: ["no voy a estar", "dejar sola a la profesional", "llaves", "acceso sin mí"],
        answer: [
          "Sí, siempre que exista una forma segura y autorizada de ingreso y salida. Muchos clientes frecuentes organizan el acceso a través de portería u otro mecanismo previamente definido.",
          "Lo ideal es que dejes unas instrucciones claras y sencillas sobre las actividades que deseas priorizar y que haya una persona autorizada o algún mecanismo coordinado para permitirle el ingreso y posteriormente la salida.",
          "Si consideras que no es posible garantizar ese acceso de manera segura, también puedes solicitar reprogramar o cancelar el servicio, teniendo en cuenta las condiciones y tiempos establecidos para este tipo de cambios.",
          "Ten presente que si la profesional llega al domicilio y no puede ingresar o nadie la atiende, el servicio puede considerarse prestado, ya que fue desplazada y ese espacio estaba reservado exclusivamente para tu programación."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "novedades",
    group: "operacion",
    title: "Cambios, cancelaciones y novedades",
    summary: "Reglas de cancelación, reprogramación, reemplazos, suspensión y garantía.",
    entries: [
      {
        id: "cancelar-reprogramar",
        question: "¿Cómo cancelo o cambio la fecha de un servicio?",
        aliases: ["cancelar", "cancelar el mismo día", "cambiar la fecha", "reprogramar", "72 horas"],
        answer: [
          "Las cancelaciones y los cambios de fecha deben solicitarse por nuestros canales oficiales con mínimo 72 horas hábiles de anticipación. Con ese tiempo podemos revisar la disponibilidad y hacer el cambio de manera organizada.",
          "Cuando la solicitud se realiza con menos de 72 horas hábiles o el mismo día, la profesional ya tiene ese espacio reservado exclusivamente para tu servicio y, por la inmediatez, no siempre es posible reasignarla.",
          "En esos casos tratamos de ayudarte buscando si existe otro cliente que necesite un servicio ocasional al que podamos redirigir a la profesional. Muchas veces lo logramos, pero no podemos garantizarlo ni asumirlo como un compromiso, porque depende de que exista una solicitud disponible en ese momento.",
          "Si lo conseguimos, revisamos contigo la alternativa o una nueva fecha. Si no, el servicio puede darse por perdido, ya que la reserva fue realizada previamente y ese tiempo quedó bloqueado exclusivamente para ti. Siempre vamos a intentar ayudarte, pero queremos ser muy transparentes desde el inicio con esta condición."
        ]
      },
      {
        id: "profesional-no-asiste",
        question: "¿Qué pasa si la profesional asignada no puede asistir?",
        aliases: ["incapacidad", "no vino", "reemplazo", "me asignan otra", "cumplimiento"],
        answer: [
          "Nuestro nivel de cumplimiento es muy alto, actualmente está por encima del 98%, pero trabajamos con personas y, como en cualquier servicio que depende de factores humanos, pueden presentarse novedades inesperadas: una incapacidad médica, calamidad familiar, accidente, licencia o alguna situación de fuerza mayor.",
          "Si esto llega a ocurrir, nos comunicaremos contigo lo antes posible para informarte la novedad y buscar una solución. Dependiendo de la disponibilidad, podremos asignarte una profesional de reemplazo que cumpla con los mismos estándares de selección, seguridad, capacitación y calidad, o reprogramar tu servicio procurando que sea para el día siguiente o en la fecha más cercana posible.",
          "Nuestro compromiso es que no te quedes sin acompañamiento y que, ante cualquier novedad, Limpiarte esté presente, te informe y gestione una solución."
        ]
      },
      {
        id: "cambio-de-profesional",
        question: "¿Me avisan si cambian la profesional? ¿Puedo pedir el cambio?",
        aliases: ["cambiar de profesional", "no me gustó la profesional", "PQRS", "solicitar otra persona"],
        answer: [
          "Si por alguna razón debemos cambiar a la profesional asignada, te lo informamos tan pronto como tengamos conocimiento de la novedad. El cambio puede darse porque tú lo solicites, porque la profesional pida cambio de cliente, por una incapacidad prolongada, una calamidad, una licencia o porque decida retirarse de la compañía.",
          "Si eres tú quien desea el cambio, debes presentar una PQRS explicando de manera clara y detallada el motivo. El enlace lo encuentras en nuestra página web o podemos compartírtelo por nuestros canales.",
          "Para nosotros es muy importante conocer el motivo. No manejamos cambios de profesional sin ninguna explicación, porque necesitamos entender si existe una situación relacionada con la calidad del servicio, la actitud, el cumplimiento o la comunicación que debamos revisar internamente. Esta información también nos permite mejorar nuestros procesos y tomar medidas si es necesario.",
          "La información que nos compartas será manejada con confidencialidad, respeto y de manera profesional. Nuestro objetivo no es obligarte a continuar con una profesional con la que no te sientas cómodo, sino entender qué ocurrió y encontrar una solución."
        ]
      },
      {
        id: "cambiar-dia-habitual",
        question: "¿Puedo cambiar el día habitual o pedir un día adicional?",
        aliases: ["cambiar el día", "día adicional", "servicio extra en la semana", "mover el día"],
        answer: [
          "Sí puedes solicitarlo. Lo importante es tener en cuenta que, en un Plan Frecuente, la profesional que tienes asignada ya cuenta con una programación fija durante la semana.",
          "Por eso, primero revisamos si esa misma profesional tiene disponibilidad en la nueva fecha o en el día adicional. Por ejemplo, si normalmente recibes el servicio los martes y quieres cambiarlo para los jueves, revisaremos si tu profesional está disponible ese día.",
          "Si los jueves ella ya tiene asignado otro cliente, no podemos retirarla de esa programación, porque también debemos respetar la continuidad del otro cliente. En ese caso sí podemos hacer el cambio o programar el día adicional, pero asignándote otra profesional disponible que cumpla con los mismos estándares de Limpiarte.",
          "En resumen: sí puedes cambiar el día o solicitar servicios adicionales; mantener a la misma profesional dependerá de su disponibilidad en la nueva fecha."
        ]
      },
      {
        id: "suspender",
        question: "¿Puedo suspender temporalmente el servicio si estoy de viaje?",
        aliases: ["suspensión", "viaje", "pausar el servicio", "reactivar", "servicios a favor"],
        answer: [
          "Puedes suspender temporalmente tus servicios por el tiempo que necesites y retomarlos cuando lo consideres conveniente. Si ya tienes servicios pagados, no los pierdes: quedan a tu favor y podrás utilizarlos cuando reactives tu programación.",
          "Lo único que debes tener presente es la continuidad de la profesional asignada. Si la suspensión es de hasta 15 días o aproximadamente dos semanas, podemos procurar conservar a la misma profesional dentro de tu programación.",
          "Si la suspensión supera ese tiempo —un mes, dos meses o más—, debemos reubicar a esa profesional en otro servicio, porque no podemos mantenerla sin programación durante un periodo prolongado.",
          "Para reactivar, solo debes comunicarte con nosotros por los canales oficiales e indicarnos la fecha a partir de la cual deseas retomar. Si tu profesional anterior ya no está disponible, te asignaremos otra que cumpla con los mismos estándares."
        ]
      },
      {
        id: "terminar-plan",
        question: "¿Cómo termino el plan frecuente? ¿Hay devolución?",
        aliases: ["cancelar el plan", "no continuar", "devolución de dinero", "saldo a favor", "ceder servicios"],
        answer: [
          "Como el Plan Frecuente se renueva mes a mes, si decides no continuar simplemente debes informarnos antes de la renovación del siguiente mes. Cuando nuestro equipo te contacte para la nueva liquidación, indícanos que no deseas continuar y no realizaremos la programación del siguiente periodo.",
          "Si ya tienes servicios pagados y te quedan algunos pendientes por utilizar, no los pierdes: quedan como saldo a favor para que los uses más adelante. También puedes cederlos a un familiar, amigo o conocido, y nosotros te ayudamos a gestionar el cambio y a programarlos para esa persona.",
          "No manejamos devolución de dinero por servicios ya pagados. Por ejemplo, si ya pagaste todos los servicios del mes y decides terminar el plan a mitad de mes, no se realiza devolución del valor restante.",
          "Por eso, si ya sabes que no continuarás, lo más sencillo es finalizar el periodo que tienes contratado y no renovar el mes siguiente."
        ]
      },
      {
        id: "garantia-inconformidad",
        question: "¿Qué pasa si no quedo conforme? ¿Tienen garantía?",
        aliases: ["garantía", "reclamo", "quedó mal", "actividad pendiente", "no quedé conforme", "queja"],
        answer: [
          "Contamos con un procedimiento de garantía y acompañamiento, pero es muy importante que cualquier inconformidad sea reportada durante la prestación del servicio, mientras la profesional todavía se encuentra en tu hogar.",
          "Para evitar inconformidades te recomendamos: 1) al iniciar, tener una lista clara de prioridades; 2) explicarle a la profesional de manera clara qué esperas del servicio y cuáles son las zonas más importantes; y 3) aproximadamente 30 minutos antes de finalizar la jornada, revisar junto con ella las actividades realizadas.",
          "Si en esa revisión encuentras algo pendiente, incompleto o que deseas corregir, ese es el momento de indicárselo para que pueda atenderlo antes de finalizar, siempre que esté dentro del alcance y del tiempo disponible.",
          "Una vez la profesional finaliza la jornada y se retira, ya no contamos con la misma posibilidad de verificar las condiciones del servicio ni de corregir inmediatamente una actividad. Por eso las reclamaciones relacionadas con la calidad o actividades pendientes deben realizarse antes de su retiro.",
          "Además, puedes comunicar la novedad a través de nuestros canales oficiales para que quede registrada y podamos acompañarte."
        ]
      },
      {
        id: "continuidad-profesional",
        question: "¿La misma profesional me acompañará todo el mes?",
        aliases: ["misma persona siempre", "profesional fija", "continuidad", "misma persona los dos días"],
        answer: [
          "Si tienes contratado un Plan Frecuente, la profesional asignada será la misma en tus días programados, precisamente para darte continuidad, confianza y estabilidad en el servicio.",
          "Si programas dos días fijos a la semana, te asignamos una profesional para cada día contratado: la asignada al lunes será siempre la misma los lunes y la asignada al jueves será siempre la misma los jueves. Dependiendo de la disponibilidad, incluso podría ser la misma profesional para ambos días.",
          "Esto permite que conozca tu hogar, tus rutinas, tus prioridades y la forma en que te gusta que se realice la limpieza.",
          "Solo en caso de presentarse una novedad —incapacidad, calamidad familiar, licencia, vacaciones o retiro de la profesional— tendremos que realizar un cambio temporal o definitivo, asignándote una profesional de reemplazo que cumpla con las mismas condiciones y requisitos."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "plataforma-general",
    group: "plataforma",
    title: "Primeros pasos en el panel",
    summary: "Acceso, permisos y organización general del Superadmin.",
    entries: [
      {
        id: "ingreso-panel",
        question: "¿Cómo ingreso al panel de administración?",
        aliases: ["login admin", "entrar al panel", "código de verificación", "doble factor", "2FA"],
        answer: [
          "El ingreso se hace desde /admin/login con tu correo y contraseña. El acceso tiene dos pasos: después de la contraseña, el sistema envía un código de 6 dígitos a tu correo que debes digitar para completar el ingreso.",
          "El código tiene una vigencia de 10 minutos. Si se vence, vuelve a iniciar sesión para generar uno nuevo.",
          "Por seguridad, después de 5 intentos fallidos la cuenta se bloquea durante 15 minutos."
        ]
      },
      {
        id: "permisos",
        question: "¿Por qué no veo todas las secciones del menú?",
        aliases: ["permisos", "roles", "no me aparece", "no tengo acceso", "secciones ocultas"],
        answer: [
          "El menú lateral se arma según los permisos de tu rol: solo aparecen las secciones a las que tienes acceso.",
          "Los permisos se agrupan por módulo (catálogo, pedidos, clientes, marketing, contenido, reportes, configuración, usuarios, integración y auditoría) y se asignan desde Usuarios y roles.",
          "La cuenta de Superadministrador ve todas las secciones sin excepción.",
          "Si necesitas acceso a una sección que no ves, solicítalo a quien administre los roles para que ajuste tu perfil o te agregue un permiso puntual."
        ]
      },
      {
        id: "manual-uso",
        question: "¿Cómo uso este Manual de funciones?",
        aliases: ["centro de ayuda", "buscador del manual", "cómo buscar", "ayuda"],
        answer: [
          "Escribe en el buscador la duda tal como te la plantea el cliente: el buscador ignora tildes y mayúsculas, y también reconoce formas alternativas de preguntar lo mismo.",
          "Por ejemplo, «puede cocinar», «preparación de alimentos» y «incluye cocina» llevan a la misma respuesta.",
          "Los resultados resaltan el texto coincidente y puedes filtrar por grupo o por tema desde las pestañas superiores. Cada respuesta tiene un botón para copiarla y enviarla al cliente tal cual."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "plataforma-catalogo",
    group: "plataforma",
    title: "Catálogo e inventario",
    summary: "Productos, categorías, precios, promociones y control de existencias.",
    entries: [
      {
        id: "crear-producto",
        question: "¿Cómo creo o edito un producto?",
        aliases: ["nuevo producto", "editar producto", "variantes", "ficha técnica", "imágenes"],
        answer: [
          "Entra a Productos y usa el botón de nuevo producto, o haz clic sobre uno existente para editarlo.",
          "El formulario cubre datos básicos, precio, categoría y marca, imágenes, ficha técnica, preguntas frecuentes del producto, productos relacionados para venta cruzada, etiquetas y campos de SEO.",
          "Si el producto tiene presentaciones distintas (tamaños, aromas), usa el generador de variantes: cada combinación puede tener su propio precio y su propio inventario.",
          "Las imágenes se cargan por archivo o por URL. La primera imagen es la que se muestra en el listado del catálogo."
        ]
      },
      {
        id: "precios-promociones",
        question: "¿Cómo manejo precios y promociones?",
        aliases: ["precio promocional", "oferta", "descuento", "precio tachado", "vigencia de promoción"],
        answer: [
          "Cada producto tiene un precio base y, opcionalmente, un precio promocional con fecha de inicio y fin. La promoción solo se aplica dentro de esa ventana: fuera de ella vuelve automáticamente al precio base.",
          "Si defines un precio de comparación, la tienda lo muestra tachado y calcula el porcentaje de descuento en la tarjeta del producto.",
          "Nunca edites el precio directamente en la base de datos: el precio efectivo que ve el cliente se calcula siempre a partir del precio base, la variante, la promoción vigente y las listas de precio por volumen."
        ]
      },
      {
        id: "inventario",
        question: "¿Cómo funciona el inventario?",
        aliases: ["stock", "existencias", "movimientos de inventario", "ajuste de stock", "agotado"],
        answer: [
          "El inventario se descuenta automáticamente cuando un pedido pasa a Pago confirmado, y se restaura si el pedido se cancela o se reembolsa.",
          "Cada movimiento queda registrado con su motivo y el responsable, de modo que siempre se puede rastrear por qué cambió una existencia.",
          "Desde Inventario puedes hacer ajustes manuales (por ejemplo, tras un conteo físico o una avería). Indica siempre el motivo: es lo que permite auditar después.",
          "Un producto sin existencias se muestra como agotado en la tienda y no puede agregarse al carrito, salvo que tenga habilitada la venta sobre pedido."
        ]
      },
      {
        id: "categorias-vacias",
        question: "¿Por qué una categoría no aparece en la tienda?",
        aliases: ["categoría no se ve", "categoría vacía", "no aparece en el menú"],
        answer: [
          "La tienda solo ofrece las categorías que tienen al menos un producto activo. Una categoría sin productos llevaría al cliente a un listado vacío, así que se oculta de la portada, de los filtros y del menú.",
          "En cuanto publiques un producto activo en esa categoría, aparece automáticamente. No hay que activarla manualmente."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "plataforma-pedidos",
    group: "plataforma",
    title: "Pedidos y clientes",
    summary: "Ciclo de vida del pedido, despachos y gestión de la base de clientes.",
    entries: [
      {
        id: "estados-pedido",
        question: "¿Cuáles son los estados de un pedido y cómo avanzan?",
        aliases: ["estado del pedido", "cambiar estado", "despachar", "entregar", "cancelar pedido"],
        answer: [
          "El recorrido normal es: Nuevo, Pago confirmado, En preparación, Despachado y Entregado. Desde la mayoría de los estados también se puede pasar a Cancelado o Reembolsado.",
          "Los saltos no son libres: solo se habilitan las transiciones válidas desde el estado actual, para evitar inconsistencias.",
          "Para marcar un pedido como Despachado es obligatorio registrar la transportadora y el número de guía. Para Cancelado o Reembolsado es obligatorio indicar el motivo.",
          "Cada cambio queda guardado en el historial del pedido con la fecha y el usuario que lo realizó, y dispara el correo y el evento correspondientes."
        ]
      },
      {
        id: "pedido-herramientas",
        question: "¿Qué puedo hacer desde el detalle de un pedido?",
        aliases: ["notas internas", "reenviar correo", "exportar pedidos", "guía"],
        answer: [
          "Desde el detalle puedes cambiar el estado, registrar transportadora y guía, agregar notas internas que el cliente no ve, y reenviar los correos de confirmación si el cliente no los recibió.",
          "El pedido guarda una copia de los productos tal como estaban al comprarse (nombre, precio y cantidad), de modo que cambiar el catálogo después no altera pedidos históricos.",
          "Desde el listado puedes filtrar por estado y exportar los resultados a CSV."
        ]
      },
      {
        id: "clientes-crm",
        question: "¿Qué información tengo de los clientes?",
        aliases: ["CRM", "etiquetas de cliente", "exportar clientes", "historial de compras", "habeas data"],
        answer: [
          "La sección Clientes reúne los datos de contacto, las direcciones registradas y el historial de pedidos de cada persona.",
          "Puedes agregar etiquetas para segmentar (por ejemplo, mayorista, empresa, recurrente) y exportar la base filtrada a CSV para campañas.",
          "También queda registrado el consentimiento de términos y tratamiento de datos de cada cliente, exigido por la Ley 1581 de 2012."
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "plataforma-marketing",
    group: "plataforma",
    title: "Marketing, contenido y configuración",
    summary: "Cupones, banners, páginas, cifras de la portada e integración con LucidBot.",
    entries: [
      {
        id: "cupones",
        question: "¿Cómo creo un cupón de descuento?",
        aliases: ["cupón", "código de descuento", "promoción", "restricciones de cupón"],
        answer: [
          "Desde Cupones puedes crear códigos con descuento por porcentaje o por valor fijo.",
          "Cada cupón admite restricciones: monto mínimo de compra, fecha de vigencia, número máximo de usos totales o por cliente, y limitación a ciertos productos o categorías.",
          "El sistema valida todas esas condiciones en el momento en que el cliente aplica el código en el carrito, y registra cada redención para que puedas medir el resultado de la campaña."
        ]
      },
      {
        id: "contenido",
        question: "¿Cómo cambio los banners y las páginas de la tienda?",
        aliases: ["banner", "páginas legales", "blog", "menús", "contenido de la tienda"],
        answer: [
          "La sección Contenido maneja los banners de la portada, las páginas estáticas (términos, políticas, preguntas frecuentes públicas), las entradas del blog y los menús de navegación.",
          "El banner principal reemplaza el fondo, el título, el subtítulo y el botón del encabezado de la portada. Si no hay banner configurado, la portada usa su diseño por defecto.",
          "Todo esto se edita sin tocar código y los cambios se reflejan en la tienda en pocos minutos."
        ]
      },
      {
        id: "cifras-portada",
        question: "¿Cómo cambio las cifras que se ven en la portada?",
        aliases: ["usuarios registrados", "envíos realizados", "números de la portada", "estadísticas home"],
        answer: [
          "En Configuración, el bloque Cifras de la portada controla la franja de números de la página principal.",
          "Cada campo acepta texto libre, por ejemplo 1071+. Si dejas un campo vacío, la portada usa el número real tomado del catálogo; y si ese número real es cero, la cifra simplemente no se muestra.",
          "Se pintan las primeras cuatro cifras que tengan valor."
        ]
      },
      {
        id: "lucidbot",
        question: "¿Qué hace la integración con LucidBot?",
        aliases: ["LucidBot", "automatizaciones", "webhook", "carrito abandonado", "eventos"],
        answer: [
          "La integración publica los eventos del negocio hacia LucidBot para disparar automatizaciones conversacionales: carrito abandonado, pedido creado, pago aprobado o rechazado, cambios de estado, despacho, entrega, cliente registrado y solicitud de contacto.",
          "La conexión se configura desde el panel indicando la URL del webhook y la clave, que se guarda cifrada. El panel permite probar la conectividad y ver el estado de la conexión.",
          "Cada evento puede activarse o desactivarse de forma individual, y existe un registro histórico de envíos con reintentos automáticos de los que fallaron.",
          "La detección de carritos abandonados y los reintentos se ejecutan automáticamente cada 10 minutos."
        ]
      },
      {
        id: "auditoria",
        question: "¿Dónde veo quién hizo un cambio?",
        aliases: ["auditoría", "bitácora", "quién modificó", "trazabilidad", "log"],
        answer: [
          "La sección Auditoría registra las acciones críticas del panel: quién las hizo, sobre qué registro y en qué momento.",
          "Sirve para resolver dudas sobre cambios de precio, ajustes de inventario, modificaciones de pedidos o cambios de configuración.",
          "El acceso a esta sección requiere el permiso de auditoría, que normalmente se asigna a perfiles de supervisión."
        ]
      }
    ]
  }
];

/** Total de entradas, para mostrarlo en el encabezado del manual. */
export const MANUAL_ENTRY_COUNT = MANUAL_SECTIONS.reduce((sum, section) => sum + section.entries.length, 0);
