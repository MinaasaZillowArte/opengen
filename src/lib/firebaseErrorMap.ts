// lib/firebaseErrorMap.ts
export const firebaseErrorMap: { [key: string]: string } = {
    'auth/email-already-in-use': 'This email address is already in use. Please use a different email or log in.',
    'auth/invalid-email': 'The email address format is invalid. Please check and try again.',
    'auth/operation-not-allowed': 'This operation is not allowed. Contact the administrator.',
    'auth/weak-password': 'Password is too weak. Use a stronger combination of letters, numbers, and symbols (minimum 6 characters).',
    'auth/user-disabled': 'This user account has been disabled.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Access to this account has been temporarily disabled for security. Try again later.',
    'auth/requires-recent-login': 'This operation is sensitive and requires recent authentication. Please log in again before retrying.',
    'auth/network-request-failed': 'Network request failed. Please check your internet connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.', // Common for wrong email/password
    // Add other error mappings as needed
};

export const getFriendlyFirebaseAuthError = (errorCode: string, defaultMessage: string = "An unexpected error occurred. Please try again."): string => {
    return firebaseErrorMap[errorCode] || defaultMessage;
};