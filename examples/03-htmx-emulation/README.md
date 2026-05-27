# 03. HTMX emulation in ~40 lines

The headline question: what does HTMX become when the browser ships streamed partial updates? It becomes a 40-line click handler.

Mapping:

| HTMX                 | This demo                         |
| -------------------- | --------------------------------- |
| `hx-get="/url"`      | `data-get="/url"`                 |
| `hx-target="#x"`     | `data-target="#x"`                |
| `hx-swap="innerHTML"`| `data-swap="inner"`               |
| `hx-swap="beforeend"`| `data-swap="append"`              |
| `hx-swap="afterbegin"`| `data-swap="prepend"`            |
| `hx-swap="outerHTML"`| `data-swap="replace"`             |

The handler also degrades: if `streamHTMLUnsafe` is unavailable, it falls back to `innerHTML` / `insertAdjacentHTML` / `outerHTML`, so the page still works without the flag.
