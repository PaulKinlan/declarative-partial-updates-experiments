# 09 · replace, don't diff

A live leaderboard that reshuffles every second. The server re-renders the **whole** sorted list and
streams it as a `<template for="board">` that replaces the marked region in place. No virtual DOM,
no diffing, no reconciliation, no framework, and no client JavaScript.

Each row carries a stable `view-transition-name`, so a browser that opts into view transitions
animates the reshuffle for free. That is a pure-CSS enhancement, not required for the replacement to
work.

The point: the virtual DOM exists to avoid re-rendering everything (diff, then patch only what
changed). When the platform can replace a whole named region from streamed HTML, a large class of
"you need a framework for this" UIs become a server that prints HTML.

Without the API the first board renders as a static snapshot, so the page degrades rather than
breaking.
