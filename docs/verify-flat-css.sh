#!/bin/bash

# Script to verify all Vue files use flat CSS (no nested BEM syntax)
# and identify any patterns that need refactoring

echo "==================================="
echo "Vue Files CSS Structure Verification"
echo "==================================="
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VUE_DIR="$SCRIPT_DIR/../app"
NESTED_FOUND=0
FILES_WITH_STYLES=0

# Find all Vue files
for vue_file in $(find "$VUE_DIR" -name "*.vue" -type f | sort); do
    # Check if file has <style> section
    if grep -q "<style" "$vue_file"; then
        FILES_WITH_STYLES=$((FILES_WITH_STYLES + 1))
        echo "Checking: $vue_file"
        
        # Extract style section
        style_content=$(awk '/<style/,/<\/style>/' "$vue_file")
        
        # Check for nested BEM patterns
        # Pattern 1: & with __ (BEM element)
        if echo "$style_content" | grep -q "&__"; then
            echo "  ⚠️  Found nested BEM element syntax (&__)"
            NESTED_FOUND=$((NESTED_FOUND + 1))
        fi
        
        # Pattern 2: & with -- (BEM modifier)
        if echo "$style_content" | grep -q "&--"; then
            echo "  ⚠️  Found nested BEM modifier syntax (&--)"
            NESTED_FOUND=$((NESTED_FOUND + 1))
        fi
        
        # Pattern 3: & with class selector
        if echo "$style_content" | grep -q "&\."; then
            echo "  ⚠️  Found nested class selector (&.)"
            NESTED_FOUND=$((NESTED_FOUND + 1))
        fi
        
        # Pattern 4: Generic & nesting (excluding pseudo-selectors which are valid)
        if echo "$style_content" | grep -E "\s*&[^:&]" | grep -v "&:hover\|&:focus\|&:active\|&:disabled\|&:checked\|&::before\|&::after" > /dev/null; then
            echo "  ⚠️  Found potential nested selector using &"
            NESTED_FOUND=$((NESTED_FOUND + 1))
        fi
        
        # Check style lang attribute (scss/sass would support nesting)
        if grep -q '<style.*lang=.*scss' "$vue_file" || grep -q '<style.*lang=.*sass' "$vue_file"; then
            echo "  ℹ️  Uses SCSS/SASS (supports nesting)"
        else
            echo "  ✓ Uses standard CSS"
        fi
        
        echo ""
    fi
done

echo "==================================="
echo "Summary:"
echo "  Total Vue files with <style>: $FILES_WITH_STYLES"
echo "  Files with nested syntax: $NESTED_FOUND"
echo "==================================="

if [ $NESTED_FOUND -eq 0 ]; then
    echo "✓ All files use flat CSS syntax!"
    exit 0
else
    echo "⚠️  Some files need refactoring from nested to flat CSS"
    exit 1
fi
