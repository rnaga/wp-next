# WP-Next

WP-Next is built with [Next.js](https://nextjs.org/) and [WP-Node](https://github.com/rnaga/wp-node). It provides two complementary products for building WordPress-powered applications where every layer is written from scratch in TypeScript and React — **no PHP involved**.

---

## 📖 [Full Documentation → rnaga.github.io/wp-next](https://rnaga.github.io/wp-next/)

> For guides, concepts, and examples, the documentation site is the best starting point.

## WP-Next Editor

WP-Next Editor is a visual, drag-and-drop page editor for building public-facing pages directly connected to your WordPress database. Pages are stored as structured [Lexical](https://lexical.dev/docs/intro) JSON in the WordPress database — making them version-controllable, programmatically manipulable, and AI-ready.

<a href="https://vimeo.com/1185738064?share=copy#t=0" target="_blank" rel="noopener">
  <img width="1200" height="699" alt="WP-Next Editor canvas demo" src="https://rnaga.github.io/wp-next/assets/editor/canvas/drag-drop-0.gif" />
</a>

### Key Features

- **Drag-and-drop canvas** — build pages visually with a live preview. Select, resize, nest, and animate elements directly on the canvas.
- **Responsive design** — set per-device breakpoints (desktop, tablet, mobile) and CSS states (hover, focus, etc.). Each device gets its own `@media` query at render time.
- **Dynamic data binding** — pull posts, users, taxonomies, and options directly from the WordPress database into any element. No custom API endpoints required.
- **Widget system** — embed sub-templates (widgets) inside other templates for reusable headers, footers, and components. Widget variants let the same widget render different content per embedding.
- **CSS variables** — define design tokens at the template level and reference them across all elements for consistent theming.
- **Animations** — attach CSS keyframe animations (98 Animate.css presets) to any element, triggered by hover, click, scroll, and more.
- **JSON editor** — edit the raw Lexical JSON directly in a built-in code editor for precise control over template structure.
- **Save history** — create and manage template save points with preview and restore support.

### Quick Demo

Run a ready-made WP-Next Editor example using Docker:

```bash
docker run --rm --init -it --name wp-next-editor-example -p 3000:3000 \
  -v wp-next-editor_public:/app/editor/public \
  -v wp-next-editor_db:/var/lib/mysql \
  rnagat/wp-next-editor-example:latest
```

Log in with:

```text
Username: wp
Password: wp
```

- Editor: [http://localhost:3000/admin/1/editor](http://localhost:3000/admin/1/editor)
- Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

To stop the container:

```bash
docker stop wp-next-editor-example
```

### Initialize the Editor

```bash
npx @rnaga/wp-next-cli -- initEditor
```

See the [Editor Installation guide](https://rnaga.github.io/wp-next/docs/editor/installation) for the full setup walkthrough.

> `wp-next-editor` includes `wp-next-admin` out of the box. See [WP-Next Admin](#wp-next-admin) below for what it provides.

### AI-Powered Template Authoring — Built-in Agent Skills

WP-Next Editor ships with a built-in **[Agent Skill](https://agentskills.io/home)** (`/wp-next-editor-template`) that lets you build and modify templates using natural-language prompts. All templates are stored as Lexical JSON, so AI agents can read, write, and transform them directly.

[Agent Skills](https://agentskills.io/home) is an open standard supported by Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Gemini CLI, VS Code, and more. Install the skill once and use it with whichever coding agent you prefer.

The skill supports four modes:

| Mode      | What it does                                                |
| --------- | ----------------------------------------------------------- |
| `create`  | Scaffold a new template from a natural-language description |
| `update`  | Modify an existing template based on a prompt               |
| `convert` | Convert HTML/CSS into a Lexical JSON template               |
| `help`    | Describe available nodes, styles, and patterns              |

Install the skill with:

```bash
npx @rnaga/wp-next-cli -- editor agentSkills add
```

Example prompt:

```
/wp-next-editor-template create src/templates/home.json "A hero section with a full-width background image, centered headline, subtitle, and a CTA button"
```

See [Using AI](https://rnaga.github.io/wp-next/docs/editor/concepts-features/using-ai) for installation details and more examples.

---

## WP-Next Admin

WP-Next Admin is a **React-based Admin Dashboard** — a headless CMS that serves as a modern alternative to the traditional WordPress Admin Dashboard.

<a href="https://vimeo.com/1112693769?share=copy#t=0" target="_blank" rel="noopener">
  <img width="1200" height="699" alt="WP-Next Admin dashboard demo" src="https://rnaga.github.io/wp-next/images/dashboard-vimeo.png" />
</a>

### Key Features

Out of the box, it includes:

- Posts & Pages
- Media
- Terms (Categories, Tags)
- Comments
- Profile & Settings
- Users and Roles
- Revisions

In **multisite mode**, it also supports:

- Sites
- Blogs (per-site content such as posts, media, comments)

### Quick Demo

Run a ready-made WP-Next example using Docker:

```bash
docker run --rm --init -it --name wp-next-example -p 3000:3000 \
  -v wp-next-example_public:/app/admin/public \
  -v wp-next-example_db:/var/lib/mysql \
  -v wp-next-example_html:/app/html \
  rnagat/wp-next-example:latest
```

Visit [http://localhost:3000/admin](http://localhost:3000/admin) and log in with:

```text
Username: wp
Password: wp
```

To stop the container:

```bash
docker stop wp-next-example
```

### Initialize the Admin Dashboard

```bash
npx @rnaga/wp-next-cli -- initAdmin
```

See the [Admin Getting Started guide](https://rnaga.github.io/wp-next/docs/admin/getting-started) for the full setup walkthrough.

### Extensibility

WP-Next Admin supports **custom pages** and a **hook system** (filters and actions) inspired by WordPress hooks but built for TypeScript and Node.js. Frontend hooks extend the Admin UI in the browser; backend hooks handle server-side concerns such as authentication, media uploads, and integrations.

See [Hooks](https://rnaga.github.io/wp-next/docs/admin/concepts-features/hooks) and [Custom Admin Pages](https://rnaga.github.io/wp-next/docs/admin/concepts-features/custom-pages) in the documentation.

---

## Prerequisites

Both products require a running WordPress database. If you don't already have WordPress installed, see the [WP-Node installation guide](https://rnaga.github.io/wp-node/docs/getting-started/installation#prerequisites) for instructions on running it with Docker.

---

## License

MIT
