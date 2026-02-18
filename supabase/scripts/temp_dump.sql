SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict Z8eIsqmLvMOQ7tt0waRaziOkpsHmdKeHOclw0TIv7GdyiMTBzIkaWsoTTpMLktA

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
	(NULL, '8ff6faeb-f540-4e39-abf5-843d37728677', 'authenticated', 'authenticated', 'admin@kensgarage.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-02-10 01:20:26.359082+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-10 01:20:26.359082+00', '2026-02-10 01:20:26.359082+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', 'authenticated', 'authenticated', 'brian@kensgarage.com', '$2a$06$dUlK5o7qna/M2t7DVx5Ie.dskyoSxAIpy4hiDIJAifcBoN63FLrr6', '2026-02-09 04:48:49.137611+00', NULL, '', NULL, '', '2026-02-09 04:48:49.137611+00', '', '', NULL, '2026-02-09 09:19:28.74026+00', '{"provider": "email", "providers": ["email"]}', '{}', NULL, '2026-02-09 04:48:49.137611+00', '2026-02-10 13:21:27.712074+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', 'authenticated', 'authenticated', 'shaqleeambagan101@gmail.com', '$2a$10$KMMVPtQTaSqDM.tu1Jz6KOD5Y4LklzqlgBgkyA0oK051Bxi1pUJXu', '2026-02-07 18:13:55.049501+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-10 02:02:38.919454+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-07 18:13:55.012879+00', '2026-02-12 03:10:00.414683+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	(NULL, 'b49913b6-3d2e-400b-af5f-17dd31c8ffa6', 'authenticated', 'authenticated', 'deviy63349@helesco.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-09 17:23:47.367096+00', '2026-02-09 17:23:47.367096+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '{"sub": "dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8", "email": "shaqleeambagan101@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-07 18:13:55.037139+00', '2026-02-07 18:13:55.037213+00', '2026-02-07 18:13:55.037213+00', '1bc6bda9-aa46-4e2f-8721-e0a2ddce4e04');


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
	('c2951886-94be-44b9-9678-e04fc40ed85a', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '2026-02-09 10:21:34.944976+00', '2026-02-09 10:21:34.944976+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/547.0.0.25.107;FBBV/875193976;FBDV/iPhone13,3;FBMD/iPhone;FBSN/iOS;FBSV/26.2.1;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('41ffdfc7-891f-43fb-b225-7fb3a7d7e606', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', '2026-02-09 09:02:35.420659+00', '2026-02-09 13:08:35.698543+00', NULL, 'aal1', NULL, '2026-02-09 13:08:35.69842', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '175.176.66.47', NULL, NULL, NULL, NULL, NULL),
	('c022c9d6-14b0-4f2f-90a3-438ee7460cbd', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '2026-02-09 18:00:01.524858+00', '2026-02-10 00:55:00.601411+00', NULL, 'aal1', NULL, '2026-02-10 00:55:00.601303', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('025abbf8-aa1f-4e83-9c55-98b48e456ce9', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '2026-02-10 01:47:58.8452+00', '2026-02-10 01:47:58.8452+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('673bcee0-ecc2-4b19-b71b-7b04e216f0d7', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', '2026-02-09 04:50:31.844635+00', '2026-02-09 04:50:31.844635+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('97107350-0e9e-4c71-8da5-6f5f2228c949', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', '2026-02-09 09:19:28.740343+00', '2026-02-10 13:21:27.721444+00', NULL, 'aal1', NULL, '2026-02-10 13:21:27.721336', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Brave/1 Mobile/15E148 Safari/604.1', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('e3f52d6a-9715-48b0-b3c5-42f73479df9b', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '2026-02-10 02:02:38.920215+00', '2026-02-11 01:47:37.757111+00', NULL, 'aal1', NULL, '2026-02-11 01:47:37.757012', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '180.190.5.56', NULL, NULL, NULL, NULL, NULL),
	('71691504-f92c-48fa-9466-79e9cc77d770', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', '2026-02-09 17:58:52.844298+00', '2026-02-12 03:10:00.427931+00', NULL, 'aal1', NULL, '2026-02-12 03:10:00.427811', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', '103.68.159.54', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('673bcee0-ecc2-4b19-b71b-7b04e216f0d7', '2026-02-09 04:50:31.85687+00', '2026-02-09 04:50:31.85687+00', 'password', 'f8aef3c8-333e-4df4-a84c-506b0ca4e698'),
	('41ffdfc7-891f-43fb-b225-7fb3a7d7e606', '2026-02-09 09:02:35.461684+00', '2026-02-09 09:02:35.461684+00', 'password', '52953b7d-2b68-4760-9536-f88820e61418'),
	('97107350-0e9e-4c71-8da5-6f5f2228c949', '2026-02-09 09:19:28.760019+00', '2026-02-09 09:19:28.760019+00', 'password', 'cce2552f-c403-44d8-b6b1-4e5b969da239'),
	('c2951886-94be-44b9-9678-e04fc40ed85a', '2026-02-09 10:21:34.994389+00', '2026-02-09 10:21:34.994389+00', 'password', 'ae1cc817-bae8-48c8-a1c2-b5892478a363'),
	('71691504-f92c-48fa-9466-79e9cc77d770', '2026-02-09 17:58:52.893725+00', '2026-02-09 17:58:52.893725+00', 'password', 'a1c9a3f5-6c42-4f07-8745-4eb33d4b5d3f'),
	('c022c9d6-14b0-4f2f-90a3-438ee7460cbd', '2026-02-09 18:00:01.532249+00', '2026-02-09 18:00:01.532249+00', 'password', 'de7716af-4ead-4bb9-8116-aa9af1086534'),
	('025abbf8-aa1f-4e83-9c55-98b48e456ce9', '2026-02-10 01:47:58.881915+00', '2026-02-10 01:47:58.881915+00', 'password', '16191c92-b352-448a-9493-052181cbc410'),
	('e3f52d6a-9715-48b0-b3c5-42f73479df9b', '2026-02-10 02:02:38.947436+00', '2026-02-10 02:02:38.947436+00', 'password', '19f68139-6be4-4b35-add8-d41f05f228b8');


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
	('00000000-0000-0000-0000-000000000000', 46, 'd2nckc3y6dsr', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 12:59:33.757343+00', '2026-02-11 01:47:37.692211+00', 'wej6dgdefcl2', 'e3f52d6a-9715-48b0-b3c5-42f73479df9b'),
	('00000000-0000-0000-0000-000000000000', 48, '2fbp6vsmxv3s', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', false, '2026-02-11 01:47:37.724778+00', '2026-02-11 01:47:37.724778+00', 'd2nckc3y6dsr', 'e3f52d6a-9715-48b0-b3c5-42f73479df9b'),
	('00000000-0000-0000-0000-000000000000', 45, 'nrcxmlqsawxd', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 11:58:11.819985+00', '2026-02-12 03:10:00.375987+00', '6juguchwst3j', '71691504-f92c-48fa-9466-79e9cc77d770'),
	('00000000-0000-0000-0000-000000000000', 49, '6zx5wo63xqkf', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', false, '2026-02-12 03:10:00.398956+00', '2026-02-12 03:10:00.398956+00', 'nrcxmlqsawxd', '71691504-f92c-48fa-9466-79e9cc77d770'),
	('00000000-0000-0000-0000-000000000000', 23, 'inngungnjs5o', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', false, '2026-02-09 04:50:31.850575+00', '2026-02-09 04:50:31.850575+00', NULL, '673bcee0-ecc2-4b19-b71b-7b04e216f0d7'),
	('00000000-0000-0000-0000-000000000000', 32, 'i3hyduufbcii', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', false, '2026-02-09 10:21:34.973864+00', '2026-02-09 10:21:34.973864+00', NULL, 'c2951886-94be-44b9-9678-e04fc40ed85a'),
	('00000000-0000-0000-0000-000000000000', 31, 'hkkkaz3xw3zh', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', true, '2026-02-09 09:19:28.751804+00', '2026-02-09 12:45:53.711061+00', NULL, '97107350-0e9e-4c71-8da5-6f5f2228c949'),
	('00000000-0000-0000-0000-000000000000', 29, '6yukwudsmxp5', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', true, '2026-02-09 09:02:35.449304+00', '2026-02-09 13:08:35.646258+00', NULL, '41ffdfc7-891f-43fb-b225-7fb3a7d7e606'),
	('00000000-0000-0000-0000-000000000000', 34, 'rhilf2pne7py', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', false, '2026-02-09 13:08:35.674002+00', '2026-02-09 13:08:35.674002+00', '6yukwudsmxp5', '41ffdfc7-891f-43fb-b225-7fb3a7d7e606'),
	('00000000-0000-0000-0000-000000000000', 36, 'pjdysy55mfbi', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-09 18:00:01.526845+00', '2026-02-10 00:55:00.543514+00', NULL, 'c022c9d6-14b0-4f2f-90a3-438ee7460cbd'),
	('00000000-0000-0000-0000-000000000000', 35, '376ctke3u7br', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-09 17:58:52.875868+00', '2026-02-10 00:55:00.543883+00', NULL, '71691504-f92c-48fa-9466-79e9cc77d770'),
	('00000000-0000-0000-0000-000000000000', 37, 'mgibsdemwc6u', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', false, '2026-02-10 00:55:00.574759+00', '2026-02-10 00:55:00.574759+00', 'pjdysy55mfbi', 'c022c9d6-14b0-4f2f-90a3-438ee7460cbd'),
	('00000000-0000-0000-0000-000000000000', 39, '76prnfuwdhym', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', false, '2026-02-10 01:47:58.862772+00', '2026-02-10 01:47:58.862772+00', NULL, '025abbf8-aa1f-4e83-9c55-98b48e456ce9'),
	('00000000-0000-0000-0000-000000000000', 40, 'bkeeei36ssp4', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 02:02:38.93378+00', '2026-02-10 03:24:12.61136+00', NULL, 'e3f52d6a-9715-48b0-b3c5-42f73479df9b'),
	('00000000-0000-0000-0000-000000000000', 33, 'kl4wv3xc67du', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', true, '2026-02-09 12:45:53.739889+00', '2026-02-10 03:53:13.342249+00', 'hkkkaz3xw3zh', '97107350-0e9e-4c71-8da5-6f5f2228c949'),
	('00000000-0000-0000-0000-000000000000', 42, '4svux5eh77no', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', true, '2026-02-10 03:53:13.362039+00', '2026-02-10 06:16:01.408073+00', 'kl4wv3xc67du', '97107350-0e9e-4c71-8da5-6f5f2228c949'),
	('00000000-0000-0000-0000-000000000000', 41, 'cip3o24xbnev', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 03:24:12.639795+00', '2026-02-10 11:58:07.835271+00', 'bkeeei36ssp4', 'e3f52d6a-9715-48b0-b3c5-42f73479df9b'),
	('00000000-0000-0000-0000-000000000000', 38, '6juguchwst3j', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 00:55:00.574771+00', '2026-02-10 11:58:11.819612+00', '376ctke3u7br', '71691504-f92c-48fa-9466-79e9cc77d770'),
	('00000000-0000-0000-0000-000000000000', 44, 'wej6dgdefcl2', 'dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', true, '2026-02-10 11:58:07.868855+00', '2026-02-10 12:59:33.736076+00', 'cip3o24xbnev', 'e3f52d6a-9715-48b0-b3c5-42f73479df9b'),
	('00000000-0000-0000-0000-000000000000', 43, '3tdg2yugu3cx', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', true, '2026-02-10 06:16:01.430253+00', '2026-02-10 13:21:27.684033+00', '4svux5eh77no', '97107350-0e9e-4c71-8da5-6f5f2228c949'),
	('00000000-0000-0000-0000-000000000000', 47, 'lx5sth4jg6ut', '0df66a1a-ef14-413c-87ac-2b5f0b81576b', false, '2026-02-10 13:21:27.702138+00', '2026-02-10 13:21:27.702138+00', '3tdg2yugu3cx', '97107350-0e9e-4c71-8da5-6f5f2228c949');


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
	('dd03bcb8-cdf9-4c3b-b95d-a87a703f1ac8', 'shaqleeambagan101@gmail.com', 'owner', '2026-02-07 18:16:26.636664+00'),
	('0df66a1a-ef14-413c-87ac-2b5f0b81576b', 'brian@kensgarage.com', 'admin', '2026-02-09 04:48:49.137611+00'),
	('b49913b6-3d2e-400b-af5f-17dd31c8ffa6', 'deviy63349@helesco.com', 'admin', '2026-02-09 17:24:02.609551+00'),
	('8ff6faeb-f540-4e39-abf5-843d37728677', 'admin@kensgarage.com', 'admin', '2026-02-10 01:20:28.599382+00');


--
-- Data for Name: Parts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Parts" ("id", "created_at", "name", "description", "price", "quantity", "category", "minQuantity", "sku", "restocked_at", "restock_quantity") VALUES
	(2, '2026-02-07 13:57:27.48343+00', '2JZ-GTE Non-VVTi', 'Bulletproof 3.0L Inline-6 Iron Block. Capable of 1000HP stock block.', 12500, 55, 'Engine & Internals', 9, 'ENG-2JZ-0002', '2026-02-10 01:26:16.250356+00', 25),
	(42, '2026-02-07 13:57:27.48343+00', 'Brembo GT Brake Kit', '6-piston big brake kit with drilled rotors.', 3500, 25, 'Brakes', 6, 'BRA-BRE-0042', NULL, 0),
	(44, '2026-02-07 13:57:27.48343+00', 'EBC Redstuff Pads', 'Ceramic low dust brake pads for street use.', 120, 49, 'Brakes', 17, 'BRA-EBC-0044', NULL, 0),
	(3, '2026-02-07 13:57:27.48343+00', 'LS3 6.2L V8', 'American muscle standard crate motor. 430HP out of the box.', 8500, 25, 'Engine & Internals', 17, 'ENG-LS3-0003', '2026-02-10 01:26:41.510141+00', 10),
	(45, '2026-02-07 13:57:27.48343+00', 'StopTech Braided Lines', 'Stainless steel lines for better pedal feel.', 110, 26, 'Brakes', 13, 'BRA-STO-0045', NULL, 0),
	(6, '2026-02-07 13:57:27.48343+00', 'Garrett GT35 Turbo', 'Ball bearing turbocharger perfect for 500-700HP builds.', 1450.5, 14, 'Forced Induction', 14, 'FOR-GAR-0006', '2026-02-12 03:11:55.064+00', 5),
	(4, '2026-02-07 13:57:27.48343+00', 'Honda K20A Type-R', 'High revving 2.0L i-VTEC engine. 8500 RPM redline.', 6500, 13, 'Engine & Internals', 12, 'ENG-HON-0004', NULL, 0),
	(46, '2026-02-07 13:57:27.48343+00', 'Sparco Evo QRT Seat', 'Fiberglass racing bucket seat. FIA approved.', 750, 5, 'Interior & Safety', 5, 'INT-SPA-0046', NULL, 0),
	(47, '2026-02-07 13:57:27.48343+00', 'Recaro Pole Position', 'The classic racing shell. Ergonomic perfection.', 1100, 19, 'Engine & Internals', 14, 'ENG-REC-0047', NULL, 0),
	(39, '2026-02-07 13:57:27.48343+00', 'Tein Flex Z Coilovers', 'Adjustable ride height and damping force.', 950, 10, 'Suspension & Handling', 10, 'SUS-TEI-0039', NULL, 0),
	(1, '2026-02-07 13:57:27.48343+00', 'RB26DETT Crate Engine', 'Legendary Twin Turbo Inline-6 for Skyline builds. The Godzilla heart.', 15000, 9, 'Engine & Internals', 9, 'ENG-RB2-0001', '2026-02-10 01:48:55.387+00', 7),
	(49, '2026-02-07 13:57:27.48343+00', 'Momo Steering Wheel', 'Leather steering wheel 350mm. Made in Italy.', 220, 10, 'Interior & Safety', 9, 'INT-MOM-0049', NULL, 0),
	(9, '2026-02-07 13:57:27.48343+00', 'HKS Super SQV4 BOV', 'The signature high-pitched sequential blow off sound.', 250, 18, 'Forced Induction', 13, 'FOR-HKS-0009', NULL, 0),
	(43, '2026-02-07 13:57:27.48343+00', 'Wilwood Big Brakes', '4-piston calipers for serious track days.', 1800, 14, 'Brakes', 14, 'BRA-WIL-0043', '2026-02-10 02:02:57.831+00', 2),
	(38, '2026-02-07 13:57:27.48343+00', 'Competition Twin Disc', 'Ceramic twin disc clutch for 800HP+ monsters.', 1200, 5, 'Engine & Internals', 5, 'ENG-COM-0038', '2026-02-10 02:03:03.099+00', 1),
	(8, '2026-02-07 13:57:27.48343+00', 'BorgWarner S400SX', 'Heavy duty twin-scroll turbo. Massive flow rates.', 950, 20, 'Engine & Internals', 14, 'ENG-BOR-0008', NULL, 0),
	(7, '2026-02-07 13:57:27.48343+00', 'Precision 6266 Gen 2', 'Rated for 800HP. The drag racing standard.', 1850, 40, 'Engine & Internals', 16, 'ENG-PRE-0007', NULL, 0),
	(40, '2026-02-07 13:57:27.48343+00', 'KW V3 Coilovers', 'Independent compression and rebound adjustment.', 2400, 30, 'Suspension & Handling', 7, 'SUS-KW -0040', NULL, 0),
	(41, '2026-02-07 13:57:27.48343+00', 'BC Racing BR Series', 'The best entry level adjustable coilovers.', 1050, 41, 'Suspension & Handling', 16, 'SUS-BC -0041', NULL, 0),
	(48, '2026-02-07 13:57:27.48343+00', 'Takata Drift Harness', '4-point street legal harness in signature green.', 250, 27, 'Interior & Safety', 20, 'INT-TAK-0048', NULL, 0),
	(5, '2026-02-07 13:57:27.48343+00', 'SR20DET Black Top', '2.0L Turbo engine famous for drifting applications.', 4500, 11, 'Engine & Internals', 10, 'ENG-SR2-0005', NULL, 0),
	(10, '2026-02-07 13:57:27.48343+00', 'Tial Q 50mm BOV', 'High flow blow off valve for high boost applications.', 285, 20, 'Forced Induction', 19, 'FOR-TIA-0010', NULL, 0),
	(50, '2026-02-07 13:57:27.48343+00', 'AEM Wideband Gauge', 'Digital Air Fuel Ratio Gauge. Essential for tuning.', 190, 34, 'Electronics & Tuning', 15, 'ELE-AEM-0050', NULL, 0),
	(12, '2026-02-07 13:57:27.48343+00', 'Mishimoto Radiator', 'Triple core aluminum radiator for maximum cooling.', 350, 18, 'Engine & Internals', 11, 'ENG-MIS-0012', NULL, 0),
	(13, '2026-02-07 13:57:27.48343+00', 'K&N Cold Air Intake', 'High flow air filter system adds +10HP.', 320, 30, 'Engine & Internals', 14, 'ENG-K&N-0013', NULL, 0),
	(14, '2026-02-07 13:57:27.48343+00', 'AEM V2 Intake', 'Tuned length intake pipe for mid-range torque.', 290, 22, 'Engine & Internals', 13, 'ENG-AEM-0014', NULL, 0),
	(16, '2026-02-07 13:57:27.48343+00', 'Edelbrock V8 Intake', 'Classic carbureted intake manifold for small blocks.', 450, 12, 'Engine & Internals', 8, 'ENG-EDE-0016', NULL, 0),
	(17, '2026-02-07 13:57:27.48343+00', 'Walbro 450 Fuel Pump', 'E85 compatible in-tank pump. Supports 500HP+.', 140, 40, 'Fuel & Ignition', 14, 'FUE-WAL-0017', NULL, 0),
	(18, '2026-02-07 13:57:27.48343+00', 'ID1050x Injectors', 'Set of 4 high impedance fuel injectors. The gold standard.', 550, 15, 'Fuel & Ignition', 10, 'FUE-ID1-0018', NULL, 0),
	(19, '2026-02-07 13:57:27.48343+00', 'Aeromotive Regulator', 'Adjustable fuel pressure regulator with gauge.', 180, 20, 'Fuel & Ignition', 19, 'FUE-AER-0019', NULL, 0),
	(11, '2026-02-07 13:57:27.48343+00', 'GReddy Intercooler Kit', 'Large core front mount intercooler with polished piping.', 850, 15, 'Forced Induction', 15, 'FOR-GRE-0011', NULL, 0),
	(15, '2026-02-07 13:57:27.48343+00', 'Skunk2 Pro Manifold', 'High flow intake manifold for Honda K-Series.', 650, 17, 'Engine & Internals', 17, 'ENG-SKU-0015', NULL, 0),
	(20, '2026-02-07 13:57:27.48343+00', 'Haltech Elite 1500', 'Standalone engine management system. Full control.', 1650, 10, 'Electronics & Tuning', 10, 'ELE-HAL-0020', NULL, 0),
	(52, '2026-02-10 01:20:51.920542+00', 'RB26DETT Crate Engine', 'Nissan RB26DETT twin-turbo inline-6 engine', 8500, 6, 'Engines', 5, 'RB26-001', NULL, 0),
	(53, '2026-02-10 01:20:51.920542+00', '2JZ-GTE Engine', 'Toyota Supra 2JZ-GTE twin-turbo engine', 12000, 9, 'Engines', 3, '2JZ-001', NULL, 0),
	(25, '2026-02-07 13:57:27.48343+00', 'ARP Head Studs', 'High tensile strength studs. Never blow a gasket again.', 180, 35, 'Engine & Internals', 17, 'ENG-ARP-0025', NULL, 0),
	(26, '2026-02-07 13:57:27.48343+00', 'Cometic Head Gasket', 'Multi-layer steel gasket for boosted engines.', 120, 40, 'Engine & Internals', 20, 'ENG-COM-0026', NULL, 0),
	(27, '2026-02-07 13:57:27.48343+00', 'Brian Crower Cams', 'Stage 2 aggressive camshaft profile for street/strip.', 550, 10, 'Engine & Internals', 10, 'ENG-BRI-0027', NULL, 0),
	(28, '2026-02-07 13:57:27.48343+00', 'Tomei Poncams', 'Drop-in camshafts for SR20DET. No tuning required.', 480, 14, 'Engine & Internals', 8, 'ENG-TOM-0028', NULL, 0),
	(29, '2026-02-07 13:57:27.48343+00', 'Supertech Springs', 'Titanium retainers and dual valve springs.', 350, 16, 'Engine & Internals', 15, 'ENG-SUP-0029', NULL, 0),
	(36, '2026-02-07 13:57:27.48343+00', 'Exedy Stage 1 Clutch', 'Organic disc heavy duty pressure plate.', 350, 20, 'Drivetrain', 5, 'DRI-EXE-0036', NULL, 0),
	(37, '2026-02-07 13:57:27.48343+00', 'ACT 6-Puck Clutch', 'High torque capacity sprung hub for track use.', 550, 12, 'Drivetrain', 8, 'DRI-ACT-0037', NULL, 0),
	(21, '2026-02-07 13:57:27.48343+00', 'MoTeC M130 ECU', 'Professional grade motorsport ECU. If you have to ask...', 3200, 12, 'Electronics & Tuning', 10, 'ELE-MOT-0021', NULL, 0),
	(22, '2026-02-07 13:57:27.48343+00', 'AEM Infinity 506', 'Programmable ECU for race cars and swaps.', 1400, 14, 'Electronics & Tuning', 14, 'ELE-AEM-0022', NULL, 0),
	(23, '2026-02-07 13:57:27.48343+00', 'CP Forged Pistons', 'High compression piston set 86mm bore.', 750, 18, 'Engine & Internals', 17, 'ENG-CP -0023', NULL, 0),
	(24, '2026-02-07 13:57:27.48343+00', 'Manley H-Beam Rods', 'Steel connecting rods rated for high torque.', 450, 18, 'Engine & Internals', 13, 'ENG-MAN-0024', NULL, 0),
	(30, '2026-02-07 13:57:27.48343+00', 'Magnaflow Exhaust', 'Stainless steel performance catback system.', 850, 18, 'Exhaust System', 18, 'EXH-MAG-0030', NULL, 0),
	(31, '2026-02-07 13:57:27.48343+00', 'Borla ATAK Exhaust', 'Aggressive sound level. Wake up the neighbors.', 1100, 19, 'Exhaust System', 13, 'EXH-BOR-0031', NULL, 0),
	(32, '2026-02-07 13:57:27.48343+00', 'Invidia N1 Exhaust', 'Single exit titanium tip exhaust. JDM style.', 650, 16, 'Exhaust System', 15, 'EXH-INV-0032', NULL, 0),
	(33, '2026-02-07 13:57:27.48343+00', 'Tomei Expreme Ti', 'Full titanium ultra lightweight exhaust system.', 1200, 7, 'Exhaust System', 6, 'EXH-TOM-0033', NULL, 0),
	(34, '2026-02-07 13:57:27.48343+00', 'NOS Sniper Kit', 'Wet nitrous system. 75HP shot at the push of a button.', 450, 20, 'Fuel & Ignition', 20, 'FUE-NOS-0034', NULL, 0),
	(35, '2026-02-07 13:57:27.48343+00', 'ZEX Nitrous System', 'Safe nitrous activation for stock engines.', 550, 20, 'Fuel & Ignition', 20, 'FUE-ZEX-0035', NULL, 0),
	(54, '2026-02-10 01:20:51.920542+00', 'K20A Engine', 'Honda K20A high-revving inline-4 engine', 4500, 4, 'Engines', 2, 'K20A-001', NULL, 0),
	(55, '2026-02-10 01:20:51.920542+00', 'LS3 V8 Engine', 'GM LS3 6.2L V8 engine', 6500, 3, 'Engines', 2, 'LS3-001', NULL, 0),
	(56, '2026-02-10 01:20:51.920542+00', 'Brembo Brake Kit', 'Brembo big brake kit front and rear', 1200, 8, 'Brakes', 5, 'BRK-001', NULL, 0),
	(57, '2026-02-10 01:20:51.920542+00', 'Ohlins Coilovers', 'Ohlins Road & Track coilover suspension', 3200, 5, 'Suspension', 3, 'SUS-001', NULL, 0),
	(58, '2026-02-10 01:20:51.920542+00', 'BBS Wheels', 'BBS FI-R 18x9.5 wheels set of 4', 2800, 6, 'Wheels', 2, 'WHL-001', NULL, 0),
	(59, '2026-02-10 01:20:51.920542+00', 'Michelin Pilot Sport 4S', 'Michelin PS4S 265/35R18 tires', 350, 20, 'Tires', 10, 'TIR-001', NULL, 0),
	(60, '2026-02-10 01:20:51.920542+00', 'Borla Exhaust System', 'Borla cat-back exhaust system', 800, 7, 'Exhaust', 3, 'EXH-001', NULL, 0),
	(61, '2026-02-10 01:20:51.920542+00', 'Recaro Seats', 'Recaro Sportster CS seats pair', 1800, 4, 'Interior', 2, 'INT-001', NULL, 0),
	(62, '2026-02-10 01:20:51.920542+00', 'Garrett Turbo', 'Garrett GT3582R turbocharger', 1500, 3, 'Turbo', 2, 'TRB-001', NULL, 0),
	(63, '2026-02-10 01:20:51.920542+00', 'AEM EMS', 'AEM Infinity 6 ECU', 1200, 6, 'Electronics', 3, 'ECU-001', NULL, 0),
	(64, '2026-02-10 01:20:51.920542+00', 'Wilwood Discs', 'Wilwood 14-inch brake discs', 450, 12, 'Brakes', 5, 'DSC-001', NULL, 0),
	(65, '2026-02-10 01:20:51.920542+00', 'HKS Intercooler', 'HKS front-mount intercooler kit', 650, 9, 'Cooling', 4, 'INT-001', NULL, 0),
	(66, '2026-02-10 01:20:51.920542+00', 'Mishimoto Radiator', 'Mishimoto aluminum radiator', 380, 15, 'Cooling', 8, 'RAD-001', NULL, 0),
	(67, '2026-02-10 01:20:51.920542+00', 'Nismo Differential', 'Nismo GT-R differential', 2200, 2, 'Drivetrain', 1, 'DIF-001', NULL, 0),
	(68, '2026-02-10 01:20:51.920542+00', 'Exedy Clutch', 'Exedy Stage 3 clutch kit', 550, 8, 'Drivetrain', 4, 'CLT-001', NULL, 0),
	(69, '2026-02-10 01:20:51.920542+00', 'NGK Spark Plugs', 'NGK Iridium spark plugs set of 6', 85, 25, 'Ignition', 15, 'SPK-001', NULL, 0),
	(70, '2026-02-10 01:20:51.920542+00', 'Mobil 1 Oil', 'Mobil 1 5W-30 synthetic oil 5qt', 45, 30, 'Fluids', 20, 'OIL-001', NULL, 0),
	(71, '2026-02-10 01:20:51.920542+00', 'Hella Lights', 'Hella 500FF driving lights pair', 320, 10, 'Lighting', 5, 'LGT-001', NULL, 0);


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Users" ("id", "created_at", "userName", "email") VALUES
	(1, '2026-02-07 02:54:06.377318+00', 'Shaq Lee', 'shaqleeambagan101@gmail.com');


--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cars" ("id", "created_at", "carName", "carBrand", "carColor", "quantity", "price") VALUES
	(1, '2026-02-05 07:47:31.999836+00', 'Toyota vios', 'Toyota', 'Black', 8, 9000);


--
-- Data for Name: kv_store_9ac7f27f; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: northwind; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sales" ("id", "created_at", "items", "subtotal", "tax", "total", "payment_method", "customer_name", "customer_email", "receipt_number", "transaction_status", "staff_id", "notes") VALUES
	('6f445de4-90aa-4db3-b6da-9d6e3c042875', '2026-02-08 13:28:46.57875+00', '[{"id": 7, "name": "Precision 6266 Gen 2", "price": 1850, "quantity": 3}, {"id": 9, "name": "HKS Super SQV4 BOV", "price": 250, "quantity": 2}]', 6050.00, 499.13, 6549.13, 'Credit Card', NULL, NULL, 'RCP-20260208-6f445d', 'completed', NULL, NULL),
	('e9642ab0-4c1d-4301-8d9e-32943995103c', '2026-02-08 13:29:27.312198+00', '[{"id": 10, "name": "Tial Q 50mm BOV", "price": 285, "quantity": 4}]', 1140.00, 94.05, 1234.05, 'Credit Card', NULL, NULL, 'RCP-20260208-e9642a', 'completed', NULL, NULL),
	('ef918376-078f-47be-98fa-ed824640faa2', '2026-02-08 13:31:32.311799+00', '[{"id": 45, "name": "StopTech Braided Lines", "price": 110, "quantity": 3}]', 330.00, 27.23, 357.23, 'Credit Card', NULL, NULL, 'RCP-20260208-ef9183', 'completed', NULL, NULL),
	('3aaa90ac-1446-4066-bc31-42b06eb1ad57', '2026-02-08 14:09:30.606212+00', '[{"id": 46, "name": "Sparco Evo QRT Seat", "price": 750, "quantity": 1}]', 750.00, 61.88, 811.88, 'Cash', NULL, NULL, 'RCP-20260208-3aaa90', 'completed', NULL, NULL),
	('34d7f785-2e55-41b7-944d-45c50ec4d87a', '2026-02-08 14:27:53.826631+00', '[{"id": 40, "name": "KW V3 Coilovers", "price": 2400, "quantity": 3}, {"id": 48, "name": "Takata Drift Harness", "price": 250, "quantity": 5}, {"id": 2, "name": "2JZ-GTE Non-VVTi", "price": 12500, "quantity": 2}, {"id": 4, "name": "Honda K20A Type-R", "price": 6500, "quantity": 2}, {"id": 9, "name": "HKS Super SQV4 BOV", "price": 250, "quantity": 3}, {"id": 7, "name": "Precision 6266 Gen 2", "price": 1850, "quantity": 3}, {"id": 6, "name": "Garrett GT35 Turbo", "price": 1450.5, "quantity": 3}, {"id": 8, "name": "BorgWarner S400SX", "price": 950, "quantity": 12}]', 68501.50, 5651.37, 74152.87, 'Cash', NULL, NULL, 'RCP-20260208-34d7f7', 'completed', NULL, NULL),
	('3b5456ad-a8b1-4465-a896-e52c0ef1b4b9', '2026-02-08 16:33:11.10768+00', '[{"id": 9, "name": "HKS Super SQV4 BOV", "price": 250, "quantity": 1}]', 250.00, 17.50, 267.50, 'Cash', NULL, NULL, 'RCP-20260208-3b5456', 'completed', NULL, NULL),
	('2c69efaf-e313-4fc7-88f4-55f91d86f8c1', '2026-02-08 17:00:53.852958+00', '[{"id": 48, "name": "Takata Drift Harness", "price": 250, "quantity": 5}, {"id": 7, "name": "Precision 6266 Gen 2", "price": 1850, "quantity": 2}, {"id": 42, "name": "Brembo GT Brake Kit", "price": 3500, "quantity": 2}]', 11950.00, 836.50, 12786.50, 'Credit Card', NULL, NULL, 'RCP-20260208-2c69ef', 'completed', NULL, NULL),
	('ce7061be-b1fe-47db-a085-d648d3177beb', '2026-02-08 17:09:50.916373+00', '[{"id": 4, "name": "Honda K20A Type-R", "price": 6500, "quantity": 1}, {"id": 5, "name": "SR20DET Black Top", "price": 4500, "quantity": 1}]', 11000.00, 770.00, 11770.00, 'Cash', NULL, NULL, 'RCP-20260208-ce7061', 'completed', NULL, NULL),
	('040ce372-312b-4b52-a040-65d2ca303e3c', '2026-02-09 04:52:57.325714+00', '[{"id": 6, "name": "Garrett GT35 Turbo", "price": 1450.5, "quantity": 2}, {"id": 39, "name": "Tein Flex Z Coilovers", "price": 950, "quantity": 3}]', 5751.00, 517.59, 6268.59, 'Cash', NULL, NULL, 'RCP-20260209-040ce3', 'completed', NULL, NULL),
	('46f7c2c3-8db8-4418-9f55-b91e8ccbdb25', '2026-02-09 06:05:58.402223+00', '[{"id": 40, "name": "KW V3 Coilovers", "price": 2400, "quantity": 2}]', 4800.00, 432.00, 5232.00, 'Cash', NULL, NULL, 'RCP-20260209-46f7c2', 'completed', NULL, NULL),
	('5644da07-1d97-4012-a48f-d7bdd99e9aab', '2026-02-09 06:06:38.691575+00', '[{"id": 10, "name": "Tial Q 50mm BOV", "price": 285, "quantity": 2}, {"id": 48, "name": "Takata Drift Harness", "price": 250, "quantity": 1}, {"id": 5, "name": "SR20DET Black Top", "price": 4500, "quantity": 1}]', 5320.00, 478.80, 5798.80, 'Cash', NULL, NULL, 'RCP-20260209-5644da', 'completed', NULL, NULL),
	('954db400-11ea-42ee-8c9b-7488e5472880', '2026-02-10 01:50:53.25815+00', '[{"id": 49, "name": "Momo Steering Wheel", "price": 220, "quantity": 4}]', 880.00, 79.20, 959.20, 'Cash', NULL, NULL, 'RCP-20260210-954db4', 'completed', NULL, NULL),
	('e3de8815-0374-4faa-8ee9-37742f9a4190', '2026-02-10 01:51:45.270731+00', '[{"id": 43, "name": "Wilwood Big Brakes", "price": 1800, "quantity": 4}]', 7200.00, 648.00, 7848.00, 'Cash', NULL, NULL, 'RCP-20260210-e3de88', 'completed', NULL, NULL),
	('2ff45e17-16e0-4a1d-8883-be8f7efab765', '2026-02-10 01:53:12.480637+00', '[{"id": 38, "name": "Competition Twin Disc", "price": 1200, "quantity": 1}, {"id": 47, "name": "Recaro Pole Position", "price": 1100, "quantity": 1}, {"id": 1, "name": "RB26DETT Crate Engine", "price": 15000, "quantity": 1}, {"id": 49, "name": "Momo Steering Wheel", "price": 220, "quantity": 1}, {"id": 9, "name": "HKS Super SQV4 BOV", "price": 250, "quantity": 1}]', 17770.00, 1599.30, 19369.30, 'Cash', NULL, NULL, 'RCP-20260210-2ff45e', 'completed', NULL, NULL),
	('15b792f2-f45f-411e-8010-0cedf5bdfd10', '2026-02-09 23:56:15.812998+00', '[{"id": 1, "sku": "RB26-001", "name": "RB26DETT Crate Engine", "price": 8500.00, "quantity": 1, "subtotal": 8500.00}, {"id": 18, "sku": "SPK-001", "name": "NGK Spark Plugs", "price": 85.00, "quantity": 2, "subtotal": 170.00}]', 8670.00, 693.60, 9363.60, 'credit_card', 'John Doe', 'john.doe@email.com', 'RCP-20260210-000001', 'completed', 'admin', 'Customer requested expedited shipping'),
	('755f10ab-5f72-4166-9ef9-6d344757a52a', '2026-02-09 21:56:15.812998+00', '[{"id": 2, "sku": "2JZ-001", "name": "2JZ-GTE Non-VVTi", "price": 12500.00, "quantity": 1, "subtotal": 12500.00}]', 12500.00, 1000.00, 13500.00, 'cash', 'Jane Smith', 'jane.smith@email.com', 'RCP-20260210-000002', 'completed', 'admin', NULL),
	('e79a638c-047f-4e05-a11b-e3d0397c1b81', '2026-02-09 01:56:15.812998+00', '[{"id": 6, "sku": "BRK-001", "name": "Brembo Brake Kit", "price": 1200.00, "quantity": 1, "subtotal": 1200.00}, {"id": 7, "sku": "SUS-001", "name": "Ohlins Coilovers", "price": 3200.00, "quantity": 1, "subtotal": 3200.00}]', 4400.00, 352.00, 4752.00, 'debit_card', 'Mike Johnson', 'mike.j@email.com', 'RCP-20260209-000001', 'completed', 'staff_001', 'Installation scheduled for next week'),
	('3933728c-7887-4b87-b40c-c3940bdf8a55', '2026-02-10 02:03:43.925259+00', '[{"id": 41, "name": "BC Racing BR Series", "price": 1050, "quantity": 1}, {"id": 50, "name": "AEM Wideband Gauge", "price": 190, "quantity": 1}, {"id": 44, "name": "EBC Redstuff Pads", "price": 120, "quantity": 1}, {"id": 6, "name": "Garrett GT35 Turbo", "price": 1450.5, "quantity": 1}, {"id": 45, "name": "StopTech Braided Lines", "price": 110, "quantity": 1}]', 2920.50, 262.84, 3183.35, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL),
	('84441fbe-6b17-4cae-8d21-86861c8b3c9c', '2026-02-12 03:11:17.247193+00', '[{"id": 6, "name": "Garrett GT35 Turbo", "price": 1450.5, "quantity": 4}]', 5802.00, 522.18, 6324.18, 'Cash', NULL, NULL, NULL, 'completed', NULL, NULL);


--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."store_settings" ("id", "store_name", "tax_rate", "low_stock_threshold", "currency", "updated_at") VALUES
	(1, 'KENS GARAGE', 9, 10, 'PHP', '2026-02-09 05:09:11.193+00');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."suppliers" ("id", "created_at", "name", "contact_person", "email", "phone", "address", "category") OVERRIDING SYSTEM VALUE VALUES
	(1, '2026-02-08 15:14:57.117337+00', 'Brembo Racing', 'Mario Rossi', 'mario@brembo.it', '+39 035 605111', 'Stezzano, Italy', 'Brakes'),
	(2, '2026-02-08 15:14:57.117337+00', 'Garrett Motion', 'Chris James', 'chris@garrett.com', '+1 764-555-0199', 'Rolle, Switzerland', 'Turbochargers'),
	(3, '2026-02-08 15:14:57.117337+00', 'Ohlins Suspension', 'Stefan Ohlin', 'stefan@ohlins.com', '+46 8 506 770 00', 'Upplands Väsby, Sweden', 'Suspension'),
	(4, '2026-02-08 15:14:57.117337+00', 'Akrapovic Exhaust', 'Igor Akrapovic', 'igor@akrapovic.com', '+386 1 787 84 84', 'Ivančna Gorica, Slovenia', 'Exhaust');


--
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."work_orders" ("id", "title", "description", "status", "priority", "customer_name", "customer_email", "assigned_to", "created_at", "due_date", "estimated_cost", "actual_cost", "items", "notes") VALUES
	('a3b5c3bb-c993-4550-b533-39f0f291d1ef', 'Engine Replacement - RB26DETT', 'Replace worn RB26DETT engine with low mileage unit. Customer reports loss of power and excessive oil consumption.', 'in_progress', 'high', 'John Davis', 'john.davis@email.com', 'Ken Senior', '2026-02-10 02:23:53.762129+00', '2026-02-13 02:23:53.762129+00', 8500.00, NULL, '[{"name": "RB26DETT Crate Engine", "part_id": 1, "quantity": 1}, {"name": "Engine Oil", "part_id": 18, "quantity": 5}]', 'Customer prefers OEM parts. Will need to order gaskets and seals.'),
	('2973c400-4a99-4313-bb7c-5966f93bbf69', 'Brake System Overhaul', 'Complete brake system replacement including pads, rotors, calipers, and fluid flush. Vehicle has 120,000 miles.', 'pending', 'medium', 'Sarah Miller', 'sarah.miller@email.com', 'Mike Johnson', '2026-02-10 02:23:53.762129+00', '2026-02-17 02:23:53.762129+00', 1200.00, NULL, '[{"name": "Brembo Brake Kit", "part_id": 5, "quantity": 1}, {"name": "Brake Fluid", "part_id": 20, "quantity": 2}]', 'Safety inspection required before return to customer.'),
	('6be5c867-bee3-4d8c-be73-a469402a77a6', 'Transmission Repair - 2JZ-GTE', 'Diagnose and repair slipping transmission on 2JZ-GTE. Customer reports harsh shifting and burnt smell.', 'pending', 'urgent', 'Robert Chen', 'robert.chen@email.com', 'Ken Senior', '2026-02-10 02:23:53.762129+00', '2026-02-11 02:23:53.762129+00', 4500.00, NULL, '[{"name": "2JZ-GTE Non-VVTi", "part_id": 2, "quantity": 1}]', 'Customer needs vehicle for daily commute. Urgent repair required.');


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 49, true);


--
-- Name: Engines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Engines_id_seq"', 71, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Users_id_seq"', 1, true);


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."cars_id_seq"', 1, true);


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

SELECT pg_catalog.setval('"public"."suppliers_id_seq"', 4, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict Z8eIsqmLvMOQ7tt0waRaziOkpsHmdKeHOclw0TIv7GdyiMTBzIkaWsoTTpMLktA

RESET ALL;
