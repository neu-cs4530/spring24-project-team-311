import React, { useState } from 'react';
import { Flex, Box, Heading, FormControl, FormLabel, Input, Button } from '@chakra-ui/react';
import { FormErrorMessage, FormHelperText, InputRightElement } from '@chakra-ui/react';

export default function LoginForm() {
  const [inputEmail, setInputEmail] = useState('');
  const [values, setValues] = useState({
    password: '',
    showPassword: false,
  });
  const [passwordError, setPasswordError] = useState(false);

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

  const handleSubmit = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    alert(`Email: ${inputEmail} & Password: ${values.password}`);
  };

  return (
    <Flex width='full' align='center' justifyContent='center'>
      <Box p={8} maxWidth='500px' borderWidth={1} borderRadius={8} boxShadow='lg'>
        <Box textAlign='center'>
          <Heading>Login</Heading>
        </Box>
        <Box my={4} textAlign='left'>
          <form>
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
          </form>
        </Box>
      </Box>
    </Flex>
  );
}
