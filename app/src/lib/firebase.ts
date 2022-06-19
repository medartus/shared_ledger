import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAVbode2QTijLa4XHBC8tRvQoh53GXf2OY',
  authDomain: 'shared-w3-ledger.firebaseapp.com',
  projectId: 'shared-w3-ledger',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default functions;
