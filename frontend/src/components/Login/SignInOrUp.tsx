/* eslint-disable import/no-extraneous-dependencies */
import {
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputRightElement,
  Link,
  Stack,
  useToast,
  Image,
} from '@chakra-ui/react';
import { auth } from '../../firebase';
import paws from '../Town/images/paws-town.png';
import assert from 'assert';

function SignInComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const handleSignIn = async () => {
    setIsSigningIn(true);
    let errorState = false;
    signInWithEmailAndPassword(auth, email, password)
      .catch(error => {
        setIsSigningIn(false);
        errorState = true;
        switch (error.code) {
          case 'auth/invalid-email':
            toast({
              title: 'Invalid email address',
              status: 'error',
            });
            break;
          case 'auth/invalid-credential':
            toast({
              title: 'Invalid email/password, please try again',
              status: 'error',
            });
            break;
          default:
            toast({
              title: 'An error occurred while signing in',
              status: 'error',
            });
        }
      })
      .then(async () => {
        if (!errorState) {
          toast({
            title: 'Signed in successfully',
            status: 'success',
          });
        }
      });
  };
  return (
    <>
      <Flex width='full' align='center' justifyContent='center'>
        <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
          <Box textAlign='center'>
            <Image width='auto' height='55px' src={paws.src} alt={'Logo'} />
            <Heading>Login</Heading>
          </Box>
          <Box my={4} textAlign='left'>
            <form>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type='email'
                  placeholder='test@test.com'
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  aria-label='EmailField'
                />
              </FormControl>
              <FormControl isRequired mt={6}>
                <FormLabel>Password</FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='*******'
                  onChange={event => setPassword(event.target.value)}
                  value={password}
                  aria-label='PasswordField'
                />
                <InputRightElement width='4.5rem'>
                  <Button h='1.75rem' size='sm' onClick={event => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </FormControl>
              <Button
                mt={4}
                width='full'
                type='submit'
                colorScheme='blue'
                isLoading={isSigningIn}
                isDisabled={isSigningIn}
                onClick={handleSignIn}
                aria-label='SignInButton'>
                Sign In
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </>
  );
}

function SignUpComponent({
  updateUserName,
  onSignUpCompleted,
}: {
  updateUserName: (newName: string) => void;
  onSignUpCompleted: () => void;
}): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const handleSignUp = async () => {
    setIsSigningUp(true);
    let errorState = false;
    await createUserWithEmailAndPassword(auth, email, password)
      .catch(async error => {
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
      })
      .then(async () => {
        if (!errorState) {
          updateUserName(userName);
          assert(auth.currentUser !== null, 'User is null');
          await updateProfile(auth.currentUser, { displayName: userName });
          toast({
            title: 'Account created.',
            status: 'success',
          });
          setIsSigningUp(false);
          onSignUpCompleted();
        }
      });
  };
  return (
    <>
      <Flex width='full' align='center' justifyContent='center'>
        <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
          <Box textAlign='center'>
            <Image width='auto' height='55px' src={paws.src} alt={'Logo'} />
            <Heading>Sign Up</Heading>
          </Box>
          <Box my={4} textAlign='left'>
            <form>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type='email'
                  placeholder='test@test.com'
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </FormControl>
              <FormControl isRequired mt={6}>
                <FormLabel>Username</FormLabel>
                <Input
                  type='text'
                  value={userName}
                  onChange={event => setUserName(event.target.value)}
                />
              </FormControl>
              <FormControl isRequired mt={6}>
                <FormLabel>Password</FormLabel>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='*******'
                  onChange={event => setPassword(event.target.value)}
                  value={password}
                />
                <InputRightElement width='4.5rem'>
                  <Button h='1.75rem' size='sm' onClick={event => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </FormControl>
              <Button
                mt={4}
                width='full'
                type='submit'
                colorScheme='blue'
                isDisabled={isSigningUp}
                isLoading={isSigningUp}
                onClick={handleSignUp}
                aria-label='SignUpButton'>
                Sign Up
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </>
  );
}

function SignInOrUp({
  updateUserName,
  newSignUp,
}: {
  updateUserName: (newName: string) => void;
  newSignUp: (val: boolean) => void;
}): JSX.Element {
  const [isSigningIn, setIsSigningIn] = useState(true); // to toggle between sign in and sign up
  if (isSigningIn) {
    newSignUp(false);
    return (
      <>
        <Flex width='full' align='center' justifyContent='center'>
          <Box mt={4} mb={4}>
            <Stack align='center' justifyContent='center'>
              <p>No account? Sign up for one!</p>
              <Link color='blue' onClick={() => setIsSigningIn(false)}>
                Create New Account
              </Link>
            </Stack>
          </Box>
        </Flex>
        <SignInComponent />
      </>
    );
  } else {
    newSignUp(true);
    return (
      <>
        <Flex width='full' align='center' justifyContent='center'>
          <Box mt={4} mb={4}>
            <Stack align='center' justifyContent='center'>
              <p>Have an account? Log in here:</p>
              <Link color='blue' onClick={() => setIsSigningIn(true)}>
                Sign In
              </Link>
            </Stack>
          </Box>
        </Flex>
        <SignUpComponent
          updateUserName={updateUserName}
          onSignUpCompleted={() => {
            setIsSigningIn(true);
          }}
        />
      </>
    );
  }
}

export default SignInOrUp;
