SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict mWvrPpGdp8FEgRkD6JIDI6uk3CzxZ12746lQoiUliwzCocHBK34IaxaSWAFtHU0

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

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '7d689b2b-2001-4079-9f78-6139ed9ec87a', '{"action":"login","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-02-10 01:44:31.619708+00', ''),
	('00000000-0000-0000-0000-000000000000', '6be67989-345e-4f57-ba9c-af4d80b98f9c', '{"action":"token_refreshed","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-10 02:43:32.766396+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb330a6c-624c-4376-8e97-b621a5c38a26', '{"action":"token_revoked","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-10 02:43:32.794209+00', ''),
	('00000000-0000-0000-0000-000000000000', '902142f8-4c33-44bb-bab4-87070404fd60', '{"action":"token_refreshed","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-10 03:45:10.509988+00', ''),
	('00000000-0000-0000-0000-000000000000', '8b7c8301-968e-4302-a4b4-29db476fe630', '{"action":"token_revoked","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-10 03:45:10.527078+00', ''),
	('00000000-0000-0000-0000-000000000000', '8081311f-8398-4a80-bb25-f28fc5e0f6ac', '{"action":"logout","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"account"}', '2026-02-10 03:46:07.674855+00', ''),
	('00000000-0000-0000-0000-000000000000', '8804be4e-0c48-481f-aa95-87b05c9c9209', '{"action":"login","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-02-10 03:49:27.851097+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce7e4ae0-a25c-403e-8f79-bc23ff3b28bc', '{"action":"token_refreshed","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-12 08:00:12.871473+00', ''),
	('00000000-0000-0000-0000-000000000000', '764a98f9-c474-40cf-bd94-3ba5648e76d5', '{"action":"token_revoked","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-12 08:00:12.880427+00', ''),
	('00000000-0000-0000-0000-000000000000', '21d0aa03-eaf3-4bda-a75b-9d0f1437e9dd', '{"action":"logout","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"account"}', '2026-02-12 08:00:24.352792+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b37c5d6d-99f1-410d-b043-bb3264300c4d', '{"action":"login","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-02-12 08:02:20.546596+00', ''),
	('00000000-0000-0000-0000-000000000000', '814e2801-b0c7-461e-8b1d-e0316e55b8d9', '{"action":"token_refreshed","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-12 23:56:39.356254+00', ''),
	('00000000-0000-0000-0000-000000000000', '4fafb44e-f14e-429a-be59-b635239453e7', '{"action":"token_revoked","actor_id":"a132f8a8-619a-40df-ad4e-87c397a9fe0a","actor_username":"brian@kensgarage.com","actor_via_sso":false,"log_type":"token"}', '2026-02-12 23:56:39.373838+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	(NULL, 'c0314153-bc41-464b-a91d-db32be550f84', 'authenticated', 'authenticated', 'admin@kensgarage.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-02-10 01:35:53.979268+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-10 01:35:53.979268+00', '2026-02-10 01:35:53.979268+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'a132f8a8-619a-40df-ad4e-87c397a9fe0a', 'authenticated', 'authenticated', 'brian@kensgarage.com', '$2a$06$AUZ1QynAxReH2ALxy/Xjve7//OOS/PauugpsjLP7L.7GGEBZmU98G', '2026-02-10 01:42:53.363789+00', NULL, '', NULL, '', '2026-02-10 01:42:53.363789+00', '', '', NULL, '2026-02-12 08:02:20.557395+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2026-02-10 01:42:53.363789+00', '2026-02-12 23:56:39.392884+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



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
	('093b90b5-268e-44ff-9b1b-9d3a42b7e3e8', 'a132f8a8-619a-40df-ad4e-87c397a9fe0a', '2026-02-12 08:02:20.560932+00', '2026-02-12 23:56:39.419166+00', NULL, 'aal1', NULL, '2026-02-12 23:56:39.419031', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '172.18.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('093b90b5-268e-44ff-9b1b-9d3a42b7e3e8', '2026-02-12 08:02:20.587945+00', '2026-02-12 08:02:20.587945+00', 'password', 'bd22e5e1-ee21-446b-9813-876d3df8038a');


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
	('00000000-0000-0000-0000-000000000000', 38, 'zs6uxexypw4s', 'a132f8a8-619a-40df-ad4e-87c397a9fe0a', true, '2026-02-12 08:02:20.576829+00', '2026-02-12 23:56:39.375202+00', NULL, '093b90b5-268e-44ff-9b1b-9d3a42b7e3e8'),
	('00000000-0000-0000-0000-000000000000', 39, 'jtpoza7bzmhr', 'a132f8a8-619a-40df-ad4e-87c397a9fe0a', false, '2026-02-12 23:56:39.38445+00', '2026-02-12 23:56:39.38445+00', 'zs6uxexypw4s', '093b90b5-268e-44ff-9b1b-9d3a42b7e3e8');


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
-- Data for Name: Admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Admins" ("id", "email", "role", "created_at") VALUES
	('c0314153-bc41-464b-a91d-db32be550f84', 'admin@kensgarage.com', 'admin', '2026-02-10 01:35:53.979268+00'),
	('a132f8a8-619a-40df-ad4e-87c397a9fe0a', 'brian@kensgarage.com', 'owner', '2026-02-10 01:42:53.363789+00');


--
-- Data for Name: Parts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Parts" ("id", "created_at", "name", "description", "price", "quantity", "category", "minQuantity", "sku", "restock_quantity", "restocked_at") VALUES
	(8, '2026-02-10 01:35:47.017256+00', 'Tomei Expreme Ti', 'Titanium Exhaust', 1200, 4, 'Exhaust', 3, 'EXH-TOM-0008', 0, NULL),
	(7, '2026-02-10 01:35:47.017256+00', 'Walbro 450 Fuel Pump', 'E85 compatible pump', 140, 39, 'Fuel', 15, 'FUE-WAL-0007', 0, NULL),
	(4, '2026-02-10 01:35:47.017256+00', 'Tein Flex Z Coilovers', 'Adjustable suspension', 950, 6, 'Suspension', 5, 'SUS-TEI-0004', 0, NULL),
	(6, '2026-02-10 01:35:47.017256+00', 'Recaro Pole Position', 'Racing bucket seat', 1100, 5, 'Interior', 6, 'INT-REC-0006', 2, '2026-02-10 01:45:33.393+00'),
	(3, '2026-02-10 01:35:47.017256+00', 'Haltech Elite 1500', 'Standalone ECU', 1650, 3, 'Electronics', 4, 'ELE-HAL-0003', 0, NULL),
	(9, '2026-02-10 01:35:47.017256+00', 'Exedy Stage 1 Clutch', 'Organic disc clutch', 3500, 17, 'Drivetrain', 10, 'DRI-EXE-0009', 0, NULL),
	(5, '2026-02-10 01:35:47.017256+00', 'Brembo GT Brake Kit', '6-piston calipers', 3500, 8, 'Brakes', 3, 'BRA-BRE-0005', 1, '2026-02-10 01:45:12.471+00'),
	(2, '2026-02-10 01:35:47.017256+00', 'Garrett GT35 Turbo', 'Ball bearing turbocharger', 1450.5, 8, 'Forced Induction', 8, 'FOR-GAR-0002', 0, NULL),
	(10, '2026-02-10 01:35:47.017256+00', 'LS3 6.2L V8', 'American Muscle Crate', 8500, 3, 'Engine', 4, 'ENG-LS3-0010', 0, NULL),
	(1, '2026-02-10 01:35:47.017256+00', 'RB26DETT Crate Engine', 'Legendary Twin Turbo Inline-6', 15000, 3, 'Engine', 5, 'ENG-RB2-0001', 3, '2026-02-10 01:44:48.799+00');


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bulb_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."bulb_types" ("id", "code", "description", "base_type", "created_at") VALUES
	('e68bc744-06e2-47fc-abda-0344d7100666', 'H4', 'Dual filament high/low beam', 'P43T', '2026-02-13 00:04:13.707701+00'),
	('5c685240-2aee-481d-80ea-2e89dd7776f7', 'H7', 'Single filament low beam', 'PX26d', '2026-02-13 00:04:13.707701+00'),
	('439afd73-2c96-4c3f-b396-b0404dc92d85', '9005', 'Single filament high beam', 'P20d', '2026-02-13 00:04:13.707701+00'),
	('bfcb1d83-3736-4b2f-af10-c4bff2329b7d', '9006', 'Single filament low beam', 'P22d', '2026-02-13 00:04:13.707701+00'),
	('00d09adc-1c25-4564-b2ba-d0408d2c712c', '9007', 'Dual filament high/low beam', 'P29t', '2026-02-13 00:04:13.707701+00'),
	('027e3400-1055-45db-a502-0dbab6b83878', 'H11', 'Single filament low beam', 'PGJ19-2', '2026-02-13 00:04:13.707701+00'),
	('4e4b9577-61c9-41bb-857e-100d63d2cb3b', 'D2S', 'HID xenon bulb', 'P32d-2', '2026-02-13 00:04:13.707701+00'),
	('34dd4026-1315-4a95-a869-1c62d8a061dd', 'D4R', 'HID xenon bulb', 'P32d-5', '2026-02-13 00:04:13.707701+00');


--
-- Data for Name: car_brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."car_brands" ("id", "name", "country", "logo_url", "created_at", "updated_at") VALUES
	('95b97f76-5af4-4b97-b15c-2d951ae92ac5', 'Toyota', 'Japan', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('439a7555-a121-4dbb-a088-5e146bc0a3bf', 'Honda', 'Japan', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('d91d8a20-fd7b-4306-8d4c-2ae32fc99b3d', 'Mitsubishi', 'Japan', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('a14e8d01-42ea-47fd-b8c7-8aa760a84e1f', 'Ford', 'USA', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('6b03c844-5958-4dff-876b-cde54c98c548', 'Chevrolet', 'USA', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('360abb05-1bab-4bc8-881e-5f9f2a2e3910', 'BMW', 'Germany', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('4aef1f65-fadd-4646-957b-b55a5242f72f', 'Mercedes-Benz', 'Germany', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00'),
	('455cc79a-1d34-4ab2-b069-ec8b6120ad49', 'Audi', 'Germany', NULL, '2026-02-13 00:04:13.707701+00', '2026-02-13 00:04:13.707701+00');


--
-- Data for Name: car_models; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: kv_store_9ac7f27f; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: northwind; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."product_categories" ("id", "name", "description", "created_at") VALUES
	('c2a4e162-56b2-4a0d-ae4d-170782c16eaf', 'Headlight', 'Main front lighting assemblies', '2026-02-13 00:04:13.707701+00'),
	('8771edb9-fe21-40fc-841d-c402d03dced5', 'Fog Light', 'Auxiliary front fog lights', '2026-02-13 00:04:13.707701+00'),
	('ccb1bcb7-d0fe-493f-a464-42c6931ceec5', 'Brake Light', 'Rear brake lighting', '2026-02-13 00:04:13.707701+00'),
	('29f38ab4-be0d-4f03-acec-6e936754cd9f', 'Signal Light', 'Turn signal indicators', '2026-02-13 00:04:13.707701+00'),
	('4971ef29-ef53-45ac-82cb-05936a314607', 'Parking Light', 'Side marker and parking lights', '2026-02-13 00:04:13.707701+00'),
	('0adf2dcd-d3d2-4cd1-aac9-55c954eba859', 'Interior Light', 'Cabin and interior illumination', '2026-02-13 00:04:13.707701+00'),
	('c2fb8b9c-ab3d-4584-970b-000f3d3db43d', 'LED Light Bar', 'Auxiliary LED lighting bars', '2026-02-13 00:04:13.707701+00');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: product_car_compatibility; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sales" ("id", "created_at", "items", "subtotal", "tax", "total", "payment_method", "receipt_number", "customer_name", "customer_email", "transaction_status", "staff_id", "notes") VALUES
	('78453005-3c15-4ec9-91c4-849c53d773e2', '2026-02-10 01:58:28.462996+00', '[{"id": 3, "name": "Haltech Elite 1500", "price": 1650, "quantity": 1}, {"id": 4, "name": "Tein Flex Z Coilovers", "price": 950, "quantity": 1}, {"id": 9, "name": "Exedy Stage 1 Clutch", "price": 3500, "quantity": 1}, {"id": 5, "name": "Brembo GT Brake Kit", "price": 3500, "quantity": 1}]', 9600.00, 792.00, 10392.00, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL),
	('69055973-e12f-44a6-9789-501f101b1486', '2026-02-10 01:59:30.579526+00', '[{"id": 7, "name": "Walbro 450 Fuel Pump", "price": 140, "quantity": 1}, {"id": 1, "name": "RB26DETT Crate Engine", "price": 15000, "quantity": 1}, {"id": 10, "name": "LS3 6.2L V8", "price": 8500, "quantity": 1}, {"id": 4, "name": "Tein Flex Z Coilovers", "price": 950, "quantity": 1}, {"id": 3, "name": "Haltech Elite 1500", "price": 1650, "quantity": 1}, {"id": 9, "name": "Exedy Stage 1 Clutch", "price": 3500, "quantity": 1}, {"id": 6, "name": "Recaro Pole Position", "price": 1100, "quantity": 1}]', 30840.00, 2544.30, 33384.30, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL),
	('c9ef5ed7-351e-4659-96f4-8135dcdc020e', '2026-02-10 03:51:16.572004+00', '[{"id": 1, "name": "RB26DETT Crate Engine", "price": 15000, "quantity": 1}, {"id": 3, "name": "Haltech Elite 1500", "price": 1650, "quantity": 1}, {"id": 9, "name": "Exedy Stage 1 Clutch", "price": 3500, "quantity": 1}]', 20150.00, 6.04, 20156.05, 'Credit Card', NULL, NULL, NULL, 'completed', NULL, NULL),
	('645ae42b-9517-4c59-b3f6-7b8c81d865e8', '2026-02-12 08:04:59.352182+00', '[{"id": 2, "name": "Garrett GT35 Turbo", "price": 1450.5, "quantity": 4}]', 5802.00, 1.74, 5803.74, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL),
	('a8e2fb5b-bc0d-430a-86ab-b3b5699ba8ef', '2026-02-12 08:33:32.675964+00', '[{"id": 10, "name": "LS3 6.2L V8", "price": 8500, "quantity": 1}, {"id": 1, "name": "RB26DETT Crate Engine", "price": 15000, "quantity": 1}]', 23500.00, 7.05, 23507.05, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL);


--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."store_settings" ("id", "store_name", "tax_rate", "low_stock_threshold", "currency", "updated_at") VALUES
	(1, 'KEN''S GARAGE', 0.03, 10, 'PHP', '2026-02-10 03:50:47.164+00');


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



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
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
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
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 39, true);


--
-- Name: Engines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Engines_id_seq"', 10, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Users_id_seq"', 1, false);


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."cars_id_seq"', 1, false);


--
-- Name: northwind_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."northwind_id_seq"', 1, false);


--
-- Name: store_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."store_settings_id_seq"', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."suppliers_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict mWvrPpGdp8FEgRkD6JIDI6uk3CzxZ12746lQoiUliwzCocHBK34IaxaSWAFtHU0

RESET ALL;
