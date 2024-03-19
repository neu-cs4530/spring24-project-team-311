import React, { useState } from 'react';
import { Flex, Box, Heading, FormControl, FormLabel, Input, Button, Link } from '@chakra-ui/react';
import { FormErrorMessage, FormHelperText, InputRightElement } from '@chakra-ui/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

export default function LoginForm() {
  const navigate = useNavigate();
  const [inputEmail, setInputEmail] = useState('');
  const [values, setValues] = useState({
    password: '',
    showPassword: false,
  });
  const [logInError, setLogInError] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInputEmail(event.target.value);

  const isError = inputEmail === '';

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const isPasswordError = values.password === '';

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values,
      password: event.target.value,
    });
  };

  const handleSubmit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    try {
      //make api call and send username, email, and password to backend
      //firebase will make the following call:
      const userCred = await signInWithEmailAndPassword(auth, inputEmail, values.password);
      //this will return usercredentials that we should then store in the database
      // if success - 200
      // failure = throw error to be caught
      // custom UID = userCred.user
      navigate('/'); // should navigate to the home page
    } catch (error) {
      console.error(error);
      setLogInError(true);
    }
  };

  return (
    <Flex width='full' align='center' justifyContent='center'>
      <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
        <Box textAlign='center'>
          <Heading>Login</Heading>
        </Box>
        <Box my={4} textAlign='left'>
          <form onSubmit={handleSubmit} className='login-form'>
            <FormControl isRequired isInvalid={isError}>
              <FormLabel>Email</FormLabel>
              <Input
                type='email'
                placeholder='test@test.com'
                value={inputEmail}
                onChange={handleInputChange}
              />
              {!isError ? (
                <FormHelperText>
                  Enter the email that is associated with your covey.town account.
                </FormHelperText>
              ) : (
                <FormErrorMessage>Email is required.</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isRequired isInvalid={isPasswordError} mt={6}>
              <FormLabel>Password</FormLabel>
              <Input
                type='password'
                placeholder='*******'
                onChange={handlePasswordChange}
                value={values.password}
              />
              <InputRightElement width='4.5rem'>
                <Button h='1.75rem' size='sm' onClick={handleClickShowPassword}>
                  {values.showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
              {!isPasswordError ? (
                <FormHelperText>Enter your password.</FormHelperText>
              ) : (
                <FormErrorMessage>Password is required.</FormErrorMessage>
              )}
            </FormControl>
            <Button mt={4} width='full' type='submit' colorScheme='blue'>
              Sign In
            </Button>
            {logInError && ( // Render sign-up button only when login fails
              <Link to='/signup'>
                <Button mt={4} width='full' colorScheme='blue'>
                  Sign Up For Covey.town
                </Button>
              </Link>
            )}
          </form>
        </Box>
      </Box>
    </Flex>
  );
}
