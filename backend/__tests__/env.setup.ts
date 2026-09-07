// Runs before the test framework is installed and before any test file
// imports src/app.ts — env.ts validates process.env synchronously at import
// time, so these must be set first. MONGODB_URI is a placeholder: tests
// never call connectDB(); each test file connects mongoose directly to its
// own mongodb-memory-server instance (see __tests__/db.ts), so nothing here
// ever actually dials this value.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://placeholder-unused-in-tests/test";
process.env.PORT = "4000";
process.env.ADMIN_EMAIL = "admin@test.dev";
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.FRONTEND_URL = "http://localhost:3000";
