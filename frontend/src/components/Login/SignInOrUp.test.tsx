import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, RenderResult, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, mockClear, MockProxy, mockReset } from 'jest-mock-extended';
import SignInOrUp from './SignInOrUp';
import {
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

jest.mock('../Town/images/paws-town.png', () => 'paws-town.png');

jest.mock('../../firebase', () => {
  return {
    auth: { currentUser: 0 },
  };
});

class MockFirebaseError extends Error {
  private _code: string;

  constructor(message: string) {
    super(message);
    this._code = '';
  }

  public get code(): string {
    return this._code;
  }

  public set code(value: string) {
    this._code = value;
  }
}

jest.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: jest.fn((auth: any, email: string, password: string) => {
      if (!email.includes('@')) {
        const err = new MockFirebaseError('auth/invalid-email');
        err.code = 'auth/invalid-email';
        return Promise.reject(err);
      }
      if (email !== 'test@mail.com' || password !== 'password') {
        const err = new MockFirebaseError('auth/invalid-credential');
        err.code = 'auth/invalid-credential';
        return Promise.reject(err);
      }
      return Promise.resolve();
    }),
    createUserWithEmailAndPassword: jest.fn((auth: any, email: string, password: string) => {
      if (!email.includes('@')) {
        const err = new MockFirebaseError('auth/invalid-email');
        err.code = 'auth/invalid-email';
        console.log('error', err);
        return Promise.reject(err);
      }
      if (email === 'test@mail.com') {
        const err = new MockFirebaseError('auth/email-already-in-use');
        err.code = 'auth/email-already-in-use';
        return Promise.reject(err);
      }
      if (password.length < 6) {
        const err = new MockFirebaseError('auth/weak-password');
        err.code = 'auth/weak-password';
        return Promise.reject(err);
      }
      return Promise.resolve();
    }),
    updateProfile: jest.fn((user: any, { displayName }: { displayName: string }) =>
      Promise.resolve(),
    ),
  };
});

const mockUpdateUserName = jest.fn((newName: string) => {});
const mockNewSignUp = jest.fn((val: boolean) => {});
const mockToast = jest.fn();

jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
describe('SignInOrUp', () => {
  let component: RenderResult;

  beforeEach(() => {
    mockNewSignUp.mockReset();
    mockUpdateUserName.mockReset();
    mockToast.mockReset();
    component = render(
      <ChakraProvider>
        <SignInOrUp updateUserName={mockUpdateUserName} newSignUp={mockNewSignUp} />
      </ChakraProvider>,
    );
  });

  it('should render the sign in form', () => {
    const { getByText } = component;
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
    expect(getByText('Password')).toBeInTheDocument();
    expect(getByText('Sign In')).toBeInTheDocument();
    expect(mockNewSignUp).toHaveBeenCalledWith(false);
  });

  it('should render the sign up form', async () => {
    const { getByText } = component;
    const signUpButton = getByText('Create New Account');
    fireEvent.click(signUpButton);
    await waitFor(() => {
      expect(getByText('Username')).toBeInTheDocument();
    });
    expect(mockNewSignUp).toHaveBeenCalledWith(true);
  });

  describe('sign in', () => {
    describe('error codes', () => {
      it('should show an error message for invalid email', async () => {
        const { getByLabelText } = component;
        expect(getByLabelText('EmailField')).toBeInTheDocument();
        expect(getByLabelText('PasswordField')).toBeInTheDocument();
        expect(getByLabelText('SignInButton')).toBeInTheDocument();
        const emailInput = getByLabelText('EmailField');
        const passwordInput = getByLabelText('PasswordField');
        const signInButton = getByLabelText('SignInButton');
        await userEvent.type(emailInput, 'invalid-email');
        await userEvent.type(passwordInput, 'password');
        await userEvent.click(signInButton);
        await waitFor(() => {
          expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'invalid-email',
            'password',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Invalid email address',
            status: 'error',
          });
        });
      });

      it('should show an error message for email with no account', async () => {
        const { getByText } = component;
        const emailInput = getByText('Email');
        const passwordInput = getByText('Password');
        const signInButton = getByText('Sign In');
        await userEvent.type(emailInput, 'test1@mail.com');
        await userEvent.type(passwordInput, 'password');
        await userEvent.click(signInButton);
        await waitFor(() => {
          expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'test1@mail.com',
            'password',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Invalid email/password, please try again',
            status: 'error',
          });
        });
      });

      it('should show an error message for invalid password', async () => {
        const { getByText } = component;
        const emailInput = getByText('Email');
        const passwordInput = getByText('Password');
        const signInButton = getByText('Sign In');
        await userEvent.type(emailInput, 'test@mail.com');
        await userEvent.type(passwordInput, 'pass');
        await userEvent.click(signInButton);
        await waitFor(() => {
          expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'test@mail.com',
            'pass',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Invalid email/password, please try again',
            status: 'error',
          });
        });
      });
    });
    test('successful sign in', async () => {
      const { getByText } = component;
      const emailInput = getByText('Email');
      const passwordInput = getByText('Password');
      const signInButton = getByText('Sign In');
      await userEvent.type(emailInput, 'test@mail.com');
      await userEvent.type(passwordInput, 'password');
      await userEvent.click(signInButton);
      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          { currentUser: 0 },
          'test@mail.com',
          'password',
        );
      });
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Signed in successfully',
          status: 'success',
        });
      });
    });
  });
  describe('sign up', () => {
    describe('error codes', () => {
      it('should show an error message for invalid email', async () => {
        const { getByText, getByLabelText } = component;
        const createNewAccountButton = getByText('Create New Account');
        await userEvent.click(createNewAccountButton);
        await waitFor(() => {
          expect(getByText('Username')).toBeInTheDocument();
        });
        const usernameInput = getByText('Username');
        const emailInput = getByText('Email');
        const passwordInput = getByText('Password');
        await userEvent.type(emailInput, 'invalid-email');
        await userEvent.type(passwordInput, 'password');
        await userEvent.type(usernameInput, 'username');
        const signUpButton = getByLabelText('SignUpButton');
        await userEvent.click(signUpButton);
        await waitFor(() => {
          expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'invalid-email',
            'password',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Invalid email address',
            status: 'error',
          });
        });
      });

      it('should show an error message for email already in use', async () => {
        const { getByText, getByLabelText } = component;
        const createNewAccountButton = getByText('Create New Account');
        await userEvent.click(createNewAccountButton);
        await waitFor(() => {
          expect(getByText('Username')).toBeInTheDocument();
        });
        const emailInput = getByText('Email');
        const passwordInput = getByText('Password');
        const usernameInput = getByText('Username');
        await userEvent.type(emailInput, 'test@mail.com');
        await userEvent.type(passwordInput, 'password');
        await userEvent.type(usernameInput, 'username');
        const signUpButton = getByLabelText('SignUpButton');
        await userEvent.click(signUpButton);
        await waitFor(() => {
          expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'test@mail.com',
            'password',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Email address already in use',
            status: 'error',
          });
        });
      });
      it('should show an error message for weak password', async () => {
        const { getByText, getByLabelText } = component;
        const createNewAccountButton = getByText('Create New Account');
        await userEvent.click(createNewAccountButton);
        await waitFor(() => {
          expect(getByText('Username')).toBeInTheDocument();
        });
        const emailInput = getByText('Email');
        const passwordInput = getByText('Password');
        const usernameInput = getByText('Username');
        await userEvent.type(emailInput, 'test1@mail.com');
        await userEvent.type(passwordInput, '12345');
        await userEvent.type(usernameInput, 'username');
        const signUpButton = getByLabelText('SignUpButton');
        await userEvent.click(signUpButton);
        await waitFor(() => {
          expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            { currentUser: 0 },
            'test1@mail.com',
            '12345',
          );
        });
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Weak password',
            status: 'error',
          });
        });
      });
    });
    test('successful sign up', async () => {
      const { getByText, getByLabelText } = component;
      const createNewAccountButton = getByText('Create New Account');
      await userEvent.click(createNewAccountButton);
      await waitFor(() => {
        expect(getByText('Username')).toBeInTheDocument();
      });
      const emailInput = getByText('Email');
      const passwordInput = getByText('Password');
      const usernameInput = getByText('Username');
      await userEvent.type(emailInput, 'test1@mail.com');
      await userEvent.type(passwordInput, '123456');
      await userEvent.type(usernameInput, 'username');
      const signUpButton = getByLabelText('SignUpButton');
      await userEvent.click(signUpButton);
      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          { currentUser: 0 },
          'test1@mail.com',
          '123456',
        );
      });
      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith(0, { displayName: 'username' });
      });
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Account created.',
          status: 'success',
        });
      });
      expect(mockUpdateUserName).toHaveBeenCalledWith('username');
    });
  });
});
