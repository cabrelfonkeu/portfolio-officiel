(function () {
  var S = window.SITE;
  var root = document.getElementById('root');
  var ui = { filter: '', docFilter: '', panel: null, pendingDelete: null, msg: '', busy: false };
  var STATUTS = ['En cours', 'Terminé'];
  var auth = loadAuth();

  /* ---------- utilitaires ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function uid() { return Math.random().toString(36).slice(2, 8); }
  function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function route() { var h = (location.hash || '').replace('#', ''); return ['projets', 'docs', 'cv', 'contact', 'admin'].indexOf(h) >= 0 ? h : 'home'; }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } }
  function statusCls(s) { return s === 'Terminé' ? 'ok' : 'warn'; }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function normalize(s) {
    s.projects = s.projects || []; s.docs = s.docs || []; s.cvs = s.cvs || []; s.skills = s.skills || [];
    s.projects.forEach(function (p, i) { if (!p.id) p.id = slug(p.title) + '-' + i; if (p.status === 'Réalisé') p.status = 'Terminé'; });
    s.docs.forEach(function (d, i) { if (!d.id) d.id = 'd-' + i; });
    s.cvs.forEach(function (c, i) { if (!c.id) c.id = 'cv-' + i; });
    return s;
  }
  normalize(S);
  function topTags(n) {
    var c = {};
    S.projects.forEach(function (p) { (p.tags || []).forEach(function (t) { c[t] = (c[t] || 0) + 1; }); });
    return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, n);
  }
  function currentCv() { return S.cvs.filter(function (c) { return c.current; })[0] || S.cvs[0]; }
  function projectName(id) { var p = S.projects.filter(function (x) { return x.id === id; })[0]; return p ? p.title : ''; }
  function photoSrc() { var P = S.profile; return P.photo + (P.photoV ? '?v=' + P.photoV : ''); }

  /* ---------- connexion GitHub (stockée uniquement dans ce navigateur) ---------- */
  function loadAuth() { try { return JSON.parse(localStorage.getItem('roicab-auth') || 'null'); } catch (e) { return null; } }
  function saveAuth(a) { try { if (a) localStorage.setItem('roicab-auth', JSON.stringify(a)); else localStorage.removeItem('roicab-auth'); } catch (e) { } }
  function guess() {
    var h = location.hostname, m = h.match(/^([^.]+)\.github\.io$/), seg = location.pathname.split('/')[1] || '';
    return { owner: m ? m[1] : '', repo: m ? (seg && seg.indexOf('.') < 0 ? seg : h) : 'roicab' };
  }
  function enc(p) { return p.split('/').map(encodeURIComponent).join('/'); }
  function api(path, opt) {
    opt = opt || {};
    return fetch('https://api.github.com/repos/' + auth.owner + '/' + auth.repo + path, {
      method: opt.method || 'GET',
      headers: { 'Authorization': 'Bearer ' + auth.token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: opt.body ? JSON.stringify(opt.body) : undefined
    }).then(function (r) {
      if (r.ok) return r.status === 204 ? null : r.json();
      var e = new Error('http'); e.status = r.status; throw e;
    });
  }
  function getFile(p) { return api('/contents/' + enc(p) + '?ref=' + encodeURIComponent(auth.branch)); }
  function putFile(p, b64, msg, sha) { return api('/contents/' + enc(p), { method: 'PUT', body: { message: msg, content: b64, branch: auth.branch, sha: sha || undefined } }); }
  function delFile(p, msg) { return getFile(p).then(function (f) { return api('/contents/' + enc(p), { method: 'DELETE', body: { message: msg, sha: f.sha, branch: auth.branch } }); }); }
  function textToB64(t) { var b = new TextEncoder().encode(t), s = ''; for (var i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s); }
  function b64ToText(b) { var s = atob(b.replace(/\n/g, '')), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return new TextDecoder().decode(a); }
  function blobToB64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(blob); }); }
  function safeName(n) { return n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'fichier'; }
  function serialize(o) {
    return '// ====== CONTENU DU SITE ROICAB ======\n// Ce fichier est mis à jour automatiquement par le mode édition du site (bouton « Espace propriétaire »).\n// Tu peux aussi le modifier à la main : garde les guillemets et les virgules.\nwindow.SITE = ' + JSON.stringify(o, null, 2) + ';\n';
  }
  function parse(text) { var w = {}; new Function('window', text)(w); return normalize(w.SITE); }
  function uploadFile(dir, file) {
    if (file.size > 25 * 1024 * 1024) { var e = new Error('big'); e.code = 'big'; return Promise.reject(e); }
    var path = dir + '/' + today().replace(/-/g, '') + '-' + safeName(file.name);
    return blobToB64(file).then(function (b) { return putFile(path, b, 'Ajout de ' + path); }).then(function () { return path; });
  }
  function resizePhoto(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var w = Math.min(600, img.width), h = Math.round(img.height * w / img.width), c = document.createElement('canvas');
        c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('img')); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { rej(new Error('img')); };
      img.src = u;
    });
  }
  function errMsg(e) {
    if (e && e.code === 'big') return 'Fichier trop lourd (25 Mo maximum).';
    if (e && e.status === 401) return 'Jeton refusé ou expiré. Reconnecte-toi dans « Espace propriétaire ».';
    if (e && (e.status === 403 || e.status === 404)) return 'Accès refusé. Vérifie que le jeton a le droit « Contents : Read and write » sur ce dépôt.';
    if (e && (e.status === 409 || e.status === 422)) return 'Conflit avec une autre modification. Réessaie.';
    return 'Échec de l’enregistrement. Vérifie ta connexion et réessaie.';
  }
  /* applique une modification sur la dernière version publiée de data.js, puis l'enregistre */
  function mutate(fn, message, after) {
    if (!auth || ui.busy) return Promise.resolve();
    ui.busy = true; ui.msg = 'Enregistrement en cours…'; render();
    return getFile('data.js').then(function (f) {
      var remote = parse(b64ToText(f.content));
      fn(remote);
      return putFile('data.js', textToB64(serialize(remote)), message, f.sha).then(function () { S = remote; });
    }).then(function () {
      ui.panel = null; ui.pendingDelete = null;
      ui.msg = 'Enregistré. Les visiteurs verront le changement dans 1 à 2 minutes.';
      if (after) after();
    }).catch(function (e) { ui.msg = errMsg(e); }).then(function () { ui.busy = false; render(); });
  }
  function fail(e) { ui.msg = errMsg(e); ui.busy = false; render(); }

  /* ---------- vues ---------- */
  function header(r) {
    var L = [['home', 'Accueil', '#'], ['projets', 'Projets', '#projets'], ['docs', 'Documentation', '#docs'], ['cv', 'CV', '#cv'], ['contact', 'Contact', '#contact']];
    return '<header class="top"><div class="wrap bar"><a class="brand" href="#"><span class="pr">&gt;_</span>roicab</a><nav aria-label="Navigation">' +
      L.map(function (l) { return '<a href="' + l[2] + '"' + (r === l[0] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; }).join('') + '</nav></div></header>';
  }
  function adminBar() {
    if (!auth) return '';
    return '<div class="admin-bar"><span>● Mode édition · ' + esc(auth.owner + '/' + auth.repo) + '</span><button class="btn sm" data-act="logout">Se déconnecter</button>' +
      (ui.msg ? '<span class="msg">' + esc(ui.msg) + '</span>' : '<span class="muted">Chaque enregistrement est publié sur ton site.</span>') + '</div>';
  }
  function statusToggle(kind, o) {
    return '<button class="btn sm" data-act="toggle-status" data-kind="' + kind + '" data-id="' + o.id + '">' + (o.status === 'Terminé' ? 'Remettre en cours' : 'Marquer terminé') + '</button>';
  }
  function delButtons(kind, id) {
    return ui.pendingDelete === kind + id
      ? '<button class="btn sm bad" data-act="del-ok" data-kind="' + kind + '" data-id="' + id + '">Confirmer la suppression</button><button class="btn sm" data-act="cancel-del">Annuler</button>'
      : '<button class="btn sm bad" data-act="del" data-kind="' + kind + '" data-id="' + id + '">Supprimer</button>';
  }
  function docsOf(pid) { return S.docs.filter(function (d) { return d.projectId === pid; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
  function dlBtn(d) {
    return d.file ? '<a class="btn sm pri" href="' + esc(d.file) + '" download="' + esc(d.fileName || '') + '">Télécharger</a>' : '<span class="muted mono" style="font-size:12px">Bientôt disponible</span>';
  }
  function docBlock(p, manage) {
    var ds = docsOf(p.id);
    if (!ds.length && !manage) return '';
    var h = '<div class="docs-box"><div class="mono muted" style="font-size:12px;letter-spacing:.08em">DOCUMENTATION</div>';
    if (!ds.length) h += '<span class="muted" style="font-size:14px">Aucune documentation pour ce projet.</span>';
    h += ds.map(function (d) {
      var r = '<div class="docrow"><div><strong style="font-size:14px">' + esc(d.title) + '</strong> <span class="pill ' + statusCls(d.status) + '">' + esc(d.status) + '</span></div><div class="acts">' + dlBtn(d);
      if (manage) r += statusToggle('doc', d) + '<button class="btn sm" data-act="edit" data-kind="doc" data-id="' + d.id + '">Modifier</button>' + delButtons('doc', d.id);
      return r + '</div></div>';
    }).join('');
    if (manage) h += '<div><button class="btn sm" data-act="new-doc-for" data-id="' + p.id + '">+ Ajouter une documentation</button></div>';
    return h + '</div>';
  }
  function projectCard(p, manage) {
    var h = '<article class="card"><div class="meta"><span>' + esc(p.year || '') + '</span><span class="pill ' + statusCls(p.status) + '">' + esc(p.status) + '</span></div>';
    h += '<h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p>';
    if (p.details) h += '<details><summary>Détails</summary><p>' + esc(p.details) + '</p></details>';
    if ((p.tags || []).length) h += '<div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>';
    if (p.link) h += '<a class="mono" style="font-size:13px" href="' + esc(p.link) + '" target="_blank" rel="noopener">Voir le projet ↗</a>';
    h += docBlock(p, manage);
    if (manage) h += '<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto">' + statusToggle('project', p) + '<button class="btn sm" data-act="edit" data-kind="project" data-id="' + p.id + '">Modifier</button>' + delButtons('project', p.id) + '</div>';
    return h + '</article>';
  }
  function formButtons() { return '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri" type="submit">Enregistrer</button><button class="btn" type="button" data-act="close-panel">Annuler</button></div>'; }
  function statusSelect(id, cur) { return '<select id="' + id + '">' + STATUTS.map(function (s) { return '<option' + (s === cur ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>'; }
  function projectForm(p) {
    var n = !p; p = p || { title: '', summary: '', details: '', tags: [], status: 'En cours', year: String(new Date().getFullYear()), link: '' };
    return '<form class="panel" data-form="project" data-id="' + (n ? '' : p.id) + '"><h3>' + (n ? 'Nouveau projet' : 'Modifier le projet') + '</h3><div class="fgrid">' +
      '<label>Titre<input type="text" id="f-title" value="' + esc(p.title) + '" required></label>' +
      '<label>Statut' + statusSelect('f-status', p.status) + '</label>' +
      '<label>Année<input type="text" id="f-year" value="' + esc(p.year) + '"></label></div>' +
      '<label>Résumé (une ou deux phrases)<textarea id="f-summary">' + esc(p.summary) + '</textarea></label>' +
      '<label>Détails (facultatif)<textarea id="f-details">' + esc(p.details) + '</textarea></label>' +
      '<div class="fgrid"><label>Technologies (séparées par des virgules)<input type="text" id="f-tags" value="' + esc((p.tags || []).join(', ')) + '"></label>' +
      '<label>Lien (GitHub, démo)<input type="url" id="f-link" value="' + esc(p.link || '') + '" placeholder="https://"></label></div>' +
      '<fieldset style="border:1px solid var(--line);border-radius:6px;padding:12px 14px;margin:0;display:flex;flex-direction:column;gap:12px"><legend class="mono muted" style="font-size:12px;padding:0 6px">Documentation du projet (facultatif)</legend>' +
      '<div class="fgrid"><label>Fichier de documentation (PDF, Word… 25 Mo max)<input type="file" id="f-doc" accept=".pdf,.doc,.docx,.odt,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.md,.txt"></label>' +
      '<label>Titre de la documentation<input type="text" id="f-doctitle" placeholder="Comment j’ai réalisé ce projet"></label>' +
      '<label>État de la documentation' + statusSelect('f-docstatus', p.status) + '</label></div></fieldset>' + formButtons() + '</form>';
  }
  function docForm(d) {
    var n = !d; d = d || { title: '', summary: '', status: 'En cours', projectId: ui.docProject || '', file: '', fileName: '' };
    var opts = '<option value="">Aucun</option>' + S.projects.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === d.projectId ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('');
    return '<form class="panel" data-form="doc" data-id="' + (n ? '' : d.id) + '"><h3>' + (n ? 'Nouvelle documentation' : 'Modifier la documentation') + '</h3><div class="fgrid">' +
      '<label>Titre<input type="text" id="d-title" value="' + esc(d.title) + '" required></label>' +
      '<label>Statut' + statusSelect('d-status', d.status) + '</label>' +
      '<label>Projet lié (facultatif)<select id="d-project">' + opts + '</select></label></div>' +
      '<label>Description<textarea id="d-summary">' + esc(d.summary) + '</textarea></label>' +
      '<label>Fichier (PDF, Word, image… 25 Mo max)' + (d.fileName ? ' — actuel : ' + esc(d.fileName) : '') + '<input type="file" id="d-file" accept=".pdf,.doc,.docx,.odt,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.md,.txt"></label>' + formButtons() + '</form>';
  }
  function profileForm() {
    var P = S.profile, sk = S.skills.map(function (s) { return s.cat + ': ' + s.items.join(', '); }).join('\n');
    return '<form class="panel" data-form="profile"><h3>Modifier le profil</h3><div class="fgrid">' +
      '<label>Nom<input type="text" id="g-name" value="' + esc(P.name) + '"></label>' +
      '<label>Titre<input type="text" id="g-title" value="' + esc(P.title) + '"></label>' +
      '<label>Ville<input type="text" id="g-location" value="' + esc(P.location) + '"></label></div>' +
      '<label>Accroche (page d’accueil)<textarea id="g-about">' + esc(P.about) + '</textarea></label>' +
      '<label class="chk"><input type="checkbox" id="g-avail"' + (P.available ? ' checked' : '') + '> Afficher « Disponible pour un stage »</label>' +
      '<div class="fgrid"><label>E-mail<input type="email" id="g-email" value="' + esc(P.email) + '"></label>' +
      '<label>Téléphone (facultatif)<input type="text" id="g-phone" value="' + esc(P.phone || '') + '"></label>' +
      '<label>LinkedIn<input type="url" id="g-linkedin" value="' + esc(P.linkedin || '') + '"></label>' +
      '<label>GitHub<input type="url" id="g-github" value="' + esc(P.github || '') + '" placeholder="https://github.com/…"></label></div>' +
      '<label>Compétences (une catégorie par ligne, « Catégorie: a, b, c »)<textarea id="g-skills" style="min-height:150px">' + esc(sk) + '</textarea></label>' +
      '<label>Changer la photo (facultatif)<input type="file" id="g-photo" accept="image/*"></label>' + formButtons() + '</form>';
  }
  function homeView() {
    var P = S.profile, tags = topTags(6);
    var ls = S.projects.slice(0, 4).map(function (p) { return slug(p.title); }).join('  ');
    var h = '<section class="hero"><div class="who">' + (P.available ? '<span class="badge"><i class="dot"></i>Disponible pour un stage</span>' : '') +
      '<h1>' + esc(P.name) + '</h1><div class="role">' + esc(P.title) + '</div><p class="lead">' + esc(P.about) + '</p>' +
      '<div class="cta"><a class="btn pri" href="#projets">Voir mes projets</a>' + (currentCv() ? '<a class="btn" href="#cv">Télécharger mon CV</a>' : '<a class="btn" href="#contact">Me contacter</a>') + '</div></div>' +
      '<div class="photo-wrap"><img class="photo" src="' + esc(photoSrc()) + '" alt="Portrait de ' + esc(P.name) + '"></div></section>';
    h += '<section class="term" aria-label="Terminal"><div class="term-h"><i></i><i></i><i></i><span style="margin-left:8px">roicab@lab: ~</span></div><pre>' +
      '<span class="p">$</span> whoami\n<span class="o">' + esc(P.name.toLowerCase()) + ' · ' + esc(P.location.toLowerCase()) + '</span>\n' +
      '<span class="p">$</span> ls projets/ | head -4\n<span class="o">' + esc(ls) + '</span>\n' +
      '<span class="p">$</span> cat stack.txt\n<span class="o">' + esc(tags.join(' · ')) + '</span>\n<span class="p">$</span> <span class="cur"></span></pre></section>';
    if (auth) h += ui.panel === 'profile' ? profileForm() : '<div><button class="btn" data-act="edit-profile">Modifier le profil, la photo et les compétences</button></div>';
    h += '<section><div class="sec-h"><h2>Projets récents</h2><a href="#projets">Tous les projets →</a></div><div class="grid">' + S.projects.slice(0, 3).map(function (p) { return projectCard(p, false); }).join('') + '</div></section>';
    h += '<section><div class="sec-h"><h2>Compétences</h2></div><div class="skills">' + S.skills.map(function (s) { return '<div><h3>' + esc(s.cat) + '</h3><ul>' + s.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div></section>';
    return h;
  }
  function chips(list, current, act) {
    return '<div class="filters" role="group">' + [''].concat(list).map(function (t) { return '<button class="tag btn-tag" data-act="' + act + '" data-t="' + esc(t) + '" aria-pressed="' + (current === t) + '">' + esc(t || 'Tout') + '</button>'; }).join('') + '</div>';
  }
  function projetsView() {
    var all = [];
    S.projects.forEach(function (p) { (p.tags || []).forEach(function (t) { if (all.indexOf(t) < 0) all.push(t); }); });
    all.sort();
    var list = S.projects.filter(function (p) { return !ui.filter || (p.tags || []).indexOf(ui.filter) >= 0; });
    var h = '<div class="page-h"><h1>Projets</h1><p class="muted">Travaux d’infrastructure, de réseau et de développement réalisés en formation et en laboratoire personnel.</p></div>';
    if (auth) {
      var pn = ui.panel || '';
      if (pn === 'new-project') h += projectForm(null);
      else if (pn.indexOf('project:') === 0) h += projectForm(findIn(S.projects, pn.slice(8)));
      else if (pn === 'new-doc') h += docForm(null);
      else if (pn.indexOf('doc:') === 0) h += docForm(findIn(S.docs, pn.slice(4)));
      else h += '<div><button class="btn pri" data-act="new" data-kind="project">+ Ajouter un projet (avec sa documentation)</button></div>';
    }
    if (all.length) h += chips(all, ui.filter, 'filter');
    h += list.length ? '<div class="grid">' + list.map(function (p) { return projectCard(p, !!auth); }).join('') + '</div>' : '<div class="empty">Aucun projet pour l’instant.</div>';
    return h;
  }
  function docsView() {
    var h = '<div class="page-h"><h1>Documentation</h1><p class="muted">Mes rendus, comptes rendus et documentations techniques, avec leur état d’avancement.</p></div>';
    if (auth) h += ui.panel === 'new-doc' ? docForm(null) : (ui.panel && ui.panel.indexOf('doc:') === 0 ? docForm(S.docs.filter(function (d) { return d.id === ui.panel.slice(4); })[0]) : '<div><button class="btn pri" data-act="new" data-kind="doc">+ Ajouter une documentation</button></div>');
    h += chips(STATUTS, ui.docFilter, 'docfilter');
    var list = S.docs.filter(function (d) { return !ui.docFilter || d.status === ui.docFilter; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    if (!list.length) return h + '<div class="empty">Aucune documentation pour l’instant.</div>';
    return h + '<div class="list">' + list.map(function (d) {
      var pn = projectName(d.projectId);
      var a = '<div class="row"><div class="info"><h3>' + esc(d.title) + ' <span class="pill ' + statusCls(d.status) + '">' + esc(d.status) + '</span></h3>' +
        (d.summary ? '<span style="font-size:15px">' + esc(d.summary) + '</span>' : '') +
        '<span class="muted" style="font-size:13px">' + esc(fmtDate(d.date)) + (pn ? ' · Projet : ' + esc(pn) : '') + '</span></div><div class="acts">' +
        dlBtn(d) + (d.file ? '<a class="btn sm" href="' + esc(d.file) + '" target="_blank" rel="noopener">Ouvrir ↗</a>' : '');
      if (auth) a += statusToggle('doc', d) + '<button class="btn sm" data-act="edit" data-kind="doc" data-id="' + d.id + '">Modifier</button>' + delButtons('doc', d.id);
      return a + '</div></div>';
    }).join('') + '</div>';
  }
  function cvView() {
    var h = '<div class="page-h"><h1>Curriculum vitæ</h1><p class="muted">Ma dernière version est toujours en haut. Les anciennes versions restent disponibles pour suivre l’évolution de mes compétences.</p></div>';
    if (auth) h += '<form class="panel" data-form="cv"><h3>Ajouter une version du CV</h3><div class="fgrid"><label>Nom de la version<input type="text" id="c-label" placeholder="CV Infrastructure – automne 2026" required></label>' +
      '<label>Fichier (PDF recommandé, 25 Mo max)<input type="file" id="c-file" accept=".pdf,.doc,.docx" required></label></div>' +
      '<label>Note (ce qui change dans cette version)<input type="text" id="c-note" placeholder="Ajout du projet WireGuard"></label><div><button class="btn pri" type="submit">Publier cette version</button></div></form>';
    var cvs = S.cvs.slice().sort(function (a, b) { return (b.current ? 1 : 0) - (a.current ? 1 : 0) || String(b.date).localeCompare(String(a.date)); });
    if (!cvs.length) return h + '<div class="empty">Aucun CV en ligne pour l’instant.</div>';
    return h + '<div class="list">' + cvs.map(function (c) {
      var a = '<div class="row"><div class="info"><h3>' + esc(c.label) + (c.current ? ' <span class="pill ok">Version actuelle</span>' : '') + '</h3><span class="muted" style="font-size:14px">' + esc(fmtDate(c.date)) + (c.note ? ' · ' + esc(c.note) : '') + '</span></div>' +
        '<div class="acts"><a class="btn sm pri" href="' + esc(c.file) + '" target="_blank" rel="noopener">Ouvrir ↗</a>';
      if (auth) a += (c.current ? '' : '<button class="btn sm" data-act="cv-current" data-id="' + c.id + '">Définir comme actuelle</button>') + delButtons('cv', c.id);
      return a + '</div></div>';
    }).join('') + '</div>';
  }
  function contactView() {
    var P = S.profile;
    function item(k, v, extra) { return '<div class="card"><span class="muted mono" style="font-size:12px">' + k + '</span><div class="val">' + v + '</div>' + (extra || '') + '</div>'; }
    var h = '<div class="page-h"><h1>Contact</h1><p class="muted">Je cherche un stage en administration systèmes et réseaux. Écris-moi, je réponds en quelques jours.</p></div><div class="contact">';
    if (P.email) h += item('E-MAIL', '<span id="mail">' + esc(P.email) + '</span>', '<div><button class="btn sm" data-copy="' + esc(P.email) + '">Copier l’adresse</button> <span class="muted mono" id="copied" style="font-size:12px"></span></div>');
    if (P.phone) h += item('TÉLÉPHONE', esc(P.phone));
    if (P.linkedin) h += item('LINKEDIN', '<a href="' + esc(P.linkedin) + '" target="_blank" rel="noopener">' + esc(P.linkedin.replace(/^https?:\/\/(www\.)?/, '')) + ' ↗</a>');
    if (P.github) h += item('GITHUB', '<a href="' + esc(P.github) + '" target="_blank" rel="noopener">' + esc(P.github.replace(/^https?:\/\//, '')) + ' ↗</a>');
    h += item('LIEU', esc(P.location));
    return h + '</div>';
  }
  function adminView() {
    var h = '<div class="page-h"><h1>Espace propriétaire</h1><p class="muted">Réservé à Cabrel. Une fois connecté, des boutons d’ajout et de modification apparaissent sur toutes les pages.</p></div>';
    if (auth) return h + '<div class="panel"><p style="margin:0">Connecté au dépôt <strong>' + esc(auth.owner + '/' + auth.repo) + '</strong> (branche ' + esc(auth.branch) + ').</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn pri" href="#projets">Gérer mes projets</a><a class="btn" href="#docs">Gérer ma documentation</a><a class="btn" href="#cv">Gérer mes CV</a><button class="btn bad" data-act="logout">Se déconnecter</button></div></div>';
    var g = guess();
    return h + '<form class="panel" data-form="login"><h3>Connexion à GitHub</h3>' +
      '<div class="fgrid"><label>Pseudo GitHub<input type="text" id="a-owner" value="' + esc(g.owner) + '" required autocomplete="off"></label>' +
      '<label>Nom du dépôt<input type="text" id="a-repo" value="' + esc(g.repo) + '" required autocomplete="off"></label></div>' +
      '<label>Jeton d’accès GitHub<input type="password" id="a-token" required autocomplete="off" placeholder="github_pat_…"></label>' +
      '<details open><summary>Comment créer le jeton (2 minutes, une seule fois)</summary><ol class="muted" style="font-size:14px;padding-left:20px;margin:8px 0 0">' +
      '<li>Sur GitHub : photo de profil &gt; <strong>Settings</strong> &gt; <strong>Developer settings</strong> &gt; <strong>Personal access tokens</strong> &gt; <strong>Fine-grained tokens</strong> &gt; <strong>Generate new token</strong>.</li>' +
      '<li><strong>Repository access</strong> : « Only select repositories », puis choisis ce dépôt.</li>' +
      '<li><strong>Permissions &gt; Repository permissions &gt; Contents</strong> : « Read and write ».</li>' +
      '<li>Génère le jeton, copie-le et colle-le ci-dessus.</li></ol>' +
      '<p class="muted" style="font-size:13px">Le jeton reste dans ce navigateur uniquement (jamais dans le site). Il ne donne accès qu’à ce dépôt. Déconnecte-toi sur un ordinateur partagé.</p></details>' +
      (ui.msg ? '<span class="msg">' + esc(ui.msg) + '</span>' : '') +
      '<div><button class="btn pri" type="submit">Se connecter</button></div></form>';
  }
  function render() {
    var r = route();
    var body = { home: homeView, projets: projetsView, docs: docsView, cv: cvView, contact: contactView, admin: adminView }[r]();
    root.innerHTML = header(r) + '<main class="wrap">' + (r === 'admin' ? '' : adminBar()) + body + '</main><footer><div class="wrap"><span>© ' + new Date().getFullYear() + ' roicab · <a href="#admin">Espace propriétaire</a></span><span>' + esc(S.profile.name) + ' · ' + esc(S.profile.location) + '</span></div></footer>';
    document.title = r === 'home' ? 'Roicab' : { projets: 'Projets', docs: 'Documentation', cv: 'CV', contact: 'Contact', admin: 'Espace propriétaire' }[r] + ' · Roicab';
  }

  /* ---------- actions ---------- */
  function findIn(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest('[data-copy]');
    if (c) {
      var done = function (t) { var e = document.getElementById('copied'); if (e) e.textContent = t; };
      var sel = function () { var m = document.getElementById('mail'); if (m) { var r = document.createRange(); r.selectNodeContents(m); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done('sélectionné'); } };
      try { navigator.clipboard.writeText(c.dataset.copy).then(function () { done('copié'); }, sel); } catch (e) { sel(); }
      return;
    }
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act, id = b.dataset.id, kind = b.dataset.kind;
    if (a === 'filter') { ui.filter = b.dataset.t; render(); }
    else if (a === 'docfilter') { ui.docFilter = b.dataset.t; render(); }
    else if (a === 'new') { ui.docProject = ''; ui.panel = 'new-' + kind; render(); }
    else if (a === 'new-doc-for') { ui.docProject = id; ui.panel = 'new-doc'; render(); var ff = document.querySelector('form[data-form]'); if (ff) ff.scrollIntoView({ block: 'center' }); }
    else if (a === 'edit') { ui.panel = kind + ':' + id; render(); var f = document.querySelector('form[data-form]'); if (f) f.scrollIntoView({ block: 'center' }); }
    else if (a === 'edit-profile') { ui.panel = 'profile'; render(); }
    else if (a === 'close-panel') { ui.panel = null; render(); }
    else if (a === 'del') { ui.pendingDelete = kind + id; render(); }
    else if (a === 'cancel-del') { ui.pendingDelete = null; render(); }
    else if (a === 'logout') { auth = null; saveAuth(null); ui.msg = ''; ui.panel = null; location.hash = ''; render(); }
    else if (a === 'toggle-status') {
      var list = kind === 'project' ? S.projects : S.docs, cur = findIn(list, id); if (!cur) return;
      var next = cur.status === 'Terminé' ? 'En cours' : 'Terminé';
      mutate(function (R) { var o = findIn(kind === 'project' ? R.projects : R.docs, id); if (o) o.status = next; }, 'Statut « ' + next + ' » : ' + cur.title);
    }
    else if (a === 'cv-current') { mutate(function (R) { R.cvs.forEach(function (x) { x.current = (x.id === id); }); }, 'CV actuel changé'); }
    else if (a === 'del-ok') {
      var file = '';
      if (kind === 'project') {
        var gone = docsOf(id).map(function (d) { return d.file; }).filter(Boolean);
        mutate(function (R) { R.projects = R.projects.filter(function (p) { return p.id !== id; }); R.docs = R.docs.filter(function (d) { return d.projectId !== id; }); }, 'Projet supprimé',
          function () { gone.forEach(function (f) { delFile(f, 'Suppression de ' + f).catch(function () { }); }); });
        return;
      }
      var src = kind === 'doc' ? S.docs : S.cvs, o = findIn(src, id); file = o && o.file;
      mutate(function (R) {
        if (kind === 'doc') R.docs = R.docs.filter(function (d) { return d.id !== id; });
        else { R.cvs = R.cvs.filter(function (x) { return x.id !== id; }); if (R.cvs.length && !R.cvs.some(function (x) { return x.current; })) R.cvs[0].current = true; }
      }, (kind === 'doc' ? 'Documentation' : 'CV') + ' supprimé', function () { if (file) delFile(file, 'Suppression de ' + file).catch(function () { }); });
    }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
    var kind = f.dataset.form, id = f.dataset.id;
    if (kind === 'login') {
      var cand = { owner: val('a-owner'), repo: val('a-repo'), token: val('a-token'), branch: 'main' };
      var old = auth; auth = cand; ui.msg = 'Vérification…'; render();
      api('').then(function (r) {
        if (r.permissions && r.permissions.push === false) { var e = new Error('perm'); e.status = 403; throw e; }
        cand.branch = r.default_branch || 'main'; saveAuth(cand); ui.msg = ''; location.hash = ''; render();
      }).catch(function (e) { auth = old; ui.msg = (e && e.status === 401) ? 'Jeton invalide.' : (e && (e.status === 404 || e.status === 403)) ? 'Dépôt introuvable ou droits insuffisants (Contents : Read and write).' : 'Connexion impossible.'; location.hash = 'admin'; render(); });
      return;
    }
    if (!auth || ui.busy) return;
    if (kind === 'project') {
      var o = { title: val('f-title'), status: val('f-status'), year: val('f-year'), summary: val('f-summary'), details: val('f-details'), link: val('f-link'), tags: val('f-tags').split(',').map(function (t) { return t.trim(); }).filter(Boolean) };
      if (!o.title) return;
      var pf = document.getElementById('f-doc').files[0], dtitle = val('f-doctitle'), dstat = val('f-docstatus') || o.status;
      var saveP = function (path, name) {
        mutate(function (R) {
          var pid = id;
          if (id) { var p = findIn(R.projects, id); if (p) Object.assign(p, o); } else { o.id = uid(); R.projects.unshift(o); pid = o.id; }
          if (path) R.docs.unshift({ id: uid(), title: dtitle || ('Documentation : ' + o.title), summary: '', status: dstat, date: today(), projectId: pid, file: path, fileName: name });
        }, 'Projet : ' + o.title);
      };
      if (pf) { ui.busy = true; ui.msg = 'Envoi de la documentation…'; render(); uploadFile('docs', pf).then(function (p) { ui.busy = false; saveP(p, pf.name); }).catch(fail); } else saveP('', '');
    } else if (kind === 'doc') {
      var d = { title: val('d-title'), status: val('d-status'), summary: val('d-summary'), projectId: val('d-project') };
      if (!d.title) return;
      var file = document.getElementById('d-file').files[0], old2 = id ? findIn(S.docs, id) : null;
      var apply = function (path, name) {
        mutate(function (R) {
          if (id) { var x = findIn(R.docs, id); if (x) { Object.assign(x, d); if (path) { x.file = path; x.fileName = name; } } }
          else { d.id = uid(); d.date = today(); d.file = path || ''; d.fileName = name || ''; R.docs.unshift(d); }
        }, 'Documentation : ' + d.title, function () { if (path && old2 && old2.file) delFile(old2.file, 'Remplacement de ' + old2.file).catch(function () { }); });
      };
      if (file) { ui.busy = true; ui.msg = 'Envoi du fichier…'; render(); uploadFile('docs', file).then(function (p) { ui.busy = false; apply(p, file.name); }).catch(fail); } else apply('', '');
    } else if (kind === 'cv') {
      var cf = document.getElementById('c-file').files[0]; if (!cf) return;
      var label = val('c-label') || cf.name, note = val('c-note');
      ui.busy = true; ui.msg = 'Envoi du fichier…'; render();
      uploadFile('cv', cf).then(function (p) {
        ui.busy = false;
        mutate(function (R) { R.cvs.forEach(function (x) { x.current = false; }); R.cvs.unshift({ id: uid(), label: label, note: note, date: today(), file: p, current: true }); }, 'Nouveau CV : ' + label);
      }).catch(fail);
    } else if (kind === 'profile') {
      var P = { name: val('g-name'), title: val('g-title'), location: val('g-location'), about: val('g-about'), available: document.getElementById('g-avail').checked, email: val('g-email'), phone: val('g-phone'), linkedin: val('g-linkedin'), github: val('g-github') };
      var sk = []; val('g-skills').split('\n').forEach(function (l) { var i = l.indexOf(':'); if (i > 0) { var items = l.slice(i + 1).split(',').map(function (x) { return x.trim(); }).filter(Boolean); if (items.length) sk.push({ cat: l.slice(0, i).trim(), items: items }); } });
      var ph = document.getElementById('g-photo').files[0];
      var save = function (v) { mutate(function (R) { Object.keys(P).forEach(function (k) { if (k !== 'name' || P.name) R.profile[k] = P[k]; }); if (sk.length) R.skills = sk; if (v) R.profile.photoV = v; }, 'Profil mis à jour'); };
      if (ph) {
        ui.busy = true; ui.msg = 'Envoi de la photo…'; render();
        resizePhoto(ph).then(blobToB64).then(function (b) { return getFile('assets/photo.jpg').catch(function () { return null; }).then(function (x) { return putFile('assets/photo.jpg', b, 'Nouvelle photo', x && x.sha); }); })
          .then(function () { ui.busy = false; save(Date.now()); }).catch(fail);
      } else save(0);
    }
  });
  window.addEventListener('hashchange', function () { ui.panel = null; ui.pendingDelete = null; if (route() !== 'admin') ui.msg = auth ? '' : ui.msg; render(); window.scrollTo(0, 0); });
  render();
})();
