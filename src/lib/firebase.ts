import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { Store, SalesRecord, PurchaseContract } from '../types';

// Credentials retrieved from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDp3mSlZGXPezXgEHArhdzXSnw0VV660vc",
  authDomain: "gen-lang-client-0355422620.firebaseapp.com",
  projectId: "gen-lang-client-0355422620",
  storageBucket: "gen-lang-client-0355422620.firebasestorage.app",
  messagingSenderId: "310718005675",
  appId: "1:310718005675:web:981c974e530339820f92ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (with designated custom database ID and long-polling)
const databaseId = "ai-studio-bocodoanhthucahn-6ea112f8-88ff-48fc-8ec4-62bc67d450d6";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Interface for user document in Firestore
export interface FirestoreUserData {
  uid: string;
  username?: string;
  passwordHash?: string;
  salt?: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: string;
  createdAt: string;
  stores: Store[];
  records: SalesRecord[];
  contracts?: PurchaseContract[];
  activeStoreId: string;
  fullName: string;
  phone?: string;
  role: string;
  securityLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    ipAddress: string;
    status: string;
    userAgent: string;
  }>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Internal state for debouncing and serializing Firestore writes
const pendingUserData: Record<string, Partial<Omit<FirestoreUserData, 'uid'>>> = {};
const syncTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const isWriting: Record<string, boolean> = {};

let isQuotaExhausted = true;
try {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem('firestore_quota_exhausted');
    if (cached === 'false') {
      isQuotaExhausted = false;
    } else {
      localStorage.setItem('firestore_quota_exhausted', 'true');
    }
  }
} catch (e) {
  isQuotaExhausted = true;
}

function markQuotaExhausted() {
  isQuotaExhausted = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('firestore_quota_exhausted', 'true');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('firestore_quota_exhausted', 'true');
    }
  } catch (e) {
    // ignore
  }
}

async function executeSyncUserData(userId: string): Promise<void> {
  if (isQuotaExhausted) {
    delete pendingUserData[userId];
    return;
  }

  if (isWriting[userId]) {
    if (!syncTimers[userId]) {
      syncTimers[userId] = setTimeout(() => {
        delete syncTimers[userId];
        executeSyncUserData(userId);
      }, 1000);
    }
    return;
  }

  const payload = pendingUserData[userId];
  if (!payload || Object.keys(payload).length === 0) return;

  delete pendingUserData[userId];
  isWriting[userId] = true;

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...payload,
      uid: userId,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error: any) {
    const errMsg = String(error?.message || error?.code || error);
    if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota') || error?.code === 'resource-exhausted') {
      console.warn('Firestore write quota exceeded. Falling back to local storage persistence mode.');
      markQuotaExhausted();
      delete pendingUserData[userId];
    } else {
      console.warn('Firestore sync error (handled gracefully):', error);
    }
  } finally {
    isWriting[userId] = false;
    if (!isQuotaExhausted && pendingUserData[userId] && Object.keys(pendingUserData[userId]).length > 0 && !syncTimers[userId]) {
      syncTimers[userId] = setTimeout(() => {
        delete syncTimers[userId];
        executeSyncUserData(userId);
      }, 1000);
    }
  }
}

/**
 * Synchronizes user data to Firestore with debouncing and write serialization
 * to prevent write queue exhaustion.
 */
export async function syncUserDataToFirestore(
  userId: string,
  data: Partial<Omit<FirestoreUserData, 'uid'>>
): Promise<void> {
  if (!userId || isQuotaExhausted) return;

  // Accumulate pending payload
  pendingUserData[userId] = {
    ...(pendingUserData[userId] || {}),
    ...data
  };

  if (syncTimers[userId]) {
    clearTimeout(syncTimers[userId]);
  }

  return new Promise((resolve) => {
    syncTimers[userId] = setTimeout(async () => {
      delete syncTimers[userId];
      await executeSyncUserData(userId);
      resolve();
    }, 1500);
  });
}

/**
 * Retrieves user data from Firestore.
 */
export async function getUserDataFromFirestore(userId: string): Promise<FirestoreUserData | null> {
  if (!userId || isQuotaExhausted) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUserData;
    }
    return null;
  } catch (error) {
    console.warn('Firestore getUserData error (falling back to local):', error);
    return null;
  }
}
