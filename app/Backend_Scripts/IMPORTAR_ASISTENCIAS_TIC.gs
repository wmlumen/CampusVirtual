/**
 * SCRIPT DE IMPORTACION DE ASISTENCIAS Y ALUMNOS TIC
 * Planilla Google Sheets: BasedeDatosCampus
 * Total Alumnos Unicos: 55 | Total Registros Asistencias: 163
 *
 * INSTRUCCIONES:
 * 1. Abrir editor de Apps Script en la hoja BasedeDatosCampus
 * 2. Crear archivo "IMPORTAR_ASISTENCIAS_TIC.gs" y pegar este codigo
 * 3. Ejecutar funcion: importarAlumnosYAsistenciasTIC()
 */

function importarAlumnosYAsistenciasTIC() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var alumnos = [
  {
    "cedula": "4384884",
    "nombre": "Adriana Lucia Ayala Delvalle",
    "email": "adriayala2023@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:14:27",
        "obs": "No vino"
      },
      {
        "fecha": "12/09/2026 13:43:45",
        "obs": "TAJY"
      },
      {
        "fecha": "15/09/2026 20:11:55",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 20:00:37",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "6049410",
    "nombre": "AIDA SÁNCHEZ",
    "email": "narellsan.99ns@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "15/09/2026 20:12:35",
        "obs": "Tuyuti"
      },
      {
        "fecha": "15/09/2026 20:25:17",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:02:59",
        "obs": "Yagua"
      }
    ]
  },
  {
    "cedula": "6093628",
    "nombre": "Augusto Rodríguez",
    "email": "aagusramosz@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:13:23",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 22:04:06",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:27:08",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "6158389",
    "nombre": "Beatriz Núñez Florentín",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:10:38",
        "obs": "KARAYA"
      },
      {
        "fecha": "14/09/2026 20:06:18",
        "obs": "Hola Prf no pude asistir porque salí tarde mi trabajo."
      },
      {
        "fecha": "15/09/2026 20:13:55",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:20:35",
        "obs": "Jagua"
      },
      {
        "fecha": "18/09/2026 20:23:32",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "2487028",
    "nombre": "Carlos aguiar",
    "email": "aguiarcarlosdj@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:12:09",
        "obs": "Super la clase"
      },
      {
        "fecha": "14/09/2026 18:16:17",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 20:14:05",
        "obs": "Tuyutí"
      },
      {
        "fecha": "18/09/2026 20:20:00",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4618745",
    "nombre": "Carmen Martínez",
    "email": "cnataliamc88@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:18:18",
        "obs": ""
      },
      {
        "fecha": "12/09/2026 14:22:55",
        "obs": "Ausente"
      },
      {
        "fecha": "15/09/2026 21:13:31",
        "obs": ""
      },
      {
        "fecha": "18/09/2026 21:03:38",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "7689168",
    "nombre": "Cristhian amarilla",
    "email": "thedevid111@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:09:20",
        "obs": "KARAYA"
      },
      {
        "fecha": "15/09/2026 20:12:18",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:02:28",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4221853",
    "nombre": "Cynthia Carolina Pappaseit",
    "email": "Cynthiacarolinapappaseit@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:11:59",
        "obs": "TAÑARANDY"
      },
      {
        "fecha": "15/09/2026 20:12:02",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:06:35",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "33277618",
    "nombre": "Daiana cortez",
    "email": "daianamarinacortez@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 20:27:21",
        "obs": "Falte por motivos de viajes del trabajo"
      },
      {
        "fecha": "15/09/2026 21:04:18",
        "obs": "Lunes y viernes"
      }
    ]
  },
  {
    "cedula": "4931666",
    "nombre": "Daisy Nuñez",
    "email": "garozzoarianie3@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:18:19",
        "obs": "Mbeju"
      },
      {
        "fecha": "14/09/2026 18:50:56",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:13:04",
        "obs": "TUYUTI- PRESENTE"
      }
    ]
  },
  {
    "cedula": "4150363",
    "nombre": "Dalia Fernandez",
    "email": "dalia.fer90@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:18:04",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 21:04:24",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 20:20:01",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "5939777",
    "nombre": "Darlin tatiana fernandez villalba",
    "email": "Darlintatiana fernandez villalba@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:11:28",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:44:50",
        "obs": "Tajy"
      },
      {
        "fecha": "15/09/2026 20:14:57",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:00:12",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "1886139",
    "nombre": "Derlis Javier Molinas Macchi",
    "email": "derlismolinas.macchi@hotmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:12:56",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:43:50",
        "obs": "Tajy"
      },
      {
        "fecha": "15/09/2026 21:17:23",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "7728176",
    "nombre": "Emanuel Benitez",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 19:59:49",
        "obs": "No pude asisitir debido a que estuve haciendo hora extraordinaria en mi trabajo"
      },
      {
        "fecha": "15/09/2026 20:11:38",
        "obs": "Presente"
      },
      {
        "fecha": "15/09/2026 20:12:43",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:05:53",
        "obs": "jaguaa"
      }
    ]
  },
  {
    "cedula": "3810762",
    "nombre": "ESMILCE ALVAREZ",
    "email": "esmilcealvarez120918@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:09:17",
        "obs": "KARAYS"
      },
      {
        "fecha": "14/09/2026 18:17:02",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:14:59",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 14:13:14",
        "obs": "TAÑARANDY"
      },
      {
        "fecha": "18/09/2026 20:01:22",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "5813040",
    "nombre": "Fausto Araujo",
    "email": "araujoandres686@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "12/09/2026 13:43:30",
        "obs": "Tajy"
      }
    ]
  },
  {
    "cedula": "6306549",
    "nombre": "Fiorella Valiente",
    "email": "Valienteguadalupe827@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:51:01",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:12:47",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 21:03:26",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4058345",
    "nombre": "Gabriel Alcaraz Ayala",
    "email": "gabrielalcaraz24@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 19:56:08",
        "obs": "Ausente por problemas de salud"
      },
      {
        "fecha": "15/09/2026 20:12:17",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:06:20",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "7086529",
    "nombre": "Gabriela Patrocinia Adorno Alfonso",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:13:39",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:45:13",
        "obs": "Tajy"
      },
      {
        "fecha": "15/09/2026 21:12:06",
        "obs": ""
      },
      {
        "fecha": "15/09/2026 21:15:01",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:02:22",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4165131",
    "nombre": "Gerardo Pinto",
    "email": "gerardopinto85@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:09:37",
        "obs": "KARAYA"
      },
      {
        "fecha": "14/09/2026 18:51:31",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:13:05",
        "obs": "TUYUTI"
      },
      {
        "fecha": "18/09/2026 20:00:37",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "6987887",
    "nombre": "Giuliana Benitez",
    "email": "toralesgiuliana634@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:19:22",
        "obs": "Mbeju"
      },
      {
        "fecha": "18/09/2026 20:02:48",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "6576974",
    "nombre": "Ivan Alejandro villalba Almada",
    "email": "alealmada988@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:30:08",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:13:20",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:23:20",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "5860420",
    "nombre": "Ivana Martinez",
    "email": "ivannacolman1@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:08:56",
        "obs": "KARAYA"
      },
      {
        "fecha": "14/09/2026 18:30:49",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:13:07",
        "obs": "TUYUTI"
      },
      {
        "fecha": "18/09/2026 20:00:08",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "4823476",
    "nombre": "Jenny Ojeda",
    "email": "jeliza1816@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:09:02",
        "obs": "KARAYA"
      },
      {
        "fecha": "14/09/2026 20:47:46",
        "obs": "Ausencia por motivos laborales"
      },
      {
        "fecha": "15/09/2026 20:15:51",
        "obs": "TUYUTI"
      },
      {
        "fecha": "18/09/2026 20:00:23",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "6335562",
    "nombre": "Juan Brizuela",
    "email": "brizuelajuan122@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:17:53",
        "obs": "Mbeju"
      },
      {
        "fecha": "14/09/2026 18:51:04",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:13:07",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "4475185",
    "nombre": "Karina Azucas",
    "email": "Giselazucas02@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:12:00",
        "obs": "Tañarandy"
      }
    ]
  },
  {
    "cedula": "5306408",
    "nombre": "Karina Samudio",
    "email": "karisamudio262@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "15/09/2026 20:12:32",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "5660134",
    "nombre": "Kathia Pamela Montiel Peralta",
    "email": "alanamontiel69@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 19:59:45",
        "obs": "No pude asistir a clases porque estoy muy mal engripada y con dolor de garganta"
      },
      {
        "fecha": "15/09/2026 20:15:37",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "6887950",
    "nombre": "Keila Espinola",
    "email": "Kespinolabenitez99@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "15/09/2026 21:03:38",
        "obs": ""
      },
      {
        "fecha": "18/09/2026 20:21:23",
        "obs": "jakua"
      },
      {
        "fecha": "18/09/2026 21:03:21",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "6527741",
    "nombre": "Laura Benítez",
    "email": "benitezlaura2611@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "15/09/2026 20:16:07",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "7305035",
    "nombre": "Leyla Masi",
    "email": "leylamasi05@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "15/09/2026 20:15:40",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:20:31",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "4777077",
    "nombre": "Lilian Celeste Olmedo Noguera",
    "email": "lilian.olmedo11121988@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:09:14",
        "obs": "Tañarandy"
      },
      {
        "fecha": "18/09/2026 21:03:31",
        "obs": ""
      }
    ]
  },
  {
    "cedula": "6795792",
    "nombre": "Liz Carolina Cantero",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:10:11",
        "obs": "Ausente"
      },
      {
        "fecha": "14/09/2026 18:17:16",
        "obs": "Mbeju"
      },
      {
        "fecha": "14/09/2026 18:18:49",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 20:12:30",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 20:00:32",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "5910772",
    "nombre": "Lucas ramos",
    "email": "lr2892136@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:18:40",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 20:15:59",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:01:58",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "3604726",
    "nombre": "María Estela Cáceres",
    "email": "estelacaceres81@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:12:05",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 20:16:31",
        "obs": "tujuti"
      }
    ]
  },
  {
    "cedula": "6556073",
    "nombre": "Maria Jacqueline Rojas Aquino",
    "email": "mariarojasaquino98@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:56:40",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 21:14:41",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 21:09:27",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "6678355",
    "nombre": "María paz rolon Montania",
    "email": "mmontania07@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 17:43:30",
        "obs": "No podré asistir por motivos de salud el día viernes 11 y hoy 14"
      },
      {
        "fecha": "18/09/2026 20:21:23",
        "obs": "Presencia"
      }
    ]
  },
  {
    "cedula": "5154664",
    "nombre": "Mariela chavez",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "18/09/2026 20:03:43",
        "obs": ""
      }
    ]
  },
  {
    "cedula": "7115649",
    "nombre": "Meli Cuenca",
    "email": "cuencameli12@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:17:20",
        "obs": "Mbeju"
      },
      {
        "fecha": "14/09/2026 18:51:42",
        "obs": "MBEJU"
      },
      {
        "fecha": "15/09/2026 20:14:51",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:20:37",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "7550027",
    "nombre": "Micaela Cabrera",
    "email": "micaela.cabrera28@icloud.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:18:10",
        "obs": "Tañrandy"
      },
      {
        "fecha": "12/09/2026 13:41:44",
        "obs": ""
      },
      {
        "fecha": "15/09/2026 21:10:44",
        "obs": "Tujuti"
      }
    ]
  },
  {
    "cedula": "6046953",
    "nombre": "Millagros Vera",
    "email": "Veracabreramilagros@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:52:16",
        "obs": "MBEJU"
      },
      {
        "fecha": "18/09/2026 20:01:45",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "6181944",
    "nombre": "Mónica Aranda",
    "email": "arandmoni@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 18:41:27",
        "obs": "Ausente por problemas de salud"
      },
      {
        "fecha": "18/09/2026 20:20:17",
        "obs": "Presente profe"
      }
    ]
  },
  {
    "cedula": "7048234",
    "nombre": "Naomi Alexandra Rodriguez Colman",
    "email": "naomicolman4@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "15/09/2026 20:16:38",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:00:18",
        "obs": "JAGUA"
      }
    ]
  },
  {
    "cedula": "4498405",
    "nombre": "Natalia Noemi Genes de Vázquez",
    "email": "nataliagenes22@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:13:09",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 21:17:14",
        "obs": "Tuyuti"
      }
    ]
  },
  {
    "cedula": "5278331",
    "nombre": "Oscar Nicolás Benitez Denis",
    "email": "nicolasbd1797@gmail.com",
    "carrera": "Maestría en Administración y Gestión Pública",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "15/09/2026 22:03:55",
        "obs": ""
      }
    ]
  },
  {
    "cedula": "6247120",
    "nombre": "Pamela Silveira",
    "email": "serafinasilveira301997@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:10:14",
        "obs": "KARAYA"
      },
      {
        "fecha": "15/09/2026 9:51:46",
        "obs": "No pude asistir, estaba de guardia en mi trabajo."
      },
      {
        "fecha": "15/09/2026 20:15:45",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:19:26",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4858468",
    "nombre": "Pedro Pablo Gonzalez Fernandez",
    "email": "pedrito17042021@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:15:19",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 21:08:51",
        "obs": "Estoy en el trabajo, por eso no puedo usar el micrófono"
      },
      {
        "fecha": "18/09/2026 21:03:38",
        "obs": ""
      }
    ]
  },
  {
    "cedula": "2984473",
    "nombre": "Rossana González",
    "email": "rossanagonzalezzz1@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "13/09/2026 17:23:38",
        "obs": "Ausente"
      },
      {
        "fecha": "18/09/2026 20:02:39",
        "obs": "Yagua"
      }
    ]
  },
  {
    "cedula": "5355326",
    "nombre": "Sandra Báez",
    "email": "sanbaez2@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:13:36",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:43:06",
        "obs": "Tajy"
      },
      {
        "fecha": "15/09/2026 21:10:01",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 20:20:55",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4746390",
    "nombre": "Tania Valeria Areco Cabrera",
    "email": "taniavaleriaarecocabrera779@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:14:20",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:47:12",
        "obs": "Tajy"
      },
      {
        "fecha": "15/09/2026 21:32:24",
        "obs": "Tuyuti"
      }
    ]
  },
  {
    "cedula": "8342647",
    "nombre": "Teodocia Duarte Gonzaslez",
    "email": "teog2901@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:15:07",
        "obs": "Tañarandy"
      },
      {
        "fecha": "12/09/2026 13:45:03",
        "obs": "TAJY"
      },
      {
        "fecha": "15/09/2026 20:15:50",
        "obs": "tuyuti"
      },
      {
        "fecha": "18/09/2026 20:21:00",
        "obs": "jagua"
      }
    ]
  },
  {
    "cedula": "5349789",
    "nombre": "Vannessa Colarte Soria",
    "email": "colartesoriavanne21@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "11/09/2026 19:09:55",
        "obs": "KARAYA"
      },
      {
        "fecha": "14/09/2026 18:16:52",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 20:13:14",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:01:42",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "4090940",
    "nombre": "Viviana Centurion",
    "email": "vivianacenturion05@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:16:02",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 21:14:09",
        "obs": ""
      },
      {
        "fecha": "15/09/2026 21:33:30",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 21:03:29",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "2970153",
    "nombre": "Wilson ortellado",
    "email": "ortelladowilson@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "asistencias": [
      {
        "fecha": "14/09/2026 19:41:03",
        "obs": "Mbeju"
      },
      {
        "fecha": "15/09/2026 21:26:56",
        "obs": "Tujuti"
      },
      {
        "fecha": "18/09/2026 20:20:55",
        "obs": "Jagua"
      }
    ]
  },
  {
    "cedula": "5529598",
    "nombre": "Zaida Antonella Bogado Jara",
    "email": "Zaidabogado6@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "asistencias": [
      {
        "fecha": "5/09/2026 14:14:05",
        "obs": "Tañarandy"
      },
      {
        "fecha": "15/09/2026 20:27:11",
        "obs": "Tuyuti"
      },
      {
        "fecha": "18/09/2026 20:20:54",
        "obs": "Jagua"
      }
    ]
  }
];
  var registros = [
  {
    "fecha": "5/09/2026 14:09:14",
    "nombre": "Lilian Celeste Olmedo Noguera",
    "cedula": "4777077",
    "asignatura": "TIC",
    "email": "lilian.olmedo11121988@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:11:28",
    "nombre": "Darlin tatiana fernandez villalba",
    "cedula": "5939777",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:11:59",
    "nombre": "Cynthia Carolina Pappaseit",
    "cedula": "4221853",
    "asignatura": "TIC",
    "email": "Cynthiacarolinapappaseit@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "TAÑARANDY"
  },
  {
    "fecha": "5/09/2026 14:12:00",
    "nombre": "Karina Azucas",
    "cedula": "4475185",
    "asignatura": "TIC",
    "email": "Giselazucas02@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:12:05",
    "nombre": "María Estela Cáceres",
    "cedula": "3604726",
    "asignatura": "TIC",
    "email": "estelacaceres81@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:12:56",
    "nombre": "Derlis Javier Molinas Macchi",
    "cedula": "1886139",
    "asignatura": "TIC",
    "email": "derlismolinas.macchi@hotmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:13:09",
    "nombre": "Natalia Noemi Genes de Vázquez",
    "cedula": "4498405",
    "asignatura": "TIC",
    "email": "nataliagenes22@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:13:23",
    "nombre": "Augusto Rodríguez",
    "cedula": "6093628",
    "asignatura": "TIC",
    "email": "aagusramosz@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:13:36",
    "nombre": "Sandra Báez",
    "cedula": "5355326",
    "asignatura": "TIC",
    "email": "sanbaez2@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:13:39",
    "nombre": "Gabriela Patrocinia Adorno Alfonso",
    "cedula": "7086529",
    "asignatura": "TIC",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:14:05",
    "nombre": "Zaida Antonella Bogado Jara",
    "cedula": "5529598",
    "asignatura": "TIC",
    "email": "Zaidabogado6@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:14:20",
    "nombre": "Tania Valeria Areco Cabrera",
    "cedula": "4746390",
    "asignatura": "TIC",
    "email": "taniavaleriaarecocabrera779@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:14:27",
    "nombre": "Adriana Lucia Ayala Delvalle",
    "cedula": "4384884",
    "asignatura": "TIC",
    "email": "adriayala2023@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "No vino"
  },
  {
    "fecha": "5/09/2026 14:15:07",
    "nombre": "Teodocia Duarte González",
    "cedula": "8342647",
    "asignatura": "TIC",
    "email": "teog2901@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:15:19",
    "nombre": "Pedro Pablo Gonzalez Fernandez",
    "cedula": "4858468",
    "asignatura": "TIC",
    "email": "pedrito17042021@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:16:02",
    "nombre": "Viviana Centurion",
    "cedula": "4090940",
    "asignatura": "TIC",
    "email": "vivianacenturion05@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "5/09/2026 14:18:10",
    "nombre": "Micaela Cabrera",
    "cedula": "7550027",
    "asignatura": "TIC",
    "email": "micaela.cabrera28@icloud.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañrandy"
  },
  {
    "fecha": "5/09/2026 14:18:18",
    "nombre": "Carmen Martínez",
    "cedula": "4618745",
    "asignatura": "TIC",
    "email": "cnataliamc88@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "5/09/2026 14:56:40",
    "nombre": "Maria Jacqueline Rojas Aquino",
    "cedula": "6556073",
    "asignatura": "TIC",
    "email": "mariarojasaquino98@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tañarandy"
  },
  {
    "fecha": "11/09/2026 19:08:56",
    "nombre": "Ivana Martinez",
    "cedula": "5860420",
    "asignatura": "TIC",
    "email": "ivannacolman1@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:09:02",
    "nombre": "Jenny Ojeda",
    "cedula": "4823476",
    "asignatura": "TIC",
    "email": "jeliza1816@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:09:17",
    "nombre": "ESMILCE ALVAREZ",
    "cedula": "3810762",
    "asignatura": "TIC",
    "email": "esmilcealvarez120918@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "KARAYS"
  },
  {
    "fecha": "11/09/2026 19:09:20",
    "nombre": "Cristhian amarilla",
    "cedula": "7689168",
    "asignatura": "TIC",
    "email": "thedevid111@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:09:37",
    "nombre": "Gerardo Pinto",
    "cedula": "4165131",
    "asignatura": "TIC",
    "email": "gerardopinto85@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:09:55",
    "nombre": "Vannessa Colarte Soria",
    "cedula": "5349789",
    "asignatura": "TIC",
    "email": "colartesoriavanne21@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:10:11",
    "nombre": "Liz Carolina Cantero",
    "cedula": "6795792",
    "asignatura": "TIC",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Ausente"
  },
  {
    "fecha": "11/09/2026 19:10:14",
    "nombre": "Pamela Silveira",
    "cedula": "6247120",
    "asignatura": "TIC",
    "email": "serafinasilveira301997@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:10:38",
    "nombre": "Beatriz concepción",
    "cedula": "6158389",
    "asignatura": "TIC",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "KARAYA"
  },
  {
    "fecha": "11/09/2026 19:12:09",
    "nombre": "Carlos aguiar",
    "cedula": "2487028",
    "asignatura": "TIC",
    "email": "aguiarcarlosdj@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Super la clase"
  },
  {
    "fecha": "12/09/2026 13:41:44",
    "nombre": "Micaela Cabrera",
    "cedula": "7550027",
    "asignatura": "TIC",
    "email": "micaela.cabrera28@icloud.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "12/09/2026 13:43:06",
    "nombre": "Sandra Baez",
    "cedula": "5355326",
    "asignatura": "TIC",
    "email": "sanbaez2@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 13:43:30",
    "nombre": "Fausto Araujo",
    "cedula": "5813040",
    "asignatura": "TIC",
    "email": "araujoandres686@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 13:43:45",
    "nombre": "Adriana Lucia Ayala Delvalle",
    "cedula": "4384884",
    "asignatura": "TIC",
    "email": "adriayala2023@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "TAJY"
  },
  {
    "fecha": "12/09/2026 13:43:50",
    "nombre": "Derlis Javier Molinas Macchi",
    "cedula": "1886139",
    "asignatura": "TIC",
    "email": "derlismolinas.macchi@hotmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 13:44:50",
    "nombre": "Darlin tatiana fernandez villalba",
    "cedula": "5939777",
    "asignatura": "TIC",
    "email": "Darlintatiana fernandez villalba@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 13:45:03",
    "nombre": "Teodocia Duarte González",
    "cedula": "8342647",
    "asignatura": "TIC",
    "email": "teog2901@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "TAJY"
  },
  {
    "fecha": "12/09/2026 13:45:13",
    "nombre": "Gabriela Adorno",
    "cedula": "7086529",
    "asignatura": "TIC",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 13:47:12",
    "nombre": "Tania areco",
    "cedula": "4746390",
    "asignatura": "TIC",
    "email": "taniavaleriaarecocabrera779@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tajy"
  },
  {
    "fecha": "12/09/2026 14:22:55",
    "nombre": "Carmen Martínez",
    "cedula": "4618745",
    "asignatura": "TIC",
    "email": "cnataliamc88@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Ausente"
  },
  {
    "fecha": "13/09/2026 17:23:38",
    "nombre": "Rossana González",
    "cedula": "2984473",
    "asignatura": "TIC",
    "email": "rossanagonzalezzz1@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Ausente"
  },
  {
    "fecha": "14/09/2026 17:43:30",
    "nombre": "Maria paz Rolon",
    "cedula": "6678355",
    "asignatura": "TIC",
    "email": "mmontania07@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "No podré asistir por motivos de salud el día viernes 11 y hoy 14"
  },
  {
    "fecha": "14/09/2026 18:16:17",
    "nombre": "Carlos Aguiar",
    "cedula": "2487028",
    "asignatura": "TIC",
    "email": "aguiarcarlosdj@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:16:52",
    "nombre": "Vannessa Colarte",
    "cedula": "5349789",
    "asignatura": "TIC",
    "email": "colartesoriavanne21@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:17:02",
    "nombre": "Esmilce Alvarez",
    "cedula": "3810762",
    "asignatura": "TIC",
    "email": "esmilcealvarez120918@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:17:16",
    "nombre": "Liz Carolina cantero",
    "cedula": "6795792",
    "asignatura": "TIC",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:17:20",
    "nombre": "Meli Cuenca",
    "cedula": "7115649",
    "asignatura": "TIC",
    "email": "cuencameli12@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "L y V 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:17:53",
    "nombre": "Juan Brizuela",
    "cedula": "6335562",
    "asignatura": "TIC",
    "email": "brizuelajuan122@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:18:04",
    "nombre": "Dalia Fernandez",
    "cedula": "4150363",
    "asignatura": "TIC",
    "email": "dalia.fer90@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:18:19",
    "nombre": "Daisy Nuñez",
    "cedula": "4931666",
    "asignatura": "TIC",
    "email": "garozzoarianie3@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:18:40",
    "nombre": "Lucas ramos",
    "cedula": "5910772",
    "asignatura": "TIC",
    "email": "lr2892136@gmail.com",
    "carrera": "",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:18:49",
    "nombre": "Liz Carolina Cantero",
    "cedula": "6795792",
    "asignatura": "TIC",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:19:22",
    "nombre": "Giuliana Benitez",
    "cedula": "6987887",
    "asignatura": "TIC",
    "email": "toralesgiuliana634@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 18:30:08",
    "nombre": "Ivan Alejandro villalba Almada",
    "cedula": "6576974",
    "asignatura": "TIC",
    "email": "alealmada988@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:30:49",
    "nombre": "Ivana Martinez",
    "cedula": "5860420",
    "asignatura": "TIC",
    "email": "ivannacolman1@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:41:27",
    "nombre": "Mónica Aranda",
    "cedula": "6181944",
    "asignatura": "TIC",
    "email": "arandmoni@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026, V026",
    "observacion": "Ausente por problemas de salud"
  },
  {
    "fecha": "14/09/2026 18:50:56",
    "nombre": "Daisy Nuñez",
    "cedula": "4931666",
    "asignatura": "TIC",
    "email": "garozzoarianie3@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:51:01",
    "nombre": "Fiorella Valiente",
    "cedula": "6306549",
    "asignatura": "TIC",
    "email": "Valienteguadalupe827@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:51:04",
    "nombre": "Juan Brizuela",
    "cedula": "6335562",
    "asignatura": "TIC",
    "email": "brizuelajuan122@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:51:31",
    "nombre": "Gerardo Pinto",
    "cedula": "4165131",
    "asignatura": "TIC",
    "email": "gerardopinto85@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:51:42",
    "nombre": "Meli Cuenca",
    "cedula": "7115649",
    "asignatura": "TIC",
    "email": "cuencameli12@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 18:52:16",
    "nombre": "Milagros Vera",
    "cedula": "6046953",
    "asignatura": "TIC",
    "email": "Veracabreramilagros@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "MBEJU"
  },
  {
    "fecha": "14/09/2026 19:41:03",
    "nombre": "Wilson ortellado",
    "cedula": "2970153",
    "asignatura": "TIC",
    "email": "ortelladowilson@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Mbeju"
  },
  {
    "fecha": "14/09/2026 19:56:08",
    "nombre": "Gabriel Alcaraz",
    "cedula": "4058345",
    "asignatura": "TIC",
    "email": "gabrielalcaraz24@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Ausente por problemas de salud"
  },
  {
    "fecha": "14/09/2026 19:59:45",
    "nombre": "Kathia Pamela Montiel Peralta",
    "cedula": "5660134",
    "asignatura": "TIC",
    "email": "alanamontiel69@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "No pude asistir a clases porque estoy muy mal engripada y con dolor de garganta"
  },
  {
    "fecha": "14/09/2026 19:59:49",
    "nombre": "Emanuel Benitez",
    "cedula": "7728176",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "No pude asisitir debido a que estuve haciendo hora extraordinaria en mi trabajo"
  },
  {
    "fecha": "14/09/2026 20:06:18",
    "nombre": "Beatriz Núñez Florentín",
    "cedula": "6158389",
    "asignatura": "TIC",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Hola Prf no pude asistir porque salí tarde mi trabajo."
  },
  {
    "fecha": "14/09/2026 20:27:21",
    "nombre": "Daiana cortez",
    "cedula": "33277618",
    "asignatura": "TIC",
    "email": "daianamarinacortez@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Falte por motivos de viajes del trabajo"
  },
  {
    "fecha": "14/09/2026 20:47:46",
    "nombre": "Jenny Ojeda",
    "cedula": "4823476",
    "asignatura": "TIC",
    "email": "jeliza1816@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Ausencia por motivos laborales"
  },
  {
    "fecha": "15/09/2026 9:51:46",
    "nombre": "Pamela Silveira",
    "cedula": "6247120",
    "asignatura": "TIC",
    "email": "serafinasilveira301997@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "No pude asistir, estaba de guardia en mi trabajo."
  },
  {
    "fecha": "15/09/2026 20:11:38",
    "nombre": "Emanuel Benitez",
    "cedula": "7728176",
    "asignatura": "TIC",
    "email": "Presente",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "observacion": "Presente"
  },
  {
    "fecha": "15/09/2026 20:11:55",
    "nombre": "Adriana Lucia Ayala",
    "cedula": "4384884",
    "asignatura": "TIC",
    "email": "adriayala2023@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:12:02",
    "nombre": "Cynthia Carolina Pappaseit",
    "cedula": "4221853",
    "asignatura": "TIC",
    "email": "Cynthiapappaseit@hotmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:12:17",
    "nombre": "Gabriel Alcaraz Ayala",
    "cedula": "4058345",
    "asignatura": "TIC",
    "email": "gabrielalcaraz24@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:12:18",
    "nombre": "Cristhian amarilla",
    "cedula": "7689168",
    "asignatura": "TIC",
    "email": "thedevid111@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:12:30",
    "nombre": "Liz Carolina Cantero",
    "cedula": "6795792",
    "asignatura": "TIC",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:12:32",
    "nombre": "Karina Samudio",
    "cedula": "5306408",
    "asignatura": "TIC",
    "email": "karisamudio262@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:12:35",
    "nombre": "AIDA SÁNCHEZ",
    "cedula": "6049410",
    "asignatura": "TIC",
    "email": "narellsan.99ns@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:12:43",
    "nombre": "Emanuel Benitez",
    "cedula": "7728176",
    "asignatura": "TIC",
    "email": "Tuyuti",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:12:47",
    "nombre": "Fiorella Valiente",
    "cedula": "6306549",
    "asignatura": "TIC",
    "email": "Valienteguadalupe827@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:13:04",
    "nombre": "Daisy Nuñez",
    "cedula": "4931666",
    "asignatura": "TIC",
    "email": "garozzoarianie3@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "TUYUTI- PRESENTE"
  },
  {
    "fecha": "15/09/2026 20:13:05",
    "nombre": "Gerardo Pinto",
    "cedula": "4165131",
    "asignatura": "TIC",
    "email": "gerardopinto85@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "TUYUTI"
  },
  {
    "fecha": "15/09/2026 20:13:07",
    "nombre": "Ivana Martinez",
    "cedula": "5860420",
    "asignatura": "TIC",
    "email": "ivannacolman1@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "TUYUTI"
  },
  {
    "fecha": "15/09/2026 20:13:07",
    "nombre": "Juan Brizuela",
    "cedula": "6335562",
    "asignatura": "TIC",
    "email": "brizuelajuan122@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LV026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:13:14",
    "nombre": "Vannessa Colarte",
    "cedula": "5349789",
    "asignatura": "TIC",
    "email": "colartesoriavanne21@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:13:20",
    "nombre": "Iván Alejandro villalba Almada",
    "cedula": "6576974",
    "asignatura": "TIC",
    "email": "alealmada988@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:13:55",
    "nombre": "Beatriz Núñez Florentin",
    "cedula": "6158389",
    "asignatura": "TIC",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:14:05",
    "nombre": "Carlos Aguiar",
    "cedula": "2487028",
    "asignatura": "TIC",
    "email": "aguiarcarlosdj@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Tuyutí"
  },
  {
    "fecha": "15/09/2026 20:14:51",
    "nombre": "Meli Cuenca",
    "cedula": "7115649",
    "asignatura": "TIC",
    "email": "cuencameli12@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LyV026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:14:57",
    "nombre": "Darlin tatiana fernandez villalba",
    "cedula": "5939777",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:14:59",
    "nombre": "Esmilce Alvarez",
    "cedula": "3810762",
    "asignatura": "TIC",
    "email": "esmilcealvarez120918@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:15:37",
    "nombre": "Kathia Pamela Montiel Peralta",
    "cedula": "5660134",
    "asignatura": "TIC",
    "email": "alanamontiel69@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:15:40",
    "nombre": "Leyla Masi",
    "cedula": "7305035",
    "asignatura": "TIC",
    "email": "leylamasi05@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:15:45",
    "nombre": "Pamela Silveira",
    "cedula": "6247120",
    "asignatura": "TIC",
    "email": "serafinasilveira301997@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:15:50",
    "nombre": "Teodocia Duarte Gonzalez",
    "cedula": "8342647",
    "asignatura": "TIC",
    "email": "teog2901@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "tuyuti"
  },
  {
    "fecha": "15/09/2026 20:15:51",
    "nombre": "Jenny Ojeda",
    "cedula": "4823476",
    "asignatura": "TIC",
    "email": "jeliza1816@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "TUYUTI"
  },
  {
    "fecha": "15/09/2026 20:15:59",
    "nombre": "Lucas ramos",
    "cedula": "5910772",
    "asignatura": "TIC",
    "email": "lr2892136@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:16:07",
    "nombre": "Laura Benítez",
    "cedula": "6527741",
    "asignatura": "TIC",
    "email": "benitezlaura2611@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 20:16:31",
    "nombre": "Maria Estela Caceres",
    "cedula": "3604726",
    "asignatura": "TIC",
    "email": "estelacaceres81@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": "tujuti"
  },
  {
    "fecha": "15/09/2026 20:16:38",
    "nombre": "Naomi Alexandra Rodriguez Colman",
    "cedula": "7048234",
    "asignatura": "TIC",
    "email": "naomicolman4@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:25:17",
    "nombre": "Aida Sánchez",
    "cedula": "6049410",
    "asignatura": "TIC",
    "email": "aidasanchezadmv.026@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 20:27:11",
    "nombre": "Zaida Antonella Bogado Jara",
    "cedula": "5529598",
    "asignatura": "TIC",
    "email": "zaidabogado6@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 21:03:38",
    "nombre": "Keila Espinola",
    "cedula": "6887950",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "15/09/2026 21:04:18",
    "nombre": "Daiana cortez",
    "cedula": "33277618",
    "asignatura": "TIC",
    "email": "daianamarinacortez@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "",
    "observacion": "Lunes y viernes"
  },
  {
    "fecha": "15/09/2026 21:04:24",
    "nombre": "Dalia Fernández",
    "cedula": "4150363",
    "asignatura": "TIC",
    "email": "dalia.fer90@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 21:08:51",
    "nombre": "Pedro Gonzalez",
    "cedula": "4858468",
    "asignatura": "TIC",
    "email": "pedrito17042021@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Estoy en el trabajo, por eso no puedo usar el micrófono"
  },
  {
    "fecha": "15/09/2026 21:10:01",
    "nombre": "Sandra Báez",
    "cedula": "5355326",
    "asignatura": "TIC",
    "email": "sanbaez2@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 21:10:44",
    "nombre": "Micaela cabrera",
    "cedula": "7550027",
    "asignatura": "TIC",
    "email": "micaela.cabrera28@icloud.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 21:12:06",
    "nombre": "Gabriela Adorno",
    "cedula": "7086529",
    "asignatura": "TIC",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "15/09/2026 21:13:31",
    "nombre": "Carmen Martínez",
    "cedula": "4618745",
    "asignatura": "TIC",
    "email": "cnataliamc88@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "15/09/2026 21:14:09",
    "nombre": "Viviana Centurion",
    "cedula": "4090940",
    "asignatura": "TIC",
    "email": "vivianacenturion05@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "15/09/2026 21:14:41",
    "nombre": "Maria Jacqueline Rojas Aquino",
    "cedula": "6556073",
    "asignatura": "TIC",
    "email": "mariarojasaquino98@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 21:15:01",
    "nombre": "Gabriela Adorno",
    "cedula": "7086529",
    "asignatura": "TIC",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 21:17:14",
    "nombre": "Natalia Noemi Genes de Vázquez",
    "cedula": "4498405",
    "asignatura": "TIC",
    "email": "nataliagenes22@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 21:17:23",
    "nombre": "Derlis Javier Molinas Macchi",
    "cedula": "1886139",
    "asignatura": "TIC",
    "email": "derlismolinas.macchi@hotmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 21:26:56",
    "nombre": "Wilson Ortellado",
    "cedula": "2970153",
    "asignatura": "TIC",
    "email": "ortelladowilson@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 21:32:24",
    "nombre": "Tania areco",
    "cedula": "4746390",
    "asignatura": "TIC",
    "email": "taniavaleriaarecocabrera779@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "15/09/2026 21:33:30",
    "nombre": "Viviana Centurion",
    "cedula": "4090949",
    "asignatura": "TIC",
    "email": "vivianacenturion05@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Tujuti"
  },
  {
    "fecha": "15/09/2026 22:03:55",
    "nombre": "Oscar Nicolás Benitez Denis",
    "cedula": "5278331",
    "asignatura": "TIC",
    "email": "nicolasbd1797@gmail.com",
    "carrera": "Maestría en Administración y Gestión Pública",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "15/09/2026 22:04:06",
    "nombre": "Augusto Rodríguez",
    "cedula": "6093628",
    "asignatura": "TIC",
    "email": "aagusramosz@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Tuyuti"
  },
  {
    "fecha": "18/09/2026 14:13:14",
    "nombre": "Esmilce Alvarez",
    "cedula": "3810762",
    "asignatura": "TIC",
    "email": "esmilcealvarez120918@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "TAÑARANDY"
  },
  {
    "fecha": "18/09/2026 20:00:08",
    "nombre": "Ivana Martinez",
    "cedula": "5860420",
    "asignatura": "TIC",
    "email": "ivannacolman1@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:00:12",
    "nombre": "Darlin tatiana fernandez",
    "cedula": "5939777",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:00:18",
    "nombre": "Naomi Rodriguez Colman",
    "cedula": "7048234",
    "asignatura": "TIC",
    "email": "naomicolman4@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:00:23",
    "nombre": "Jenny Ojeda",
    "cedula": "4823476",
    "asignatura": "TIC",
    "email": "jeliza1816@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:00:32",
    "nombre": "Liz Carolina cantero",
    "cedula": "6795792",
    "asignatura": "TIC",
    "email": "canterolizcarolina0807@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:00:37",
    "nombre": "Gerardo Pinto",
    "cedula": "4165131",
    "asignatura": "TIC",
    "email": "gerardopinto85@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:00:37",
    "nombre": "Adriana Lucia Ayala Delvalle",
    "cedula": "4384884",
    "asignatura": "TIC",
    "email": "adriayala2023@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:01:22",
    "nombre": "Esmilce Alvarez",
    "cedula": "3810762",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:01:42",
    "nombre": "Vannessa Colarte",
    "cedula": "5349789",
    "asignatura": "TIC",
    "email": "colartesoriavanne21@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:01:45",
    "nombre": "Millagros Vera",
    "cedula": "6046953",
    "asignatura": "TIC",
    "email": "veracabreramilagros@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:01:58",
    "nombre": "Lucas ramos",
    "cedula": "591072",
    "asignatura": "TIC",
    "email": "lr2892136@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:02:22",
    "nombre": "Gabriela Adorno",
    "cedula": "7086529",
    "asignatura": "TIC",
    "email": "abigailalfonso129@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:02:28",
    "nombre": "Cristhian amarilla",
    "cedula": "7689168",
    "asignatura": "TIC",
    "email": "thedevid111@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:02:39",
    "nombre": "Rossana González",
    "cedula": "2984473",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Yagua"
  },
  {
    "fecha": "18/09/2026 20:02:48",
    "nombre": "Giuliana Benitez",
    "cedula": "6987887",
    "asignatura": "TIC",
    "email": "yulianabenitez067@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:02:59",
    "nombre": "Aida Sánchez",
    "cedula": "6049410",
    "asignatura": "TIC",
    "email": "aidasanchezadmv.026@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Yagua"
  },
  {
    "fecha": "18/09/2026 20:03:43",
    "nombre": "Mariela chavez",
    "cedula": "5154664",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "Lv026",
    "observacion": ""
  },
  {
    "fecha": "18/09/2026 20:05:53",
    "nombre": "Emanuel Benitez",
    "cedula": "7728176",
    "asignatura": "TIC",
    "email": "jagua",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "LV026",
    "observacion": "jaguaa"
  },
  {
    "fecha": "18/09/2026 20:06:20",
    "nombre": "Gabriel Alcaraz Ayala",
    "cedula": "4058345",
    "asignatura": "TIC",
    "email": "gabrielalcaraz24@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:06:35",
    "nombre": "Cynthia Carolina Pappaseit",
    "cedula": "4221853",
    "asignatura": "TIC",
    "email": "Cynthiapappaseit@hotmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:19:26",
    "nombre": "Pamela Silveira",
    "cedula": "6247120",
    "asignatura": "TIC",
    "email": "serafinasilveira301997@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:00",
    "nombre": "Carlos Aguiar",
    "cedula": "2487028",
    "asignatura": "TIC",
    "email": "aguiarcarlosdj@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:01",
    "nombre": "Dalia Fernández",
    "cedula": "4150363",
    "asignatura": "TIC",
    "email": "dalia.fer90@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:17",
    "nombre": "Mónica Aranda",
    "cedula": "6181944",
    "asignatura": "TIC",
    "email": "arandmoni@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026, V0266",
    "observacion": "Presente profe"
  },
  {
    "fecha": "18/09/2026 20:20:31",
    "nombre": "Leyla Masi",
    "cedula": "7305035",
    "asignatura": "TIC",
    "email": "leylamasi05@gmail.com",
    "carrera": "Licenciatura en Administración y Gestión Pública",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:20:35",
    "nombre": "Beatriz Núñez Florentin",
    "cedula": "6158389",
    "asignatura": "TIC",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:37",
    "nombre": "Meli Cuenca",
    "cedula": "7115649",
    "asignatura": "TIC",
    "email": "cuencameli12@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "LyV026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:20:54",
    "nombre": "Zaida Antonella Bogado Jara",
    "cedula": "5529598",
    "asignatura": "TIC",
    "email": "zaidabogado6@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:55",
    "nombre": "Sandra Báez",
    "cedula": "5355326",
    "asignatura": "TIC",
    "email": "sanbaez2@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:20:55",
    "nombre": "Wilson Ortellado",
    "cedula": "2970153",
    "asignatura": "TIC",
    "email": "ortelladowilson@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:21:00",
    "nombre": "Teodocia Duarte Gonzaslez",
    "cedula": "8342647",
    "asignatura": "TIC",
    "email": "teog2901@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "jagua"
  },
  {
    "fecha": "18/09/2026 20:21:23",
    "nombre": "María paz rolon Montania",
    "cedula": "6678355",
    "asignatura": "TIC",
    "email": "mmontania07@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "VL 026",
    "observacion": "Presencia"
  },
  {
    "fecha": "18/09/2026 20:21:23",
    "nombre": "Keila Espinola",
    "cedula": "6887950",
    "asignatura": "TIC",
    "email": "Kespinolabenitez99@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "jakua"
  },
  {
    "fecha": "18/09/2026 20:23:20",
    "nombre": "Ivan villalba",
    "cedula": "6576974",
    "asignatura": "TIC",
    "email": "Alealmada988@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 20:23:32",
    "nombre": "beatriznunezflorentin95@gmail.com",
    "cedula": "6158389",
    "asignatura": "TIC",
    "email": "beatriznunezflorentin95@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "JAGUA"
  },
  {
    "fecha": "18/09/2026 20:27:08",
    "nombre": "Augusto Rodríguez",
    "cedula": "6093628",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 21:03:21",
    "nombre": "Keila Espinola",
    "cedula": "6887950",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 21:03:26",
    "nombre": "Fiorella Valiente",
    "cedula": "6306549",
    "asignatura": "TIC",
    "email": "Valienteguadalupe827@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "VL 026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 21:03:29",
    "nombre": "Viviana Centurion",
    "cedula": "4090940",
    "asignatura": "TIC",
    "email": "",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 21:03:31",
    "nombre": "Lilian Celeste Olmedo Noguera",
    "cedula": "4777077",
    "asignatura": "TIC",
    "email": "lilian.olmedo11121988@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "18/09/2026 21:03:38",
    "nombre": "Carmen Martínez",
    "cedula": "4618745",
    "asignatura": "TIC",
    "email": "cnataliamc88@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": "Jagua"
  },
  {
    "fecha": "18/09/2026 21:03:38",
    "nombre": "Pedro Pablo Gonzalez Fernandez",
    "cedula": "4858468",
    "asignatura": "TIC",
    "email": "pedrito17042021@gmail.com",
    "carrera": "Licenciatura en Administración Aduanera",
    "seccion": "S026",
    "observacion": ""
  },
  {
    "fecha": "18/09/2026 21:09:27",
    "nombre": "Maria Jacqueline Rojas Aquino",
    "cedula": "6556073",
    "asignatura": "TIC",
    "email": "mariarojasaquino98@gmail.com",
    "carrera": "Licenciatura en Administración de Empresas",
    "seccion": "S026",
    "observacion": "Jagua"
  }
];

  var shRegistro = ss.getSheetByName("RegistroAlumnos");
  var shNomina = ss.getSheetByName("NominaCurso");
  var shAsistencias = ss.getSheetByName("Asistencias");
  var nowIso = new Date().toISOString();

  // 1. Sincronizar RegistroAlumnos
  if (shRegistro) {
    var regData = shRegistro.getDataRange().getValues();
    var existing = {};
    for (var i = 1; i < regData.length; i++) existing[String(regData[i][0]).replace(/\D/g, "")] = true;
    var cReg = 0;
    alumnos.forEach(function(a) {
      if (!existing[a.cedula]) {
        shRegistro.appendRow([a.cedula, a.nombre, a.email || "", a.carrera || "", a.seccion || "S026", nowIso, "Importado de TIC"]);
        existing[a.cedula] = true;
        cReg++;
      }
    });
    Logger.log("Alumnos agregados a RegistroAlumnos: " + cReg);
  }

  // 2. Sincronizar Asistencias
  if (shAsistencias) {
    var cAsist = 0;
    registros.forEach(function(r) {
      shAsistencias.appendRow([r.fecha, r.cedula, r.nombre, r.asignatura || "TIC", r.carrera, r.seccion, r.email, r.observacion]);
      cAsist++;
    });
    Logger.log("Asistencias insertadas: " + cAsist);
  }

  // 3. Sincronizar NominaCurso
  if (shNomina) {
    var nomData = shNomina.getDataRange().getValues();
    var keys = {};
    for (var j = 1; j < nomData.length; j++) keys[String(nomData[j][0]).replace(/\D/g, "") + "_TIC_" + String(nomData[j][3])] = true;
    var cNom = 0;
    alumnos.forEach(function(a) {
      var k = a.cedula + "_TIC_" + (a.seccion || "S026");
      if (!keys[k]) {
        shNomina.appendRow([a.cedula, a.nombre, "TIC", a.seccion || "S026", a.carrera, a.asistencias.length, "activo"]);
        keys[k] = true;
        cNom++;
      }
    });
    Logger.log("Alumnos matriculados en NominaCurso: " + cNom);
  }
  Logger.log("=== IMPORTACION FINALIZADA CON EXITO ===");
}