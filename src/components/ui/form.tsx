import * as React from "react"
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
  type UseFormReturn,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// ─── Form = FormProvider ──────────────────────────────────────────────────────
const Form = FormProvider

// ─── Context ──────────────────────────────────────────────────────────────────
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// ─── FormField ────────────────────────────────────────────────────────────────
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// ─── useFormField ─────────────────────────────────────────────────────────────
/*
 * Two jobs, deliberately separable:
 *
 *   1. IDs — generate one and hand out `formItemId` / `formDescriptionId` /
 *      `formMessageId`, so `FormLabel` gets an `htmlFor`, the control gets a
 *      matching `id`, and the hint is wired into `aria-describedby`.
 *   2. FIELD STATE — the react-hook-form error for this field.
 *
 * Job 1 needs no react-hook-form, and coupling the two is what split this
 * codebase in half. `useFormField` used to throw outside a `FormField`, so a
 * plain labelled field could not use these parts at all — and every such
 * field in the product went on to hand-roll the stack instead. The result:
 * 45 of 74 `<Label>`s in `src/components/app` carry no `htmlFor`, so a click
 * focuses nothing and a screen reader announces the control unlabelled.
 * `Input`'s `Field.Root` does not cover it — that wires the HINT, and only
 * when a `hint` is passed.
 *
 * So the hook now degrades instead of throwing. Inside a `FormField` it
 * behaves exactly as before. Outside one it still gives the ids, and reports
 * no error — which is correct, because without react-hook-form there is no
 * validation to report. A field can therefore be wired for accessibility
 * today and gain validation later by wrapping it, with no restructuring.
 */
function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  // `useFormContext()` returns null outside a `FormProvider`; without a
  // `FormField` there is no field to ask about either.
  const form = useFormContext()
  const bound = !!fieldContext.name && !!form

  if (!itemContext.id) {
    throw new Error("useFormField must be used within <FormItem>")
  }

  const fieldState = bound
    ? form.getFieldState(fieldContext.name, form.formState)
    : ({} as ReturnType<UseFormReturn["getFieldState"]>)
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// ─── FormItem ─────────────────────────────────────────────────────────────────
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("flex flex-col gap-1.5", className)} {...props} />
    </FormItemContext.Provider>
  )
}

// ─── FormLabel ────────────────────────────────────────────────────────────────
function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

// ─── FormControl ──────────────────────────────────────────────────────────────
// Clones the child element with the correct id/aria attributes for accessibility.
function FormControl({ children }: { children: React.ReactElement }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  if (!React.isValidElement(children)) return <>{children}</>

  return React.cloneElement(
    children as React.ReactElement<Record<string, unknown>>,
    {
      id: formItemId,
      "aria-describedby": !error
        ? formDescriptionId
        : `${formDescriptionId} ${formMessageId}`,
      "aria-invalid": !!error,
      ...(children as React.ReactElement<Record<string, unknown>>).props,
    }
  )
}

// ─── FormDescription ──────────────────────────────────────────────────────────
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()
  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-xsmall text-muted-foreground", className)}
      {...props}
    />
  )
}

// ─── FormMessage ──────────────────────────────────────────────────────────────
function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message ?? error) : children

  if (!body) return null

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      // Match the Input component's inline `data-slot="input-hint"`
      // styling so error / hint text reads identically whether the
      // field is wired through react-hook-form or used standalone.
      className={cn("text-2xsmall font-normal leading-snug text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
}
