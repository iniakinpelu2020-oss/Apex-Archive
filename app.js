(function () {
  'use strict';

  var KEY = 'apex.archive.v1';
  var items = [];
  var filter = 'unread';

  var el = {
    form: document.getElementById('addForm'),
    url: document.getElementById('url'),
    label: document.getElementById('label'),
    tag: document.getElementById('tag'),
    list: document.getElementById('list'),
    empty: document.getElementById('empty'),
    search: document.getElementById('search'),
    cUnread: document.getElementById('cUnread'),
    cAll: document.getElementById('cAll'),
    cRead: document.getElementById('cRead'),
    toast: document.getElementById('toast'),
    file: document.getElementById('importFile')
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch (err) {
      items = [];
    }
    if (!Array.isArray(items)) items = [];
    items.forEach(function (it) {
      if (!it.id) it.id = uid();
      if (typeof it.url !== 'string') it.url = '';
      if (typeof it.title !== 'string') it.title = '';
      if (typeof it.tag !== 'string') it.tag = '';
      if (!it.saved) it.saved = Date.now();
      it.read = !!it.read;
    });
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (err) {
      toast('Could not save \u2014 storage may be full');
    }
  }

  function normalise(value) {
    var raw = value.trim();
    if (!raw) return '';
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var u = new URL(raw);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch (err) {
      return '';
    }
  }

  function host(url) {
    try {
      return new URL(url).host.replace(/^www\./, '');
    } catch (err) {
      return url;
    }
  }

  function when(t) {
    var d = new Date(t);
    var days = Math.round((Date.now() - t) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function matches(it) {
    if (filter === 'unread' && it.read) return false;
    if (filter === 'read' && !it.read) return false;
    var q = el.search.value.trim().toLowerCase();
    if (!q) return true;
    return (it.title + ' ' + it.url + ' ' + it.tag).toLowerCase().indexOf(q) !== -1;
  }

  function render() {
    var unread = items.filter(function (i) { return !i.read; }).length;
    el.cUnread.textContent = unread;
    el.cAll.textContent = items.length;
    el.cRead.textContent = items.length - unread;

    var rows = items.filter(matches).sort(function (a, b) { return b.saved - a.saved; });
    el.list.textContent = '';

    rows.forEach(function (it) {
      var li = document.createElement('li');
      li.className = 'item' + (it.read ? ' read' : '');

      var main = document.createElement('div');
      main.className = 'item-main';

      var a = document.createElement('a');
      a.href = it.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = it.title.trim() || host(it.url);
      a.addEventListener('click', function () { markRead(it.id); });
      main.appendChild(a);

      var h = document.createElement('span');
      h.className = 'host';
      h.textContent = it.url;
      main.appendChild(h);

      if (it.tag) {
        var pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = '#' + it.tag;
        main.appendChild(pill);
      }

      var w = document.createElement('span');
      w.className = 'when';
      w.textContent = (it.read ? 'Read \u00b7 saved ' : 'Saved ') + when(it.saved);
      main.appendChild(w);

      var actions = document.createElement('div');
      actions.className = 'item-actions';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.textContent = it.read ? 'Unread' : 'Read';
      toggle.addEventListener('click', function () { markRead(it.id, !it.read); });
      actions.appendChild(toggle);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Delete';
      del.addEventListener('click', function () { remove(it.id); });
      actions.appendChild(del);

      li.appendChild(main);
      li.appendChild(actions);
      el.list.appendChild(li);
    });

    el.empty.hidden = rows.length !== 0;
    el.empty.textContent = items.length
      ? 'No links match this filter.'
      : 'Nothing saved here yet. Paste a link above to start.';
  }

  function markRead(id, value) {
    items.forEach(function (it) {
      if (it.id !== id) return;
      it.read = typeof value === 'boolean' ? value : true;
    });
    persist();
    render();
  }

  function remove(id) {
    items = items.filter(function (it) { return it.id !== id; });
    persist();
    render();
    toast('Link deleted');
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.toast.hidden = true; }, 2400);
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var url = normalise(el.url.value);
    if (!url) {
      toast('That does not look like an http(s) link');
      el.url.focus();
      return;
    }
    var dup = items.filter(function (it) { return it.url === url; })[0];
    if (dup) {
      dup.read = false;
      dup.saved = Date.now();
      persist();
      render();
      toast('Already saved \u2014 moved to the top');
    } else {
      items.unshift({
        id: uid(),
        url: url,
        title: el.label.value.trim(),
        tag: el.tag.value.trim().replace(/^#/, '').toLowerCase(),
        read: false,
        saved: Date.now()
      });
      persist();
      render();
      toast('Saved');
    }
    el.form.reset();
    el.url.focus();
  });

  el.search.addEventListener('input', render);

  document.querySelectorAll('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filter = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      render();
    });
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    if (!items.length) {
      toast('Nothing to export');
      return;
    }
    download('apex-archive-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(items, null, 2));
  });

  document.getElementById('importBtn').addEventListener('click', function () { el.file.click(); });

  el.file.addEventListener('change', function () {
    var file = el.file.files && el.file.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var added = 0;
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error('not a list');
        var known = {};
        items.forEach(function (it) { known[it.url] = true; });
        parsed.forEach(function (raw) {
          var url = normalise(String(raw.url || ''));
          if (!url || known[url]) return;
          known[url] = true;
          added++;
          items.push({
            id: uid(),
            url: url,
            title: typeof raw.title === 'string' ? raw.title : '',
            tag: typeof raw.tag === 'string' ? raw.tag : '',
            read: !!raw.read,
            saved: Number(raw.saved) || Date.now()
          });
        });
      } catch (err) {
        toast('Import failed \u2014 expected an Apex Archive export');
        el.file.value = '';
        return;
      }
      persist();
      render();
      toast(added ? 'Imported ' + added + ' link' + (added === 1 ? '' : 's') : 'Nothing new to import');
      el.file.value = '';
    };
    reader.readAsText(file);
  });

  load();
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
