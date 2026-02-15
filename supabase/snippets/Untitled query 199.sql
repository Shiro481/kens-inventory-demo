 CREATE TABLE IF NOT EXISTS products (
   bulb_type_id bigint REFERENCES bulb_types(id),
);