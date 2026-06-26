// ============================================
// MODULO: Paises con bandera y codigo en input
// ============================================

let _countriesCache = null;

const cargarPaises = async () => {
    if (_countriesCache) return _countriesCache;
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        _countriesCache = data
            .map(country => ({
                nombre:  country.name.common,
                oficial: country.name.official,
                codigo:  country.cca2,
                prefijo: country.idd?.root + (country.idd?.suffixes?.[0] || ''),
                bandera: country.flags?.svg || country.flag || ''
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .filter(c => c.prefijo && c.prefijo !== '+undefined');
        return _countriesCache;
    } catch (error) {
        console.error('Error cargando paises:', error);
        return [];
    }
};

const poblarSelectPaises = async (selectId, paisSeleccionado = '') => {
    const select = document.getElementById(selectId);
    if (!select) return;
    try {
        select.innerHTML = '<option value="">Cargando paises...</option>';
        select.disabled = true;
        const paises = await cargarPaises();
        select.innerHTML = '<option value="">Selecciona un pais</option>';
        paises.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais.nombre;
            option.textContent = `${pais.nombre} (${pais.prefijo})`;
            if (pais.nombre === paisSeleccionado) option.selected = true;
            select.appendChild(option);
        });
        select.disabled = false;
    } catch (error) {
        console.error('Error poblando select:', error);
        select.innerHTML = '<option value="">Error cargando paises</option>';
        select.disabled = true;
    }
};

const obtenerDatosPais = async (nombrePais) => {
    const paises = await cargarPaises();
    return paises.find(p => p.nombre === nombrePais) || null;
};

// -- Helpers bandera -------------------------------------------------------

const mostrarFlagEn = (wrap, pais) => {
    if (!wrap) return;
    let badge = wrap.querySelector('.pais-flag-sel');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'pais-flag-sel';
        wrap.appendChild(badge);
    }
    badge.innerHTML = [
        pais.bandera ? `<img src="${pais.bandera}" alt="${pais.codigo}">` : '',
        pais.prefijo ? `<span class="pais-flag-pref">${pais.prefijo}</span>` : ''
    ].join('');
    wrap.classList.add('tiene-pais');
};

const limpiarFlagEn = (wrap) => {
    if (!wrap) return;
    wrap.querySelector('.pais-flag-sel')?.remove();
    wrap.classList.remove('tiene-pais');
};

// -- AUTOCOMPLETE ----------------------------------------------------------

const _inyectarEstilosAC = () => {
    if (document.getElementById('pais-ac-styles')) return;
    const el = document.createElement('style');
    el.id = 'pais-ac-styles';
    el.textContent = `
        .pais-ac-wrap { position: relative; display: block; width: 100%; }
        .pais-ac-dropdown {
            display: none; position: absolute; top: 100%; left: 0; right: 0;
            background: #fff; border: 1px solid #c7d2fe; border-top: none;
            border-radius: 0 0 8px 8px; max-height: 230px; overflow-y: auto;
            z-index: 1000; box-shadow: 0 8px 24px rgba(0,0,0,.13); scrollbar-width: thin;
        }
        .pais-ac-dropdown.abierto { display: block; }
        .pais-ac-item {
            padding: 8px 12px; cursor: pointer; font-size: 13px;
            display: flex; align-items: center; gap: 10px;
            border-bottom: 1px solid #f3f4f6; transition: background .1s;
            user-select: none; white-space: nowrap;
        }
        .pais-ac-item:last-child { border-bottom: none; }
        .pais-ac-item:hover, .pais-ac-item.resaltado { background: #eff6ff; color: #1a2744; }
        .pais-ac-bandera { font-size: 18px; flex-shrink: 0; line-height: 1; width: 22px; text-align: center; }
        .pais-ac-nombre  { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
        .pais-ac-prefijo { font-size: 11px; color: #9ca3af; white-space: nowrap; }
        .pais-ac-empty   { padding: 14px; color: #9ca3af; font-size: 13px; text-align: center; }
        .pais-flag-sel {
            position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
            display: flex; align-items: center; gap: 5px;
            pointer-events: none; z-index: 2;
        }
        .pais-flag-sel img {
            width: 22px; height: 15px; object-fit: cover;
            border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,.25); display: block;
        }
        .pais-flag-pref {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
            background: #f3f4f6; padding: 1px 5px; border-radius: 3px; border: 1px solid #e5e7eb;
        }
        .pais-ac-wrap.tiene-pais > input[type="text"],
        .pais-ac-wrap.tiene-pais > input:not([type]) { padding-left: 74px !important; }
    `;
    document.head.appendChild(el);
};

