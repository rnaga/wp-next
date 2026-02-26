"use client";

import { MenuBlogHook } from "./menu-blog.hook";
import { MenuSiteHook } from "./menu-site.hook";
import { PreloadModalHook } from "./preload-modal.hook";
import { ThemesHook } from "./themes.hook";

export const hooks = [MenuBlogHook, MenuSiteHook, PreloadModalHook, ThemesHook];
