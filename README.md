# Apex Archive

Bookmarks and read-it-later for ApexOS. Vanilla HTML/CSS/JS, no build step, relative `./` paths so
it also runs from `/apps/archive/` inside the ApexOS bundle.

## Run

```sh
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

## Controls

| control | what it does |
|---|---|
| Save link | Normalises the URL (adds `https://`), de-duplicates, and saves it as unread |
| Unread / All / Read | Filters the list; counts sit next to each tab |
| Search | Matches title, URL and tag |
| Read / Unread | Toggles an item; opening a link also marks it read |
| Export | Downloads every item as JSON |
| Import | Merges an Apex Archive JSON export, skipping URLs already saved |

## Storage

`localStorage` key `apex.archive.v1`, an array of
`{ id, url, title, tag, read, saved }`. Titles are not fetched from the network, because doing so
would leak every saved URL to the page's origin; the host name is shown instead until you type one.

## Bundling into ApexOS

Roster entry `Apex-Archive archive`. Keep paths relative, and bump `CACHE` in `sw.js`
(`apex-archive-v1`) whenever shell files change.
