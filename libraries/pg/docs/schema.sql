
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

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE TYPE public.entity_publish_event_kind AS ENUM (
    'publish',
    'unpublish',
    'archive',
    'unarchive'
);

CREATE TYPE public.entity_status AS ENUM (
    'draft',
    'published',
    'modified',
    'withdrawn',
    'archived'
);

CREATE TYPE public.event_type AS ENUM (
    'createEntity',
    'createAndPublishEntity',
    'updateEntity',
    'updateAndPublishEntity',
    'publishEntities',
    'unpublishEntities',
    'archiveEntity',
    'unarchiveEntity',
    'updateSchema',
    'createPrincipal'
);

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.advisory_locks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    handle integer NOT NULL,
    acquired_at timestamp with time zone DEFAULT now() NOT NULL,
    renewed_at timestamp with time zone DEFAULT now() NOT NULL,
    lease_duration interval NOT NULL
);

CREATE SEQUENCE public.advisory_locks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.advisory_locks_id_seq OWNED BY public.advisory_locks.id;

CREATE TABLE public.entities (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    published_entity_versions_id integer,
    latest_draft_entity_versions_id integer,
    latest_fts tsvector NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    never_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated integer NOT NULL,
    published_fts tsvector,
    status public.entity_status NOT NULL,
    auth_key character varying(255) NOT NULL,
    resolved_auth_key character varying(255) NOT NULL,
    dirty smallint DEFAULT 0 NOT NULL,
    invalid smallint DEFAULT 0 NOT NULL,
    published_name character varying(255)
);

CREATE SEQUENCE public.entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entities_id_seq OWNED BY public.entities.id;

CREATE SEQUENCE public.entities_updated_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entities_updated_seq OWNED BY public.entities.updated;

CREATE TABLE public.entity_latest_locations (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    location public.geometry NOT NULL,
    CONSTRAINT enforce_srid_location CHECK ((public.st_srid(location) = 4326))
);

CREATE SEQUENCE public.entity_latest_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_latest_locations_id_seq OWNED BY public.entity_latest_locations.id;

CREATE TABLE public.entity_latest_references (
    id integer NOT NULL,
    from_entities_id integer NOT NULL,
    to_entities_id integer NOT NULL
);

CREATE SEQUENCE public.entity_latest_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_latest_references_id_seq OWNED BY public.entity_latest_references.id;

CREATE TABLE public.entity_latest_value_types (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    value_type character varying(255) NOT NULL
);

CREATE SEQUENCE public.entity_latest_value_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_latest_value_types_id_seq OWNED BY public.entity_latest_value_types.id;

CREATE TABLE public.entity_published_locations (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    location public.geometry NOT NULL,
    CONSTRAINT enforce_srid_location CHECK ((public.st_srid(location) = 4326))
);

CREATE SEQUENCE public.entity_published_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_published_locations_id_seq OWNED BY public.entity_published_locations.id;

CREATE TABLE public.entity_published_references (
    id integer NOT NULL,
    from_entities_id integer NOT NULL,
    to_entities_id integer NOT NULL
);

CREATE SEQUENCE public.entity_published_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_published_references_id_seq OWNED BY public.entity_published_references.id;

CREATE TABLE public.entity_published_value_types (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    value_type character varying(255) NOT NULL
);

CREATE SEQUENCE public.entity_published_value_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_published_value_types_id_seq OWNED BY public.entity_published_value_types.id;

CREATE TABLE public.entity_versions (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    version smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by integer NOT NULL,
    data jsonb NOT NULL,
    schema_version integer NOT NULL,
    encode_version integer DEFAULT 0 NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL
);

CREATE SEQUENCE public.entity_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.entity_versions_id_seq OWNED BY public.entity_versions.id;

CREATE TABLE public.event_entity_versions (
    id integer NOT NULL,
    events_id integer NOT NULL,
    entity_versions_id integer NOT NULL,
    published_name character varying(255)
);

