-- This script populates the database with a generic user and sample data.
-- It assumes it's being run on the fresh v4 schema you just created.

-- 1. Insert our generic user 'alfa'
-- We are explicitly setting the user_id to 1 for predictability.
-- The IGNORE keyword prevents an error if the user already exists.
INSERT IGNORE INTO `users` (`user_id`, `username`, `email`, `password_hash`, `preferences`) VALUES
(1, 'alfa', 'alfa@test.com', 'dummy_hash', '{}');

-- 2. Insert sample columns for our generic user (user_id = 1)
-- This will only insert them if they don't already exist for this user.
INSERT INTO `columns` (`user_id`, `column_name`, `position`)
SELECT 1, 'Weekdays', 0 WHERE NOT EXISTS (SELECT 1 FROM `columns` WHERE `user_id` = 1 AND `column_name` = 'Weekdays');

INSERT INTO `columns` (`user_id`, `column_name`, `position`)
SELECT 1, 'Chores', 1 WHERE NOT EXISTS (SELECT 1 FROM `columns` WHERE `user_id` = 1 AND `column_name` = 'Chores');


-- 3. Insert sample tasks, referencing the columns created above
-- This version uses subqueries to find the correct column_id by name,
-- making it robust even if the IDs are not 1 and 2.
INSERT INTO `tasks` (`user_id`, `column_id`, `encrypted_data`, `position`, `status`) VALUES
(1, (SELECT column_id FROM columns WHERE user_id = 1 AND column_name = 'Weekdays'), '{\"title\":\"Monday\"}', 0, 'normal'),
(1, (SELECT column_id FROM columns WHERE user_id = 1 AND column_name = 'Weekdays'), '{\"title\":\"Tuesday\"}', 1, 'normal'),
(1, (SELECT column_id FROM columns WHERE user_id = 1 AND column_name = 'Weekdays'), '{\"title\":\"Wednesday\"}', 2, 'priority'),
(1, (SELECT column_id FROM columns WHERE user_id = 1 AND column_name = 'Chores'), '{\"title\":\"Wash car\"}', 0, 'normal'),
(1, (SELECT column_id FROM columns WHERE user_id = 1 AND column_name = 'Chores'), '{\"title\":\"Mow lawn\"}', 1, 'completed');

