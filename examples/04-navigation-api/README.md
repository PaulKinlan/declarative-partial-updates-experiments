# 04. Navigation API + DPU

Three things working together:

1. **Server** routes every URL standalone (`/04/home`, `/04/posts`, `/04/about`, `/04/post/...`) so back/forward, refresh and copy-paste all behave like normal navigation.
2. **Navigation API** intercepts in-app link clicks via `navigation.addEventListener('navigate', e => e.intercept({ handler }))`. The address bar updates without a full reload.
3. **DPU** streams the fragment body into `#content` via `streamHTMLUnsafe()`.

If `'navigation' in window` is false, no interception runs — link clicks become normal navigations and the SSR routes serve them.

The whole client is ~25 lines, mostly the handler closure.
