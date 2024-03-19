import React, { useState } from 'react';
import { Flex, Box, Heading, FormControl, FormLabel, Input, Button } from '@chakra-ui/react';
import { FormErrorMessage, FormHelperText, InputRightElement } from '@chakra-ui/react';
import { CloseIcon, CheckIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [inputEmail, setInputEmail] = useState('');
  const [values, setValues] = useState({
    password: '',
    showPassword: false,
  });
  const [username, setUsername] = useState('');
  const [valuesConfirm, setValuesConfirm] = useState({
    password: '',
    showPassword: false,
  });

  const navigate = useNavigate();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInputEmail(event.target.value);

  const isEmailError = inputEmail === '';

  const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setUsername(event.target.value);

  const isUserNameError = username === '';

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values,
      password: event.target.value,
    });
  };

  const handlePasswordConfirmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValuesConfirm({
      ...values,
      password: event.target.value,
    });
  };

  const handleClickShowPasswordConfirm = () => {
    setValuesConfirm({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  const isConfirmPassError =
    values.password !== '' &&
    valuesConfirm.password !== '' &&
    values.password !== valuesConfirm.password;

  const handleSubmit = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    alert(`Email: ${inputEmail} & Password: ${values.password}`);
    try {
      //make api call and send username, email, and password to backend
      //firebase will make the following call:
      //const UserCred = await CreateUsersWithEmailAndPassword(auth, email, password)
      //this will return usercredentials that we should then store in the database
      // if success - 200
      // failure = throw error to be caught
      // custom UID = userCred.user
      navigate('/'); // should navigate to the home page
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flex width='full' align='center' justifyContent='center'>
      <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
        <Box textAlign='center'>
          <Heading>Sign up</Heading>
        </Box>
        <Box my={4} textAlign='left'>
          <form onSubmit={handleSubmit} className='signup-form'>
            <FormControl isRequired isInvalid={isUserNameError}>
              <FormLabel>Username</FormLabel>
              <Input
                type='username'
                placeholder='sample-username'
                value={username}
                onChange={handleUserNameChange}
              />
              {!isUserNameError ? (
                <FormHelperText>
                  Enter the username that will be associated with your covey.town account.
                </FormHelperText>
              ) : (
                <FormErrorMessage>Username is required.</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isRequired isInvalid={isEmailError}>
              <FormLabel>Email</FormLabel>
              <Input
                type='email'
                placeholder='test@test.com'
                value={inputEmail}
                onChange={handleInputChange}
              />
              {!isEmailError ? (
                <FormHelperText>
                  Enter the email that will be associated with your covey.town account.
                </FormHelperText>
              ) : (
                <FormErrorMessage>Email is required.</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={6} isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                id='pass'
                placeholder='*******'
                onChange={handlePasswordChange}
                value={values.password}
              />
              <InputRightElement width='4.5rem'>
                <Button h='1.75rem' size='sm' onClick={handleClickShowPassword}>
                  {values.showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </FormControl>
            <FormControl mt={6} isRequired isInvalid={isConfirmPassError}>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type='password'
                placeholder='*******'
                onChange={handlePasswordConfirmChange}
                value={valuesConfirm.password}
              />
              <InputRightElement width='4.5rem'>
                {isConfirmPassError ? ( // Display X icon when passwords don't match
                  <CloseIcon color='red.500' />
                ) : (
                  <CheckIcon color='green.500' /> // Display check icon when passwords match
                )}
                <Button h='1.75rem' size='sm' onClick={handleClickShowPasswordConfirm}>
                  {valuesConfirm.showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
              {isConfirmPassError && ( // Display error message when passwords don't match
                <FormErrorMessage>Passwords do not match.</FormErrorMessage>
              )}
            </FormControl>
            <Button mt={4} width='full' className='signup-button' type='submit' colorScheme='blue'>
              Create Account
            </Button>
          </form>
        </Box>
      </Box>
    </Flex>
  );
}
