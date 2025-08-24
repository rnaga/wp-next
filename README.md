# WP-Next

WP-Next is built with [Next.js](https://nextjs.org/) and [WP-Node](https://github.com/rnaga/wp-node). It provides a modern **React-based Admin Dashboard** and utilities for building applications that interact directly with a WordPress database — **no PHP required**.

👉 **View [Full Documentation](https://rnaga.github.io/wp-next/)**

<a href="https://vimeo.com/1112693769?share=copy#t=0" target="_blank" rel="noopener">
  <img width="1200" height="699" alt="dashboard-vimeo" src="https://rnaga.github.io/wp-next/images/dashboard-vimeo.png" />
</a>

## Quick Demo

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

To stop and remove the running example container, use:

```sh
docker stop wp-next-example
```

## Admin Dashboard

The main feature of WP-Next is the **Admin Dashboard**, a headless CMS that serves as an alternative to the traditional WordPress Admin Dashboard.

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

### Notes

Since WP-Next is entirely written in TypeScript and React, some WordPress features are **not supported**, including:

- WordPress Themes and appearance settings
- WordPress Block Editor (Gutenberg)
- WordPress template rendering APIs
- WordPress plugins

## Core Libraries

- [`@rnaga/wp-node`](https://github.com/rnaga/wp-node) — TypeScript-first WordPress database integration.
- [`next`](https://nextjs.org/) — Next.js framework for SSR/SSG, routing, and APIs.
- [`@mui/material`](https://mui.com/) — Material UI component library.
- [`@tiptap/react`](https://tiptap.dev/), [`mui-tiptap`](https://github.com/sjdemartini/mui-tiptap) — TipTap rich-text editor with Material UI integration.

## Installation

### Prerequisites

WP-Next requires a running WordPress database. If you don’t already have WordPress installed, see the Prerequisites section in the WP-Node installation guide for instructions on running it with Docker:

https://rnaga.github.io/wp-node/docs/getting-started/installation#prerequisites

### Initialize Project (Admin Dashboard)

WP-Next provides a CLI tool to initialize the Admin Dashboard. Run the following command and follow the prompts:

```bash
npx @rnaga/wp-next-cli -- initAdmin
```

Example setup prompts you may see:

```text
✔ Enter your database hostname: · localhost
✔ Enter your database port: · 33306
✔ Enter your database username: · wp
✔ Enter your database password: · **
✔ Enter your database name: · wordpress
✔ Is it a multi-site? · No
✔ Enter your static assets path: · public
✔ Enter your Admin URL: · http://localhost:3000
✔ Enter project path (What is your project named?): · admin
```

The CLI will automatically install and configure:

- A Next.js project (App Router enabled) for the Admin Dashboard
- Pages and layouts required by the Admin Dashboard
- Configuration files and the `_wp/hooks` scaffolding

### Run and Build the Admin Dashboard

Run in development mode:

```bash
npm run dev
```

Build and start for production:

```bash
npm run build
npm run start
```

For more on production deployment, refer to the Next.js deployment guide:

https://nextjs.org/docs/pages/getting-started/deploying

## Hooks (Filter and Action)

WP-Next uses [WP-Node](https://github.com/rnaga/wp-node) hook system which is inspired by WordPress hooks but designed for TypeScript and Node.js. The system supports both filters (which transform data) and actions (which run side effects). Because WP-Node is TypeScript-first, hooks are type-safe and can be asynchronous — they are not directly compatible with WordPress core PHP hooks.

Key points:

- Filters: transform and return data; they may be async.
- Actions: perform side effects and do not return data.
- Hooks can be registered either with TypeScript decorators (static / application lifecycle) or with the functional HookCommand utilities (runtime / dynamic).

### Frontend vs Backend hooks

When initialized, WP-Next generates a `_wp/hooks` directory where you can add your own hooks:

```txt
hooks/
├── client
│   └── index.tsx
└── server
    ├── admin-media.hook.ts
    ├── index.ts
    ├── nextauth-providers.hook.ts
    └── notifications.hook.ts
```

#### Frontend Hooks

Frontend hooks (place under `_wp/hooks/client/`) are bundled into the Admin UI and run in the browser. Use them to register UI extensions such as sidebar menus, custom admin pages, or client-side theming. Frontend hooks must contain only client-safe code (no direct access to the filesystem, process env secrets, or server-only Node APIs).

#### Backend Hooks

Backend hooks (place under `_wp/hooks/server/`) run inside the server-side application/context. Use them for server responsibilities like media upload handling, authentication providers, email sending, or other integrations that require Node APIs, credentials, or synchronous server-side state.

For more details about hooks, how they work, and usage examples, see the WP-Node hooks documentation:

https://rnaga.github.io/wp-node/docs/concepts-features/hooks

## Custom Admin Pages

You can extend the Admin Dashboard by registering **custom pages**:

Below are minimal, illustrative examples (a page component and a frontend hook) you can copy into `_wp/hooks/client/` and adapt to your project.

1. **Create a React component** (`CustomPage.tsx`) to render your page.
2. **Write a frontend hook** (`menu-custom.hook.tsx`) to add a sidebar menu and route.
3. **Register the hook** in `_wp/hooks/client/index.tsx`.

Example menu item route:  
`http://localhost:3000/admin/blog/custom`

This allows you to build fully custom interfaces inside the Admin while reusing the WP-Next shell.

Example code (illustrative — example usage)

These snippets show one way to implement `CustomPage.tsx` and `menu-custom.hook.tsx`. Adapt imports, types, and `capabilities` to your project; they are examples, not production-ready code.

CustomPage.tsx

```tsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const CustomPage = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Custom Page
      </Typography>

      <Typography paragraph>
        This is a simple custom admin page. Put your React UI here — forms,
        lists, editor components, etc.
      </Typography>

      <ul>
        <li>Example item 1</li>
        <li>Example item 2</li>
      </ul>
    </Box>
  );
};
```

menu-custom.hook.tsx

```tsx
"use client";

import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import CircleIcon from "@mui/icons-material/Circle";
import { CustomPage } from "./CustomPage";

@hook("next_admin_custom_menu")
export class MenuCustomHook {
  @clientFilter("next_admin_menu")
  hookFilter(adminMenus: any[] = [], segment?: string) {
    // Only show in blog/dashboard segments
    if (!["blog", "dashboard"].includes(segment || "")) {
      return adminMenus;
    }

    const blogMenu = [
      {
        icon: <CircleIcon />,
        displayOnSidebar: true,
        component: <CustomPage />,
        capabilities: ["read"], // control access
        label: "Custom Page",
        // final route: /admin/blog/custom
        path: `/${"blog"}/custom`,
      },
    ];

    return [...adminMenus, ...blogMenu];
  }
}
```

index.tsx (register hooks)

```ts
import { getDefaultAdminHooks } from "@rnaga/wp-next-admin/client/utils";
import { MenuCustomHook } from "./menu-custom.hook";

// include defaults first, then your custom hook
export const hooks = [...getDefaultAdminHooks(), MenuCustomHook];
```

Summary and quick how-to

- Prerequisite: WP-Next Admin initialized (project creates `_wp/hooks/` on first run).

- Key files (place under `_wp/hooks/client/`):

  - `CustomPage.tsx` — minimal React page component that renders when the route is visited.
  - `menu-custom.hook.tsx` — frontend hook that adds a sidebar menu entry and maps a path (e.g. `/admin/blog/custom`) to your component. Use the `@hook(...)` class decorator and a client filter such as `@clientFilter('next_admin_menu')` to contribute menu items.
  - `index.tsx` — export the frontend hooks array. Include defaults first, then your custom hook: `export const hooks = [...getDefaultAdminHooks(), MenuCustomHook];`

- Important notes:

  - Admin routes are segmented (e.g. `dashboard`, `blog`). Hooks often check/normalize the current segment so the final URL becomes something like `/admin/blog/custom`.
  - Use `capabilities` on menu items (for example `['read']` or `['edit_posts']`) to restrict access.
  - Frontend hooks run in the browser bundle — avoid Node-only APIs, filesystem access, or secrets in client hooks.

- Quick steps:

  1. Create `_wp/hooks/client/CustomPage.tsx` with your React UI.
  2. Add `_wp/hooks/client/menu-custom.hook.tsx` to register the menu item and route (set `component`, `path`, and `capabilities`).
  3. Add your hook to `_wp/hooks/client/index.tsx` so the Admin shell loads it.
  4. Run in dev or build for production.

- Run:

```bash
npm run dev
# or for production
npm run build
npm run start
```

Example menu route: `http://localhost:3000/admin/blog/custom`

## License

MIT
