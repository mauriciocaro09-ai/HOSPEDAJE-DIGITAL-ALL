// ============================================================
// MÓDULO: Países — datos embebidos, banderas via flagcdn.com
// Sin API externa · sin CORS · posicionamiento inteligente
// ============================================================

// [nombre_en, codigo2, prefijo]
const _PAISES_RAW = [
  ['Afghanistan','AF','+93'],['Albania','AL','+355'],['Algeria','DZ','+213'],
  ['Andorra','AD','+376'],['Angola','AO','+244'],['Antigua and Barbuda','AG','+1268'],
  ['Argentina','AR','+54'],['Armenia','AM','+374'],['Australia','AU','+61'],
  ['Austria','AT','+43'],['Azerbaijan','AZ','+994'],['Bahamas','BS','+1242'],
  ['Bahrain','BH','+973'],['Bangladesh','BD','+880'],['Barbados','BB','+1246'],
  ['Belarus','BY','+375'],['Belgium','BE','+32'],['Belize','BZ','+501'],
  ['Benin','BJ','+229'],['Bhutan','BT','+975'],['Bolivia','BO','+591'],
  ['Bosnia and Herzegovina','BA','+387'],['Botswana','BW','+267'],['Brazil','BR','+55'],
  ['Brunei','BN','+673'],['Bulgaria','BG','+359'],['Burkina Faso','BF','+226'],
  ['Burundi','BI','+257'],['Cambodia','KH','+855'],['Cameroon','CM','+237'],
  ['Canada','CA','+1'],['Cape Verde','CV','+238'],['Central African Republic','CF','+236'],
  ['Chad','TD','+235'],['Chile','CL','+56'],['China','CN','+86'],
  ['Colombia','CO','+57'],['Comoros','KM','+269'],['Costa Rica','CR','+506'],
  ['Croatia','HR','+385'],['Cuba','CU','+53'],['Cyprus','CY','+357'],
  ['Czech Republic','CZ','+420'],['DR Congo','CD','+243'],['Denmark','DK','+45'],
  ['Djibouti','DJ','+253'],['Dominica','DM','+1767'],['Dominican Republic','DO','+1809'],
  ['Ecuador','EC','+593'],['Egypt','EG','+20'],['El Salvador','SV','+503'],
  ['Equatorial Guinea','GQ','+240'],['Eritrea','ER','+291'],['Estonia','EE','+372'],
  ['Eswatini','SZ','+268'],['Ethiopia','ET','+251'],['Fiji','FJ','+679'],
  ['Finland','FI','+358'],['France','FR','+33'],['Gabon','GA','+241'],
  ['Gambia','GM','+220'],['Georgia','GE','+995'],['Germany','DE','+49'],
  ['Ghana','GH','+233'],['Greece','GR','+30'],['Grenada','GD','+1473'],
  ['Guatemala','GT','+502'],['Guinea','GN','+224'],['Guinea-Bissau','GW','+245'],
  ['Guyana','GY','+592'],['Haiti','HT','+509'],['Honduras','HN','+504'],
  ['Hungary','HU','+36'],['Iceland','IS','+354'],['India','IN','+91'],
  ['Indonesia','ID','+62'],['Iran','IR','+98'],['Iraq','IQ','+964'],
  ['Ireland','IE','+353'],['Israel','IL','+972'],['Italy','IT','+39'],
  ['Jamaica','JM','+1876'],['Japan','JP','+81'],['Jordan','JO','+962'],
  ['Kazakhstan','KZ','+7'],['Kenya','KE','+254'],['Kiribati','KI','+686'],
  ['Kuwait','KW','+965'],['Kyrgyzstan','KG','+996'],['Laos','LA','+856'],
  ['Latvia','LV','+371'],['Lebanon','LB','+961'],['Lesotho','LS','+266'],
  ['Liberia','LR','+231'],['Libya','LY','+218'],['Liechtenstein','LI','+423'],
  ['Lithuania','LT','+370'],['Luxembourg','LU','+352'],['Madagascar','MG','+261'],
  ['Malawi','MW','+265'],['Malaysia','MY','+60'],['Maldives','MV','+960'],
  ['Mali','ML','+223'],['Malta','MT','+356'],['Marshall Islands','MH','+692'],
  ['Mauritania','MR','+222'],['Mauritius','MU','+230'],['Mexico','MX','+52'],
  ['Micronesia','FM','+691'],['Moldova','MD','+373'],['Monaco','MC','+377'],
  ['Mongolia','MN','+976'],['Montenegro','ME','+382'],['Morocco','MA','+212'],
  ['Mozambique','MZ','+258'],['Myanmar','MM','+95'],['Namibia','NA','+264'],
  ['Nauru','NR','+674'],['Nepal','NP','+977'],['Netherlands','NL','+31'],
  ['New Zealand','NZ','+64'],['Nicaragua','NI','+505'],['Niger','NE','+227'],
  ['Nigeria','NG','+234'],['North Korea','KP','+850'],['North Macedonia','MK','+389'],
  ['Norway','NO','+47'],['Oman','OM','+968'],['Pakistan','PK','+92'],
  ['Palau','PW','+680'],['Palestine','PS','+970'],['Panama','PA','+507'],
  ['Papua New Guinea','PG','+675'],['Paraguay','PY','+595'],['Peru','PE','+51'],
  ['Philippines','PH','+63'],['Poland','PL','+48'],['Portugal','PT','+351'],
  ['Qatar','QA','+974'],['Republic of the Congo','CG','+242'],['Romania','RO','+40'],
  ['Russia','RU','+7'],['Rwanda','RW','+250'],['Saint Kitts and Nevis','KN','+1869'],
  ['Saint Lucia','LC','+1758'],['Saint Vincent and the Grenadines','VC','+1784'],
  ['Samoa','WS','+685'],['San Marino','SM','+378'],['Sao Tome and Principe','ST','+239'],
  ['Saudi Arabia','SA','+966'],['Senegal','SN','+221'],['Serbia','RS','+381'],
  ['Seychelles','SC','+248'],['Sierra Leone','SL','+232'],['Singapore','SG','+65'],
  ['Slovakia','SK','+421'],['Slovenia','SI','+386'],['Solomon Islands','SB','+677'],
  ['Somalia','SO','+252'],['South Africa','ZA','+27'],['South Korea','KR','+82'],
  ['South Sudan','SS','+211'],['Spain','ES','+34'],['Sri Lanka','LK','+94'],
  ['Sudan','SD','+249'],['Suriname','SR','+597'],['Sweden','SE','+46'],
  ['Switzerland','CH','+41'],['Syria','SY','+963'],['Taiwan','TW','+886'],
  ['Tajikistan','TJ','+992'],['Tanzania','TZ','+255'],['Thailand','TH','+66'],
  ['Timor-Leste','TL','+670'],['Togo','TG','+228'],['Tonga','TO','+676'],
  ['Trinidad and Tobago','TT','+1868'],['Tunisia','TN','+216'],['Turkey','TR','+90'],
  ['Turkmenistan','TM','+993'],['Tuvalu','TV','+688'],['Uganda','UG','+256'],
  ['Ukraine','UA','+380'],['United Arab Emirates','AE','+971'],['United Kingdom','GB','+44'],
  ['United States','US','+1'],['Uruguay','UY','+598'],['Uzbekistan','UZ','+998'],
  ['Vanuatu','VU','+678'],['Vatican City','VA','+39'],['Venezuela','VE','+58'],
  ['Vietnam','VN','+84'],['Yemen','YE','+967'],['Zambia','ZM','+260'],['Zimbabwe','ZW','+263']
];

