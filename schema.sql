-- STEP1 create table layers
DROP TABLE IF EXISTS public.layers;
CREATE TABLE public.layers (
    id int4 NOT NULL GENERATED ALWAYS AS IDENTITY,
    public_id text NOT NULL,
    "name" text NULL,
    url text NULL,
    "type" text NULL,
    description text NULL,
    copyrights text NULL,
    last_updated timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_updated timestamptz NULL,
    access_time timestamptz NULL,
    "owner" text NULL,
    is_public bool NULL,
    category_id int4 NULL,
    group_id int4 NULL,
    properties jsonb NULL,
    is_dirty bool NULL,
    zoom_visibility_rules jsonb NULL,
    geom public.geometry NULL,
    is_visible bool NULL DEFAULT false,
    feature_properties jsonb NULL,
    api_key varchar NULL,
    is_global bool NULL DEFAULT false,
    tile_size int4 NULL,
    min_zoom int4 NULL,
    max_zoom int4 NULL,
    mapbox_styles jsonb NULL,
    CONSTRAINT layers_mapbox_styles_check CHECK ((mapbox_styles ? 'url'::text)),
    CONSTRAINT layers_pkey PRIMARY KEY (id),
    CONSTRAINT layers_public_id_key UNIQUE (public_id)
);
CREATE INDEX layers_geom_idx ON public.layers USING gist (geom);


-- STEP2 populate table layers with feature for openaerialmap
insert into public.layers(
    public_id,
    name,
    url,
    type,
    description,
    copyrights,
    last_updated,
    source_updated,
    owner,
    is_public,
    is_visible,
    is_global,
    geom)
select
    'openaerialmap_geocint',
    'OAM Mosaic',
    '',
    'raster',
    'The open collection of openly licensed satellite and unmanned aerial vehicle (UAV) imagery. ',
    'All imagery is publicly licensed and made available through the Humanitarian OpenStreetMap Team''s Open Imagery Network (OIN) Node. All imagery contained in OIN is licensed CC-BY 4.0, with attribution as contributors of Open Imagery Network. All imagery is available to be traced in OpenStreetMap. © OpenAerialMap, © Kontur',
    now(),
    now(),
    'layers-db',
    true,
    false,
    true,
    (select st_setsrid(ST_MakeBox2D(st_point(-179.0, -85.06), st_point(179.0, 85.06)),4326));


-- STEP3 creating table layers_features
DROP TABLE IF EXISTS public.layers_features;
CREATE TABLE public.layers_features (
    feature_id text NOT NULL,
    layer_id int4 NOT NULL,
    properties jsonb NULL,
    geom public.geometry NULL,
    last_updated timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    zoom int4 NULL DEFAULT 999,
    CONSTRAINT layers_features_feature_id_layer_id_zoom_key UNIQUE (feature_id, layer_id, zoom)
);
CREATE INDEX layers_features_3857_idx ON public.layers_features USING gist (st_transform(geom, 3857));
CREATE INDEX layers_features_layer_id_3857_idx ON public.layers_features USING gist (layer_id, st_transform(geom, 3857));
CREATE INDEX layers_features_layer_id_geom_idx ON public.layers_features USING gist (layer_id, geom);
CREATE INDEX layers_features_layer_id_zoom_geom_idx ON public.layers_features USING gist (layer_id, zoom, geom);
CREATE INDEX layers_features_zoom_idx ON public.layers_features USING btree (zoom);

ALTER TABLE public.layers_features ADD CONSTRAINT layers_features_layer_id_fkey FOREIGN KEY (layer_id) REFERENCES public.layers(id) ON DELETE CASCADE;