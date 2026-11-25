---
version: alpha
name: Censored Data Benchmark
description: Research tables and transparent evaluation status for censored retail data
colors:
  primary: "#174e43"
  text: "#243830"
  background: "#f5f5ef"
  muted: "#6c7971"
  border: "#dce3d8"
  accent: "#ac633e"
typography:
  sans:
    fontFamily: "DM Sans, Arial, sans-serif"
  display:
    fontFamily: "Libre Caslon Display, Georgia, serif"
  mono:
    fontFamily: "monospace"
rounded:
  DEFAULT: "12px"
  sm: "7px"
  lg: "16px"
spacing:
  page-max: "1256px"
  page-padding: "32px"
components:
  button:
    textColor: "{colors.text}"
  table:
    textColor: "{colors.text}"
  select:
    textColor: "{colors.text}"
    rounded: "5px"
  status:
    textColor: "{colors.muted}"
    typography: "{typography.sans}"
---

# Existing application design context

## Intermittent forecasting priority — 21 November 2026

The default local screen now compares recorded-sales forecasting participants with RMSSE and CRPS-9. Preserve the existing retail accounting visual language, palette, typography, labelled native selects, semantic tables and global focus/scrollbar rules. Reuse style.css tokens; intermittent.css adds layout only. The signature remains the evidence table, with training-only intermittency and zero-proportion filters. No new hero illustration or visual redesign is required. The legacy Original view stays behind the footer link.

This records the established application, inspected on 7 October 2026. It preserves the existing visual identity; the CPU confirmation status addition changes no runtime token. The product contract is [UX-CONTRACT.md](UX-CONTRACT.md).

## Overview

The audience is researchers comparing recovery and forecasting methods. The main job is to compare like-for-like, independently checked results and understand their coverage. The measured-study view also tells the local operator which experiments are computing, waiting, partially saved or complete.

The visual reference is a retail accounting sheet with clear columns, restrained green headings and a visible censored-observation key. Scientific distinctions carry the emphasis: separate periods, demand/recovery columns, input declarations and measurement limits. Avoid promotional winner claims or treating a progress percentage as an accuracy result.

The public-facing content is English for an international research audience. No Japan-specific market or business workflow is evidenced by this task. Source dates retain their dataset convention; local status-check timestamps use the browser's locale. This public website presents an in-progress study.

## Runtime ownership and colors

[src/style.css](src/style.css) is the canonical runtime token source. This file mirrors its accepted values. `--green`, `--muted`, `--border` and `--orange` implement primary, muted, border and accent. The root foreground/background implement text and background. Components consume those shared variables; do not add parallel token values for a status paragraph.

The existing `--orange` declaration currently has no component consumer. Preserve it as source context; the design linter reports that unused token as a warning. No new runtime use is introduced to silence the warning.

## Typography

Body text uses DM Sans with Arial/sans fallbacks. Display headings use Libre Caslon Display with Georgia/serif fallbacks. Technical IDs use monospace. The `.local-queue` owner in [local-study.css](src/local-study.css) provides 12px text, 1.7 line height, muted color and safe wrapping. Its bold method/stage label establishes hierarchy without introducing another card style.

## Layout

The shared page has a 1256px maximum width and 32px desktop side padding. The existing hero has a 16px radius; research boards use 12px and small groups 7px. Narrow screens follow the maintained media queries. Tables own their horizontal overflow; the document remains naturally scrollable. A status addition must not widen the page or change filter/table geometry.

## Elevation and shapes

Hierarchy uses shared borders and tonal surfaces. Existing rounded containers remain; no new shadow, overlay or animation belongs to a live experiment-status paragraph.

## Components and states

`LocalStudy` owns live status rendering and the existing 15-second read-only poll. Reuse `.local-queue`, semantic status text and an ordinary receipt link. A live controller is verified through native process inventory. Interrupted and temporarily unavailable observations must not be described as running. A completed native recipe still requires its independent score/reproduction checks before ranking.

Native buttons own actions; anchors own navigation/downloads. Shared focus treatment is a 3px outline with a 4px offset in `style.css`. Native labelled selects own filters. Table headers use semantic buttons for supported sorting. Loading, errors, stale status and no-results text follow the existing application owners; avoid creating another notification system.

## Verification

Check changed status data against the actual native process and frozen population. Typecheck/build the application, exercise its receipt link and refresh, and inspect the changed text at normal and narrow widths. Preserve URL filters, separate period tables and the original protocol route. Static design checks are separate from scientific acceptance.

## Minimal local study — 9 October 2026

One common input statement precedes the semantic demand/recovery/score/support table. No feature or information-regime selector, retired comparison viewer or extra-rate row. Running details and remaining work use the existing native details/summary disclosure, collapsed by default. Complete results and their declared supported inputs remain in method details; no relabelling of legacy forecasts. The read-only status reports current native ownership; activity never admits a score. A validated CUDA launch may replace the displayed CPU attempt only after the exact CPU owner is absent and every scientific recipe field matches. Retain both attempts on disk; never merge forecasts or admit scores through the status reader.

## Model disclosure — 10 October 2026

The shared ModelProvenance component renders recorded pretraining and weight-license fields beside each method in the main, local and Original tables. Recipe and disclosure text remain one block in the existing method cell. No token, filter or score is added. Original views show the complete accepted Original list; the research-only feature filter applies to Recent results.
