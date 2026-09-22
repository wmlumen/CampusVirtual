/**
 * catalogos-py.js — Listas personales del formulario de matrícula (v08.5.7)
 *  - CV_NACIONALIDADES : nacionalidades (gentilicios), Paraguaya primero.
 *  - CV_ESTADOS_CIVILES
 *  - CV_PAISES_GENTILICIOS : pares [país, nacionalidad] (País de origen y Nacionalidad se completan entre sí)
 * Departamentos, ciudades y barrios NO están aquí: vienen de la API propia js/localidades-py.js
 * (datos en data/localidades-py/, códigos DGEEC).
 */
(function (global) {
    'use strict';

    var CV_OTRO = '__otro__';

    var CV_ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a'];

    // [país, gentilicio]
    var PAISES = [
        ['Afganistán', 'Afgana'], ['Albania', 'Albanesa'], ['Alemania', 'Alemana'], ['Andorra', 'Andorrana'],
        ['Angola', 'Angoleña'], ['Antigua y Barbuda', 'Antiguana'], ['Arabia Saudita', 'Saudí'], ['Argelia', 'Argelina'],
        ['Argentina', 'Argentina'], ['Armenia', 'Armenia'], ['Australia', 'Australiana'], ['Austria', 'Austriaca'],
        ['Azerbaiyán', 'Azerbaiyana'], ['Bahamas', 'Bahameña'], ['Bangladés', 'Bangladesí'], ['Barbados', 'Barbadense'],
        ['Baréin', 'Bareiní'], ['Bélgica', 'Belga'], ['Belice', 'Beliceña'], ['Benín', 'Beninesa'],
        ['Bielorrusia', 'Bielorrusa'], ['Birmania (Myanmar)', 'Birmana'], ['Bolivia', 'Boliviana'],
        ['Bosnia y Herzegovina', 'Bosnia'], ['Botsuana', 'Botsuana'], ['Brasil', 'Brasileña'], ['Brunéi', 'Bruneana'],
        ['Bulgaria', 'Búlgara'], ['Burkina Faso', 'Burkinesa'], ['Burundi', 'Burundesa'], ['Bután', 'Butanesa'],
        ['Cabo Verde', 'Caboverdiana'], ['Camboya', 'Camboyana'], ['Camerún', 'Camerunesa'], ['Canadá', 'Canadiense'],
        ['Catar', 'Catarí'], ['Chad', 'Chadiana'], ['Chile', 'Chilena'], ['China', 'China'], ['Chipre', 'Chipriota'],
        ['Ciudad del Vaticano', 'Vaticana'], ['Colombia', 'Colombiana'], ['Comoras', 'Comorense'],
        ['Corea del Norte', 'Norcoreana'], ['Corea del Sur', 'Surcoreana'], ['Costa de Marfil', 'Marfileña'],
        ['Costa Rica', 'Costarricense'], ['Croacia', 'Croata'], ['Cuba', 'Cubana'], ['Dinamarca', 'Danesa'],
        ['Dominica', 'Dominiquesa'], ['Ecuador', 'Ecuatoriana'], ['Egipto', 'Egipcia'], ['El Salvador', 'Salvadoreña'],
        ['Emiratos Árabes Unidos', 'Emiratí'], ['Eritrea', 'Eritrea'], ['Eslovaquia', 'Eslovaca'], ['Eslovenia', 'Eslovena'],
        ['España', 'Española'], ['Estados Unidos', 'Estadounidense'], ['Estonia', 'Estonia'],
        ['Esuatini (Suazilandia)', 'Esuatiniana'], ['Etiopía', 'Etíope'], ['Filipinas', 'Filipina'], ['Finlandia', 'Finlandesa'],
        ['Fiyi', 'Fiyiana'], ['Francia', 'Francesa'], ['Gabón', 'Gabonesa'], ['Gambia', 'Gambiana'], ['Georgia', 'Georgiana'],
        ['Ghana', 'Ghanesa'], ['Granada', 'Granadina'], ['Grecia', 'Griega'], ['Guatemala', 'Guatemalteca'],
        ['Guinea', 'Guineana'], ['Guinea-Bisáu', 'Guineana de Bisáu'], ['Guinea Ecuatorial', 'Ecuatoguineana'],
        ['Guyana', 'Guyanesa'], ['Haití', 'Haitiana'], ['Honduras', 'Hondureña'], ['Hungría', 'Húngara'], ['India', 'India'],
        ['Indonesia', 'Indonesia'], ['Irak', 'Iraquí'], ['Irán', 'Iraní'], ['Irlanda', 'Irlandesa'], ['Islandia', 'Islandesa'],
        ['Islas Marshall', 'Marshalesa'], ['Islas Salomón', 'Salomonense'], ['Israel', 'Israelí'], ['Italia', 'Italiana'],
        ['Jamaica', 'Jamaicana'], ['Japón', 'Japonesa'], ['Jordania', 'Jordana'], ['Kazajistán', 'Kazaja'], ['Kenia', 'Keniana'],
        ['Kirguistán', 'Kirguisa'], ['Kiribati', 'Kiribatiana'], ['Kuwait', 'Kuwaití'], ['Laos', 'Laosiana'], ['Lesoto', 'Lesotense'],
        ['Letonia', 'Letona'], ['Líbano', 'Libanesa'], ['Liberia', 'Liberiana'], ['Libia', 'Libia'],
        ['Liechtenstein', 'Liechtensteiniana'], ['Lituania', 'Lituana'], ['Luxemburgo', 'Luxemburguesa'],
        ['Macedonia del Norte', 'Macedonia'], ['Madagascar', 'Malgache'], ['Malasia', 'Malasia'], ['Malaui', 'Malauí'],
        ['Maldivas', 'Maldiva'], ['Malí', 'Maliense'], ['Malta', 'Maltesa'], ['Marruecos', 'Marroquí'], ['Mauricio', 'Mauriciana'],
        ['Mauritania', 'Mauritana'], ['México', 'Mexicana'], ['Micronesia', 'Micronesia'], ['Moldavia', 'Moldava'],
        ['Mónaco', 'Monegasca'], ['Mongolia', 'Mongola'], ['Montenegro', 'Montenegrina'], ['Mozambique', 'Mozambiqueña'],
        ['Namibia', 'Namibia'], ['Nauru', 'Nauruana'], ['Nepal', 'Nepalí'], ['Nicaragua', 'Nicaragüense'], ['Níger', 'Nigerina'],
        ['Nigeria', 'Nigeriana'], ['Noruega', 'Noruega'], ['Nueva Zelanda', 'Neozelandesa'], ['Omán', 'Omaní'],
        ['Países Bajos', 'Neerlandesa'], ['Pakistán', 'Pakistaní'], ['Palaos', 'Palauana'], ['Palestina', 'Palestina'],
        ['Panamá', 'Panameña'], ['Papúa Nueva Guinea', 'Papú'], ['Paraguay', 'Paraguaya'], ['Perú', 'Peruana'],
        ['Polonia', 'Polaca'], ['Portugal', 'Portuguesa'], ['Reino Unido', 'Británica'],
        ['República Centroafricana', 'Centroafricana'], ['República Checa', 'Checa'], ['República del Congo', 'Congoleña'],
        ['República Democrática del Congo', 'Congoleña (R.D.)'], ['República Dominicana', 'Dominicana'], ['Ruanda', 'Ruandesa'],
        ['Rumania', 'Rumana'], ['Rusia', 'Rusa'], ['Samoa', 'Samoana'], ['San Cristóbal y Nieves', 'Sancristobaleña'],
        ['San Marino', 'Sanmarinense'], ['San Vicente y las Granadinas', 'Sanvicentina'], ['Santa Lucía', 'Santalucense'],
        ['Santo Tomé y Príncipe', 'Santotomense'], ['Senegal', 'Senegalesa'], ['Serbia', 'Serbia'], ['Seychelles', 'Seychellense'],
        ['Sierra Leona', 'Sierraleonesa'], ['Singapur', 'Singapurense'], ['Siria', 'Siria'], ['Somalia', 'Somalí'],
        ['Sri Lanka', 'Esrilanquesa'], ['Sudáfrica', 'Sudafricana'], ['Sudán', 'Sudanesa'], ['Sudán del Sur', 'Sursudanesa'],
        ['Suecia', 'Sueca'], ['Suiza', 'Suiza'], ['Surinam', 'Surinamesa'], ['Tailandia', 'Tailandesa'], ['Taiwán', 'Taiwanesa'],
        ['Tanzania', 'Tanzana'], ['Tayikistán', 'Tayika'], ['Timor Oriental', 'Timorense'], ['Togo', 'Togolesa'],
        ['Tonga', 'Tongana'], ['Trinidad y Tobago', 'Trinitense'], ['Túnez', 'Tunecina'], ['Turkmenistán', 'Turcomana'],
        ['Turquía', 'Turca'], ['Tuvalu', 'Tuvaluana'], ['Ucrania', 'Ucraniana'], ['Uganda', 'Ugandesa'], ['Uruguay', 'Uruguaya'],
        ['Uzbekistán', 'Uzbeka'], ['Vanuatu', 'Vanuatuense'], ['Venezuela', 'Venezolana'], ['Vietnam', 'Vietnamita'],
        ['Yemen', 'Yemení'], ['Yibuti', 'Yibutiana'], ['Zambia', 'Zambiana'], ['Zimbabue', 'Zimbabuense']
    ];

    // Paraguaya primero y luego orden alfabético por gentilicio
    var CV_NACIONALIDADES = PAISES.map(function (p) { return p[1]; })
        .filter(function (g, i, a) { return a.indexOf(g) === i && g !== 'Paraguaya'; })
        .sort(function (a, b) { return a.localeCompare(b, 'es'); });
    CV_NACIONALIDADES.unshift('Paraguaya');

    global.CV_OTRO = CV_OTRO;
    global.CV_PAISES_GENTILICIOS = PAISES;   // [[país, nacionalidad]] para vincular País de origen ↔ Nacionalidad
    global.CV_NACIONALIDADES = CV_NACIONALIDADES;
    global.CV_ESTADOS_CIVILES = CV_ESTADOS_CIVILES;
})(window);
