SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict QYrOeJ5uWhZ19L9bzwjwekCteniYxhdMsys4QPe50Pdl2AIAs97qRQKWeD6lA3W

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '377c371a-8174-43a4-888c-3db452e19c0d', 'authenticated', 'authenticated', 'shaqleeambagan101@gmail.com', '$2a$10$8Ka2pEkI6JcLKHSuZaQzQ.Ga8.gjOMIW3oYZ6yxTgJBffR4KtggPm', '2026-02-13 08:44:28.610637+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-17 13:13:03.376224+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-13 08:44:28.606636+00', '2026-02-18 00:15:09.795047+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('377c371a-8174-43a4-888c-3db452e19c0d', '377c371a-8174-43a4-888c-3db452e19c0d', '{"sub": "377c371a-8174-43a4-888c-3db452e19c0d", "email": "shaqleeambagan101@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-13 08:44:28.607822+00', '2026-02-13 08:44:28.607875+00', '2026-02-13 08:44:28.607875+00', 'ac01aff9-54f4-4778-b94d-c9f5d0faa021');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('f76bb6c7-20b7-402b-a3ed-e510b2fa361b', '377c371a-8174-43a4-888c-3db452e19c0d', '2026-02-17 13:13:03.376312+00', '2026-02-18 00:15:09.807541+00', NULL, 'aal1', NULL, '2026-02-18 00:15:09.806719', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '180.190.5.56', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('f76bb6c7-20b7-402b-a3ed-e510b2fa361b', '2026-02-17 13:13:03.400426+00', '2026-02-17 13:13:03.400426+00', 'password', 'ab305254-4e1c-48df-aef4-d4751aa99133');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 35, 'q42sesk42cqd', '377c371a-8174-43a4-888c-3db452e19c0d', true, '2026-02-17 13:13:03.390995+00', '2026-02-17 22:17:46.904702+00', NULL, 'f76bb6c7-20b7-402b-a3ed-e510b2fa361b'),
	('00000000-0000-0000-0000-000000000000', 36, 'i26f527d77xo', '377c371a-8174-43a4-888c-3db452e19c0d', true, '2026-02-17 22:17:46.932889+00', '2026-02-17 23:16:11.639741+00', 'q42sesk42cqd', 'f76bb6c7-20b7-402b-a3ed-e510b2fa361b'),
	('00000000-0000-0000-0000-000000000000', 37, 'ly2frsq2ddfc', '377c371a-8174-43a4-888c-3db452e19c0d', true, '2026-02-17 23:16:11.661297+00', '2026-02-18 00:15:09.767425+00', 'i26f527d77xo', 'f76bb6c7-20b7-402b-a3ed-e510b2fa361b'),
	('00000000-0000-0000-0000-000000000000', 38, 'azajbyobdw24', '377c371a-8174-43a4-888c-3db452e19c0d', false, '2026-02-18 00:15:09.784788+00', '2026-02-18 00:15:09.784788+00', 'ly2frsq2ddfc', 'f76bb6c7-20b7-402b-a3ed-e510b2fa361b');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admins" ("id", "email", "password_hash", "full_name", "role", "is_active", "created_at", "updated_at") VALUES
	('b02f30cf-2d28-44bd-b59d-9d9684ad650e', 'shaqleeambagan101@gmail.com', '$2a$06$OkQUIz32.AXvtA.lrUl8hOiWtvHHLYBstqH7dHlJE842fnGPq2uWK', 'System Owner', 'super_admin', true, '2026-02-13 08:37:25.227332+00', '2026-02-13 08:37:25.227332+00');


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."product_categories" ("id", "created_at", "name", "description") VALUES
	(1, '2026-02-15 12:12:09.933322+00', 'Headlight', 'Main front lighting'),
	(2, '2026-02-15 12:12:09.933322+00', 'Fog Light', 'Auxiliary fog lights'),
	(3, '2026-02-15 12:12:09.933322+00', 'Signal Light', 'Turn signals'),
	(4, '2026-02-15 12:12:09.933322+00', 'Interior Light', 'Cabin lighting'),
	(5, '2026-02-15 12:12:09.933322+00', 'Brake Light', 'Rear brake lights'),
	(6, '2026-02-15 12:12:09.933322+00', 'Wiper', 'Windshield wipers'),
	(7, '2026-02-15 12:12:09.933322+00', 'Horn', 'Automotive horns'),
	(8, '2026-02-15 12:12:09.933322+00', 'Work Light', 'Off-road work lights');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: variant_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."variant_categories" ("id", "created_at", "code", "description") VALUES
	(1, '2026-02-15 12:12:09.933322+00', 'H1', 'Single filament'),
	(2, '2026-02-15 12:12:09.933322+00', 'H3', 'Fog light type'),
	(3, '2026-02-15 12:12:09.933322+00', 'H4', 'Dual filament Hi/Lo'),
	(4, '2026-02-15 12:12:09.933322+00', 'H7', 'Single filament'),
	(5, '2026-02-15 12:12:09.933322+00', 'H8', 'Fog light type'),
	(6, '2026-02-15 12:12:09.933322+00', 'H9', 'High beam type'),
	(7, '2026-02-15 12:12:09.933322+00', 'H11', 'Single filament'),
	(8, '2026-02-15 12:12:09.933322+00', 'H16', 'Low wattage fog'),
	(9, '2026-02-15 12:12:09.933322+00', '9005', 'HB3 High beam'),
	(10, '2026-02-15 12:12:09.933322+00', '9006', 'HB4 Low beam'),
	(11, '2026-02-15 12:12:09.933322+00', '9012', 'HIR2'),
	(12, '2026-02-15 12:12:09.933322+00', '880', 'Fog light'),
	(13, '2026-02-15 12:12:09.933322+00', '881', 'Fog light'),
	(14, '2026-02-15 12:12:09.933322+00', 'D1S', 'HID Xenon'),
	(15, '2026-02-15 12:12:09.933322+00', 'D2S', 'HID Xenon'),
	(16, '2026-02-15 12:12:09.933322+00', 'D3S', 'HID Xenon'),
	(17, '2026-02-15 12:12:09.933322+00', 'D4S', 'HID Xenon'),
	(18, '2026-02-15 12:12:09.933322+00', 'T10', 'W5W Wedge'),
	(19, '2026-02-15 12:12:09.933322+00', 'T15', 'W16W Wedge'),
	(20, '2026-02-15 12:12:09.933322+00', 'T20', '7440/7443 Wedge'),
	(21, '2026-02-15 12:12:09.933322+00', 'T25', '3156/3157 Wedge'),
	(22, '2026-02-15 12:12:09.933322+00', '1156', 'BA15S Bayonet'),
	(23, '2026-02-15 12:12:09.933322+00', '1157', 'BAY15D Bayonet'),
	(24, '2026-02-15 16:15:43.192829+00', 'H13', 'Created via App'),
	(25, '2026-02-16 01:42:21.081737+00', '9012 (HIR2)', 'Created via App');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "created_at", "updated_at", "name", "sku", "barcode", "brand", "category_id", "variant_type_id", "supplier_id", "selling_price", "cost_price", "stock_quantity", "min_stock_level", "reorder_level", "description", "image_url", "voltage", "wattage", "color_temperature", "lumens", "beam_type", "specifications", "has_variants") VALUES
	(8, '2026-02-17 04:11:21.176012+00', '2026-02-17 04:38:59.744056+00', 'GPNE RS7 ', NULL, NULL, 'GPNE', NULL, NULL, NULL, 0.00, 0.00, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"internal_notes": "PARENT"}', true),
	(7, '2026-02-17 04:02:59.507517+00', '2026-02-17 04:39:14.462997+00', 'GPNE R6', NULL, NULL, 'GPNE', NULL, NULL, NULL, 0.00, 0.00, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"last_restock": {"date": "2026-02-17T04:04:09.409Z", "quantity": 1}, "internal_notes": "PARENT"}', true),
	(11, '2026-02-17 05:00:24.255216+00', '2026-02-17 05:02:15.962006+00', 'Osram Night Breaker', NULL, NULL, 'Osram', NULL, NULL, NULL, 0.00, 0.00, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"internal_notes": "PARENT"}', true),
	(10, '2026-02-17 04:17:57.484314+00', '2026-02-17 23:08:04.098399+00', 'GPNE R3', NULL, NULL, 'GPNE', NULL, NULL, NULL, 0.00, 0.00, 1, 5, 5, NULL, NULL, NULL, NULL, '', NULL, NULL, '{"tags": [], "last_restock": {"date": "2026-02-17T04:18:19.295Z", "quantity": 1}, "internal_notes": "PARENT"}', true),
	(9, '2026-02-17 04:15:45.203966+00', '2026-02-17 23:08:26.905245+00', 'GPNE RS6X', NULL, NULL, 'GPNE', NULL, NULL, NULL, 0.00, 0.00, 1, 5, 5, NULL, NULL, NULL, NULL, 'Dual Color', NULL, NULL, '{"tags": [], "internal_notes": "PARENT"}', true),
	(12, '2026-02-17 23:21:20.810204+00', '2026-02-17 23:42:31.30212+00', 'Aero Vogue Flex', NULL, NULL, 'PIAA', 6, NULL, NULL, 0.00, 0.00, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"tags": [], "last_restock": {"date": "2026-02-17T23:21:56.532Z", "quantity": 1}, "internal_notes": ""}', true);


