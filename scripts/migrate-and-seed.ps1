# Migrate and seed all containerized microservices in Docker Compose
Write-Host "=== Running migrations for AuthService ===" -ForegroundColor Cyan
docker compose exec auth-service npx sequelize-cli db:migrate

Write-Host "=== Running migrations for Flights & Search Service ===" -ForegroundColor Cyan
docker compose exec flight-service npx sequelize-cli db:migrate

Write-Host "=== Running seeders for Flights & Search Service ===" -ForegroundColor Cyan
docker compose exec flight-service npx sequelize-cli db:seed:all
docker compose exec flight-service node src/seeders/manual_flights_seeder.js

Write-Host "=== Running migrations for BookingService ===" -ForegroundColor Cyan
docker compose exec booking-service npx sequelize-cli db:migrate

Write-Host "=== Running migrations for ReminderService ===" -ForegroundColor Cyan
docker compose exec reminder-service npx sequelize-cli db:migrate

Write-Host "=== All migrations and seeders completed! ===" -ForegroundColor Green
