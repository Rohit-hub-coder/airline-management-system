-- Initialize databases for Airline Management System microservices
CREATE DATABASE IF NOT EXISTS `auth_db_dev`;
CREATE DATABASE IF NOT EXISTS `flight_search_db_dev`;
CREATE DATABASE IF NOT EXISTS `booking_db_dev`;
CREATE DATABASE IF NOT EXISTS `reminder_db_dev`;

GRANT ALL PRIVILEGES ON `auth_db_dev`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `flight_search_db_dev`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `booking_db_dev`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `reminder_db_dev`.* TO 'root'@'%';
FLUSH PRIVILEGES;
