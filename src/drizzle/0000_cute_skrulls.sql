CREATE TABLE IF NOT EXISTS "FriendRequest" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "_friends" (
	"A" integer NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Task" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"title" text NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"description" text,
	"date" timestamp(3),
	"tripId" integer NOT NULL,
	"price" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Trip" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"title" text NOT NULL,
	"background" text,
	"date" timestamp(3) NOT NULL,
	"ownerId" integer NOT NULL,
	"backgroundProvider" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"refreshToken" text,
	"profilePicture" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserInTrip" (
	"tripId" integer NOT NULL,
	"userId" integer NOT NULL,
	CONSTRAINT "UserInTrip_pkey" PRIMARY KEY("tripId","userId")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "FriendRequest_senderId_receiverId_key" ON "FriendRequest" ("senderId","receiverId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "_friends_AB_unique" ON "_friends" ("A","B");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "_friends_B_index" ON "_friends" ("B");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User" ("username");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "_friends" ADD CONSTRAINT "_friends_A_User_id_fk" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "_friends" ADD CONSTRAINT "_friends_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Task" ADD CONSTRAINT "Task_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserInTrip" ADD CONSTRAINT "UserInTrip_tripId_Trip_id_fk" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserInTrip" ADD CONSTRAINT "UserInTrip_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