const _NOMBRES_ES = {
  'Afghanistan':'Afganistán','Algeria':'Argelia','Argentina':'Argentina',
  'Australia':'Australia','Austria':'Austria','Belgium':'Bélgica',
  'Bolivia':'Bolivia','Brazil':'Brasil','Canada':'Canadá',
  'Chile':'Chile','China':'China','Colombia':'Colombia',
  'Costa Rica':'Costa Rica','Croatia':'Croacia','Cuba':'Cuba',
  'Czech Republic':'República Checa','Denmark':'Dinamarca',
  'Dominican Republic':'República Dominicana','Ecuador':'Ecuador',
  'Egypt':'Egipto','El Salvador':'El Salvador','Finland':'Finlandia',
  'France':'Francia','Germany':'Alemania','Greece':'Grecia',
  'Guatemala':'Guatemala','Haiti':'Haití','Honduras':'Honduras',
  'Hungary':'Hungría','India':'India','Indonesia':'Indonesia',
  'Iran':'Irán','Iraq':'Irak','Ireland':'Irlanda','Israel':'Israel',
  'Italy':'Italia','Jamaica':'Jamaica','Japan':'Japón','Jordan':'Jordania',
  'Mexico':'México','Morocco':'Marruecos','Netherlands':'Países Bajos',
  'New Zealand':'Nueva Zelanda','Nicaragua':'Nicaragua','Nigeria':'Nigeria',
  'Norway':'Noruega','Pakistan':'Pakistán','Panama':'Panamá',
  'Paraguay':'Paraguay','Peru':'Perú','Philippines':'Filipinas',
  'Poland':'Polonia','Portugal':'Portugal','Romania':'Rumania',
  'Russia':'Rusia','Saudi Arabia':'Arabia Saudita','South Korea':'Corea del Sur',
  'Spain':'España','Sweden':'Suecia','Switzerland':'Suiza',
  'Turkey':'Turquía','Ukraine':'Ucrania',
  'United Arab Emirates':'Emiratos Árabes Unidos',
  'United Kingdom':'Reino Unido','United States':'Estados Unidos',
  'Uruguay':'Uruguay','Venezuela':'Venezuela','Vietnam':'Vietnam'
};

