import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.TEST_VAR);
console.log(process.env.NEXT_TEST_VAR);
// Your web app's Firebase configuration
// TODO: put this in .env file
const firebaseConfig = {
  apiKey: 'AIzaSyCIOW_Yip0CHd5hJe5mjO674dpm40YOeTk',
  authDomain: 'covey-town-pets.firebaseapp.com',
  projectId: 'covey-town-pets',
  storageBucket: 'covey-town-pets.appspot.com',
  messagingSenderId: '209075765212',
  appId: '1:209075765212:web:530a8d8586598b760cd919',
  databaseURL: 'https://covey-town-pets-default-rtdb.firebaseio.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
