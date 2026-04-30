CREATE TYPE "public"."habit_frequency" AS ENUM('daily', 'weekly', 'n_per_week');--> statement-breakpoint
CREATE TYPE "public"."finance_kind" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('want', 'reading', 'done', 'paused');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "habit_checkins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"performed_on" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "habits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"frequency" "habit_frequency" DEFAULT 'daily' NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "finance_kind" NOT NULL,
	"color" text,
	"icon" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "finance_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"description" text,
	"occurred_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "books" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"status" "book_status" DEFAULT 'want' NOT NULL,
	"pages_total" integer,
	"pages_read" integer DEFAULT 0 NOT NULL,
	"rating" integer,
	"started_on" date,
	"finished_on" date,
	"notes" text,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe_ingredients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recipe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"servings" integer,
	"total_minutes" integer,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"telegram" text,
	"birthday" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "time_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "time_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_activities" ADD CONSTRAINT "time_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_activity_id_time_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."time_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "habit_checkins_habit_date_idx" ON "habit_checkins" USING btree ("habit_id","performed_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "habit_checkins_user_idx" ON "habit_checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "habits_user_idx" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_categories_user_idx" ON "finance_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_tx_user_occurred_idx" ON "finance_transactions" USING btree ("user_id","occurred_on");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_tx_category_idx" ON "finance_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_events_user_start_idx" ON "calendar_events" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "books_user_status_idx" ON "books" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipe_ingredients_recipe_idx" ON "recipe_ingredients" USING btree ("recipe_id","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipes_user_idx" ON "recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_user_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_activities_user_idx" ON "time_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_sessions_user_started_idx" ON "time_sessions" USING btree ("user_id","started_at");