import { Platform } from "react-native";
import { databaseService as nativeDatabaseService } from "./DatabaseService";
import { webDatabaseService } from "./WebDatabaseService";

// Export platform-specific database service
export const databaseService =
  Platform.OS === "web" ? webDatabaseService : nativeDatabaseService;

// Also export individual services for direct access if needed
export { nativeDatabaseService, webDatabaseService };
export { DATABASE_NAME, DATABASE_VERSION, SCHEMA, MIGRATIONS } from "./schema";
