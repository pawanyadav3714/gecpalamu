import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  terminate,
  clearIndexedDbPersistence
} from "firebase/firestore";
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with experimentalForceLongPolling to handle potential proxy/iframe issues
// and ensure we can connect in restricted environments.
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const code = (error as any)?.code;
  const message = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error(`Firestore Error [${code || 'unknown'}]:`, message);
  console.debug('Detailed Error Info:', JSON.stringify(errInfo));
  
  // We silence offline/unavailable errors as they might be transient during dev or initial load
  if (code === 'unavailable' || message.includes('offline')) {
    console.warn("Firestore backend is currently unreachable. Retrying in background...");
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

// Function to reset connection if it gets stuck
export async function resetFirestore() {
  await terminate(db);
  await clearIndexedDbPersistence(db);
}

async function testConnection() {
  try {
    // Try to get a non-existent document to check connection
    // We use getDocFromServer to bypass local cache and confirm network path
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase connection established successfully.");
  } catch (error: any) {
    const code = error.code;
    const message = error.message;

    if (code === 'permission-denied') {
      console.log("Firestore connection: Reachable (Security rules are active).");
      return;
    }
    
    if (code === 'unavailable' || message?.includes('client is offline')) {
      console.warn("Firestore Connection: Client reports offline status. This may resolve as the app initializes.");
    } else {
      console.warn("Firestore Connection Status:", message || error);
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
