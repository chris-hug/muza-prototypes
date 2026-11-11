/*
 * Curated album credits — the shape the production database will fill from
 * iTunes, MusicBrainz and Discogs together, hand-written here for three
 * albums so the credits dialog can show what a full record looks like.
 *
 * Why this shape:
 * - ONE entry per person. A name appears once per album, with every role it
 *   played merged onto it ("Tenor saxophone, Composer") — the sources list a
 *   person once per role, and a sheet that repeats names reads as a dump.
 * - A role may name the TRACKS it applies to. In jazz the lineup and the
 *   instrument change from track to track (Dolphy plays bass clarinet, flute
 *   and alto on one record), and the liner-note convention "(1, 2)" says that
 *   in a handful of characters instead of a credits block per track.
 * - `group` is the person's PRIMARY section. MusicBrainz and Discogs name
 *   roles differently; a fixed set of four sections is what keeps the list
 *   from becoming Tidal's twelve role headings.
 * - Names are stored as they are read, "Mark Ernestus", never "Ernestus,
 *   Mark": splitting a sort-name at the comma is how Qobuz ends up showing a
 *   first name as a role.
 *
 * No album-catalog import, so album-catalog can read this without a cycle.
 * The `notes` copy is written for the prototype, not quoted from the
 * original liner notes.
 */

export type CreditGroup = "personnel" | "composition" | "production" | "artwork"

export interface CreditRole {
  role: string
  /** 1-based track numbers the role applies to; omitted = the whole album. */
  tracks?: number[]
}

export interface CreditPerson {
  name: string
  group: CreditGroup
  roles: CreditRole[]
  /** `false` when the catalogue has no artist page for the name — common for
   *  sleeve designers, photographers and liner-note writers. The row then
   *  shows the name as plain text and no heart. Omitted = has a page. */
  profile?: false
}

export interface AlbumCreditsData {
  catalogNumber?: string
  studio?: string
  people: CreditPerson[]
  notes?: { by?: string; text: string }
}

export const ALBUM_CREDITS: Record<string, AlbumCreditsData> = {
  // A Love Supreme — one quartet, one session, four parts.
  a07: {
    catalogNumber: "A-77",
    studio: "Van Gelder Studio, Englewood Cliffs, NJ",
    people: [
      { name: "John Coltrane", group: "personnel", roles: [
        { role: "Tenor saxophone" }, { role: "Vocals", tracks: [1] },
        { role: "Composer" }, { role: "Liner notes" },
      ] },
      { name: "McCoy Tyner",    group: "personnel",  roles: [{ role: "Piano" }] },
      { name: "Jimmy Garrison", group: "personnel",  roles: [{ role: "Double bass" }] },
      { name: "Elvin Jones",    group: "personnel",  roles: [{ role: "Drums" }, { role: "Gong", tracks: [1] }] },
      { name: "Bob Thiele",     group: "production", roles: [{ role: "Producer" }] },
      { name: "Rudy Van Gelder", group: "production", roles: [{ role: "Recording engineer" }] },
    ],
    notes: {
      by: "Muza",
      text: "Recorded in a single evening by Coltrane's working quartet, the suite moves from the four-note motif of Acknowledgement to the recited prayer of Psalm, where Coltrane plays the syllables of his own poem on the tenor.",
    },
  },

  // Blue Train — a sextet, and the one standard on it credits other writers.
  a03: {
    catalogNumber: "BLP 1577",
    studio: "Van Gelder Studio, Hackensack, NJ",
    people: [
      { name: "John Coltrane",   group: "personnel", roles: [{ role: "Tenor saxophone" }, { role: "Composer", tracks: [1, 2, 3, 5] }] },
      { name: "Lee Morgan",      group: "personnel", roles: [{ role: "Trumpet" }] },
      { name: "Curtis Fuller",   group: "personnel", roles: [{ role: "Trombone" }] },
      { name: "Kenny Drew",      group: "personnel", roles: [{ role: "Piano" }] },
      { name: "Paul Chambers",   group: "personnel", roles: [{ role: "Double bass" }] },
      { name: "Philly Joe Jones", group: "personnel", roles: [{ role: "Drums" }] },
      { name: "Jerome Kern",     group: "composition", roles: [{ role: "Composer", tracks: [4] }] },
      { name: "Johnny Mercer",   group: "composition", roles: [{ role: "Lyricist", tracks: [4] }] },
      { name: "Alfred Lion",     group: "production", roles: [{ role: "Producer" }] },
      { name: "Rudy Van Gelder", group: "production", roles: [{ role: "Recording engineer" }] },
      { name: "Reid Miles",      group: "artwork",    roles: [{ role: "Cover design" }] },
      { name: "Francis Wolff",   group: "artwork",    roles: [{ role: "Photography" }] },
      { name: "Robert Levin",    group: "artwork",    roles: [{ role: "Liner notes" }] },
    ],
    notes: {
      by: "Muza",
      text: "Coltrane's only session as a leader for Blue Note, with a three-horn front line. Four of the five tunes are his; I'm Old Fashioned is the ballad that shows the other side of the date.",
    },
  },

  // Out to Lunch — the instrument changes with the track.
  a06: {
    catalogNumber: "BLP 4163",
    studio: "Van Gelder Studio, Englewood Cliffs, NJ",
    people: [
      { name: "Eric Dolphy", group: "personnel", roles: [
        { role: "Bass clarinet", tracks: [1, 2] }, { role: "Flute", tracks: [3] },
        { role: "Alto saxophone", tracks: [4, 5] }, { role: "Composer" },
      ] },
      { name: "Freddie Hubbard",   group: "personnel", roles: [{ role: "Trumpet" }] },
      { name: "Bobby Hutcherson",  group: "personnel", roles: [{ role: "Vibraphone" }] },
      { name: "Richard Davis",     group: "personnel", roles: [{ role: "Double bass" }] },
      { name: "Tony Williams",     group: "personnel", roles: [{ role: "Drums" }] },
      { name: "Alfred Lion",       group: "production", roles: [{ role: "Producer" }] },
      { name: "Rudy Van Gelder",   group: "production", roles: [{ role: "Recording engineer" }] },
      // No artist page for these two — the prototype's example of that state.
      { name: "Reid Miles",        group: "artwork",    roles: [{ role: "Cover design" }], profile: false },
      { name: "A. B. Spellman",    group: "artwork",    roles: [{ role: "Liner notes" }],  profile: false },
    ],
    notes: {
      by: "Muza",
      text: "Dolphy's only album as a leader for Blue Note. He changes instrument with the piece — bass clarinet, flute, alto — and Hutcherson's vibraphone takes the place a piano would usually hold.",
    },
  },
}
