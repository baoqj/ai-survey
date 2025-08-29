-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CONSUMER', 'BUSINESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('SYSTEM', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('PUBLIC', 'PRIVATE', 'PASSWORD', 'INVITE');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "QualityScore" AS ENUM ('RED', 'AMBER', 'GREEN');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('DRAFT', 'COMPLETED', 'INVALID');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARN', 'SPEND', 'TRANSFER', 'REFUND');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('EARN', 'SPEND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('POINTS', 'CASH');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar_url" TEXT,
    "user_type" "UserType" NOT NULL DEFAULT 'CONSUMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender",
    "occupation" TEXT,
    "education" TEXT,
    "location" TEXT,
    "interests" JSONB,
    "behavior_tags" JSONB,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "tag_value" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" "TagSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "config" JSONB,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "access_type" "AccessType" NOT NULL DEFAULT 'PUBLIC',
    "access_code" TEXT,
    "max_responses" INTEGER,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "seo_config" JSONB,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "template_id" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_templates" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "price" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "status" "TemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "respondent_id" TEXT,
    "answers" JSONB NOT NULL,
    "metadata" JSONB,
    "ai_analysis" JSONB,
    "quality_score" "QualityScore",
    "completion_rate" DOUBLE PRECISION,
    "time_spent" INTEGER,
    "status" "ResponseStatus" NOT NULL DEFAULT 'COMPLETED',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_analytics" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "analysis_result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "model_version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_rules" (
    "id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "rule_type" "RuleType" NOT NULL,
    "action" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "conditions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "daily_limit" INTEGER,
    "total_limit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_purchases" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'POINTS',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_embeddings" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "model_name" TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_embeddings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "embedding_type" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "model_name" TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "surveys_creator_id_idx" ON "surveys"("creator_id");

-- CreateIndex
CREATE INDEX "surveys_status_idx" ON "surveys"("status");

-- CreateIndex
CREATE INDEX "surveys_category_idx" ON "surveys"("category");

-- CreateIndex
CREATE INDEX "surveys_published_at_idx" ON "surveys"("published_at");

-- CreateIndex
CREATE INDEX "survey_templates_creator_id_idx" ON "survey_templates"("creator_id");

-- CreateIndex
CREATE INDEX "survey_templates_category_idx" ON "survey_templates"("category");

-- CreateIndex
CREATE INDEX "survey_templates_price_idx" ON "survey_templates"("price");

-- CreateIndex
CREATE INDEX "survey_templates_rating_idx" ON "survey_templates"("rating");

-- CreateIndex
CREATE INDEX "responses_survey_id_idx" ON "responses"("survey_id");

-- CreateIndex
CREATE INDEX "responses_respondent_id_idx" ON "responses"("respondent_id");

-- CreateIndex
CREATE INDEX "responses_quality_score_idx" ON "responses"("quality_score");

-- CreateIndex
CREATE INDEX "responses_completed_at_idx" ON "responses"("completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "response_analytics_response_id_analysis_type_key" ON "response_analytics"("response_id", "analysis_type");

-- CreateIndex
CREATE INDEX "response_analytics_response_id_idx" ON "response_analytics"("response_id");

-- CreateIndex
CREATE INDEX "response_analytics_analysis_type_idx" ON "response_analytics"("analysis_type");

-- CreateIndex
CREATE INDEX "point_transactions_user_id_idx" ON "point_transactions"("user_id");

-- CreateIndex
CREATE INDEX "point_transactions_type_idx" ON "point_transactions"("type");

-- CreateIndex
CREATE INDEX "point_transactions_source_idx" ON "point_transactions"("source");

-- CreateIndex
CREATE INDEX "point_transactions_createdAt_idx" ON "point_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "point_rules_rule_name_key" ON "point_rules"("rule_name");

-- CreateIndex
CREATE INDEX "point_rules_action_idx" ON "point_rules"("action");

-- CreateIndex
CREATE INDEX "point_rules_is_active_idx" ON "point_rules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "template_purchases_buyer_id_template_id_key" ON "template_purchases"("buyer_id", "template_id");

-- CreateIndex
CREATE INDEX "template_purchases_buyer_id_idx" ON "template_purchases"("buyer_id");

-- CreateIndex
CREATE INDEX "template_purchases_template_id_idx" ON "template_purchases"("template_id");

-- CreateIndex
CREATE INDEX "template_purchases_createdAt_idx" ON "template_purchases"("createdAt");

-- CreateIndex
CREATE INDEX "survey_embeddings_survey_id_idx" ON "survey_embeddings"("survey_id");

-- CreateIndex
CREATE INDEX "survey_embeddings_content_type_idx" ON "survey_embeddings"("content_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_embeddings_user_id_embedding_type_key" ON "user_embeddings"("user_id", "embedding_type");

-- CreateIndex
CREATE INDEX "user_embeddings_user_id_idx" ON "user_embeddings"("user_id");

-- CreateIndex
CREATE INDEX "user_embeddings_embedding_type_idx" ON "user_embeddings"("embedding_type");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tags" ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_analytics" ADD CONSTRAINT "response_analytics_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_purchases" ADD CONSTRAINT "template_purchases_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "survey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_embeddings" ADD CONSTRAINT "survey_embeddings_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
