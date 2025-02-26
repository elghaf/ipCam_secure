import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, storage } from '@/lib/firebase/firebase';

export const firebaseService = {
  // Auth methods
  async signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  async signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  async signOut() {
    return signOut(auth);
  },
  
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
  
  // Storage methods
  async uploadFile(path: string, file: File) {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  },
  
  async deleteFile(path: string) {
    const storageRef = ref(storage, path);
    return deleteObject(storageRef);
  },
  
  getFileUrl(path: string) {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }
};