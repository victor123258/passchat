# Cross-Device Optimization & Responsive Touch Architecture

A comprehensive layout and interaction upgrade delivering responsive excellence across smartphones (375px–430px), foldable screens, tablets (768px–1024px), standard laptops (1366px–1440px), and ultrawide desktop monitors, featuring touch-friendly hitboxes, virtual keyboard resilience, and an adaptive fullscreen video call grid.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your Phase 1 selections, the implementation will adhere to these core architectural priorities:
> - **Screen Size Scope**: Comprehensive optimization across mobile, tablet, laptop, and ultra-wide desktop monitors without sacrificing the single-file serverless design.
> - **Touch Ergonomics & Spacing**: Native mobile touch posture with strict $\ge 44\text{px}$ touch targets, `viewport-fit=cover`, iOS/Android safe area insets (`env(safe-area-inset-*)`), and tap-friendly thumb ergonomics.
> - **Call Screen Adaptation**: Fullscreen adaptive video grid that automatically transitions from side-by-side or picture-in-picture on desktop to auto-stacked vertical viewports on mobile devices.

---

### 1. Overview & Core Concept

- **What It Does**: Enhances PassChat's single-page web architecture with full cross-device responsiveness. Mobile users get native app feel with zero-delay taps (`touch-action: manipulation`), notch/home-bar safe padding, keyboard-safe chat viewports (`100dvh`), and one-touch action sheets. Tablet users get comfortable wide-aspect viewing with centered reading widths. Desktop users get high-productivity keyboard shortcuts, clean modal scaling, and multi-stream call geometry.
- **Target Audience / Persona**: Users on any device—from an iPhone or Android phone on 4G to an iPad or multi-monitor 4K desktop workstation—who need instant, private, end-to-end encrypted communication with zero app installation.
- **Key Value**: Flawless visual hierarchy, legible typography, and reliable WebRTC call interfaces regardless of screen dimensions, orientation shifts, or virtual keyboard activations.

---

### 2. User Experience & Visual Design

#### Form Factor Architecture Matrix

| Form Factor | Viewport Range | Primary Layout Pattern | Touch / Input Density | Call Screen Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (Compact)** | $320\text{px} - 430\text{px}$ | Single-column flex stream, fixed header + sticky bottom bar, `pb-safe` | $\ge 44\text{px}$ hitboxes, 100dvh viewport, bottom action sheet | Fullscreen stacked tiles (remote video top 55%, local video bottom 45% or floating thumbnail) |
| **Foldable / Large Mobile** | $431\text{px} - 640\text{px}$ | Adaptive single-column with balanced horizontal gutters | $\ge 44\text{px}$ hitboxes, fluid textarea autogrow | Adaptive split or top/bottom stacked with controls docked to bottom |
| **Tablet (Portrait & Landscape)** | $768\text{px} - 1024\text{px}$ | Centered reading column ($760\text{px}$ max), spacious margins, floating overlays | Hybrid touch/pointer, expanded popover menus | Side-by-side video stream split ($50/50$) or cinematic center stage |
| **Desktop / Laptop** | $1200\text{px} - 1440\text{px}+$ | Max-width containment container ($960\text{px}$ chat column or full-width fluid header) | Precision pointer, keyboard navigation (`Enter`, `Esc`), hover actions | Dual-stream theatrical view with floating PiP and studio control bar |

#### Visual Identity & Theme Tokens
- **Canvas Preservation**: Retains PassChat’s 11 themes (Obsidian, Signal Tactical, Solar Forge, Neo-Tokyo, Monolith, Nordic, Graphite Violet, Crimson Night, Frost Light, Paper Day, Sakura Haze).
- **Safe Area Inset Tokens**:
  - Top header: `padding-top: max(0.75rem, env(safe-area-inset-top))`
  - Input footer: `padding-bottom: max(0.75rem, env(safe-area-inset-bottom))`
  - Left/Right gutters: `padding-left: max(1rem, env(safe-area-inset-left))`, `padding-right: max(1rem, env(safe-area-inset-right))`
- **Typography & Scale**:
  - Display brand: `clamp(1.5rem, 4vw, 2.25rem)` with `text-wrap: balance`
  - Chat text: `15px` (`text-[15px]`) on mobile for high readability and iOS auto-zoom prevention (iOS Safari auto-zooms text `< 16px` on input focus; textarea styled at `text-base` `16px` to prevent unwanted zoom-in jumps)
  - Metadata: Clean unboxed timestamps and sender handles (`11px` font-mono)

#### Interactive Feedback & Motion
- **Tap Feedback**: `active:scale-[0.97]` micro-transitions with 150ms settling on all touch triggers.
- **Virtual Keyboard Resilience**: Replaces static `100vh` with `100dvh` (`min-height: 100dvh; height: 100dvh;`) to avoid iOS Safari address bar jumps and keyboard clipping.
- **Scroll Memory & Anchor**: Smooth auto-scroll behavior anchored to the bottom when new messages arrive or when the user focuses the message composer.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Viewport Sizing (`100dvh` vs `100vh` / JavaScript window.innerHeight)**
  - *Chosen Approach*: Pure CSS dynamic viewport units (`height: 100dvh`) with `@supports` fallback to `100vh`.
  - *Why*: Eliminates JavaScript resize thrashing while preventing the mobile browser bottom navigation bar (Safari / Chrome) from obscuring the message composer.
  - *Alternatives Considered*: Window `resize` event listeners updating `--vh` CSS variable. Rejected because it causes visual lag and jank during keyboard animations.

