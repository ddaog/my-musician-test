-- quizzes
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  edit_token text not null,
  created_at timestamp default now()
);

-- quiz_items
create table if not exists quiz_items (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  name text not null,
  rank int not null,
  unique (quiz_id, rank)
);

-- submissions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  nickname text not null,
  score int not null,
  created_at timestamp default now()
);

-- submission_items
create table if not exists submission_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  name text not null,
  selected_rank int not null
);

-- index for leaderboard
create index if not exists idx_submissions_quiz_score
on submissions (quiz_id, score desc);
