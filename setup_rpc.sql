-- Function to confirm email subscription via token
create or replace function public.confirm_subscription(p_token text)
returns boolean as $$
declare
  v_user_id uuid;
begin
  -- Find the user with the matching token
  select id into v_user_id
  from public.profiles
  where notification_token = p_token and notification_status = 'pending';

  -- If no user found, return false
  if v_user_id is null then
    return false;
  end if;

  -- Update the user's status
  update public.profiles
  set notification_status = 'subscribed'
  where id = v_user_id;

  return true;
end;
$$ language plpgsql security definer;
