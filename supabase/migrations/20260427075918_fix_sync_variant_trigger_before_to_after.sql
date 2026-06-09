
-- Drop the broken BEFORE trigger
DROP TRIGGER IF EXISTS trigger_sync_variant_normalization ON public.product_variants;

-- Re-create as AFTER so product_variants row exists when variant_specifications FK is checked
CREATE TRIGGER trigger_sync_variant_normalization
  AFTER INSERT OR UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION sync_variant_to_normalized();
;
