# PoshanCare Design System Specification

This document summarizes the centralized design system tokens, typography scales, layout conventions, and reusable UI components implemented in Phase 2A, derived directly from the Google Stitch HTML designs in `frontend/UI_UX/`.

## 1. Color Palette Tokens

### Primary Brand (Forest Emerald)
- `primary`: `#003629` / `#004532`
- `primary-hover`: `#004d3b`
- `primary-container`: `#1b4d3e` / `#065f46`
- `primary-fixed`: `#baeed9` / `#a6f2d1`
- `primary-fixed-dim`: `#9ed1bd` / `#8bd6b6`
- `on-primary`: `#ffffff`
- `on-primary-container`: `#8abda9`
- `on-primary-fixed`: `#002117`

### Secondary Accent (Warm Amber / Terracotta)
- `secondary`: `#7e5700` / `#904d00`
- `secondary-container`: `#fdbe50` / `#fe932c`
- `secondary-fixed`: `#ffdead` / `#ffdcc3`
- `on-secondary`: `#ffffff`
- `on-secondary-container`: `#714d00`

### Tertiary Accent (Clinical Mint / Teal)
- `tertiary`: `#003625` / `#004530`
- `tertiary-container`: `#004f38` / `#005f44`
- `tertiary-fixed`: `#abf1d0` / `#97f5cc`
- `on-tertiary`: `#ffffff`

### Surfaces & Backgrounds
- `background`: `#f9f9ff`
- `surface`: `#f9f9ff`
- `surface-dim`: `#cfdaf2`
- `surface-container-lowest`: `#ffffff` (Card white)
- `surface-container-low`: `#f0f3ff` (Soft tint background)
- `surface-container`: `#e7eeff`
- `surface-container-high`: `#dee8ff`
- `surface-container-highest`: `#d8e3fb`

### Typography & Text
- `on-surface`: `#111c2d` (Main text)
- `on-surface-variant`: `#404945` (Secondary text)
- `outline`: `#707974` (Muted labels)
- `outline-variant`: `#c0c9c3` (Borders)

### Feedback & Status
- `error`: `#ba1a1a`
- `error-container`: `#ffdad6`
- `on-error-container`: `#93000a`
- `success`: `#004530`

---

## 2. Typography System

- **Headlines & Titles**: `Plus Jakarta Sans`, sans-serif (`font-semibold` / `font-bold`)
- **Body, Labels & Numeric Metrics**: `Inter`, sans-serif

### Type Scale Classes
- `font-display-lg`: `48px` / line-height `56px`
- `font-headline-lg`: `32px` / line-height `40px`
- `font-headline-md`: `24px` / line-height `32px`
- `font-headline-sm`: `20px` / line-height `28px`
- `font-title-lg`: `18px` / line-height `26px`
- `font-title-md`: `16px` / line-height `24px`
- `font-body-lg`: `16px` / line-height `26px`
- `font-body-md`: `14px` / line-height `22px`
- `font-body-sm`: `12px` / line-height `18px`
- `font-label-lg`: `14px` / line-height `20px`
- `font-label-md`: `12px` / line-height `16px`
- `font-label-sm`: `11px` / line-height `14px`
- `font-numeric-metric`: `28px` / line-height `32px`

---

## 3. Reusable UI Component Library (`frontend/src/components/ui/`)

| Component | Key Props / Variants | Purpose |
|---|---|---|
| `Button` | `primary`, `secondary`, `tertiary`, `outline`, `ghost`, `danger`; `sm`, `md`, `lg`; `isLoading` | Action buttons with icon & state support |
| `Input` | `label`, `helperText`, `error`, `leftIcon`, `rightIcon` | Form text, email, password inputs |
| `Select` | `label`, `options`, `helperText`, `error` | Form select dropdown |
| `Textarea` | `label`, `helperText`, `error` | Multi-line text field |
| `Card` | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | Standard container card |
| `Badge` | `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `outline`, `surface` | Clinical & status badges |
| `IconButton` | `variant`, `size`, `ariaLabel` | Icon action wrapper |
| `Divider` | `orientation`, `label` | Separator line with optional text |
| `Modal` | `isOpen`, `onClose`, `title`, `footer`, `size` | Accessible dialog popup |
| `Dropdown` | `trigger`, `items`, `align` | Popover action menu |
| `Tabs` | `tabs`, `activeTab`, `onChange` | Segmented tab navigation |
| `Progress` | `value`, `max`, `label`, `sublabel`, `variant`, `size` | Linear progress bar for macros |
| `Avatar` | `src`, `name`, `size`, `variant` | User avatar / initials display |
| `Tooltip` | `content`, `position` | Hover text helper hint |
| `EmptyState` | `icon`, `title`, `description`, `action` | Empty data container fallback |
| `LoadingState` | `message` | Spinner loading indicator |

---

## 4. Application Layouts (`frontend/src/components/layout/`)

- **`AppLayout`**: Desktop Sidebar (`Sidebar.tsx`), Top Header (`Header.tsx`), Mobile Navigation (`MobileNavigation.tsx`), and content viewport (`<Outlet />`).
- **`AuthLayout`**: Double-sided container card layout matching `PoshanCare_signin.html` with clinical privacy top header.
- **`OnboardingLayout`**: 6-step progress indicator header matching `PoshanCare_welcome.html`.
