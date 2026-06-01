-- Ensure the breeds table exists for breed CRUD, filtering, and animal-type joins.
CREATE TABLE IF NOT EXISTS public.breeds (
  breed_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  animal_type_id BIGINT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT breeds_pkey PRIMARY KEY (breed_id),
  CONSTRAINT breeds_animal_type_id_fkey
    FOREIGN KEY (animal_type_id)
    REFERENCES public.animal_types(animal_type_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_breeds_name ON public.breeds (name);
CREATE INDEX IF NOT EXISTS idx_breeds_animal_type_id ON public.breeds (animal_type_id);