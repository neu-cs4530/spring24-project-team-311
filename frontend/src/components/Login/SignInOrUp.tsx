import { updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Heading, Input, Stack, useToast } from '@chakra-ui/react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { set } from 'lodash';
import { auth } from '../../firebase';
import { FirebaseError } from 'firebase/app';

function SignInComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const toast = useToast();
  const handleSignIn = async () => {
    setIsSigningIn(true);
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
      setIsSigningIn(false);
      switch (error.code) {
        case 'auth/invalid-email':
          toast({
            title: 'Invalid email address',
            status: 'error',
          });
          break;
        case 'auth/user-not-found':
          toast({
            title: 'No user found with this email address',
            status: 'error',
          });
          break;
        case 'auth/wrong-password':
          toast({
            title: 'Incorrect password',
            status: 'error',
          });
          break;
        default:
          toast({
            title: 'An error occurred while signing in',
            status: 'error',
          });
      }
    });
  };
  return (
    <>
      <Stack>
        <Heading as="h2" size="xl">Sign In</Heading>
        <FormControl>
          <FormLabel htmlFor='email'>Email Address</FormLabel>
          <Input
            autoFocus
            name='email'
            placeholder='test@example.com'
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
          <FormLabel htmlFor='password'>Password</FormLabel>
          <Input
            name='password'
            type='password'
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </FormControl>
        <Button 
          data-testid='signInButton'
          onClick={handleSignIn}
          isLoading={isSigningIn}
          isDisabled={isSigningIn}>
          Sign in
        </Button>
      </Stack>
    </>
  );
}

function SignUpComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const toast = useToast();
  const handleSignUp = async () => {
    setIsSigningUp(true);
    let errorState = false;
    await createUserWithEmailAndPassword(auth, email, password).catch(async (error) => {
      errorState = true;
      setIsSigningUp(false);
      switch (error.code) {
        case 'auth/invalid-email':
          toast({
            title: 'Invalid email address',
            status: 'error',
          });
          break;
        case 'auth/email-already-in-use':
          toast({
            title: 'Email address already in use',
            status: 'error',
          });
          break;
        case 'auth/weak-password':
          toast({
            title: 'Weak password',
            status: 'error',
          });
          break;
        default:
          toast({
            title: 'An error occurred while signing up',
            status: 'error',
          });
      }
    });
    if (!errorState) {
      await updateProfile(auth.currentUser!, { displayName: userName });
    }
  };
  return (
    <>
      <Stack>
        <Heading as="h2" size="xl">Sign Up</Heading>
        <FormControl>
          <FormLabel htmlFor='email'>Email Address</FormLabel>
          <Input
            autoFocus
            name='email'
            placeholder='test@example.com'
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
          <FormLabel htmlFor='password'>Password</FormLabel>
          <Input
            name='password'
            type='password'
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          <FormLabel htmlFor='username'>Username</FormLabel>
          <Input
            name='Username'
            value={userName}
            onChange={event => setUserName(event.target.value)}
          />
        </FormControl>
        <Button 
          data-testid='signInButton'
          onClick={handleSignUp}
          isLoading={isSigningUp}
          isDisabled={isSigningUp}>
          Sign up
        </Button>
      </Stack>
    </>
  );
}


function SignInOrUp(): JSX.Element {
  const [isSigningIn, setIsSigningIn] = useState(true);  // to toggle between sign in and sign up
  if (isSigningIn) {
    return (
      <>
        No account? Sign up for one! <Button onClick={() => setIsSigningIn(false)}>Create New Account</Button>
        <SignInComponent />
      </>
    );
  } else {
    return (
      <>
        Have an account already? Log in here: <Button onClick={() => setIsSigningIn(true)}>Sign in</Button>
        <SignUpComponent />
      </>
    );
  }
}

export default SignInOrUp;
