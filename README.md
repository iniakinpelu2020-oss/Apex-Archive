# Apex Archive

Bookmarks and read-it-later, with the full text saved so links stop rotting.

**Status: not built.**

## What it should do

- Save a URL from the phone's share sheet.
- Keep a readable copy of the text, so a deleted page is still readable.
- Full-text search over everything you saved.

## The constraint that shapes it

Saving the text needs a fetch from a server, because most pages block a browser fetch with
CORS. Cloudflare Workers can do that fetch, and 100,000 requests a day is generous for one
person. Extraction (Readability) runs fine in a Worker.

Firestore stores the extracted text; keep it to text, not screenshots, or 1 GiB fills up
surprisingly fast.

## What to build, in order

1. Save a URL, extract the text, show it in a clean reader view.
2. Search across saved text.
3. Tags and a "read later" queue.
4. An import from browser bookmarks (the HTML export file).

## What you need to do

1. Nothing new.

## First three steps

1. A Worker route that takes a URL and returns extracted text.
2. A list view with search.
3. A share target in the Android app that posts the current page.
