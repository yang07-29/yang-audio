# Interface notes

The learning portal uses original, dependency-free HTML/CSS/JavaScript. Navigation patterns were informed by the official [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar) and [daisyUI Drawer](https://daisyui.com/components/drawer/) documentation. No external runtime or copied component package is required.

The home page prioritizes daily tasks, groups courses by stage, and opens course/video resources in a same-origin in-page reader. Original course URLs remain available, including independent-page fallback links. All old homepage explanations are retained under Resources → Learning guidance.

Learning records are local to the current browser and website origin. Opening material never automatically marks it completed. Export/import is required when moving from the previous host or another device.

## 2026-10-27 — Audio handbook redesign

The current design references the task-first, content-preserving and responsive-audit principles in [Hallmark](https://github.com/Nutlope/hallmark). Hallmark was read as a design reference, not globally installed, and no formal Hallmark audit score is claimed.

The shared `assets/handbook.css` uses warm paper, dark ink and restrained green. The home page's largest heading is the actual daily topic. Text and video are paired on the daily panel, every chapter row and the reader switcher. Five checkable task rows replace nested cards. The primary GTCRN project is distinguished from the two comparison projects. Existing progress keys and routes are retained.

23 core texts include a static beginner section: everyday situation, three worked steps, plain-language terminology, a bridge to the original code, limitations and a self-check. The original equations, code blocks and result images are retained. Examples are explicitly educational and do not manufacture project performance.

All 23 video lessons are rendered with the handbook palette, focused code blocks with original line numbers, larger subtitles, intact numeric tokens at line breaks and step highlighting. Narration is still local Chinese synthesis, not a human lecturer or NotebookLM output. MP4 and WebM remain available.

Verification uses regression tests, numerical checks, link checks, real rendered frame inspection, codec/full-decode/timestamp checks and HTTP deployment checks. Browser automation was unavailable; these checks must not be presented as an eight-width browser audit or proof of playback on every phone.
