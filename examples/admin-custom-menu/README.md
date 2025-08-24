# Add a Custom Menu and Page to WP‑Next Admin

This guide shows how to register a **custom sidebar menu item** and render a **custom React page** inside the WP‑Next Admin Dashboard. It includes:

- A simple React component (`CustomPage.tsx`) to display content.
- A frontend hook (`menu-custom.hook.tsx`) that injects a new menu entry and routes to the component.
- How to register the hook so it’s picked up by the Admin.

---

## Prerequisites

- WP‑Next Admin app initialized (the project creates a `_wp/hooks` folder on first run).

---

## File Overview

- `CustomPage.tsx`  
  A minimal React component that renders the page content shown when users click the new menu item.

- `menu-custom.hook.tsx`  
  A frontend hook that:
  - Adds a **sidebar menu item**.
  - Maps a **route** (e.g. `/admin/blog/custom`) to your component.
  - Optionally **restricts access** by capability (e.g. `["read"]`).

> **Note:** The filename is `menu-custom.hook.tsx` (not `hoook`).

---

## Project Structure (relevant parts)

Place your files like this:

```text
_wp/
  hooks/
    client/
      index.tsx          # register frontend hooks here
      menu-custom.hook.tsx
      CustomPage.tsx
    server/
      # (backend hooks live here)
```

---

## 1) Create the Page Component

`_wp/hooks/client/CustomPage.tsx`

```ts
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const CustomPage = () => {
  return (
    <Typography component="span">
      <p>This is a paragraph with some example text.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
        <li>List item 3</li>
      </ul>
    </Typography>
  );
};
```

**What this does:** It renders content inside the Admin shell when users navigate to your custom route.

---

## 2) Add a Frontend Hook to Register the Menu & Route

`_wp/hooks/client/menu-custom.hook.tsx`

```ts
"use client";

import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import CircleIcon from "@mui/icons-material/Circle";

import type * as wpAdminTypes from "@rnaga/wp-next-admin/types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { CustomPage } from "./CustomPage";

/**
 * MenuCustomHook
 *
 * Adds a custom page to the admin sidebar and routes to <CustomPage />.
 */
@hook("next_admin_custom_menu")
export class MenuCustomHook {
  @clientFilter("next_admin_menu")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_menu"]>
  ) {
    let [, segment] = args;
    const [adminMenus] = args;

    // Show this menu only on "blog" or "dashboard" segments (e.g. /admin/blog).
    if (!["blog", "dashboard"].includes(segment)) {
      return adminMenus;
    }

    // Normalize to "blog" so the URL becomes /admin/blog/custom
    segment = "blog";

    const blogMenu: wpAdminTypes.client.AdminMenu[] = [
      {
        icon: <CircleIcon />,
        displayOnSidebar: true,
        component: <CustomPage />,
        capabilities: ["read"], // access control
        label: "Custom Page",
        // e.g. http://localhost:3000/admin/blog/custom
        path: `/${segment}/custom`,
      },
    ];

    return [...adminMenus, ...blogMenu];
  }
}
```

### Key Details

- **Decorator pairing**

  - `@hook("next_admin_custom_menu")`: Registers this class as a named admin hook.
  - `@clientFilter("next_admin_menu")`: Contributes items to the client-side admin menu array.

- **Segment logic**

  - The Admin URL space is segmented (e.g. `dashboard`, `blog`, etc.).
  - The example **limits** the menu to `blog` and `dashboard` contexts and **normalizes** the route to `blog`, so the final path is `/admin/blog/custom`.

- **Access control**
  - `capabilities: ["read"]` ensures only users with the `read` capability can see/access the page.
  - Use additional capabilities (e.g. `["edit_posts"]`) to further restrict.

---

## 3) Register the Hook

Add your hook to the frontend hooks registry:

`_wp/hooks/client/index.tsx`

```ts
import { getDefaultAdminHooks } from "@rnaga/wp-next-admin/client/utils";
// Import your custom hook
import { MenuCustomHook } from "./menu-custom.hook";

// Register: include defaults first, then your custom hook
export const hooks = [...getDefaultAdminHooks(), MenuCustomHook];
```

This ensures your menu item and route are available to the Admin shell.

---

## 4) Run or Build

- **Dev:**

  ```
  ash
  npm run dev
  ```

- **Build & Start (production):**

  ```bash
  npm run build
  npm run start
  ```

Navigate to your Admin app (e.g. `http://localhost:3000/admin`) and open the **Blog** section (`/admin/dashboard`). You should see **“Custom Page”** in the sidebar; clicking it renders your component.
