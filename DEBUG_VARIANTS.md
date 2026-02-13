# 🔍 Variant Selection Debugging Checklist

## Step 1: Open Browser Console

1. Press `F12` to open Developer Tools
2. Go to the **Console** tab
3. Keep it open while testing

## Step 2: Hard Refresh

Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to clear cache

## Step 3: Check Item in POS

1. Go to POS page
2. Look for your item with variants
3. **Check if you see "MULTIPLE OPTIONS" badge** on the card
   - ✅ If YES: The `has_variants` field is set correctly
   - ❌ If NO: Continue to Step 4

## Step 4: Verify Database (if no badge shows)

Open Supabase SQL Editor and run:

```sql
-- Check your item
SELECT id, name, has_variants, uuid
FROM inventory
WHERE name LIKE '%YOUR_ITEM_NAME%';
```

**Expected result**: `has_variants` should be `true`

If it's `false` or `null`, run:

```sql
UPDATE inventory
SET has_variants = true
WHERE id = YOUR_ITEM_ID;
```

## Step 5: Click the Item

1. Click on the item card
2. **Watch the Console** - you should see logs like:
   ```
   🔍 [POS] Item clicked: { name: "...", has_variants: true, uuid: "...", willShowVariantModal: true }
   📡 [POS] Fetching variants for product: ...
   ✅ [POS] Variants fetched: [...]
   ```

## Step 6: Check What Happens

### Scenario A: Modal Opens with Variants ✅

- **Success!** The feature is working
- You should see variant cards
- Select a variant and add to cart

### Scenario B: Modal Opens but Says "No variants configured"

- The item has `has_variants = true` but no variants in the database
- **Fix**: Go to Dashboard → Edit Item → Add variants using the variant form

### Scenario C: Item Detail Modal Opens (not variant modal)

- Check console for errors
- Likely causes:
  1. `has_variants` is not `true` in database
  2. Item doesn't have a `uuid` field
  3. Supabase error (check console)

### Scenario D: Nothing Happens

- Check console for JavaScript errors
- Make sure you hard-refreshed (Ctrl+Shift+R)

## Step 7: Verify Variants Exist in Database

```sql
-- Check if variants exist for your product
SELECT *
FROM product_bulb_variants
WHERE product_id = 'YOUR_PRODUCT_UUID';
```

**Expected**: At least one row should be returned

If no rows:

- Go to Dashboard → Inventory → Edit Item
- Add variants using the "Manage Variants" section

## Common Issues & Solutions

### Issue: "MULTIPLE OPTIONS" badge doesn't show

**Cause**: `has_variants` is not `true` in database
**Solution**:

```sql
UPDATE inventory SET has_variants = true WHERE id = YOUR_ITEM_ID;
```

### Issue: Console shows "uuid: undefined"

**Cause**: Item doesn't have a UUID
**Solution**: Check your database schema - the `inventory` table should have a `uuid` column

### Issue: Console shows Supabase error

**Cause**: Database permissions or table doesn't exist
**Solution**:

1. Check if `product_bulb_variants` table exists
2. Check RLS policies allow SELECT on the table

### Issue: Old code still running

**Cause**: Browser cache
**Solution**: Hard refresh with `Ctrl + Shift + R`

## What the Console Logs Mean

- `🔍 [POS] Item clicked` - Item was clicked, shows if it has variants
- `📡 [POS] Fetching variants` - Querying database for variants
- `✅ [POS] Variants fetched` - Successfully got variants (check the array)
- `❌ [POS] Error fetching variants` - Database error (check the error message)
- `ℹ️ [POS] No variants` - Item doesn't have `has_variants = true`

## Quick Test Query

Run this to see all items with variants:

```sql
SELECT
  i.id,
  i.name,
  i.has_variants,
  i.uuid,
  COUNT(v.id) as variant_count
FROM inventory i
LEFT JOIN product_bulb_variants v ON v.product_id = i.uuid
WHERE i.has_variants = true
GROUP BY i.id, i.name, i.has_variants, i.uuid;
```

This shows which items have variants and how many variants each has.
