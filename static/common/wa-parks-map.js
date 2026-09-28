/* wa-parks-map.js — the home page's corner map: Washington, with every park I've visited, and the park whose card is
 * in view highlighted.
 *
 * Built on the theme's track map (themes/zola-es-theme/docs/track-map.md): the same widget markup and styles, and the
 * basemap from track-common.js. Unlike the theme's listing map, the view never moves: it stays on the whole state,
 * and the park in view is marked on it. Clicking it opens it full-screen, as a park page's map expands, where the reader
 * can pan and zoom, see a park's cover photo by pointing at it, and open its page. On a phone the corner map is the
 * theme's bottom strip, a 76 px picture of the state, which draws only the park in view. Reads:
 *   - #wa-parks-config          JSON written by parks-list.html (the parks, the parks still to do, basemap options)
 *   - the site's `region_outline`, the state's outline (from OpenStreetMap), which the map sets apart from its
 *     surroundings with the theme's `addRegion`
 *   - .park-entry[data-seq]     the cards, in page order
 *   - CSS custom properties on the widget (--es-track-*) for every colour
 */
(function () {
  'use strict';

  const cfgEl = document.getElementById('wa-parks-config');
  const widget = document.getElementById('es-track-widget');
  if (!cfgEl || !widget || !window.esTrack) return;
  const { iconSvg, isPhone } = window.esTrack;
  const CFG = JSON.parse(cfgEl.textContent);
  const tok = n => getComputedStyle(widget).getPropertyValue('--es-track-' + n).trim();

  // The state's extent, [[west, south], [east, north]].
  const WASHINGTON = [[-124.85, 45.54], [-116.91, 49.0]];

  // The reading line, as a fraction of the window's height: the card that crosses it is the one in view.
  const FOCUS_LINE = 0.4;

  const notice = document.getElementById('es-track-notice');
  const ico = document.getElementById('es-track-ico');
  const text = document.getElementById('es-track-text');
  const collapseBtn = document.getElementById('es-track-collapse');
  const attrBtn = document.getElementById('es-track-attr-btn');
  const modal = document.getElementById('es-track-modal');
  const thumb = document.getElementById('es-track-thumb');
  const thumbImg = thumb.querySelector('img');
  const thumbLoc = document.getElementById('es-track-thumb-loc');
  const thumbTail = document.getElementById('es-track-thumb-tail');
  const showNotice = msg => { notice.textContent = msg || ''; notice.hidden = !msg; };

  const parks = CFG.parks || [];
  const bySeq = new Map(parks.map(p => [p.seq, p]));

  // Parks I've visited but not yet written up count as visited; the rest are still to do.
  const todo = CFG.todo || [];
  const unpublished = todo.filter(p => p.seq > 0);
  const toGo = todo.length - unpublished.length;

  // Full-screen, the most recent parks I've visited stand out.
  const RECENT = 10;
  const latestSeq = Math.max(0, ...parks.concat(todo).map(p => p.seq || 0));

  const cards = Array.from(document.querySelectorAll('.park-entry[data-seq]'))
    .map(el => ({ el, park: bySeq.get(+el.dataset.seq) }))
    .filter(c => c.park);

  // Every park on the map: those I've written up, then those still to do (or not yet written up).
  const places = parks.concat(todo);

  let map = null, mapReady = false, focus = -1, collapsed = false, expanded = false;
  let base = null;  // OpenFreeMap's style, or null when it couldn't be loaded.
  let outline = null;  // Washington's outline, a GeoJSON polygon, or null when it couldn't be loaded.

  // ------------------------------------------------------------ map
  // Every park as a point: `seq` is its place in the quest, or 0 for a park still to do, and `k` its index in `places`.
  const pointData = () => ({
    type: 'FeatureCollection',
    features: places.map((p, k) => ({
      type: 'Feature',
      properties: { seq: p.seq || 0, k },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    })),
  });

  const seq = ['get', 'seq'];
  // The park in view, highlighted on the corner map; full-screen, every park is drawn alike.
  const at = () => focus >= 0 && !expanded ? cards[focus].park.seq : -1;

  // A phone's strip is too small a picture of the state for every park: while a card is in view, only its park is
  // drawn there. Before the first card, the summary shows them all, as the caption counts them.
  const strip = () => isPhone() && !expanded;
  const NONE = ['==', seq, -2];
  const FILTERS = {
    'wa-todo': () => strip() && at() >= 0 ? NONE : ['==', seq, 0],
    'wa-visited': () => strip() && at() >= 0 ? NONE : ['all', ['>', seq, 0], ['!=', seq, at()]],
    'wa-recent': () => expanded ? ['>', seq, latestSeq - RECENT] : NONE,
    'wa-current-halo': () => ['==', seq, at()],
    'wa-current-ring': () => ['==', seq, at()],
    'wa-current': () => ['==', seq, at()],
  };

  // The corner map at the site's detail; full-screen, the full basemap and larger dots, as on a park page's map.
  function buildStyle() {
    const style = window.esTrack.basemapStyle(base, { cfg: CFG, tok, detail: expanded ? 'standard' : CFG.detail || 'minimal' });
    const z = expanded ? 1.6 : 1;

    // The highlight is drawn smaller on a phone's strip, where it would otherwise cover a third of the state.
    const h = strip() ? .6 : 1;

    // The map is all about Washington, so it doesn't need to name it.
    style.layers = style.layers.filter(l => l.id !== 'place_state');
    style.sources.parks = { type: 'geojson', data: pointData() };

    // The state stands out: its surroundings dim, and a fine line traces its border, as on the park pages' maps.
    window.esTrack.addRegion(style, outline, tok);
    const dot = (id, paint) => ({ id, type: 'circle', source: 'parks', filter: FILTERS[id](), paint });
    const cur = tok('current');
    style.layers.push(
      dot('wa-todo', { 'circle-radius': 3 * z, 'circle-color': tok('todo'), 'circle-stroke-color': tok('casing'), 'circle-stroke-width': .8 * z }),
      dot('wa-visited', { 'circle-radius': 3 * z, 'circle-color': tok('accent'), 'circle-stroke-color': tok('casing'), 'circle-stroke-width': .8 * z }),
      dot('wa-recent', { 'circle-radius': 3 * z, 'circle-color': cur, 'circle-stroke-color': tok('casing'), 'circle-stroke-width': .8 * z }),

      // The park in view, highlighted as the page map highlights its position dot: a soft halo, a ring, and a white dot.
      dot('wa-current-halo', { 'circle-radius': 11 * h, 'circle-color': cur, 'circle-opacity': .3, 'circle-blur': .4 }),
      dot('wa-current-ring', { 'circle-radius': 11 * h, 'circle-color': cur, 'circle-opacity': 0, 'circle-stroke-color': cur, 'circle-stroke-width': 3 * h }),
      dot('wa-current', { 'circle-radius': 5 * h, 'circle-color': tok('dot'), 'circle-stroke-color': cur, 'circle-stroke-width': 2.5 * h }),

      // What the pointer finds: every park, a little larger than it's drawn.
      { id: 'wa-hit', type: 'circle', source: 'parks', paint: { 'circle-radius': 10, 'circle-opacity': 0 } },
    );
    widget.classList.add('basemap-muted');
    return style;
  }

  function applyFilters() {
    if (mapReady) Object.keys(FILTERS).forEach(id => map.setFilter(id, FILTERS[id]()));
  }

  // The whole state, filling the corner map, or with room around it full-screen. The corner map leaves room at the top
  // for its expand button, so the parks in the state's northeast corner stay in sight. There's nothing to frame while
  // the map has no size: collapsed to its caption, or hidden on a phone until it's opened full-screen.
  function frame(animate) {
    if (!mapReady) return;
    const box = map.getContainer();
    if (!box.clientWidth || !box.clientHeight) return;
    const padding = expanded ? (isPhone() ? 20 : 50) : isPhone() ? 4 : { top: 46, right: 12, bottom: 12, left: 12 };
    map.fitBounds(WASHINGTON, { padding, duration: animate ? 600 : 0 });
  }

  // ------------------------------------------------------------ caption
  // The park in view: its name and designator, where it is, and when I visited, as its own page puts them. Before
  // the first card, and full-screen, where every park is drawn alike, the quest so far.
  function caption() {
    const c = focus >= 0 && !expanded ? cards[focus] : null;
    const line = (cls, t) => {
      const el = document.createElement('span');
      el.className = cls;
      el.textContent = t;
      return el;
    };

    // Names come from the site, but are set as text all the same.
    let lines;
    if (c) {
      const p = c.park;
      // The line is styled as the designator and the name as itself, so an ellipsis cutting the designator short
      // matches it.
      const title = line('mode wa-park-title', '');
      title.append(line('wa-park-name', p.name), ' ' + p.designator);
      lines = [title, p.near && line('label', `${p.near}, Washington`), p.visited && line('label', `visited ${p.visited}`)];
    } else {
      // The project's name is 146 Parks, but the count has grown since: the old number scribbled out and the new one
      // written in beside it.
      const visited = parks.length + unpublished.length, total = parks.length + todo.length;
      const title = line('mode wa-quest', '');
      if (total !== 146) {
        title.append(line('wa-was', '146'), ' ', line('wa-now', String(total)), ' Parks');
        title.title = `Found more parks: now headed for ${total}!`;
      } else {
        title.textContent = '146 Parks';
      }
      lines = [title, line('label', `${visited} parks visited${toGo ? ` · ${toGo} to go` : ''}`)];

      // Full-screen, a key to the green dots.
      if (expanded) lines.push(line('label', `The ${RECENT} most recent in green`));
    }
    ico.innerHTML = iconSvg('pin');
    text.replaceChildren(...lines.filter(Boolean));
    text.title = c ? `Open ${c.park.name}` : '';
  }

  // ------------------------------------------------------------ following the reader
  // The card that crosses the reading line, else the nearest one; -1 before the first card reaches the line.
  function focusIndex() {
    if (!cards.length) return -1;
    const line = innerHeight * FOCUS_LINE;
    if (cards[0].el.getBoundingClientRect().top > line) return -1;

    // At the foot of the page the last card may never reach the line.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) return cards.length - 1;
    let best = 0, bd = Infinity;
    cards.forEach((c, i) => {
      const r = c.el.getBoundingClientRect();
      const d = r.top > line ? r.top - line : r.bottom < line ? line - r.bottom : 0;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function setFocus(i) {
    if (i === focus) return;
    focus = i;
    caption();
    applyFilters();
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      setFocus(focusIndex());
      updateOverlap();
    });
  }

  // Fade the widget while it sits over a cover photo, as on the park pages' map.
  function updateOverlap() {
    if (!CFG.dim || isPhone()) { widget.classList.remove('over-photo'); return; }
    const w = widget.getBoundingClientRect();
    let over = false;
    for (const c of cards) {
      const img = c.el.querySelector('.cover img');
      if (!img) continue;
      const r = img.getBoundingClientRect();
      if (r.left < w.right && r.right > w.left && r.top < w.bottom && r.bottom > w.top) { over = true; break; }
    }
    widget.classList.toggle('over-photo', over);
  }

  function setCollapsed(v, remember) {
    collapsed = v;
    widget.classList.toggle('is-collapsed', v);
    collapseBtn.setAttribute('aria-expanded', String(!v));
    collapseBtn.setAttribute('aria-label', v ? 'Show map' : 'Collapse map');
    if (remember) { try { localStorage.setItem('es-track-collapsed', v ? '1' : '0'); } catch (e) { /* Private mode. */ } }
    if (mapReady) requestAnimationFrame(() => { map.resize(); frame(false); });
    updateOverlap();
  }

  // ------------------------------------------------------------ full-screen
  // The map opens full-screen in the theme's modal, as a park page's map does, and returns to the corner on close.
  const home = { parent: widget.parentNode, next: widget.nextSibling };

  function setInteractive(on) {
    ['scrollZoom', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate', 'boxZoom'].forEach(h => { if (map[h]) on ? map[h].enable() : map[h].disable(); });
    if (map.touchZoomRotate) map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();
    map.touchPitch.disable();
  }

  function setExpanded(v) {
    if (v === expanded || !mapReady) return;
    expanded = v;
    hideCard();
    caption();
    widget.classList.toggle('is-corner', !v);
    widget.classList.toggle('is-expanded', v);
    if (v) modal.appendChild(widget);
    else home.parent.insertBefore(widget, home.next);
    modal.hidden = !v;
    document.body.style.overflow = v ? 'hidden' : '';
    setInteractive(v);
    map.setStyle(buildStyle());
    requestAnimationFrame(() => {
      map.resize();
      frame(false);
    });
    updateOverlap();
  }

  // ------------------------------------------------------------ park card
  // Full-screen, pointing at a park (or tapping it) shows its cover photo, name, and visit, as a park page's map shows
  // a photo: beside the dot, clear of it, and tied to it by a funnel.
  let cardAt = null;  // The index in `places` of the park on the card.

  function hideCard() {
    cardAt = null;
    thumb.hidden = true;
    thumbTail.toggleAttribute('hidden', true);
  }

  function showCard(k) {
    const p = places[k];
    if (!p) return;
    cardAt = k;
    if (p.cover) {
      if (thumbImg.getAttribute('src') !== p.cover) thumbImg.src = p.cover;
      thumbImg.style.display = '';
    } else {
      thumbImg.removeAttribute('src');
      thumbImg.style.display = 'none';
    }
    thumb.classList.toggle('wa-no-photo', !p.cover);
    const span = (cls, t) => {
      const el = document.createElement('span');
      el.className = cls;
      el.textContent = t;
      return el;
    };
    const title = span('wa-card-title', '');
    title.append(span('wa-park-name', p.name), p.designator ? ' ' + p.designator : '');
    const note = p.url ? (p.visited ? `visited ${p.visited}` : '') : p.seq > 0 ? 'visited, not yet written up' : 'not yet visited';
    const words = span('wa-card-text', '');
    words.replaceChildren(...[title, note && span('wa-card-note', note)].filter(Boolean));

    // A park I've visited carries its number on the state's shape, as in the parks list, before its name.
    const row = span('wa-card-row', '');
    if (p.seq > 0) {
      const badge = span('sequence-assembly', '');
      const shape = document.createElement('img');
      shape.src = '/common/wa-shape.png';
      shape.alt = '';
      shape.width = 49;
      shape.height = 32;
      badge.append(shape, span('sequence', String(p.seq)));
      row.appendChild(badge);
    }
    row.appendChild(words);
    thumbLoc.replaceChildren(row);
    thumb.hidden = false;
    placeCard();
  }

  // Above the dot when there's room, else below, then right or left: the first spot that fits in the map and keeps
  // the dot clear.
  function placeCard() {
    if (cardAt == null) return;
    const p = places[cardAt], pt = map.project([p.lon, p.lat]);
    const box = map.getContainer().getBoundingClientRect(), w = thumb.offsetWidth, h = thumb.offsetHeight;
    const gap = 24, edge = 4;
    const cands = [[pt.x - w / 2, pt.y - gap - h], [pt.x - w / 2, pt.y + gap], [pt.x + gap, pt.y - h / 2], [pt.x - gap - w, pt.y - h / 2]];
    const clamp = ([x, y]) => [Math.max(edge, Math.min(box.width - edge - w, x)), Math.max(edge, Math.min(box.height - edge - h, y))];
    const clear = ([x, y]) => pt.x < x - 8 || pt.x > x + w + 8 || pt.y < y - 8 || pt.y > y + h + 8;
    const fits = c => { const [x, y] = clamp(c); return x === c[0] && y === c[1]; };
    const pick = cands.find(fits) || cands.map(clamp).find(clear) || clamp(cands[0]);
    const [x, y] = clamp(pick);
    thumb.style.left = x + 'px';
    thumb.style.top = y + 'px';
    drawTail(pt, x, y, w, h, box);
  }

  // A funnel from the card's nearest edge to just short of the dot, as on a park page's map.
  function drawTail(pt, x, y, w, h, box) {
    const cx = Math.max(x, Math.min(x + w, pt.x)), cy = Math.max(y, Math.min(y + h, pt.y));
    const dx = pt.x - cx, dy = pt.y - cy, len = Math.hypot(dx, dy);
    if (len < 14 || len > 90) { thumbTail.toggleAttribute('hidden', true); return; }
    const ux = dx / len, uy = dy / len, px = -uy, py = ux, half = 6, stop = 9;
    const ax = pt.x - ux * stop, ay = pt.y - uy * stop, bx = cx - ux, by = cy - uy;
    thumbTail.setAttribute('width', box.width);
    thumbTail.setAttribute('height', box.height);
    thumbTail.querySelector('polygon').setAttribute('points', `${ax},${ay} ${bx + px * half},${by + py * half} ${bx - px * half},${by - py * half}`);
    thumbTail.toggleAttribute('hidden', false);
  }

  // The card's height changes once the photo arrives.
  thumbImg.addEventListener('load', () => { if (!thumb.hidden) placeCard(); });
  thumbImg.addEventListener('error', () => { thumbImg.style.display = 'none'; if (!thumb.hidden) placeCard(); });

  const openPark = k => { const p = places[k]; if (p && p.url) location.href = p.url; };
  const canHover = matchMedia('(hover: hover)').matches;

  function wireMap() {
    map.on('mousemove', 'wa-hit', e => {
      if (!expanded || !canHover || !e.features.length) return;
      map.getCanvas().style.cursor = places[e.features[0].properties.k].url ? 'pointer' : '';
      if (e.features[0].properties.k !== cardAt) showCard(e.features[0].properties.k);
    });
    map.on('mouseleave', 'wa-hit', () => {
      if (!expanded || !canHover) return;
      map.getCanvas().style.cursor = '';
      hideCard();
    });

    // With a mouse, the card is already up, so a click opens the park; on a touch screen, the first tap shows the
    // card, and tapping the card opens the park.
    map.on('click', e => {
      if (!expanded) return;
      const f = map.queryRenderedFeatures(e.point, { layers: ['wa-hit'] })[0];
      if (!f) { hideCard(); return; }
      const k = f.properties.k;
      if (canHover) openPark(k);
      else showCard(k);
    });
    map.on('move', placeCard);
  }
  thumb.addEventListener('click', e => { e.stopPropagation(); if (cardAt != null) openPark(cardAt); });

  // ------------------------------------------------------------ controls
  // Clicking the corner map opens it full-screen; clicking its caption opens the park in view.
  widget.addEventListener('click', e => {
    if (expanded || e.target.closest('.es-track-attr-btn, .es-track-attr, .es-track-collapse')) return;
    if (collapsed) { setCollapsed(false, true); return; }
    const c = focus >= 0 ? cards[focus] : null;
    if (e.target.closest('.es-track-bar')) { if (c) location.href = c.park.url; return; }
    setExpanded(true);
  });
  attrBtn.addEventListener('click', e => { e.stopPropagation(); attrBtn.setAttribute('aria-expanded', String(attrBtn.getAttribute('aria-expanded') !== 'true')); });
  collapseBtn.addEventListener('click', e => { e.stopPropagation(); setCollapsed(!collapsed, true); });
  document.getElementById('es-track-expand').addEventListener('click', e => { e.stopPropagation(); setExpanded(true); });
  document.getElementById('es-track-close').addEventListener('click', e => { e.stopPropagation(); setExpanded(false); });
  document.getElementById('es-track-fit').addEventListener('click', e => { e.stopPropagation(); frame(true); });
  document.getElementById('es-track-zoom-in').addEventListener('click', e => { e.stopPropagation(); map.zoomIn(); });
  document.getElementById('es-track-zoom-out').addEventListener('click', e => { e.stopPropagation(); map.zoomOut(); });

  // Outside the map, or Escape, closes it.
  modal.addEventListener('click', e => { if (e.target === modal) setExpanded(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) setExpanded(false); });

  // ------------------------------------------------------------ boot
  async function start() {
    if (!cards.length) return;
    widget.hidden = false;
    try { const v = localStorage.getItem('es-track-collapsed'); collapsed = v === null ? (isPhone() && CFG.mobileCollapsed) : v === '1'; }
    catch (e) { collapsed = isPhone() && CFG.mobileCollapsed; }
    setCollapsed(collapsed, false);
    focus = focusIndex();
    caption();
    addEventListener('scroll', onScroll, { passive: true });

    // Turning a phone, or resizing a window, may move the map between the strip and the corner, which draw the parks
    // differently: the style is rebuilt when that happens.
    let phone = isPhone();
    addEventListener('resize', () => {
      onScroll();
      if (!mapReady) return;
      map.resize();
      if (phone !== isPhone()) { phone = isPhone(); map.setStyle(buildStyle()); }
      frame(false);
      hideCard();
    });

    const [basemap, shape] = await Promise.all([
      window.esTrack.loadBasemap(CFG, tok),
      window.esTrack.loadRegion(CFG.regionOutline),
    ]);

    base = basemap;
    outline = shape;
    if (!window.maplibregl) { showNotice('The map library could not be loaded.'); return; }
    if (!base) showNotice('Map tiles unavailable. Showing the parks alone.');

    // Interactive only full-screen: the corner map is a picture of the state, and a click on it opens it. The state
    // fits the corner map above zoom 3, but a phone's 76 px strip needs about 2.5.
    map = new maplibregl.Map({ container: 'es-track-canvas', style: buildStyle(), bounds: WASHINGTON, attributionControl: false, fadeDuration: 0, maxZoom: 16, minZoom: 1 });
    setInteractive(false);
    wireMap();
    map.on('load', () => {
      mapReady = true;
      applyFilters();
      frame(false);
    });
    map.on('error', e => { const m = (e && e.error && e.error.message) || ''; if (m) console.warn('wa-parks-map:', m); });
    onScroll();
  }

  start().catch(err => console.warn('wa-parks-map:', err));
})();
