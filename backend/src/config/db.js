import mongoose from 'mongoose';

/**
 * Strips password credentials from MongoDB connection URI for safe console logging
 */
function sanitizeMongoUri(uri) {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1******$3');
  } catch {
    return 'masked-uri';
  }
}

/**
 * Establishes connection to MongoDB
 * @param {string} [customUri] - Optional URI (used for testing with in-memory database)
 */
export async function connectDB(customUri) {
  const uri = customUri || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'codesage_ai',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed to ${sanitizeMongoUri(uri)}: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      // Allow the application to start or handle reconnects rather than crashing silently
      console.warn('[Database] Retrying connection or operating in degraded mode...');
    }
    throw error;
  }
}

/**
 * Disconnects from MongoDB cleanly
 */
export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
  } catch (error) {
    console.error(`[Database Error] Error during disconnection: ${error.message}`);
  }
}

// Event listeners for connection monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

// Graceful shutdown handlers
const handleExit = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
