import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
export default class TestDB {
  firebaseConfig = {
    apiKey: 'AIzaSyA-w39Ll4vNuTKL8FH5qbUzNkZdNKlsEjE',
    authDomain: 'swe-fin-proj-spr24-311.firebaseapp.com',
    projectId: 'swe-fin-proj-spr24-311',
    storageBucket: 'swe-fin-proj-spr24-311.appspot.com',
    messagingSenderId: '286640725822',
    appId: '1:286640725822:web:353a50eb6191053440d66f',
    databaseURL: 'https://swe-fin-proj-spr24-311-default-rtdb.firebaseio.com',
  };

  // Initialize Firebase
  firebaseApp = initializeApp(this.firebaseConfig);

  // Initialize Realtime Database and get a reference to the service
  // eslint-disable-next-line import/prefer-default-export
  db = getDatabase(this.firebaseApp);
}