const iniciarAutocompletePaises = ({ inputId, hiddenId = null, defaultValue = '' } = {}) => {
    const input = document.getElementById(inputId);
    if (!input) return { setValor: () => {} };
    const hiddenInput = hiddenId ? document.getElementById(hiddenId) : null;

    if (input.dataset.acIniciado) {
        input.value = defaultValue || '';
        if (hiddenInput) hiddenInput.value = defaultValue || '';
        const wrap = input.closest('.pais-ac-wrap');
        if (defaultValue) {
            cargarPaises().then(paises => {
                const p = paises.find(x => x.nombre === defaultValue);
                if (p) mostrarFlagEn(wrap, p); else limpiarFlagEn(wrap);
            });
        } else { limpiarFlagEn(wrap); }
        return {
            setValor: (v) => {
                input.value = v || '';
                if (hiddenInput) hiddenInput.value = v || '';
                const w = input.closest('.pais-ac-wrap');
                if (v) { cargarPaises().then(paises => { const p = paises.find(x => x.nombre === v); if (p) mostrarFlagEn(w, p); else limpiarFlagEn(w); }); }
                else limpiarFlagEn(w);
            }
        };
    }
    input.dataset.acIniciado = '1';
    _inyectarEstilosAC();

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

    const dropdown = document.createElement('div');
    dropdown.className = 'pais-ac-dropdown';
    wrap.appendChild(dropdown);

    let allPaises = [];
    let highlightedIdx = -1;

    if (defaultValue) {
        input.value = defaultValue;
        if (hiddenInput) hiddenInput.value = defaultValue;
    }

    cargarPaises().then(paises => {
        allPaises = paises;
        const nombre = defaultValue || input.value.trim();
        if (nombre) {
            const found = paises.find(p => p.nombre === nombre);
            if (found) {
                if (!input.value) { input.value = found.nombre; if (hiddenInput) hiddenInput.value = found.nombre; }
                mostrarFlagEn(wrap, found);
            }
        }
    });

    const cerrar = () => { dropdown.classList.remove('abierto'); dropdown.innerHTML = ''; highlightedIdx = -1; };

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
        if (!filtrados.length) {
            dropdown.innerHTML = '<div class="pais-ac-empty">Sin resultados</div>';
            dropdown.classList.add('abierto');
            return;
        }
        const top = filtrados.slice(0, 35);
        dropdown.innerHTML = top.map(p => `
            <div class="pais-ac-item" data-nombre="${p.nombre.replace(/"/g, "&quot;")}">
                <span class="pais-ac-bandera">${p.bandera ? `<img src="${p.bandera}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;" alt="">` : ''}</span>
                <span class="pais-ac-nombre">${p.nombre}</span>
                ${p.prefijo ? `<span class="pais-ac-prefijo">${p.prefijo}</span>` : ''}
            </div>`).join('');
        dropdown.classList.add('abierto');
        dropdown.querySelectorAll('.pais-ac-item').forEach(item => {
            item.addEventListener('mousedown', e => { e.preventDefault(); seleccionar(item.dataset.nombre); });
        });
    };

    const filtrar = (q) => {
        if (!q) return cerrar();
        if (!allPaises.length) return;
        const ql = q.toLowerCase();
        const startsWith = allPaises.filter(p => p.nombre.toLowerCase().startsWith(ql));
        const contains   = allPaises.filter(p => !p.nombre.toLowerCase().startsWith(ql) && p.nombre.toLowerCase().includes(ql));
        renderItems([...startsWith, ...contains]);
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
            const pais = allPaises.find(p => p.nombre === v);
            if (pais) mostrarFlagEn(wrap, pais);
            else cargarPaises().then(paises => { const p2 = paises.find(p => p.nombre === v); if (p2) mostrarFlagEn(wrap, p2); });
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
