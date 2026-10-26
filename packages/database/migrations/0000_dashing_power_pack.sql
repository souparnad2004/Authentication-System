CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'deleted', 'locked', 'disabled');--> statement-breakpoint
CREATE TABLE "user" (
	"uuid" uuid NOT NULL,
	"user_status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_uuid_unique" UNIQUE("uuid")
);
