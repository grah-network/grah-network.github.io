/* GRAH — outils communs : signature manuscrite, documents imprimables, petites aides */
(function () {
  'use strict';
  var G = window.GRAH = window.GRAH || {};

  G.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  G.fmtDate = function (d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(String(d).length === 10 ? d + 'T12:00:00' : d));
  };
  G.fmtDateTime = function (d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)).replace(':', ' h ');
  };
  G.euro = function (v) { return v == null || v === '' ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(v)); };

  /* Signature au doigt, au stylet ou à la souris. pad.isEmpty(), pad.clear(), pad.toDataURL() */
  G.pad = function (canvas) {
    var ctx = canvas.getContext('2d'), drawing = false, strokes = 0, last = null;
    function size() {
      var r = canvas.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * k)), h = Math.max(1, Math.round(r.height * k));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h; strokes = 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.4 * k;
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; }
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function (e) { size(); drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + 0.1, last.y + 0.1); ctx.stroke(); e.preventDefault(); });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; strokes++;
    });
    function end() { drawing = false; }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    setTimeout(size, 0);
    return {
      isEmpty: function () { return strokes < 8; },
      clear: function () { ctx.clearRect(0, 0, canvas.width, canvas.height); strokes = 0; },
      toDataURL: function () { return canvas.toDataURL('image/png'); }
    };
  };

  /* Document imprimable (ou à enregistrer en PDF) : en-tête GRAH, informations, texte, signatures */
  G.docHtml = function (o) {
    var e = G.esc;
    var meta = (o.meta || []).filter(function (r) { return r && r[1] !== undefined && r[1] !== null && r[1] !== ''; })
      .map(function (r) { return '<tr><th>' + e(r[0]) + '</th><td>' + e(r[1]) + '</td></tr>'; }).join('');
    var sigs = (o.sigs || []).map(function (s) {
      return '<div class="sig"><div class="l">' + e(s.label) + '</div>' + (s.name ? '<div>' + e(s.name) + '</div>' : '') +
        (s.img ? '<img src="' + e(s.img) + '" alt="signature">' : '<div class="empty"></div>') +
        '<div class="d">' + (s.date ? 'Signé le ' + e(G.fmtDate(s.date)) : 'Non signé') + '</div></div>';
    }).join('');
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + e(o.title) + '</title><style>' +
      '@page{size:A4;margin:18mm 16mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#000;font-size:11pt;line-height:1.45;margin:0}' +
      '.h{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5pt solid #000;padding-bottom:6pt;margin-bottom:14pt}' +
      '.h b{font-size:22pt;letter-spacing:-.5pt}.h span{font-size:8.5pt;text-align:right;color:#444}' +
      'h1{font-size:16pt;margin:0 0 4pt}.sub{color:#444;margin:0 0 12pt}table{border-collapse:collapse;width:100%;margin:0 0 14pt}' +
      'th,td{text-align:left;vertical-align:top;padding:4pt 6pt;border-bottom:.5pt solid #bbb;font-size:10pt}th{width:34%;font-weight:700}' +
      '.body{white-space:pre-wrap;margin-bottom:14pt}.extra{margin-bottom:14pt}.sigs{display:flex;gap:16pt;flex-wrap:wrap;page-break-inside:avoid}' +
      '.sig{flex:1;min-width:200pt;border:1pt solid #000;border-radius:4pt;padding:8pt}.sig .l{font-weight:700}.sig img{display:block;max-width:100%;height:70pt;object-fit:contain;margin:4pt 0}' +
      '.sig .empty{height:70pt}.sig .d{font-size:9pt;color:#444}.foot{margin-top:16pt;font-size:8pt;color:#666;border-top:.5pt solid #bbb;padding-top:4pt}' +
      'ul{margin:4pt 0 12pt;padding-left:16pt}</style></head><body>' +
      '<div class="h"><b>GRAH!</b><span>Groupe de Recherche artistique et d’Action sur l’Hospitalité<br>Association loi 1901 · RNA W302023215 · SIRET 103 759 312 00012<br>10 Place Avogadro, 30900 Nîmes · contact@grah-network.com</span></div>' +
      '<h1>' + e(o.title) + '</h1>' + (o.subtitle ? '<p class="sub">' + e(o.subtitle) + '</p>' : '') +
      (meta ? '<table>' + meta + '</table>' : '') + (o.extra || '') +
      (o.body ? '<div class="body">' + e(o.body) + '</div>' : '') +
      (sigs ? '<div class="sigs">' + sigs + '</div>' : '') +
      '<div class="foot">' + e(o.foot || ('Document généré le ' + G.fmtDate(new Date().toISOString()) + ' depuis grah-network.com')) + '</div></body></html>';
  };
  G.printDoc = function (o) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(G.docHtml(o)); d.close();
    var go = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (err) { /* rien */ } setTimeout(function () { f.remove(); }, 60000); };
    var imgs = d.images, left = imgs.length;
    if (!left) return setTimeout(go, 50);
    for (var i = 0; i < imgs.length; i++) { if (imgs[i].complete) { if (--left === 0) setTimeout(go, 50); } else imgs[i].onload = imgs[i].onerror = function () { if (--left === 0) setTimeout(go, 50); }; }
  };
})();
