// Legacy URL shim: theses used to render here as article.html?id=<id>.
        // The canonical version now lives at /theses/<id>.html (static pages
        // with real meta tags so link previews work). Forward old links.
        (function () {
            var id = new URLSearchParams(window.location.search).get('id');
            if (id && /^[a-z0-9-]+$/.test(id)) {
                window.location.replace('/theses/' + id + '.html');
            } else {
                window.location.replace('/investment-theses.html');
            }
        })();