--
-- Data for Name: variant_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."variant_definitions" ("id", "created_at", "base_name", "variant_name", "display_name", "compatibility_list", "description", "is_active") VALUES
	(1, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', 'H4/H7/9005/9006', 'Universal Kit (H4/H7/9005/9006)', '{H4,H7,9005,9006}', 'Fits multiple sockets with adapters', true),
	(2, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', 'H4/Hb2/9003', 'Hi/Lo Beam (H4)', '{H4,Hb2,9003}', 'Standard high/low beam', true),
	(3, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', 'H7', 'Low Beam (H7)', '{H7}', 'Standard low beam', true),
	(4, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', 'H11/H8/H9', 'Single Beam (H11)', '{H11,H8,H9}', 'Standard single beam', true),
	(5, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', '9005/HB3', 'High Beam (9005)', '{9005,HB3}', 'Standard high beam', true),
	(6, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', '9006/HB4', 'Low Beam (9006)', '{9006,HB4}', 'Standard low beam', true),
	(7, '2026-02-15 12:12:09.933322+00', 'LED Headlight Kit', '9012/HIR2', 'Single Beam (9012)', '{9012,HIR2}', 'Accessory light', true),
	(8, '2026-02-15 12:12:09.933322+00', 'LED Fog Light', 'H11/H8/H16', 'Fog Universal (H11/H8/H16)', '{H11,H8,H16}', 'Universal fog light fitment', true),
	(9, '2026-02-15 12:12:09.933322+00', 'LED Fog Light', '880/881', 'Fog (880/881)', '{880,881}', 'Small fog light', true),
	(10, '2026-02-15 12:12:09.933322+00', 'LED Signal', '1156/BA15S', 'Single Contact (1156)', '{1156,BA15S}', 'Turn signal / Reverse', true),
	(11, '2026-02-15 12:12:09.933322+00', 'LED Signal', '7440/T20', 'Wedge Base (7440)', '{7440,T20}', 'Turn signal', true),
	(12, '2026-02-15 12:12:09.933322+00', 'LED Brake', '1157/BAY15D', 'Double Contact (1157)', '{1157,BAY15D}', 'Brake/Tail light', true),
	(13, '2026-02-15 12:12:09.933322+00', 'LED Brake', '7443/T20', 'Wedge Double (7443)', '{7443,T20}', 'Brake/Tail light', true),
	(14, '2026-02-15 12:12:09.933322+00', 'Interior LED', 'T10/194/168', 'Wedge T10 (Universal)', '{T10,194,168}', 'Parking/Interior/Plate', true),
	(15, '2026-02-15 12:12:09.933322+00', 'Interior LED', 'Festoon 31mm', 'Festoon 31mm', '{31mm}', 'Dome light', true),
	(16, '2026-02-15 12:12:09.933322+00', 'Interior LED', 'Festoon 36mm', 'Festoon 36mm', '{36mm}', 'Dome light', true),
	(17, '2026-02-15 16:02:47.309202+00', 'Simple Bulb', 'H13', 'H13', '{H13}', 'Standard H13', true),
	(18, '2026-02-15 16:14:45.801102+00', 'Simple Bulb', 'H11', 'H11', '{H11}', 'Standard H11', true),
	(19, '2026-02-15 16:15:38.740664+00', 'Simple Bulb', 'Festoon 41mm', 'Festoon 41mm', '{"Festoon 41mm"}', 'Standard Festoon 41mm', true),
	(20, '2026-02-16 01:42:51.462139+00', 'Simple Bulb', 'D2S', 'D2S', '{D2S}', 'Standard D2S', true),
	(21, '2026-02-16 01:43:42.742359+00', 'Simple Bulb', 'D1S', 'D1S', '{D1S}', 'Standard D1S', true),
	(22, '2026-02-16 04:02:01.892255+00', 'Simple Bulb', '9005 (HB3)', '9005 (HB3)', '{"9005 (HB3)"}', 'Standard 9005 (HB3)', true),
	(23, '2026-02-16 05:39:09.432152+00', 'Simple Bulb', '9012 (HIR2)', '9012 (HIR2)', '{"9012 (HIR2)"}', 'Standard 9012 (HIR2)', true),
	(24, '2026-02-17 03:57:53.340187+00', 'Simple Bulb', 'H1', 'H1', '{H1}', 'Standard H1', true),
	(25, '2026-02-17 03:58:47.351891+00', 'Simple Bulb', '9006 (HB4)', '9006 (HB4)', '{"9006 (HB4)"}', 'Standard 9006 (HB4)', true),
	(26, '2026-02-17 04:02:21.484399+00', 'Simple Bulb', 'H27', 'H27', '{H27}', 'Standard H27', true),
	(27, '2026-02-17 04:15:43.76334+00', 'Simple Bulb', 'H4', 'H4', '{H4}', 'Standard H4', true),
	(28, '2026-02-17 23:12:03.507824+00', 'Simple Variant', '12"', '12"', '{"12\""}', 'Standard 12"', true),
	(29, '2026-02-17 23:12:49.697065+00', 'Simple Variant', '16"', '16"', '{"16\""}', 'Standard 16"', true),
	(30, '2026-02-17 23:13:24.789725+00', 'Simple Variant', '17"', '17"', '{"17\""}', 'Standard 17"', true),
	(31, '2026-02-17 23:13:44.575145+00', 'Simple Variant', '18"', '18"', '{"18\""}', 'Standard 18"', true),
	(32, '2026-02-17 23:14:03.960222+00', 'Simple Variant', '19"', '19"', '{"19\""}', 'Standard 19"', true),
	(33, '2026-02-17 23:14:33.445326+00', 'Simple Variant', '20"', '20"', '{"20\""}', 'Standard 20"', true),
	(34, '2026-02-17 23:15:07.52315+00', 'Simple Variant', '22"', '22"', '{"22\""}', 'Standard 22"', true),
	(35, '2026-02-17 23:15:30.764856+00', 'Simple Variant', '24"', '24"', '{"24\""}', 'Standard 24"', true),
	(36, '2026-02-17 23:16:00.635179+00', 'Simple Variant', '26"', '26"', '{"26\""}', 'Standard 26"', true),
	(37, '2026-02-17 23:24:42.040657+00', 'Simple Variant', '14"', '14"', '{"14\""}', 'Standard 14"', true),
	(38, '2026-02-17 23:33:26.320003+00', 'Simple Variant', '28"', '28"', '{"28\""}', 'Standard 28"', true),
	(39, '2026-02-17 23:40:35.038579+00', 'Simple Variant', '10"', '10"', '{"10\""}', 'Standard 10"', true),
	(40, '2026-02-17 23:41:09.010751+00', 'Simple Variant', '11"', '11"', '{"11\""}', 'Standard 11"', true),
	(41, '2026-02-17 23:42:27.15767+00', 'Simple Variant', '13"', '13"', '{"13\""}', 'Standard 13"', true);


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."product_variants" ("id", "created_at", "product_id", "variant_id", "variant_type", "color_temperature", "variant_sku", "variant_barcode", "selling_price", "cost_price", "stock_quantity", "min_stock_level", "is_primary", "description", "price_adjustment", "variant_color") VALUES
	(29, '2026-02-17 04:17:57.707266+00', 10, 24, 'H1', '4300', 'null-29', NULL, 5000.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(30, '2026-02-17 05:00:24.721951+00', 11, 27, 'H4', '0', 'null-30', NULL, 3750.00, 0.00, 8, 5, false, NULL, 0.00, 'universal
'),
	(28, '2026-02-17 04:15:45.483932+00', 9, 27, 'H4', 'Dual Color', 'null-28', NULL, 6000.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(27, '2026-02-17 04:15:45.483932+00', 9, 22, '9005 (HB3)', 'Dual Color', 'null-27', NULL, 6000.00, 0.00, 3, 5, false, NULL, 0.00, NULL),
	(32, '2026-02-17 23:21:21.200279+00', 12, 28, '12"', 'Red', NULL, NULL, 1100.00, 0.00, 5, 5, false, '', 0.00, 'RedK'),
	(33, '2026-02-17 23:21:21.200279+00', 12, 29, '16"', 'Red', NULL, NULL, 1100.00, 0.00, 3, 5, false, '', 0.00, 'RedK'),
	(34, '2026-02-17 23:21:21.200279+00', 12, 30, '17"', 'Red', NULL, NULL, 1100.00, 0.00, 5, 5, false, '', 0.00, 'RedK'),
	(35, '2026-02-17 23:21:21.200279+00', 12, 31, '18"', 'Red', NULL, NULL, 1100.00, 0.00, 12, 5, false, '', 0.00, 'RedK'),
	(36, '2026-02-17 23:21:21.200279+00', 12, 32, '19"', 'Red', NULL, NULL, 1100.00, 0.00, 3, 5, false, '', 0.00, 'RedK'),
	(37, '2026-02-17 23:21:21.200279+00', 12, 33, '20"', 'Red', NULL, NULL, 1200.00, 0.00, 5, 5, false, '', 0.00, 'RedK'),
	(38, '2026-02-17 23:21:21.200279+00', 12, 34, '22"', 'Red', NULL, NULL, 1200.00, 0.00, 5, 5, false, '', 0.00, 'RedK'),
	(39, '2026-02-17 23:21:21.200279+00', 12, 35, '24"', 'Red', NULL, NULL, 1300.00, 0.00, 5, 5, false, '', 0.00, 'RedK'),
	(40, '2026-02-17 23:21:21.200279+00', 12, 36, '26"', 'Red', NULL, NULL, 1300.00, 0.00, 4, 5, false, '', 0.00, 'RedK'),
	(42, '2026-02-17 23:25:59.28453+00', 12, 29, '16"', 'Purple', NULL, NULL, 1300.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(15, '2026-02-17 04:02:59.920591+00', 7, 25, '9006 (HB4)', '4300', 'null-15', NULL, 6000.00, NULL, 9, 5, false, NULL, 0.00, NULL),
	(17, '2026-02-17 04:02:59.920591+00', 7, 25, '9006 (HB4)', '6000', 'null-17', NULL, 6000.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(24, '2026-02-17 04:02:59.920591+00', 7, 26, 'H27', '6000', 'null-24', NULL, 6000.00, 0.00, 2, 5, false, NULL, 0.00, NULL),
	(23, '2026-02-17 04:02:59.920591+00', 7, 26, 'H27', '4300', 'null-23', NULL, 6000.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(22, '2026-02-17 04:02:59.920591+00', 7, 23, '9012 (HIR2)', '4300', 'null-22', NULL, 6000.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(21, '2026-02-17 04:02:59.920591+00', 7, 23, '9012 (HIR2)', '6000', 'null-21', NULL, 6000.00, 0.00, 6, 5, false, NULL, 0.00, NULL),
	(20, '2026-02-17 04:02:59.920591+00', 7, 22, '9005 (HB3)', '4300', 'null-20', NULL, 6000.00, 0.00, 3, 5, false, NULL, 0.00, NULL),
	(16, '2026-02-17 04:02:59.920591+00', 7, 24, 'H1', '6000', 'null-16', NULL, 6000.00, 6000.00, 3, 5, false, NULL, 0.00, NULL),
	(18, '2026-02-17 04:02:59.920591+00', 7, 3, 'H7', '6000', 'null-18', NULL, 6000.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(19, '2026-02-17 04:02:59.920591+00', 7, 3, 'H7', '4300', 'null-19', NULL, 6000.00, 0.00, 2, 5, false, NULL, 0.00, NULL),
	(26, '2026-02-17 04:11:21.427321+00', 8, 22, '9005 (HB3)', '6000', 'null-26', NULL, 8500.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(25, '2026-02-17 04:11:21.427321+00', 8, 25, '9006 (HB4)', '6000', 'null-25', NULL, 8500.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(41, '2026-02-17 23:24:42.748564+00', 12, 37, '14"', 'Purple', 'null-41', NULL, 1200.00, 0.00, 7, 5, false, NULL, 0.00, NULL),
	(43, '2026-02-17 23:27:29.406148+00', 12, 30, '17"', 'Purple', NULL, NULL, 1350.00, 0.00, 1, 5, false, NULL, 0.00, NULL),
	(44, '2026-02-17 23:28:06.916971+00', 12, 31, '18"', 'Purple', NULL, NULL, 1400.00, 0.00, 4, 5, false, NULL, 0.00, NULL),
	(45, '2026-02-17 23:28:35.061509+00', 12, 32, '19"', 'Purple', NULL, NULL, 1400.00, 0.00, 4, 5, false, NULL, 0.00, NULL),
	(46, '2026-02-17 23:29:24.32874+00', 12, 33, '20"', 'Purple', 'null-46', NULL, 1500.00, 0.00, 3, 5, false, NULL, 0.00, 'Purple'),
	(47, '2026-02-17 23:30:12.504051+00', 12, 34, '22"', 'Purple', 'null-47', NULL, 1400.00, 0.00, 5, 5, false, NULL, 0.00, 'Purple'),
	(48, '2026-02-17 23:30:59.20278+00', 12, 35, '24"', 'Purple', 'null-48', NULL, 1600.00, 0.00, 8, 5, false, NULL, 0.00, 'Purple'),
	(49, '2026-02-17 23:33:28.968284+00', 12, 38, '28"', 'Purple', 'null-49', NULL, 1800.00, 0.00, 5, 5, false, NULL, 0.00, 'Purple'),
	(51, '2026-02-17 23:37:55.388727+00', 12, 29, '16"', 'Green', NULL, NULL, 1200.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(52, '2026-02-17 23:38:19.991003+00', 12, 32, '19"', 'Green', NULL, NULL, 1400.00, 0.00, 2, 5, false, NULL, 0.00, NULL),
	(53, '2026-02-17 23:39:03.677297+00', 12, 33, '20"', 'Green', NULL, NULL, 1500.00, 0.00, 4, 5, false, NULL, 0.00, NULL),
	(54, '2026-02-17 23:39:22.984673+00', 12, 34, '22"', 'Green', NULL, NULL, 1500.00, 0.00, 9, 5, false, NULL, 0.00, NULL),
	(55, '2026-02-17 23:39:56.375832+00', 12, 35, '24"', 'Green', NULL, NULL, 1600.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(56, '2026-02-17 23:40:35.69054+00', 12, 39, '10"', 'Yellow', NULL, NULL, 1000.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(57, '2026-02-17 23:41:09.700261+00', 12, 40, '11"', 'Yellow', NULL, NULL, 1050.00, 0.00, 4, 5, false, NULL, 0.00, NULL),
	(58, '2026-02-17 23:41:34.741267+00', 12, 28, '12"', 'Yellow', NULL, NULL, 1100.00, 0.00, 5, 5, false, NULL, 0.00, NULL),
	(59, '2026-02-17 23:42:27.987196+00', 12, 41, '13"', 'Yellow', NULL, NULL, 1150.00, 0.00, 5, 5, false, NULL, 0.00, NULL);


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."store_settings" ("id", "store_name", "tax_rate", "low_stock_threshold", "currency", "updated_at") VALUES
	(1, 'KENS GARAGE', 0, 5, 'PHP', '2026-02-16 07:18:26.348+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 38, true);


--
-- Name: bulb_type_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."bulb_type_variants_id_seq"', 41, true);


--
-- Name: bulb_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."bulb_types_id_seq"', 25, true);


--
-- Name: product_bulb_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_bulb_variants_id_seq"', 59, true);


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."product_categories_id_seq"', 8, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."products_id_seq"', 12, true);


--
-- Name: store_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."store_settings_id_seq"', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."suppliers_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict QYrOeJ5uWhZ19L9bzwjwekCteniYxhdMsys4QPe50Pdl2AIAs97qRQKWeD6lA3W

RESET ALL;
