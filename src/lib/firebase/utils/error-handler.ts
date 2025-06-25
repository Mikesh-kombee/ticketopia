/**
 * Generic error handler for Firestore operations
 * @param operation The async operation to execute
 * @param errorMessage The error message to log if the operation fails
 * @returns The result of the operation or a default value
 */
export async function handleFirestoreError<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    if (error instanceof Error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
    throw error;
  }
}