CREATE SEQUENCE public.event_entity_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.event_entity_versions_id_seq OWNED BY public.event_entity_versions.id;

CREATE TABLE public.events (
    id integer NOT NULL,
    type public.event_type NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schema_versions_id integer,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    principals_id integer
);

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;

CREATE TABLE public.principals (
    id integer NOT NULL,
    provider character varying(255) NOT NULL,
    identifier character varying(255) NOT NULL,
    subjects_id integer NOT NULL
);

CREATE SEQUENCE public.principals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.principals_id_seq OWNED BY public.principals.id;

CREATE TABLE public.schema_versions (
    id integer NOT NULL,
    specification jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    version integer NOT NULL
);

CREATE SEQUENCE public.schema_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.schema_versions_id_seq OWNED BY public.schema_versions.id;

CREATE TABLE public.schemaversion (
    version bigint NOT NULL,
    name text,
    md5 text,
    run_at timestamp with time zone
);

CREATE TABLE public.subjects (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;

CREATE TABLE public.unique_index_values (
    id integer NOT NULL,
    entities_id integer NOT NULL,
    index_name character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    latest boolean DEFAULT false NOT NULL,
    published boolean DEFAULT false NOT NULL
);

CREATE SEQUENCE public.unique_index_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.unique_index_values_id_seq OWNED BY public.unique_index_values.id;

ALTER TABLE ONLY public.advisory_locks ALTER COLUMN id SET DEFAULT nextval('public.advisory_locks_id_seq'::regclass);

ALTER TABLE ONLY public.entities ALTER COLUMN id SET DEFAULT nextval('public.entities_id_seq'::regclass);

ALTER TABLE ONLY public.entities ALTER COLUMN updated SET DEFAULT nextval('public.entities_updated_seq'::regclass);

ALTER TABLE ONLY public.entity_latest_locations ALTER COLUMN id SET DEFAULT nextval('public.entity_latest_locations_id_seq'::regclass);

ALTER TABLE ONLY public.entity_latest_references ALTER COLUMN id SET DEFAULT nextval('public.entity_latest_references_id_seq'::regclass);

ALTER TABLE ONLY public.entity_latest_value_types ALTER COLUMN id SET DEFAULT nextval('public.entity_latest_value_types_id_seq'::regclass);

ALTER TABLE ONLY public.entity_published_locations ALTER COLUMN id SET DEFAULT nextval('public.entity_published_locations_id_seq'::regclass);

ALTER TABLE ONLY public.entity_published_references ALTER COLUMN id SET DEFAULT nextval('public.entity_published_references_id_seq'::regclass);

ALTER TABLE ONLY public.entity_published_value_types ALTER COLUMN id SET DEFAULT nextval('public.entity_published_value_types_id_seq'::regclass);

ALTER TABLE ONLY public.entity_versions ALTER COLUMN id SET DEFAULT nextval('public.entity_versions_id_seq'::regclass);

ALTER TABLE ONLY public.event_entity_versions ALTER COLUMN id SET DEFAULT nextval('public.event_entity_versions_id_seq'::regclass);

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);

ALTER TABLE ONLY public.principals ALTER COLUMN id SET DEFAULT nextval('public.principals_id_seq'::regclass);

ALTER TABLE ONLY public.schema_versions ALTER COLUMN id SET DEFAULT nextval('public.schema_versions_id_seq'::regclass);

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);

ALTER TABLE ONLY public.unique_index_values ALTER COLUMN id SET DEFAULT nextval('public.unique_index_values_id_seq'::regclass);

ALTER TABLE ONLY public.advisory_locks
    ADD CONSTRAINT advisory_locks_name_key UNIQUE (name);

ALTER TABLE ONLY public.advisory_locks
    ADD CONSTRAINT advisory_locks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_name_key UNIQUE (name);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_published_name_key UNIQUE (published_name);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_updated_key UNIQUE (updated);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_uuid_key UNIQUE (uuid);

