import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Heading, Input, Stack } from '@chakra-ui/react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { set } from 'lodash';
import { auth } from '../../firebase';

function SignInComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
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
        </FormControl>
        <Button 
          data-testid='signInButton'
          onClick={handleSignIn}
          isLoading={isSigningIn}
          isDisabled={isSigningIn}>
          Sign in
        </Button>
        {error !== ''? {error} : ''}
      </Stack>
    </>
  );
}

function SignUpComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const handleSignUp = async () => {
    try {
      setIsSigningUp(true);
      setError('');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
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
        </FormControl>
        <Button 
          data-testid='signInButton'
          onClick={handleSignUp}
          isLoading={isSigningUp}
          isDisabled={isSigningUp}>
          Sign up
        </Button>
        {error !== ''? {error} : ''}
      </Stack>
    </>
  );
}

function SignInOrUp(): JSX.Element {
  const [isSigningIn, setIsSigningIn] = useState(true);
  if (isSigningIn) {
    return (
      <>
        <Button onClick={() => setIsSigningIn(false)}>Sign up here</Button>
        <SignInComponent />
      </>
    );
  } else {
    return (
      <>
        <Button onClick={() => setIsSigningIn(true)}>Sign in here</Button>
        <SignUpComponent />
      </>
    );
  }
}

export default SignInOrUp;
```