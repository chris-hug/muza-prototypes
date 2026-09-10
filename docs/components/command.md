---
title: Command
source: src/components/ui/command.tsx
related: [dialog, input, search, menu]
usage:
  - nothing yet — search is its own field, not a command palette
---

`Command` is the keyboard-driven filtered list — a search field over grouped items that arrow keys select and Enter runs — as an inline surface or, as `CommandDialog`, the ⌘K palette inside a `Dialog`. It wraps `cmdk`; the app's own search is a different surface (`SearchPanel`, the Search section).

## Anatomy

| Part | Wears | Notes |
|---|---|---|
| `Command` | `flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-foreground` | no border of its own: inside a dialog the dialog's is the border; inline, the call site adds `border border-border` |
| `CommandInput` | wrapper `flex items-center gap-2 border-b border-border px-3` with `Search size-4 text-muted-foreground`; input `h-11 w-full bg-transparent py-3 text-base placeholder:text-muted-foreground` | 44px, `text-base` — the field is the surface's title row |
| `CommandList` | `max-h-[300px] overflow-y-auto overflow-x-hidden` | the list scrolls, the field stays |
| `CommandEmpty` | `py-6 text-center text-small text-muted-foreground` | — |
| `CommandGroup` | `p-1`; heading `px-2 py-1.5 text-xsmall font-normal text-muted-foreground` | headings are labels, never uppercase |
| `CommandSeparator` | `-mx-1 h-px bg-border` | full-bleed across the group padding |
| `CommandItem` | `rounded-lg px-2.5 py-1.5 text-base`; selected `bg-accent text-accent-foreground`; disabled `opacity-50 pointer-events-none`; glyphs `size-4` unless sized | "selected" is cmdk's `data-selected` — the keyboard cursor or the hovered row — not a checked state |
| `CommandShortcut` | `ml-auto text-xsmall tracking-widest text-muted-foreground` | — |

`CommandDialog` puts a `Command` inside `DialogContent` with `overflow-hidden p-0` and `showCloseButton={false}`, and raises the metrics for a surface that *is* the modal: input `h-12`, items `px-2 py-3` (about 55px a row at `text-base`), glyphs `size-5`, group headings `px-2`, groups `px-2` with `pt-0` between them.

## Usage

```tsx
<Command className="border border-border rounded-xl w-full max-w-sm">
  <CommandInput placeholder="Search albums, artists…" />
  <CommandList>
    <CommandEmpty>No results.</CommandEmpty>
    <CommandGroup heading="Albums">
      {albums.map(a => (
        <CommandItem key={a.id} onSelect={() => open(a)}><Music2 />{a.title}</CommandItem>
      ))}
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem><Upload />Upload a track<CommandShortcut>⌘U</CommandShortcut></CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

The palette is the same tree inside `<CommandDialog open={open} onOpenChange={setOpen}>`. **⌘K is not bound by the component**: the call site adds a `keydown` listener — `src/ds-examples/command-dialog.tsx` is the six lines.

## Sizing

- Inline: fixed by the call site (`max-w-sm`, 384px); the list caps at 300px tall and scrolls.
- `CommandDialog`: the **window**, through `Dialog` — a bottom sheet below the **768** presentation gate, a centred `md:max-w-sm` modal from 768 up (see [`dialog.md`](dialog.md)). Inside the frame the window chip drives it.

## Behaviour

- Typing filters every item by its text (cmdk's default scoring); groups with no match hide; `CommandEmpty` shows when nothing matches.
- ↑ / ↓ move the selection, Enter fires the item's `onSelect`, the pointer selects on hover. Escape closes the dialog (the Dialog's own).
- Selecting an item does not close `CommandDialog` by itself — close it in `onSelect`.

## Motion

**Colour changes fade through `state-fade`** — `color, background-color, border-color, outline-color, opacity` on `cubic-bezier(0.2,0,0,1)`, 440ms in and 100ms out. The split needs no second mechanism: the transition that runs on the way in is the one declared on `:hover`, the one on the way out is the one on the element. The items carry it, so the highlight eases rather than snapping as you arrow down the list.

## Open questions

- Not used in the prototype: search is the Search surface (`SearchPanel`, `SearchResultsView`), with its own field and `MediaListItem` result rows. Two "type to find" surfaces with different row metrics is a decision nobody has written down.
- `CommandShortcut` uses `tracking-widest`, a letter-spacing primitive; the type system has no semantic alias for it.
- The old section label promised "press ⌘K"; nothing in `command.tsx` or the old demo bound it. The call site now does.
