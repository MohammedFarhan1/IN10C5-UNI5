do $$
declare
  admin_user_id uuid;
begin
  if to_regclass('public.users') is null then
    raise exception 'public.users does not exist. Run supabase/schema.sql before supabase/seed.sql.';
  end if;

  select id into admin_user_id
  from auth.users
  where email = 'admin@uni5.com';

  if admin_user_id is null then
    admin_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@uni5.com',
      extensions.crypt('admin123', extensions.gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at,
      last_sign_in_at
    )
    values (
      gen_random_uuid(),
      admin_user_id,
      format('{"sub":"%s","email":"%s"}', admin_user_id::text, 'admin@uni5.com')::jsonb,
      'email',
      'admin@uni5.com',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  end if;

  insert into public.users (id, email, role)
  values (admin_user_id, 'admin@uni5.com', 'admin')
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role;
end $$;
