-- Code for /sql/storyboards_schema.sql
--
-- Signal - Storyboards module schema
--
-- Every table in the collaborative storyboarding view (the third tab). All are
-- prefixed `sb_` and none of them touch an existing Signal table except by
-- foreign key onto `users(user_id)`.
--
-- Safe to re-run: every statement is IF NOT EXISTS.
--
-- @version 8.8 Samara
-- @author Alex & Claude

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

-- One row per person taking part in this feature: either a Signal account
-- (`user_id` set) or a codeword guest (`user_id` NULL). Authorship, membership
-- and ownership all point here, so the feature has exactly one identity and
-- Signal's `users` table never has to carry credential-less guest rows.
--
-- The unique key on `user_id` binds an account to at most one participant row;
-- MariaDB permits repeated NULLs in a unique index, which is what lets every
-- guest sit in the same column.
CREATE TABLE IF NOT EXISTS `sb_participants` (
	`participant_id` INT NOT NULL AUTO_INCREMENT,
	`user_id` INT DEFAULT NULL,
	`display_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
	`is_guest` TINYINT(1) NOT NULL DEFAULT 0,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`last_seen_at` DATETIME DEFAULT NULL,
	PRIMARY KEY (`participant_id`),
	UNIQUE KEY `ux_sb_participant_user` (`user_id`),
	CONSTRAINT `fk_sb_participant_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A guest's session. Guests never get a PHP login session, so this carries both
-- the opaque cookie token (hashed at rest, never stored raw) and the CSRF token
-- the guest gateway checks, mirroring what $_SESSION does for accounts.
CREATE TABLE IF NOT EXISTS `sb_guest_sessions` (
	`session_id` INT NOT NULL AUTO_INCREMENT,
	`participant_id` INT NOT NULL,
	`token_hash` CHAR(64) COLLATE utf8mb4_unicode_ci NOT NULL,
	`csrf_token` CHAR(64) COLLATE utf8mb4_unicode_ci NOT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`expires_at` DATETIME NOT NULL,
	`last_seen_at` DATETIME DEFAULT NULL,
	`user_agent` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	PRIMARY KEY (`session_id`),
	UNIQUE KEY `ux_sb_guest_token` (`token_hash`),
	KEY `ix_sb_guest_participant` (`participant_id`),
	CONSTRAINT `fk_sb_guest_participant` FOREIGN KEY (`participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- The document unit
-- ---------------------------------------------------------------------------

-- One row = one storyboard. `access_code` is the shareable codeword and
-- `code_version` is bumped on every rotation: a membership stamped with an
-- older version is locked out by that single UPDATE, with no per-session
-- cleanup.
--
-- `active_code` exists only to carry the unique index. The rule is "a live
-- codeword resolves to exactly one storyboard", which wants a partial index;
-- MariaDB has none, so the generated column nulls the code out for archived
-- storyboards and the plain unique index then means the right thing.
--
-- The nine trailing columns are the delivery brief. All nullable: a storyboard
-- is created before its author knows the answers, and export is what refuses
-- while the seven required ones are blank.
CREATE TABLE IF NOT EXISTS `sb_storyboards` (
	`storyboard_id` INT NOT NULL AUTO_INCREMENT,
	`owner_participant_id` INT NOT NULL,
	`title` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
	`description` TEXT COLLATE utf8mb4_unicode_ci,
	`access_code` VARCHAR(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`code_version` INT NOT NULL DEFAULT 1,
	`code_updated_at` DATETIME DEFAULT NULL,
	`join_role` ENUM('editor','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'editor',
	`status` ENUM('active','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
	`audience` TEXT COLLATE utf8mb4_unicode_ci,
	`desired_outcome` TEXT COLLATE utf8mb4_unicode_ci,
	`presenter` TEXT COLLATE utf8mb4_unicode_ci,
	`modality` TEXT COLLATE utf8mb4_unicode_ci,
	`delivery_format` TEXT COLLATE utf8mb4_unicode_ci,
	`time_constraint` TEXT COLLATE utf8mb4_unicode_ci,
	`target_language` TEXT COLLATE utf8mb4_unicode_ci,
	`tone` TEXT COLLATE utf8mb4_unicode_ci,
	`sensitivities` TEXT COLLATE utf8mb4_unicode_ci,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`active_code` VARCHAR(64) COLLATE utf8mb4_unicode_ci
		GENERATED ALWAYS AS (IF(`status` = 'active', `access_code`, NULL)) STORED,
	PRIMARY KEY (`storyboard_id`),
	UNIQUE KEY `ux_sb_active_code` (`active_code`),
	KEY `ix_sb_storyboard_owner` (`owner_participant_id`),
	CONSTRAINT `fk_sb_storyboard_owner` FOREIGN KEY (`owner_participant_id`) REFERENCES `sb_participants` (`participant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who may open which storyboard, and under which code version. The owner's row
-- carries `joined_code_version` NULL: ownership is held by account, not by code,
-- so a rotation never locks the owner out of their own work.
CREATE TABLE IF NOT EXISTS `sb_memberships` (
	`membership_id` INT NOT NULL AUTO_INCREMENT,
	`storyboard_id` INT NOT NULL,
	`participant_id` INT NOT NULL,
	`role` ENUM('owner','editor','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'editor',
	`joined_code_version` INT DEFAULT NULL,
	`status` ENUM('active','left') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
	`joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`last_active_at` DATETIME DEFAULT NULL,
	PRIMARY KEY (`membership_id`),
	UNIQUE KEY `ux_sb_membership` (`storyboard_id`,`participant_id`),
	KEY `ix_sb_membership_participant` (`participant_id`),
	CONSTRAINT `fk_sb_membership_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_membership_participant` FOREIGN KEY (`participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Scenes and their content
-- ---------------------------------------------------------------------------

-- One row = one scene: a single point the audience should take away. `position`
-- is 1-based within its storyboard and is the argument's running order.
--
-- `kind` only ever holds 'placeholder' today. It is here so that backing a scene
-- with a finished HTML file can be added later without a migration; nothing
-- reads it as anything else yet.
CREATE TABLE IF NOT EXISTS `sb_scenes` (
	`scene_id` INT NOT NULL AUTO_INCREMENT,
	`storyboard_id` INT NOT NULL,
	`title` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
	`position` INT NOT NULL,
	`kind` ENUM('placeholder','built') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'placeholder',
	`owner_label` VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`is_backup` TINYINT(1) NOT NULL DEFAULT 0,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`scene_id`),
	KEY `ix_sb_scene_storyboard` (`storyboard_id`,`position`),
	CONSTRAINT `fk_sb_scene_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A scene's text boxes: the scene's own content, and half of what the export
-- consumes. Distinct from the comment log, which is review and is never
-- exported.
--
-- `sort_order` is NOT a sequence within this table. Text boxes and reference
-- images share one 0..N-1 sequence per scene across both tables, so a text box
-- can sit between two images. Anything writing it has to consider both tables
-- or it hands a new element a number an image already holds.
--
-- `body` stores cross-references as `<<@{scene_id}>>` — a stable id, rendered as
-- the target's current position, so reordering never breaks a link.
CREATE TABLE IF NOT EXISTS `sb_scene_texts` (
	`text_id` INT NOT NULL AUTO_INCREMENT,
	`scene_id` INT NOT NULL,
	`storyboard_id` INT NOT NULL,
	`author_participant_id` INT DEFAULT NULL,
	`author_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`body` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
	`sort_order` INT NOT NULL DEFAULT 0,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`text_id`),
	KEY `ix_sb_text_scene` (`scene_id`,`sort_order`,`text_id`),
	KEY `ix_sb_text_storyboard` (`storyboard_id`),
	CONSTRAINT `fk_sb_text_scene` FOREIGN KEY (`scene_id`) REFERENCES `sb_scenes` (`scene_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_text_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_text_author` FOREIGN KEY (`author_participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A scene's reference images — at most four, cap enforced in the handler.
-- Bytes live on disk under Signal's upload directory; this table holds the
-- metadata and the path, and the bytes are charged to the storyboard owner's
-- storage quota (a guest has no account to charge).
--
-- `description` is required and non-empty for every row. It is the image's
-- alt-text, its hover tooltip, and the only way the exported brief can tell an
-- agent what a screenshot actually shows.
--
-- `sort_order` shares the one sequence per scene described on sb_scene_texts.
CREATE TABLE IF NOT EXISTS `sb_scene_assets` (
	`asset_id` INT NOT NULL AUTO_INCREMENT,
	`scene_id` INT NOT NULL,
	`storyboard_id` INT NOT NULL,
	`kind` ENUM('reference_image') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reference_image',
	`sort_order` INT NOT NULL DEFAULT 0,
	`description` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
	`filename` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
	`mime` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`byte_size` BIGINT NOT NULL DEFAULT 0,
	`storage_path` VARCHAR(512) COLLATE utf8mb4_unicode_ci NOT NULL,
	`uploaded_by_participant_id` INT DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`asset_id`),
	KEY `ix_sb_asset_scene` (`scene_id`,`sort_order`,`asset_id`),
	KEY `ix_sb_asset_storyboard` (`storyboard_id`),
	CONSTRAINT `fk_sb_asset_scene` FOREIGN KEY (`scene_id`) REFERENCES `sb_scenes` (`scene_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_asset_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_asset_uploader` FOREIGN KEY (`uploaded_by_participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team Notes: the review log. Separate from scene content and never exported as
-- content. `status` closed means hidden from the active log but kept for the
-- record — closed and hidden are one state, not two.
--
-- `author_name` is a snapshot taken at write time, so losing access later never
-- erases who said what.
CREATE TABLE IF NOT EXISTS `sb_comments` (
	`comment_id` INT NOT NULL AUTO_INCREMENT,
	`scene_id` INT NOT NULL,
	`storyboard_id` INT NOT NULL,
	`author_participant_id` INT DEFAULT NULL,
	`author_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
	`body` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
	`status` ENUM('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
	`is_action_item` TINYINT(1) NOT NULL DEFAULT 0,
	`action_owner` VARCHAR(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (`comment_id`),
	KEY `ix_sb_comment_scene` (`scene_id`,`comment_id`),
	KEY `ix_sb_comment_storyboard` (`storyboard_id`,`status`),
	CONSTRAINT `fk_sb_comment_scene` FOREIGN KEY (`scene_id`) REFERENCES `sb_scenes` (`scene_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_comment_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_comment_author` FOREIGN KEY (`author_participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- History
-- ---------------------------------------------------------------------------

-- Every export snapshots the markdown it produced, so a brief that was handed to
-- an agent can be read back exactly as it was sent.
CREATE TABLE IF NOT EXISTS `sb_exports` (
	`export_id` INT NOT NULL AUTO_INCREMENT,
	`storyboard_id` INT NOT NULL,
	`created_by_participant_id` INT DEFAULT NULL,
	`created_by_name` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
	`format` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'markdown',
	`scope` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
	`content` LONGTEXT COLLATE utf8mb4_unicode_ci NOT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`export_id`),
	KEY `ix_sb_export_storyboard` (`storyboard_id`,`export_id`),
	CONSTRAINT `fk_sb_export_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_export_author` FOREIGN KEY (`created_by_participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Light audit trail: rotations, joins, scene adds, exports.
CREATE TABLE IF NOT EXISTS `sb_events` (
	`event_id` INT NOT NULL AUTO_INCREMENT,
	`storyboard_id` INT DEFAULT NULL,
	`participant_id` INT DEFAULT NULL,
	`kind` VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL,
	`detail` TEXT COLLATE utf8mb4_unicode_ci,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`event_id`),
	KEY `ix_sb_event_storyboard` (`storyboard_id`,`event_id`),
	CONSTRAINT `fk_sb_event_storyboard` FOREIGN KEY (`storyboard_id`) REFERENCES `sb_storyboards` (`storyboard_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sb_event_participant` FOREIGN KEY (`participant_id`) REFERENCES `sb_participants` (`participant_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Join attempts, per IP, so a codeword cannot be brute-forced or the space
-- enumerated. Rows older than the window are pruned opportunistically.
CREATE TABLE IF NOT EXISTS `sb_join_attempts` (
	`attempt_id` INT NOT NULL AUTO_INCREMENT,
	`ip_address` VARCHAR(45) COLLATE utf8mb4_unicode_ci NOT NULL,
	`succeeded` TINYINT(1) NOT NULL DEFAULT 0,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`attempt_id`),
	KEY `ix_sb_attempt_ip` (`ip_address`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
