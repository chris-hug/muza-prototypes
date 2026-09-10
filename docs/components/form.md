---
title: Form
source: src/components/ui/form.tsx
related: [input, select, button, dialog]
usage:
  - Upload music — hand-rolled, not via Form | /?page=Music
  - Shop › Settings — hand-rolled | /?page=Shop&shop-tab=settings
  - Cart › checkout details — hand-rolled | /?page=Shop
---

`Form` is the react-hook-form binding for a validated form: `FormField` wraps a Controller, and `FormItem` stacks its `FormLabel`, `FormControl`, `FormDescription` and `FormMessage` with generated ids, so the control is labelled, described and marked invalid without the call site writing an `id`. **The product is full of forms and none of them use these parts.** Upload music alone stacks 17 labelled fields; Shop settings, the vinyl listing, the cart, the edit-release dialog and the order detail do the same. Every one of them hand-rolls the stack — a `div.flex.flex-col.gap-1.5` around a `Label` and a control, local `useState` for the value, and `Input`'s `hint` / `hintTone` for the error. So this section documents the **intended** path beside a shipped one that looks identical and shares none of its wiring.

## Anatomy

| Part | What it does | Wears |
|---|---|---|
| `Form` | `FormProvider` — spread the `useForm()` return into it | — |
| `FormField` | `Controller` plus a context carrying the field `name` | — |
| `FormItem` | `useId()` into context; the stack | `flex flex-col gap-1.5` |
| `FormLabel` | `Label` with `htmlFor="<id>-form-item"` | `data-[error=true]:text-destructive` |
| `FormControl` | clones its one child with `id`, `aria-describedby` (the description, plus the message when in error) and `aria-invalid` | the child's own — `Input` turns `aria-invalid` into `border-destructive` plus `invalid-ring`, a 2px outline at 20% of `--destructive` (40% in dark), the same geometry `focus-ring` draws (`input.tsx:83`) |
| `FormDescription` | `<p id="…-description">` | `text-xsmall text-muted-foreground` |
| `FormMessage` | `<p id="…-message">` — the error's message, else its children; renders nothing when both are empty | `text-2xsmall font-normal leading-snug text-destructive` |

`FormMessage` matches `Input`'s own hint (`HINT_CLS = "text-2xsmall leading-snug"`, `input.tsx:58`), so an error reads the same whether the field is wired through react-hook-form or uses `Input`'s `hint` / `hintTone="error"` on its own.

`FormControl` spreads the child's props *after* the generated ones, so a child that passes its own `id` keeps it.

## Usage

```tsx
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
    <FormField control={form.control} name="title" render={({ field }) => (
      <FormItem>
        <FormLabel>Track title</FormLabel>
        <FormControl><Input placeholder="e.g. Blue Afternoon" {...field} /></FormControl>
        <FormDescription>Your track's public display name.</FormDescription>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

A `Select` goes in the same way with `value={field.value} onValueChange={field.onChange}`. `useFormField()` throws outside a `FormField`, so a stray `FormLabel` fails loudly rather than rendering unlabelled.

## Sizing

The Form parts have no width of their own — `FormItem` is a `flex flex-col gap-1.5` and nothing else. The **call site** sets the measure; the frame uses `w-full max-w-sm`, which is the shape to copy: fill the column, stop at a readable width.

Measured in the frame:

| Window | Column | Form | `SelectTrigger` |
|---|---|---|---|
| 320 | 296 | 296 — fills | 296 — full width |
| 1069 | 781 | 384 — capped by `max-w-sm` | 155 — `w-fit` |

The Select is worth watching there. Inside a form it is a **field**, so below the presentation gate it goes full width like its neighbours and opens as a bottom sheet; above it, it shrinks to its content. The form does not arrange that — [`Select`](select.md) does it itself, and a form row stays one family at both ends because of it.

A two-column layout is in-page reflow and may use `sm:` ([`responsive.md`](responsive.md)); a form inside a dialog follows the dialog — a sheet below 768, `mobile="form"` when its action must survive the keyboard ([`dialog.md`](dialog.md)).

## Behaviour

- Validation runs through the resolver on submit (react-hook-form's default `mode: "onSubmit"`), then on every change of a field that has errored; errors land in `FormMessage`, the label turns destructive, the control gets `aria-invalid`.
- `form.reset()` returns to `defaultValues` and clears the errors.
- Focus moves to the first invalid field on submit (`shouldFocusError`, react-hook-form's default).

## Open questions

- **Two form paths, one look — and only one of them is documented here.** No file in `src` or `app` imports `@/components/ui/form`, and `react-hook-form` appears nowhere outside this section's demo. What the product has instead, by `<Label>` count: `upload-music-dialog.tsx` (17), `edit-release-dialog.tsx` (8), `cart-drawer.tsx` (8), `vinyl-create-listing.tsx` (7), `shop-settings-view.tsx` (6), `manage-view.tsx` (5), `transfer-view.tsx` (4), `order-detail-view.tsx` (4), plus smaller ones. Each repeats the `FormItem` stack by hand and validates through `Input`'s `hint` / `hintTone`.

  That holds together only while `HINT_CLS` (`input.tsx:58`) and `FormMessage` stay in step, and nothing makes them. Verified 9 Sept 26: both `text-2xsmall … leading-snug`, still matching. The decision to make is whether these views adopt `Form` or `Form` is retired — carrying both is what lets them drift.

- Only `settings-view.tsx` and `login-dialog.tsx` render an actual `<form>` element; the rest are fields inside a dialog with buttons, so there is no submit handler to hang validation on.
- The "Used in:" links are marked *hand-rolled, not via Form* on purpose: they are where the pattern lives, not where the component does. Drop the qualifier the day a view adopts `Form`.
- `Input`'s hint (`input.tsx:119–134`) is base-ui `Field.Error` / `Field.Description`, which set their own `aria-describedby`; a `FormControl` around an `Input` that *also* passes `hint` describes the field twice.
