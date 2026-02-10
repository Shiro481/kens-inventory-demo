alter table "public"."Parts" add column "restock_quantity" bigint default 0;

alter table "public"."Parts" add column "restocked_at" timestamp with time zone;

CREATE INDEX idx_parts_restocked_at ON public."Parts" USING btree (restocked_at);

-- Note: Storage triggers removed to prevent errors with non-existent functions
-- The storage schema is managed by Supabase and doesn't need manual triggers

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.safe_storage_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Return without attempting to call non-existent storage functions
    RETURN OLD;
END;
$function$
;
