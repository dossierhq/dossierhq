--
-- PostgreSQL database dump
--

-- Dumped from database version 13.0
-- Dumped by pg_dump version 13.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger;


--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tiger_data;


--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA topology;


--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entities (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    published_version smallint DEFAULT 0 NOT NULL,
    published_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: entities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entities_id_seq OWNED BY public.entities.id;


--
-- Name: entitiesb; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entitiesb (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    published_deleted boolean DEFAULT false NOT NULL,
    published_entityb_versions integer
);


--
-- Name: entitiesb_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entitiesb_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entitiesb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entitiesb_id_seq OWNED BY public.entitiesb.id;


--
-- Name: entity_field_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_field_references (
    id integer NOT NULL,
    entity_fields_id integer NOT NULL,
    entities_id integer NOT NULL
);


--
-- Name: entity_field_references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_field_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_field_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_field_references_id_seq OWNED BY public.entity_field_references.id;


--
-- Name: entity_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_fields (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    name character varying(255) NOT NULL,
    data jsonb NOT NULL,
    min_version smallint DEFAULT 0 NOT NULL,
    max_version smallint DEFAULT 0 NOT NULL
);


--
-- Name: entity_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_fields_id_seq OWNED BY public.entity_fields.id;


--
-- Name: entity_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_versions (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    version smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL
);


--
-- Name: entity_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entity_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entity_versions_id_seq OWNED BY public.entity_versions.id;


--
-- Name: entityb_version_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entityb_version_references (
    id integer NOT NULL,
    entityb_versions_id integer NOT NULL,
    entities_id integer NOT NULL
);


--
-- Name: entityb_version_references_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entityb_version_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entityb_version_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entityb_version_references_id_seq OWNED BY public.entityb_version_references.id;


--
-- Name: entityb_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entityb_versions (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    version smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL,
    data jsonb
);


--
-- Name: entityb_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entityb_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entityb_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entityb_versions_id_seq OWNED BY public.entityb_versions.id;


--
-- Name: principals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.principals (
    id integer NOT NULL,
    provider character varying(255) NOT NULL,
    identifier character varying(255) NOT NULL,
    subjects_id integer NOT NULL
);


--
-- Name: principals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.principals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: principals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.principals_id_seq OWNED BY public.principals.id;


--
-- Name: published_entity_fields; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.published_entity_fields AS
 SELECT ef.id,
    ef.entities_id,
    ef.name,
    ef.data
   FROM public.entities e,
    public.entity_fields ef
  WHERE ((e.id = ef.entities_id) AND (e.published_version >= ef.min_version) AND (e.published_version <= ef.max_version));


--
-- Name: schemaversion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schemaversion (
    version bigint NOT NULL,
    name text,
    md5 text,
    run_at timestamp with time zone
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.subjects.id;


--
-- Name: big_data_a; Type: TABLE; Schema: topology; Owner: -
--

CREATE TABLE topology.big_data_a (
    id integer NOT NULL,
    some_data text
);


--
-- Name: big_data_a_id_seq; Type: SEQUENCE; Schema: topology; Owner: -
--

CREATE SEQUENCE topology.big_data_a_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: big_data_a_id_seq; Type: SEQUENCE OWNED BY; Schema: topology; Owner: -
--

ALTER SEQUENCE topology.big_data_a_id_seq OWNED BY topology.big_data_a.id;


--
-- Name: big_data_b; Type: TABLE; Schema: topology; Owner: -
--

CREATE TABLE topology.big_data_b (
    id integer NOT NULL,
    some_data text
);


--
-- Name: big_data_b_id_seq; Type: SEQUENCE; Schema: topology; Owner: -
--

CREATE SEQUENCE topology.big_data_b_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: big_data_b_id_seq; Type: SEQUENCE OWNED BY; Schema: topology; Owner: -
--

ALTER SEQUENCE topology.big_data_b_id_seq OWNED BY topology.big_data_b.id;


--
-- Name: entities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entities ALTER COLUMN id SET DEFAULT nextval('public.entities_id_seq'::regclass);


--
-- Name: entitiesb id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entitiesb ALTER COLUMN id SET DEFAULT nextval('public.entitiesb_id_seq'::regclass);


--
-- Name: entity_field_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_field_references ALTER COLUMN id SET DEFAULT nextval('public.entity_field_references_id_seq'::regclass);


--
-- Name: entity_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_fields ALTER COLUMN id SET DEFAULT nextval('public.entity_fields_id_seq'::regclass);


--
-- Name: entity_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_versions ALTER COLUMN id SET DEFAULT nextval('public.entity_versions_id_seq'::regclass);


--
-- Name: entityb_version_references id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_version_references ALTER COLUMN id SET DEFAULT nextval('public.entityb_version_references_id_seq'::regclass);


--
-- Name: entityb_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_versions ALTER COLUMN id SET DEFAULT nextval('public.entityb_versions_id_seq'::regclass);


--
-- Name: principals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.principals ALTER COLUMN id SET DEFAULT nextval('public.principals_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: big_data_a id; Type: DEFAULT; Schema: topology; Owner: -
--

ALTER TABLE ONLY topology.big_data_a ALTER COLUMN id SET DEFAULT nextval('topology.big_data_a_id_seq'::regclass);


--
-- Name: big_data_b id; Type: DEFAULT; Schema: topology; Owner: -
--

ALTER TABLE ONLY topology.big_data_b ALTER COLUMN id SET DEFAULT nextval('topology.big_data_b_id_seq'::regclass);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: entities entities_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_uuid_key UNIQUE (uuid);


--
-- Name: entitiesb entitiesb_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entitiesb
    ADD CONSTRAINT entitiesb_pkey PRIMARY KEY (id);


--
-- Name: entitiesb entitiesb_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entitiesb
    ADD CONSTRAINT entitiesb_uuid_key UNIQUE (uuid);


--
-- Name: entity_field_references entity_field_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_field_references
    ADD CONSTRAINT entity_field_references_pkey PRIMARY KEY (id);


--
-- Name: entity_fields entity_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_fields
    ADD CONSTRAINT entity_fields_pkey PRIMARY KEY (id);


--
-- Name: entity_versions entity_versions_entities_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_entities_id_version_key UNIQUE (entities_id, version);


--
-- Name: entity_versions entity_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_pkey PRIMARY KEY (id);


--
-- Name: entityb_version_references entityb_version_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_version_references
    ADD CONSTRAINT entityb_version_references_pkey PRIMARY KEY (id);


--
-- Name: entityb_versions entityb_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_versions
    ADD CONSTRAINT entityb_versions_pkey PRIMARY KEY (id);


--
-- Name: principals principals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_pkey PRIMARY KEY (id);


--
-- Name: principals principals_provider_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_provider_identifier_key UNIQUE (provider, identifier);


--
-- Name: schemaversion schemaversion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schemaversion
    ADD CONSTRAINT schemaversion_pkey PRIMARY KEY (version);


--
-- Name: subjects users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: subjects users_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT users_uuid_key UNIQUE (uuid);


--
-- Name: big_data_a big_data_a_id_key; Type: CONSTRAINT; Schema: topology; Owner: -
--

ALTER TABLE ONLY topology.big_data_a
    ADD CONSTRAINT big_data_a_id_key UNIQUE (id);


--
-- Name: entities_non_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entities_non_deleted ON public.entities USING btree (id) WHERE (published_deleted = false);


--
-- Name: entitiesb_non_deleted_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entitiesb_non_deleted_index ON public.entitiesb USING btree (id) WHERE (published_deleted = false);


--
-- Name: entity_field_references_entity_fields_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_field_references_entity_fields_id_index ON public.entity_field_references USING btree (entity_fields_id, entities_id);


--
-- Name: entity_fields_entities_is; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entity_fields_entities_is ON public.entity_fields USING btree (entities_id);


--
-- Name: entityb_version_references_entityb_versions_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX entityb_version_references_entityb_versions_id_index ON public.entityb_version_references USING btree (entityb_versions_id);


--
-- Name: entitiesb entitiesb_published_entityb_versions_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entitiesb
    ADD CONSTRAINT entitiesb_published_entityb_versions_fkey FOREIGN KEY (published_entityb_versions) REFERENCES public.entityb_versions(id);


--
-- Name: entity_field_references entity_field_references_entities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_field_references
    ADD CONSTRAINT entity_field_references_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: entity_field_references entity_field_references_entity_fields_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_field_references
    ADD CONSTRAINT entity_field_references_entity_fields_id_fkey FOREIGN KEY (entity_fields_id) REFERENCES public.entity_fields(id) ON DELETE CASCADE;


--
-- Name: entity_fields entity_fields_entities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_fields
    ADD CONSTRAINT entity_fields_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: entity_versions entity_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.subjects(id);


--
-- Name: entity_versions entity_versions_entities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: entityb_version_references entityb_version_references_entities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_version_references
    ADD CONSTRAINT entityb_version_references_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entitiesb(id) ON DELETE CASCADE;


--
-- Name: entityb_version_references entityb_version_references_entityb_versions_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_version_references
    ADD CONSTRAINT entityb_version_references_entityb_versions_id_fkey FOREIGN KEY (entityb_versions_id) REFERENCES public.entityb_versions(id) ON DELETE CASCADE;


--
-- Name: entityb_versions entityb_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_versions
    ADD CONSTRAINT entityb_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.subjects(id);


--
-- Name: entityb_versions entityb_versions_entities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entityb_versions
    ADD CONSTRAINT entityb_versions_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entitiesb(id) ON DELETE CASCADE;


--
-- Name: principals principals_subjects_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_subjects_id_fkey FOREIGN KEY (subjects_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

