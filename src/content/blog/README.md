Posts for napwake.dev/blog/, one Markdown file each, named for the post's address (`hello.md` is
`/blog/hello/`). Front matter: `title`, `date` (YYYY-MM-DD), `description` (one sentence), `author`, and
`draft: true` while a post isn't published yet. A draft is built only by `npm run dev`, with a "Draft"
marker. `npm run build` leaves it out altogether, and builds no /blog/ until a post is published. This
README isn't a post. Unapproved drafts stay out of this repo.