ALTER TABLE ONLY public.entity_latest_locations
    ADD CONSTRAINT entity_latest_locations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_latest_references
    ADD CONSTRAINT entity_latest_references_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_latest_value_types
    ADD CONSTRAINT entity_latest_value_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_published_locations
    ADD CONSTRAINT entity_published_locations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_published_references
    ADD CONSTRAINT entity_published_references_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_published_value_types
    ADD CONSTRAINT entity_published_value_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.event_entity_versions
    ADD CONSTRAINT event_entity_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_uuid_key UNIQUE (uuid);

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_provider_identifier_key UNIQUE (provider, identifier);

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.schema_versions
    ADD CONSTRAINT schema_versions_version_key UNIQUE (version);

ALTER TABLE ONLY public.schemaversion
    ADD CONSTRAINT schemaversion_pkey PRIMARY KEY (version);

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_uuid_key UNIQUE (uuid);

ALTER TABLE ONLY public.unique_index_values
    ADD CONSTRAINT unique_index_values_index_name_value_key UNIQUE (index_name, value);

ALTER TABLE ONLY public.unique_index_values
    ADD CONSTRAINT unique_index_values_pkey PRIMARY KEY (id);

CREATE INDEX entities_dirty ON public.entities USING btree (dirty);

CREATE INDEX entities_latest_fts_index ON public.entities USING gin (latest_fts);

CREATE INDEX entities_published_fts_index ON public.entities USING gin (published_fts);

CREATE INDEX event_entity_versions_entity_versions_id ON public.event_entity_versions USING btree (entity_versions_id);

CREATE INDEX event_entity_versions_events_id ON public.event_entity_versions USING btree (events_id);

CREATE INDEX unique_index_values_entities_id ON public.unique_index_values USING btree (entities_id);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_latest_draft_entity_versions_id_fkey FOREIGN KEY (latest_draft_entity_versions_id) REFERENCES public.entity_versions(id);

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_published_entity_versions_id_fkey FOREIGN KEY (published_entity_versions_id) REFERENCES public.entity_versions(id);

ALTER TABLE ONLY public.entity_latest_locations
    ADD CONSTRAINT entity_latest_locations_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_latest_references
    ADD CONSTRAINT entity_latest_references_from_entities_id_fkey FOREIGN KEY (from_entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_latest_references
    ADD CONSTRAINT entity_latest_references_to_entities_id_fkey FOREIGN KEY (to_entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_latest_value_types
    ADD CONSTRAINT entity_latest_value_types_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_published_locations
    ADD CONSTRAINT entity_published_locations_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_published_references
    ADD CONSTRAINT entity_published_references_from_entities_id_fkey FOREIGN KEY (from_entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_published_references
    ADD CONSTRAINT entity_published_references_to_entities_id_fkey FOREIGN KEY (to_entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_published_value_types
    ADD CONSTRAINT entity_published_value_types_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.subjects(id);

ALTER TABLE ONLY public.entity_versions
    ADD CONSTRAINT entity_versions_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_entity_versions
    ADD CONSTRAINT event_entity_versions_entity_versions_id_fkey FOREIGN KEY (entity_versions_id) REFERENCES public.entity_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.event_entity_versions
    ADD CONSTRAINT event_entity_versions_events_id_fkey FOREIGN KEY (events_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_principals_id_fkey FOREIGN KEY (principals_id) REFERENCES public.principals(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_schema_versions_id_fkey FOREIGN KEY (schema_versions_id) REFERENCES public.schema_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.principals
    ADD CONSTRAINT principals_subjects_id_fkey FOREIGN KEY (subjects_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.unique_index_values
    ADD CONSTRAINT unique_index_values_entities_id_fkey FOREIGN KEY (entities_id) REFERENCES public.entities(id) ON DELETE CASCADE;
