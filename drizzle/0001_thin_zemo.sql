CREATE TABLE `activity_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100),
	`entity_id` varchar(100),
	`description` text,
	`metadata` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`category_code` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_category_code_unique` UNIQUE(`category_code`)
);
--> statement-breakpoint
CREATE TABLE `customer_enquiries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`enquiry_code` varchar(50) NOT NULL,
	`customer_id` bigint NOT NULL,
	`product_id` bigint NOT NULL,
	`required_quantity` int NOT NULL,
	`expected_purchase_date` datetime,
	`remarks` text,
	`status` enum('NEW','CONTACTED','FOLLOW_UP','CONVERTED','LOST','CANCELLED') NOT NULL DEFAULT 'NEW',
	`submitted_by_user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customer_enquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `enquiries_enquiry_code_unique` UNIQUE(`enquiry_code`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`customer_code` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`mobile` varchar(30),
	`email` varchar(255),
	`address` text,
	`remarks` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_customer_code_unique` UNIQUE(`customer_code`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`employee_code` varchar(50) NOT NULL,
	`phone` varchar(30),
	`designation` varchar(100),
	`joining_date` datetime,
	`address` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_user_unique` UNIQUE(`user_id`),
	CONSTRAINT `employees_employee_code_unique` UNIQUE(`employee_code`)
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`transaction_code` varchar(50) NOT NULL,
	`product_id` bigint NOT NULL,
	`transaction_type` enum('OPENING','PURCHASE','SALE','DAMAGE','ADJUSTMENT_IN','ADJUSTMENT_OUT','RETURN_IN','RETURN_OUT') NOT NULL,
	`quantity` int NOT NULL,
	`previous_balance` int NOT NULL,
	`new_balance` int NOT NULL,
	`sale_id` bigint,
	`sale_item_id` bigint,
	`performed_by_user_id` bigint NOT NULL,
	`remarks` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_transaction_code_unique` UNIQUE(`transaction_code`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`product_code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`category_id` bigint NOT NULL,
	`unit` varchar(30) NOT NULL DEFAULT 'Piece',
	`current_stock` int NOT NULL DEFAULT 0,
	`minimum_stock_level` int NOT NULL DEFAULT 0,
	`purchase_price` decimal(12,2),
	`selling_price` decimal(12,2),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_product_code_unique` UNIQUE(`product_code`)
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`sale_id` bigint NOT NULL,
	`product_id` bigint NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`line_total` decimal(14,2) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`sale_code` varchar(50) NOT NULL,
	`customer_id` bigint NOT NULL,
	`source` enum('DIRECT','ENQUIRY') NOT NULL DEFAULT 'DIRECT',
	`enquiry_id` bigint,
	`sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`payment_status` enum('PENDING','PARTIAL','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`remarks` text,
	`created_by_user_id` bigint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_sale_code_unique` UNIQUE(`sale_code`),
	CONSTRAINT `sales_enquiry_unique` UNIQUE(`enquiry_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(255);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `user_code` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `role` enum('ADMIN','EMPLOYEE') DEFAULT 'EMPLOYEE' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_user_code_unique` UNIQUE(`user_code`);--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `customer_enquiries` ADD CONSTRAINT `customer_enquiries_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `customer_enquiries` ADD CONSTRAINT `customer_enquiries_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `customer_enquiries` ADD CONSTRAINT `customer_enquiries_submitted_by_user_id_users_id_fk` FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_sale_item_id_sale_items_id_fk` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_performed_by_user_id_users_id_fk` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_enquiry_id_customer_enquiries_id_fk` FOREIGN KEY (`enquiry_id`) REFERENCES `customer_enquiries`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_created_by_user_id_users_id_fk` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `activity_logs_user_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_action_idx` ON `activity_logs` (`action`);--> statement-breakpoint
CREATE INDEX `activity_logs_entity_idx` ON `activity_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_created_at_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `categories_name_idx` ON `categories` (`name`);--> statement-breakpoint
CREATE INDEX `categories_active_idx` ON `categories` (`is_active`);--> statement-breakpoint
CREATE INDEX `enquiries_customer_idx` ON `customer_enquiries` (`customer_id`);--> statement-breakpoint
CREATE INDEX `enquiries_product_idx` ON `customer_enquiries` (`product_id`);--> statement-breakpoint
CREATE INDEX `enquiries_submitted_by_idx` ON `customer_enquiries` (`submitted_by_user_id`);--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `customer_enquiries` (`status`);--> statement-breakpoint
CREATE INDEX `enquiries_created_at_idx` ON `customer_enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `customers_mobile_idx` ON `customers` (`mobile`);--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE INDEX `employees_active_idx` ON `employees` (`is_active`);--> statement-breakpoint
CREATE INDEX `inventory_transactions_product_idx` ON `inventory_transactions` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_transactions_type_idx` ON `inventory_transactions` (`transaction_type`);--> statement-breakpoint
CREATE INDEX `inventory_transactions_sale_idx` ON `inventory_transactions` (`sale_id`);--> statement-breakpoint
CREATE INDEX `inventory_transactions_performed_by_idx` ON `inventory_transactions` (`performed_by_user_id`);--> statement-breakpoint
CREATE INDEX `inventory_transactions_created_at_idx` ON `inventory_transactions` (`created_at`);--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_stock_idx` ON `products` (`current_stock`);--> statement-breakpoint
CREATE INDEX `products_active_idx` ON `products` (`is_active`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_product_idx` ON `sale_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `sales_customer_idx` ON `sales` (`customer_id`);--> statement-breakpoint
CREATE INDEX `sales_source_idx` ON `sales` (`source`);--> statement-breakpoint
CREATE INDEX `sales_date_idx` ON `sales` (`sale_date`);--> statement-breakpoint
CREATE INDEX `sales_payment_status_idx` ON `sales` (`payment_status`);--> statement-breakpoint
CREATE INDEX `sales_created_by_idx` ON `sales` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_active_idx` ON `users` (`is_active`);