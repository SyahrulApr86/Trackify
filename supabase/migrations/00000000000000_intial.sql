--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.2

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: add_task_tags(uuid, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_task_tags(p_task_id uuid, p_tag_names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_tag_id uuid;

  v_tag_name text;

BEGIN

  -- For each tag name

  FOREACH v_tag_name IN ARRAY p_tag_names

  LOOP

    -- Get or create the tag

    v_tag_id := manage_tag(v_tag_name);

    

    -- Add the tag to the task

    INSERT INTO task_tags (task_id, tag_id)

    VALUES (p_task_id, v_tag_id)

    ON CONFLICT DO NOTHING;

  END LOOP;

END;

$$;


--
-- Name: can_delete_category(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_delete_category(p_category_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_task_count integer;

BEGIN

  SELECT COUNT(*)

  INTO v_task_count

  FROM tasks

  WHERE category_id = p_category_id;

  

  RETURN v_task_count = 0;

END;

$$;


--
-- Name: check_category_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_category_user_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  IF NEW.user_id IS NULL THEN

    RAISE EXCEPTION 'user_id cannot be null';

  END IF;

  RETURN NEW;

END;

$$;


--
-- Name: cleanup_tags_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_tags_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  -- Clean up unused tags after task_tags changes

  PERFORM cleanup_unused_tags();

  RETURN NULL;

END;

$$;


--
-- Name: cleanup_unused_tags(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_unused_tags() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  -- Delete tags that have no associated tasks

  DELETE FROM tags

  WHERE NOT EXISTS (

    SELECT 1

    FROM task_tags

    WHERE task_tags.tag_id = tags.id

  );

END;

$$;


--
-- Name: clear_user_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clear_user_context() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  PERFORM set_config('app.user_id', null, false);

END;

$$;


--
-- Name: delete_category(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_category(p_category_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_user_id uuid;

BEGIN

  -- Get and validate the user context

  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;

  IF v_user_id IS NULL THEN

    RAISE EXCEPTION 'User context not set';

  END IF;



  -- Validate the category exists and belongs to the user

  IF NOT EXISTS (

    SELECT 1 

    FROM categories 

    WHERE id = p_category_id AND user_id = v_user_id

  ) THEN

    RAISE EXCEPTION 'Category not found or does not belong to the user';

  END IF;



  -- Check if the category has tasks

  IF EXISTS (

    SELECT 1 

    FROM tasks 

    WHERE category_id = p_category_id

  ) THEN

    RETURN false;

  END IF;



  -- Delete the category

  DELETE FROM categories

  WHERE id = p_category_id

    AND user_id = v_user_id;

  

  RETURN true;

EXCEPTION

  WHEN OTHERS THEN

    RAISE EXCEPTION 'Error deleting category: %', SQLERRM;

END;

$$;


--
-- Name: get_category_tasks_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_category_tasks_count(p_category_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_count integer;

BEGIN

  SELECT COUNT(*)

  INTO v_count

  FROM tasks

  WHERE category_id = p_category_id;

  

  RETURN v_count;

END;

$$;


--
-- Name: manage_category(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manage_category(p_name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_category_id uuid;

  v_user_id uuid;

BEGIN

  -- Get the current user ID from the context

  BEGIN

    v_user_id := current_setting('app.user_id', true)::uuid;

  EXCEPTION 

    WHEN OTHERS THEN

      RAISE EXCEPTION 'User context not set or invalid';

  END;



  -- Validate the user ID

  IF v_user_id IS NULL THEN

    RAISE EXCEPTION 'User context not set';

  END IF;



  -- Validate the category name

  IF p_name IS NULL OR trim(p_name) = '' THEN

    RAISE EXCEPTION 'Category name cannot be empty';

  END IF;



  -- Try to find existing category with retry logic

  FOR i IN 1..3 LOOP

    BEGIN

      SELECT id INTO v_category_id

      FROM categories

      WHERE name = trim(p_name)

        AND user_id = v_user_id;

      

      EXIT WHEN v_category_id IS NOT NULL;



      -- If category doesn't exist, create it

      IF v_category_id IS NULL THEN

        INSERT INTO categories (name, user_id)

        VALUES (trim(p_name), v_user_id)

        RETURNING id INTO v_category_id;

        

        EXIT;

      END IF;

    EXCEPTION

      WHEN OTHERS THEN

        IF i = 3 THEN

          RAISE EXCEPTION 'Failed to manage category after 3 attempts: %', SQLERRM;

        END IF;

        -- Wait a bit before retrying

        PERFORM pg_sleep(0.1);

    END;

  END LOOP;



  RETURN v_category_id;

END;

$$;


--
-- Name: manage_tag(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manage_tag(p_name text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  v_tag_id uuid;

  v_user_id uuid;

BEGIN

  -- Get and validate the user context

  v_user_id := NULLIF(current_setting('app.user_id', true), '')::uuid;

  IF v_user_id IS NULL THEN

    RAISE EXCEPTION 'User context not set';

  END IF;



  -- Validate the tag name

  IF p_name IS NULL OR trim(p_name) = '' THEN

    RAISE EXCEPTION 'Tag name cannot be empty';

  END IF;



  -- Try to find existing tag

  SELECT id INTO v_tag_id

  FROM tags

  WHERE name = trim(p_name)

    AND user_id = v_user_id;



  -- Create new tag if it doesn't exist

  IF v_tag_id IS NULL THEN

    INSERT INTO tags (name, user_id)

    VALUES (trim(p_name), v_user_id)

    RETURNING id INTO v_tag_id;

  END IF;



  RETURN v_tag_id;

EXCEPTION

  WHEN OTHERS THEN

    RAISE EXCEPTION 'Error managing tag: %', SQLERRM;

END;

$$;


--
-- Name: migrate_existing_categories(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_existing_categories() RETURNS void
    LANGUAGE plpgsql
    AS $$

DECLARE

  r RECORD;

BEGIN

  -- Process each unique category and user_id combination

  FOR r IN (

    SELECT DISTINCT category, user_id

    FROM tasks

    WHERE category IS NOT NULL

  ) LOOP

    -- Create category if it doesn't exist

    INSERT INTO categories (name, user_id)

    VALUES (r.category, r.user_id)

    ON CONFLICT (name, user_id) DO NOTHING;

  END LOOP;



  -- Update tasks with category_id

  UPDATE tasks t

  SET category_id = c.id

  FROM categories c

  WHERE t.category = c.name

    AND t.user_id = c.user_id

    AND t.category IS NOT NULL;

END;

$$;


--
-- Name: remove_task_tags(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_task_tags(p_task_id uuid, p_tag_ids uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  DELETE FROM task_tags

  WHERE task_id = p_task_id

    AND tag_id = ANY(p_tag_ids);

END;

$$;


--
-- Name: set_user_context(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_user_context(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  IF user_id IS NULL THEN

    RAISE EXCEPTION 'User ID cannot be null';

  END IF;



  -- Verify the user exists

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN

    RAISE EXCEPTION 'User not found';

  END IF;



  -- Set the context with retry logic

  FOR i IN 1..3 LOOP

    BEGIN

      PERFORM set_config('app.user_id', user_id::text, false);

      

      -- Verify the context was set correctly

      IF current_setting('app.user_id', true)::uuid = user_id THEN

        RETURN;

      END IF;

    EXCEPTION

      WHEN OTHERS THEN

        IF i = 3 THEN

          RAISE EXCEPTION 'Failed to set user context after 3 attempts: %', SQLERRM;

        END IF;

        -- Wait a bit before retrying

        PERFORM pg_sleep(0.1);

    END;

  END LOOP;



  RAISE EXCEPTION 'Failed to verify user context was set correctly';

END;

$$;


--
-- Name: update_note_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_note_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = now();

  RETURN NEW;

END;

$$;


--
-- Name: validate_time_progress_range(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_time_progress_range() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  -- Convert dates and times to timestamps for comparison

  DECLARE

    start_timestamp timestamptz;

    end_timestamp timestamptz;

  BEGIN

    start_timestamp := (NEW.start_date + 

      make_interval(hours => NEW.start_hour, mins => NEW.start_minute))::timestamptz;

    end_timestamp := (NEW.end_date + 

      make_interval(hours => NEW.end_hour, mins => NEW.end_minute))::timestamptz;



    IF end_timestamp <= start_timestamp THEN

      RAISE EXCEPTION 'End time must be after start time';

    END IF;

  END;

  

  RETURN NEW;

END;

$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    color text,
    CONSTRAINT categories_color_check CHECK (((color IS NULL) OR (color = ANY (ARRAY['slate'::text, 'gray'::text, 'zinc'::text, 'neutral'::text, 'stone'::text, 'red'::text, 'orange'::text, 'amber'::text, 'yellow'::text, 'lime'::text, 'green'::text, 'emerald'::text, 'teal'::text, 'cyan'::text, 'sky'::text, 'blue'::text, 'indigo'::text, 'violet'::text, 'purple'::text, 'fuchsia'::text, 'pink'::text, 'rose'::text]))))
);


--
-- Name: columns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.columns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    board_id uuid NOT NULL,
    "order" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    date date NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: task_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_tags (
    task_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    column_id uuid NOT NULL,
    "order" integer NOT NULL,
    is_completed boolean DEFAULT false,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    deadline timestamp with time zone,
    status text DEFAULT 'To Do'::text NOT NULL,
    completed_at timestamp with time zone,
    archived_at timestamp with time zone,
    category_id uuid,
    priority integer DEFAULT 99999 NOT NULL,
    CONSTRAINT tasks_priority_check CHECK ((priority >= 1))
);


--
-- Name: time_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    start_hour integer DEFAULT 6 NOT NULL,
    start_minute integer DEFAULT 0 NOT NULL,
    end_hour integer DEFAULT 6 NOT NULL,
    end_minute integer DEFAULT 0 NOT NULL,
    CONSTRAINT time_progress_dates_check CHECK ((end_date >= start_date)),
    CONSTRAINT time_progress_end_hour_check CHECK (((end_hour >= 0) AND (end_hour <= 23))),
    CONSTRAINT time_progress_end_minute_check CHECK (((end_minute >= 0) AND (end_minute <= 59))),
    CONSTRAINT time_progress_start_hour_check CHECK (((start_hour >= 0) AND (start_hour <= 23))),
    CONSTRAINT time_progress_start_minute_check CHECK (((start_minute >= 0) AND (start_minute <= 59)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    username text NOT NULL,
    display_name text NOT NULL,
    password_hash text NOT NULL
);


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_user_id_key UNIQUE (name, user_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: columns columns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.columns
    ADD CONSTRAINT columns_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: task_tags task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_pkey PRIMARY KEY (task_id, tag_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: time_progress time_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_progress
    ADD CONSTRAINT time_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_categories_name_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_categories_name_user_id ON public.categories USING btree (name, user_id);


--
-- Name: idx_categories_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_user_id ON public.categories USING btree (user_id);


--
-- Name: idx_categories_user_id_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_user_id_name ON public.categories USING btree (user_id, name);


--
-- Name: idx_notes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_date ON public.notes USING btree (date);


--
-- Name: idx_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);


--
-- Name: idx_notes_user_id_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id_date ON public.notes USING btree (user_id, date);


--
-- Name: idx_tags_name_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_name_user_id ON public.tags USING btree (user_id, name);


--
-- Name: idx_tags_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_user_id ON public.tags USING btree (user_id);


--
-- Name: idx_task_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_tags_tag_id ON public.task_tags USING btree (tag_id);


--
-- Name: idx_task_tags_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_tags_task_id ON public.task_tags USING btree (task_id);


--
-- Name: idx_time_progress_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_progress_dates ON public.time_progress USING btree (start_date, end_date);


--
-- Name: idx_time_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_progress_user_id ON public.time_progress USING btree (user_id);


--
-- Name: categories ensure_category_user_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_category_user_id BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.check_category_user_id();


--
-- Name: task_tags trigger_cleanup_tags; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_cleanup_tags AFTER DELETE ON public.task_tags FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_tags_trigger();


--
-- Name: notes update_note_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_note_timestamp BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_note_timestamp();


--
-- Name: time_progress validate_time_progress_range_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_time_progress_range_trigger BEFORE INSERT OR UPDATE ON public.time_progress FOR EACH ROW EXECUTE FUNCTION public.validate_time_progress_range();


--
-- Name: boards boards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: categories categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: columns columns_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.columns
    ADD CONSTRAINT columns_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tags tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_tags task_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: task_tags task_tags_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_tags
    ADD CONSTRAINT task_tags_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.columns(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: time_progress time_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_progress
    ADD CONSTRAINT time_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users Users can insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert" ON public.users FOR INSERT WITH CHECK (true);


--
-- Name: columns Users can manage columns in their boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage columns in their boards" ON public.columns USING ((EXISTS ( SELECT 1
   FROM public.boards
  WHERE ((boards.id = columns.board_id) AND (boards.user_id = (current_setting('app.user_id'::text, true))::uuid)))));


--
-- Name: boards Users can manage own boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own boards" ON public.boards USING ((user_id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: categories Users can manage own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own categories" ON public.categories TO authenticated USING ((user_id = (NULLIF(current_setting('app.user_id'::text, true), ''::text))::uuid));


--
-- Name: notes Users can manage own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own notes" ON public.notes TO authenticated USING ((user_id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: time_progress Users can manage own progress items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own progress items" ON public.time_progress TO authenticated USING ((user_id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: tags Users can manage own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own tags" ON public.tags TO authenticated USING ((user_id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: task_tags Users can manage own task tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own task tags" ON public.task_tags TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.tasks
  WHERE ((tasks.id = task_tags.task_id) AND (tasks.user_id = (current_setting('app.user_id'::text, true))::uuid)))));


--
-- Name: tasks Users can manage own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own tasks" ON public.tasks USING ((user_id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING ((id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING ((id = (current_setting('app.user_id'::text, true))::uuid));


--
-- Name: boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: columns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: task_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: time_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

