# ArtVault: UX/UI Design Guide

## Visual Identity (Gallery Premium)
ArtVault follows a "Museum/Gallery" aesthetic designed to highlight the artworks themselves while providing a professional, robust management environment.

### 🎨 Design Tokens
| Category | Token | Value (Hex) | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `bg-gallery` | `#FFFFFF` | Primary canvas |
| **Foreground** | `fg-museum` | `#0A0A0A` | Text and high contrast elements |
| **Acent** | `accent-gold` | `#C5A049` | Buttons, Active states, Status icons |
| **Surface** | `surface-soft` | `#F5F5F5` | Secondary containers (cards, sidebars) |
| **Border** | `border-thin` | `#E0E0E0` | Subtle separations |

### 🔡 Typography
- **Titles**: `Playfair Display` (Serif) – Elegant, historical, academic.
- **Body**: `Inter` (Sans-serif) – Readable, functional, technical.

### 🖼️ Core Components

#### 1. Technical Sheet (Ficha Técnica) - Stepper Flow
The form is divided into 4 logical steps to reduce cognitive load:
1. **Basic Info**: Title, Inventory ID, Author, Date.
2. **Material/Dimensions**: Technique, Support, Weight, Measurements.
3. **Condition/History**: Conservation status, provenance, exhibits.
4. **Media**: High-res photo upload with automatic compression and preview.

#### 2. Public Catalog
- **Masonry/Grid Gallery**: Dynamic layout with high-quality thumbnails.
- **Advanced Search**: Sidebar filters by collection, author, technique, and date range.
- **Skeleton Loaders**: Elegant fade-in animations for images to handle high-res assets gracefully.

#### 3. Media Service
- **Automatic Compression**: Client-side logic to ensure images are <300kb before upload.
- **Naming Convention**: `[titulo]_[id].jpg` for SEO and organization.

### 🏛️ Vibe Architecture
- **Immersion**: Low-impact UI elements—borders are extremely thin or non-existent, using shadows to create depth.
- **Purity**: Zero "clutter" (no hard shadows, no bright neon colors).
- **Pro-user Navigation**: Keyboard shortcuts and breadcrumbs for efficient deep-cataloging.
