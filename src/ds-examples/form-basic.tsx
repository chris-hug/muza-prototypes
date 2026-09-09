"use client"

/*
 * Form — react-hook-form + zod through the `Form` parts: each field is a
 * `FormField` (a Controller) whose `FormItem` stacks label, control, hint
 * and error, wired together by generated ids. Submit empty to see the
 * schema's messages land in `FormMessage`, the label turn `text-destructive`
 * and the field get `aria-invalid`.
 */

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const GENRES = ["Electronic", "Hip-Hop", "Jazz", "Indie"]

const trackSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  genre: z.string().min(1, "Please select a genre"),
  bio:   z.string().max(280, "Max 280 characters").optional(),
})

export default function FormBasicExample() {
  const form = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: { title: "", genre: "", bio: "" },
  })

  function onSubmit(values: z.infer<typeof trackSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full max-w-sm">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Track title</FormLabel>
              <FormControl><Input placeholder="e.g. Blue Afternoon" {...field} /></FormControl>
              <FormDescription>Your track's public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Genre</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => (
                      <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Tell listeners about this track…" rows={3} {...field} /></FormControl>
              <FormDescription>Max 280 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">Submit</Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>Reset</Button>
        </div>
      </form>
    </Form>
  )
}
