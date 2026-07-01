-- Production schema for the tutor and student cabinet.
-- Run this file in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create type public.profile_role as enum ('teacher', 'student');
create type public.assignment_status as enum ('new', 'in_progress', 'done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null,
  full_name text not null,
  telegram text,
  created_at timestamptz not null default now()
);

create table public.tutor_students (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  target text,
  created_at timestamptz not null default now(),
  unique (tutor_id, student_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date date,
  created_at timestamptz not null default now()
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.assignment_status not null default 'new',
  student_comment text not null default '',
  tutor_comment text not null default '',
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  topic text not null default '',
  description text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  format text not null default 'Онлайн',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tutor_students enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.materials enable row level security;
alter table public.lessons enable row level security;
alter table public.messages enable row level security;

create policy "profiles_read_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_read_connected_people"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_students relation
    where
      (relation.tutor_id = auth.uid() and relation.student_id = profiles.id)
      or (relation.student_id = auth.uid() and relation.tutor_id = profiles.id)
  )
);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "relations_read_connected"
on public.tutor_students for select
to authenticated
using (tutor_id = auth.uid() or student_id = auth.uid());

create policy "relations_teacher_insert"
on public.tutor_students for insert
to authenticated
with check (tutor_id = auth.uid());

create policy "relations_teacher_update"
on public.tutor_students for update
to authenticated
using (tutor_id = auth.uid())
with check (tutor_id = auth.uid());

create policy "relations_teacher_delete"
on public.tutor_students for delete
to authenticated
using (tutor_id = auth.uid());

create policy "assignments_read_connected"
on public.assignments for select
to authenticated
using (tutor_id = auth.uid() or student_id = auth.uid());

create policy "assignments_teacher_insert"
on public.assignments for insert
to authenticated
with check (
  tutor_id = auth.uid()
  and exists (
    select 1 from public.tutor_students relation
    where relation.tutor_id = auth.uid()
      and relation.student_id = assignments.student_id
  )
);

create policy "assignments_teacher_update"
on public.assignments for update
to authenticated
using (tutor_id = auth.uid())
with check (tutor_id = auth.uid());

create policy "assignments_teacher_delete"
on public.assignments for delete
to authenticated
using (tutor_id = auth.uid());

create policy "submissions_read_connected"
on public.assignment_submissions for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.assignments assignment
    where assignment.id = assignment_submissions.assignment_id
      and assignment.tutor_id = auth.uid()
  )
);

create policy "submissions_student_insert"
on public.assignment_submissions for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.assignments assignment
    where assignment.id = assignment_submissions.assignment_id
      and assignment.student_id = auth.uid()
  )
);

create policy "submissions_student_update"
on public.assignment_submissions for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "materials_read_connected"
on public.materials for select
to authenticated
using (
  tutor_id = auth.uid()
  or student_id = auth.uid()
  or (
    student_id is null
    and exists (
      select 1 from public.tutor_students relation
      where relation.tutor_id = materials.tutor_id
        and relation.student_id = auth.uid()
    )
  )
);

create policy "materials_teacher_insert"
on public.materials for insert
to authenticated
with check (tutor_id = auth.uid());

create policy "materials_teacher_update"
on public.materials for update
to authenticated
using (tutor_id = auth.uid())
with check (tutor_id = auth.uid());

create policy "materials_teacher_delete"
on public.materials for delete
to authenticated
using (tutor_id = auth.uid());

create policy "lessons_read_connected"
on public.lessons for select
to authenticated
using (tutor_id = auth.uid() or student_id = auth.uid());

create policy "lessons_teacher_insert"
on public.lessons for insert
to authenticated
with check (
  tutor_id = auth.uid()
  and exists (
    select 1 from public.tutor_students relation
    where relation.tutor_id = auth.uid()
      and relation.student_id = lessons.student_id
  )
);

create policy "lessons_teacher_update"
on public.lessons for update
to authenticated
using (tutor_id = auth.uid())
with check (tutor_id = auth.uid());

create policy "lessons_teacher_delete"
on public.lessons for delete
to authenticated
using (tutor_id = auth.uid());

create policy "messages_read_participants"
on public.messages for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages_send_to_connected_people"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.tutor_students relation
    where
      (relation.tutor_id = auth.uid() and relation.student_id = messages.recipient_id)
      or (relation.student_id = auth.uid() and relation.tutor_id = messages.recipient_id)
  )
);

create index tutor_students_tutor_id_idx on public.tutor_students(tutor_id);
create index tutor_students_student_id_idx on public.tutor_students(student_id);
create index assignments_student_id_idx on public.assignments(student_id);
create index materials_student_id_idx on public.materials(student_id);
create index lessons_tutor_starts_at_idx on public.lessons(tutor_id, starts_at);
create index lessons_student_starts_at_idx on public.lessons(student_id, starts_at);
create index messages_participants_idx on public.messages(sender_id, recipient_id, created_at);
