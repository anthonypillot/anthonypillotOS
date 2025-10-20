# CSS Guidelines for Vue.js Components

## Overview

This project uses **flat CSS syntax** in all Vue.js `.vue` files. Nested BEM (Block Element Modifier) syntax is not used to ensure better compatibility with standard CSS and avoid potential issues with Vue's scoped styles.

## Current State

All Vue files with `<style>` sections currently follow flat CSS patterns:

### Files with Style Sections

1. `app/error.vue` - Error page image filter
2. `app/components/task-holdem/Card.vue` - Card component transitions
3. `app/components/task-holdem/PokerPlayer.vue` - Poker card background
4. `app/components/task-holdem/Chat.vue` - Vue transition animations
5. `app/components/base/ExperienceCard.vue` - Slide fade transitions
6. `app/components/base/Hero.vue` - Gradient background animations
7. `app/components/github/HistoryCleaner.vue` - Font family override

## Flat CSS Pattern

### ✅ Correct (Flat CSS)

```css
<style scoped>
.card {
  transition: transform 0.15s;
}

.card:hover {
  transform: translateY(-0.25rem);
}

.card__element {
  padding: 1rem;
}

.card--modifier {
  background: blue;
}
</style>
```

### ❌ Incorrect (Nested BEM)

```css
<style scoped lang="scss">
.card {
  transition: transform 0.15s;
  
  &:hover {
    transform: translateY(-0.25rem);
  }
  
  &__element {
    padding: 1rem;
  }
  
  &--modifier {
    background: blue;
  }
}
</style>
```

## Benefits of Flat CSS

1. **Standard Compatibility**: Works with standard CSS without requiring preprocessors
2. **Vue Scoped Styles**: Better compatibility with Vue's scoped style system
3. **Readability**: Easier to search and understand class relationships
4. **Performance**: No preprocessing step needed for styles
5. **Tooling**: Works with standard CSS linting and formatting tools

## Best Practices

### 1. Use Scoped Styles

Always use `scoped` attribute to prevent style leakage:

```vue
<style scoped>
.component-class {
  /* styles */
}
</style>
```

### 2. Use Standard CSS

Avoid using `lang="scss"` or `lang="sass"` unless absolutely necessary:

```vue
<!-- Preferred -->
<style scoped>
.my-class { }
</style>

<!-- Avoid unless necessary -->
<style scoped lang="scss">
.my-class { }
</style>
```

### 3. Write Explicit Selectors

Write out full class names for BEM elements and modifiers:

```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }

/* Modifier */
.card--highlighted { }
.card--large { }
```

### 4. Use Pseudo-selectors Directly

Pseudo-selectors can be used normally without nesting:

```css
.button {
  background: blue;
}

.button:hover {
  background: darkblue;
}

.button:disabled {
  opacity: 0.5;
}
```

### 5. Multiple Selectors

Use comma-separated selectors for shared styles:

```css
.v-enter-from,
.v-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
```

## Verification

To verify all Vue files follow flat CSS syntax, run:

```bash
./docs/verify-flat-css.sh
```

This script checks all `.vue` files for nested BEM patterns and reports any violations.

## Migration from Nested to Flat CSS

If you have nested BEM syntax that needs to be refactored, follow these steps:

### Example Migration

**Before (Nested):**
```scss
.block {
  color: red;
  
  &__element {
    padding: 1rem;
    
    &:hover {
      padding: 1.5rem;
    }
  }
  
  &--modifier {
    color: blue;
  }
}
```

**After (Flat):**
```css
.block {
  color: red;
}

.block__element {
  padding: 1rem;
}

.block__element:hover {
  padding: 1.5rem;
}

.block--modifier {
  color: blue;
}
```

## Tailwind CSS

This project primarily uses Tailwind CSS for utility-first styling. Custom CSS should only be used when:

1. Creating animations or keyframes
2. Defining complex transitions
3. Applying styles that Tailwind doesn't support well
4. Component-specific styling that benefits from scoped styles

Most styling should be done using Tailwind utility classes in the template:

```vue
<template>
  <div class="bg-blue-500 hover:bg-blue-700 p-4 rounded">
    <!-- content -->
  </div>
</template>
```

## Maintenance

- All new Vue components should follow flat CSS syntax
- Avoid adding `lang="scss"` or `lang="sass"` to style blocks
- Keep custom CSS minimal; prefer Tailwind utilities
- Use the verification script regularly to ensure compliance

## Questions?

If you have questions about these guidelines or need clarification, please:
1. Review existing Vue component examples
2. Check the Tailwind CSS documentation
3. Open an issue for discussion