- **Decision 2: Mobile Input Font Sizing ($16\text{px}$ Base)**
  - *Chosen Approach*: Message textarea uses `text-base` ($16\text{px}$) on mobile viewports.
  - *Why*: Prevents iOS Safari from triggering destructive page viewport zooms when an input receives focus.
  - *Alternatives Considered*: `<meta name="viewport" content="user-scalable=no">`. Rejected because blocking pinch-zoom violates accessibility standards (WCAG).

- **Decision 3: Adaptive Video Call Grid (Auto-Stacking vs Fixed PiP)**
  - *Chosen Approach*: CSS Grid with media queries: stacked vertical layout on mobile devices (`< 640px`) where both participants occupy clear viewports, switching to responsive side-by-side or floating PiP on desktop.
  - *Why*: Mobile phone vertical aspect ratios make tiny bottom-corner PiP thumbnails illegible; auto-stacking provides clear visibility of facial expressions and shared screens.

- **Decision 4: Touch Hitbox Standard ($\ge 44\text{px}$)**
  - *Chosen Approach*: Expand interactive button hitboxes across all header icons, media buttons, action sheet items, and emoji selectors to at least $44 \times 44\text{px}$ using padding and flex alignment.
  - *Why*: Eliminates accidental mis-taps on high-density touchscreens.

---

### 4. Technical Architecture & Layout Geometry

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASSCHAT CROSS-DEVICE RESPONSIVE LAYOUT ENGINE                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ MOBILE VIEWPORT: 375px - 430px ]                                    │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ HEADER: Safe-top padding, Passkey chip, Call/Menu triggers   │      │
│  ├──────────────────────────────────────────────────────────────┤      │
│  │ MESSAGES CONTAINER: 100dvh flex-1, smooth scroll, 15px text  │      │
│  │  • Peer Message (padded bubble, tap reveals action bar)      │      │
│  │  • Self Message (padded bubble, copy/reply/unsend icons)     │      │
│  ├──────────────────────────────────────────────────────────────┤      │
│  │ BOTTOM DOCK: Safe-bottom padding, >=44px buttons, 16px text  │      │
│  │  [Clip] [Mic] [😊] [ Type message...       ] [ Send (44px) ]  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                        │
│  [ ADAPTIVE WEBRTC CALL OVERLAY: MOBILE VS DESKTOP ]                   │
│                                                                        │
│  MOBILE STACKED (<640px)              DESKTOP CINEMATIC (>=640px)      │
│  ┌─────────────────────────┐         ┌───────────────────────────────┐ │
│  │ Remote Video (Top 55%)  │         │ Remote Video (Full Stage)     │ │
│  │ [ Peer Camera / Screen] │         │                               │ │
│  ├─────────────────────────┤         │               ┌─────────────┐ │ │
│  │ Local Video (Bottom 45%)│         │               │ Local (PiP) │ │ │
│  │ [ Your Camera / Waves ] │         │               └─────────────┘ │ │
│  ├─────────────────────────┤         ├───────────────────────────────┤ │
│  │ Controls Bar (>=44px)   │         │ Controls Bar (Extended icons) │ │
│  │ [Mic] [Cam] [Flip] [End]│         │ [Mic] [Studio] [Cam] [Share]  │ │
│  └─────────────────────────┘         └───────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### State & DOM Interactivity Mapping
- **`#joinScreen`**: Max-width container (`max-w-md`) with adaptive horizontal gutters, centered vertically and horizontally on desktop, edge-padded with `p-4 sm:p-8` on mobile.
- **`#chatScreen`**: Uses `h-[100dvh]` with `flex flex-col overflow-hidden`.
  - Header: Truncates room name elegantly on narrow displays (`max-w-[120px] sm:max-w-none truncate`), wraps passkey chip with click-to-copy.
  - Composer: Multi-line textarea auto-grows up to 120px, touch toolbar buttons remain accessible above virtual keyboard without breaking page geometry.
- **`#callOverlay`**: Converts the video stage into a responsive flex/grid container. When mobile screen detected, switches local video thumbnail from a tiny fixed floating box into an integrated split or enlarged floating tile.
- **Action Sheets & Popovers**: Bottom-docked on mobile (`rounded-t-3xl border-t`), floating centered modal on desktop.

---

### Verification & Testing Plan

1. **Mobile Emulation Tests**:
   - iPhone SE ($375\text{px}$), iPhone 14/15 Pro ($393\text{px}$), Samsung Galaxy S21 ($360\text{px}$).
   - Verify safe area insets (top notch, bottom home indicator bar).
   - Test virtual keyboard open/close without layout jump or viewport overflow.
2. **Tablet & Foldable Tests**:
   - iPad Mini ($768\text{px}$), iPad Pro ($1024\text{px}$).
   - Verify reading container max-width containment and split-touch targets.
3. **Desktop Workstation Tests**:
   - Standard Laptop ($1366 \times 768$, $1440 \times 900$), 4K Ultrawide ($2560\text{px}+$).
   - Verify centered message feed, keyboard navigation (`Enter` to send, `Shift+Enter` for newline, `Esc` to close sheets/modals).
4. **Interactive Call Test**:
   - Test Call Overlay on small screen: ensure camera tiles, controls, and audio waves remain fully visible without horizontal scrollbars.
5. **Compilation & Build**:
   - Run `compile_applet` and `lint_applet` to confirm zero errors or regressions.