// URL de bandera via flagcdn.com (imágenes, sin restricción CORS para display)
const _flagUrl = (codigo) => `https://flagcdn.com/w20/${codigo.toLowerCase()}.png`;

let _countriesCache = null;

const cargarPaises = async () => {
  if (_countriesCache) return _countriesCache;
  _countriesCache = _PAISES_RAW
    .map(([nombre, codigo, prefijo]) => ({
      nombre: _NOMBRES_ES[nombre] || nombre,
      nombreEn: nombre,
      codigo,
      prefijo,
      bandera: _flagUrl(codigo)
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return _countriesCache;
};

const poblarSelectPaises = async (selectId, paisSeleccionado = '') => {
  const select = document.getElementById(selectId);
  if (!select) return;
  const paises = await cargarPaises();
  select.innerHTML = '<option value="">Selecciona un país</option>';
  paises.forEach(p => {
    const o = document.createElement('option');
    o.value = p.nombre;
    o.textContent = `${p.nombre} (${p.prefijo})`;
    if (p.nombre === paisSeleccionado) o.selected = true;
    select.appendChild(o);
  });
};

const obtenerDatosPais = async (nombrePais) => {
  const paises = await cargarPaises();
  return paises.find(p => p.nombre === nombrePais || p.nombreEn === nombrePais) || null;
};

// ── Bandera en el input ──────────────────────────────────────────────────────

const mostrarFlagEn = (wrap, pais) => {
  if (!wrap) return;
  let badge = wrap.querySelector('.pais-flag-sel');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'pais-flag-sel';
    wrap.appendChild(badge);
  }
  badge.innerHTML =
    `<img src="${pais.bandera}" alt="${pais.codigo}" class="pais-flag-img" onerror="this.style.display='none'">` +
    (pais.prefijo ? `<span class="pais-flag-pref">${pais.prefijo}</span>` : '');
  wrap.classList.add('tiene-pais');
};

const limpiarFlagEn = (wrap) => {
  if (!wrap) return;
  wrap.querySelector('.pais-flag-sel')?.remove();
  wrap.classList.remove('tiene-pais');
};

// ── Estilos ──────────────────────────────────────────────────────────────────

const _inyectarEstilosAC = () => {
  if (document.getElementById('pais-ac-styles')) return;
  const s = document.createElement('style');
  s.id = 'pais-ac-styles';
  s.textContent = `
    .pais-ac-wrap { position: relative; display: block; width: 100%; }
    .pais-ac-dropdown {
      display: none; position: fixed;
      background: #fff; border: 1px solid #c7d2fe;
      border-radius: 8px; overflow-y: auto;
      z-index: 99999; box-shadow: 0 8px 24px rgba(0,0,0,.18);
      scrollbar-width: thin;
    }
    .pais-ac-dropdown.abierto { display: block; }
    .pais-ac-item {
      padding: 7px 12px; cursor: pointer; font-size: 13px;
      color: #1f2937; display: flex; align-items: center; gap: 9px;
      border-bottom: 1px solid #f3f4f6; transition: background .1s; user-select: none;
    }
    .pais-ac-item:last-child { border-bottom: none; }
    .pais-ac-item:hover, .pais-ac-item.resaltado { background: #eff6ff; color: #1a2744; }
    .pais-ac-flag  { flex-shrink: 0; width: 24px; display:flex; align-items:center; }
    .pais-ac-flag img { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,.2); display:block; }
    .pais-ac-nombre { flex: 1; font-weight: 500; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pais-ac-prefijo{ font-size: 11px; color: #9ca3af; white-space: nowrap; }
    .pais-ac-empty  { padding: 14px; color: #9ca3af; font-size: 13px; text-align: center; }
    /* Badge bandera dentro del input */
    .pais-flag-sel {
      position: absolute; left: 7px; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center; gap: 5px; pointer-events: none; z-index: 2;
    }
    .pais-flag-img  { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,.25); display: block; }
    .pais-flag-pref {
      font-size: 11px; font-weight: 600; color: #374151;
      background: #f3f4f6; padding: 1px 4px; border-radius: 3px; border: 1px solid #e5e7eb; white-space: nowrap;
    }
    .pais-ac-wrap.tiene-pais > input[type="text"],
    .pais-ac-wrap.tiene-pais > input:not([type]) { padding-left: 78px !important; }
  `;
  document.head.appendChild(s);
};

// ── Autocomplete ─────────────────────────────────────────────────────────────

const iniciarAutocompletePaises = ({ inputId, hiddenId = null, defaultValue = '' } = {}) => {
  const input = document.getElementById(inputId);
  if (!input) return { setValor: () => {} };
  const hiddenInput = hiddenId ? document.getElementById(hiddenId) : null;

  // Idempotencia
  if (input.dataset.acIniciado) {
    input.value = defaultValue || '';
    if (hiddenInput) hiddenInput.value = defaultValue || '';
    const wrap = input.closest('.pais-ac-wrap');
    if (defaultValue) {
      cargarPaises().then(ps => {
        const p = ps.find(x => x.nombre === defaultValue || x.nombreEn === defaultValue);
        if (p) mostrarFlagEn(wrap, p); else limpiarFlagEn(wrap);
      });
    } else limpiarFlagEn(wrap);
    return {
      setValor: (v) => {
        input.value = v || '';
        if (hiddenInput) hiddenInput.value = v || '';
        const w = input.closest('.pais-ac-wrap');
        if (v) cargarPaises().then(ps => { const p = ps.find(x => x.nombre === v || x.nombreEn === v); if (p) mostrarFlagEn(w, p); else limpiarFlagEn(w); });
        else limpiarFlagEn(w);
      }
    };
  }
  input.dataset.acIniciado = '1';
  _inyectarEstilosAC();

  // Bloquear autofill nativo de Chrome (ignora "off" en campos de dirección)
  input.setAttribute('autocomplete', 'new-password');
  input.setAttribute('name', '_ps' + Math.random().toString(36).slice(2, 7));

  // Wrapper
  const parent = input.parentElement;
  let wrap;
  if (parent.classList.contains('pais-ac-wrap')) {
    wrap = parent;
  } else {
    wrap = document.createElement('div');
    wrap.className = 'pais-ac-wrap';
    parent.insertBefore(wrap, input);
    wrap.appendChild(input);
  }

  // El dropdown debe vivir dentro del <dialog> si el input está en uno:
  // los dialogs usan el "top layer" del navegador y tapan cualquier elemento
  // position:fixed anclado a document.body, sin importar el z-index.
  const dropdown = document.createElement('div');
  dropdown.className = 'pais-ac-dropdown';
  const parentDialog = input.closest('dialog');
  (parentDialog || document.body).appendChild(dropdown);

  let allPaises = [];
  let highlightedIdx = -1;

  if (defaultValue) {
    input.value = defaultValue;
    if (hiddenInput) hiddenInput.value = defaultValue;
  }

  // Datos ya embebidos — se resuelve sincrónicamente en el próximo tick
  cargarPaises().then(ps => {
    allPaises = ps;
    const nombre = defaultValue || input.value.trim();
    if (nombre) {
      const found = ps.find(p => p.nombre === nombre || p.nombreEn === nombre);
      if (found) {
        if (!input.value) { input.value = found.nombre; if (hiddenInput) hiddenInput.value = found.nombre; }
        mostrarFlagEn(wrap, found);
      }
    }
  });

  // Posicionamiento inteligente: se abre hacia arriba si hay más espacio
  const posicionar = () => {
    const r = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const maxH = 200;

    dropdown.style.left  = r.left + 'px';
    dropdown.style.width = r.width + 'px';

    if (spaceBelow < maxH && spaceAbove > spaceBelow) {
      const h = Math.min(maxH, spaceAbove - 8);
      dropdown.style.top        = 'auto';
      dropdown.style.bottom     = (window.innerHeight - r.top) + 'px';
      dropdown.style.maxHeight  = h + 'px';
      dropdown.style.borderRadius = '8px 8px 0 0';
    } else {
      const h = Math.min(maxH, spaceBelow - 8);
      dropdown.style.bottom     = 'auto';
      dropdown.style.top        = r.bottom + 'px';
      dropdown.style.maxHeight  = h + 'px';
      dropdown.style.borderRadius = '0 0 8px 8px';
    }
  };

  const cerrar = () => {
    dropdown.classList.remove('abierto');
    dropdown.innerHTML = '';
    highlightedIdx = -1;
  };

  const seleccionar = (nombre) => {
    input.value = nombre;
    if (hiddenInput) hiddenInput.value = nombre;
    const pais = allPaises.find(p => p.nombre === nombre);
    if (pais) mostrarFlagEn(wrap, pais);
    cerrar();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const resaltar = (items) => {
    items.forEach((el, i) => el.classList.toggle('resaltado', i === highlightedIdx));
    items[highlightedIdx]?.scrollIntoView({ block: 'nearest' });
  };

  const renderItems = (filtrados) => {
    highlightedIdx = -1;
    posicionar();
    if (!filtrados.length) {
      dropdown.innerHTML = '<div class="pais-ac-empty">Sin resultados</div>';
      dropdown.classList.add('abierto');
      return;
    }
    dropdown.innerHTML = filtrados.slice(0, 40).map(p =>
      `<div class="pais-ac-item" data-nombre="${p.nombre.replace(/"/g, '&quot;')}">` +
      `<span class="pais-ac-flag"><img src="${p.bandera}" alt="${p.codigo}" onerror="this.style.display='none'"></span>` +
      `<span class="pais-ac-nombre">${p.nombre}</span>` +
      `<span class="pais-ac-prefijo">${p.prefijo}</span></div>`
    ).join('');
    dropdown.classList.add('abierto');
    dropdown.querySelectorAll('.pais-ac-item').forEach(item => {
      item.addEventListener('mousedown', e => { e.preventDefault(); seleccionar(item.dataset.nombre); });
    });
  };

  const filtrar = (q) => {
    if (!q) return cerrar();
    const ql = q.toLowerCase();
    const sw = allPaises.filter(p =>
      p.nombre.toLowerCase().startsWith(ql) || p.nombreEn.toLowerCase().startsWith(ql)
    );
    const co = allPaises.filter(p =>
      !p.nombre.toLowerCase().startsWith(ql) && !p.nombreEn.toLowerCase().startsWith(ql) &&
      (p.nombre.toLowerCase().includes(ql) || p.nombreEn.toLowerCase().includes(ql))
    );
    renderItems([...sw, ...co]);
  };

  input.addEventListener('input', () => {
    if (!input.value.trim()) { limpiarFlagEn(wrap); if (hiddenInput) hiddenInput.value = ''; }
    filtrar(input.value.trim());
  });
  input.addEventListener('focus', () => { if (input.value.trim()) filtrar(input.value.trim()); });
  input.addEventListener('blur',  () => {
    setTimeout(() => { cerrar(); if (hiddenInput && input.value.trim()) hiddenInput.value = input.value.trim(); }, 200);
  });
  input.addEventListener('keydown', e => {
    const items = [...dropdown.querySelectorAll('.pais-ac-item')];
    if (!items.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1); resaltar(items); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); highlightedIdx = Math.max(highlightedIdx - 1, 0); resaltar(items); }
    else if (e.key === 'Enter' && highlightedIdx >= 0) { e.preventDefault(); seleccionar(items[highlightedIdx].dataset.nombre); }
    else if (e.key === 'Escape') cerrar();
  });

  const setValor = (v) => {
    input.value = v || '';
    if (hiddenInput) hiddenInput.value = v || '';
    if (v) {
      const p = allPaises.find(x => x.nombre === v || x.nombreEn === v);
      if (p) mostrarFlagEn(wrap, p);
      else cargarPaises().then(ps => { const p2 = ps.find(x => x.nombre === v || x.nombreEn === v); if (p2) mostrarFlagEn(wrap, p2); });
    } else limpiarFlagEn(wrap);
  };

  return { setValor };
};

window.cargarPaises              = cargarPaises;
window.poblarSelectPaises        = poblarSelectPaises;
window.obtenerDatosPais          = obtenerDatosPais;
window.iniciarAutocompletePaises = iniciarAutocompletePaises;
window.mostrarFlagEn             = mostrarFlagEn;
window.limpiarFlagEn             = limpiarFlagEn;
