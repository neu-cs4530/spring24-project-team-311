import { updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Input, InputRightElement, Link, Stack, StylesProvider, useToast } from '@chakra-ui/react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { isError, set, values } from 'lodash';
import { auth } from '../../firebase';
import { FirebaseError } from 'firebase/app';

function SignInComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      <Flex width='full' align='center' justifyContent='center'>
        <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
          <Box textAlign='center'>
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
              <Button mt={4}
                width='full' 
                type='submit' 
                colorScheme='blue' 
                isLoading={isSigningIn} 
                isDisabled={isSigningIn}
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </>
  );
}

function SignUpComponent(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const handleSignUp = async () => {
    setIsSigningUp(true);
    let errorState = false;
    await createUserWithEmailAndPassword(auth, email, password).catch(async (error) => {
      console.log(error.code, error.message)
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
      <Flex width='full' align='center' justifyContent='center'>
        <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
          <Box textAlign='center'>
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
              <FormControl isRequired>
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
              <Button mt={4} width='full' type='submit' colorScheme='blue' isDisabled={isSigningUp} isLoading={isSigningUp} onClick={handleSignUp}>
                Sign Up
              </Button>
            </form>
          </Box>
        </Box>
      </Flex>
    </>
  );
}


function SignInOrUp(): JSX.Element {
  const [isSigningIn, setIsSigningIn] = useState(true);  // to toggle between sign in and sign up
  if (isSigningIn) {
    return (
      <>
        <Flex width='full' align='center' justifyContent='center'>
          <Stack align='center' justifyContent='center'>
            <p>No account? Sign up for one!</p>
            <Link color='blue' onClick={() => setIsSigningIn(false)}>Create New Account</Link>
          </Stack>
        </Flex>
        <SignInComponent />
      </>
    );
  } else {
    return (
      <>
        <Flex width='full' align='center' justifyContent='center'>
          <Stack align='center' justifyContent='center'>
            <p>Have an account? Log in here:</p>
            <Link color='blue' onClick={() => setIsSigningIn(true)}>Sign In</Link>
          </Stack>
        </Flex>
        <SignUpComponent />
      </>
    );
  }
}

export default SignInOrUp;
