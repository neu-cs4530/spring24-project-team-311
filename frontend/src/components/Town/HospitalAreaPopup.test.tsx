import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import HospitalAreaPopup from './HospitalAreaPopup';

// Mock the useInteractable hook
jest.mock('../../classes/TownController', () => ({
  useInteractable: jest.fn(() => true), // Mocked useInteractable hook always returns true
}));

// Mock the useTownController hook
jest.mock('../../hooks/useTownController', () =>
  jest.fn(() => ({
    pause: jest.fn(),
    unPause: jest.fn(),
    interactEnd: jest.fn(),
  })),
);

describe('HospitalAreaPopup component', () => {
  test('renders component with no progress screen', () => {
    const { getByText } = render(<HospitalAreaPopup />);
    expect(getByText('Choose Treatment')).toBeInTheDocument();
  });

  test('renders component with progress screen', async () => {
    const { getByText, findByText } = render(<HospitalAreaPopup />);
    fireEvent.click(getByText('Done'));
    await waitFor(() =>
      expect(findByText('Treating your pet! Please wait...')).toBeInTheDocument(),
    );
  });

  test('simulates treatment selection and progress', async () => {
    const { getByText, findByText, getByLabelText } = render(<HospitalAreaPopup />);
    fireEvent.click(getByText('Done'));
    fireEvent.click(getByLabelText('Health Check-up'));
    await waitFor(() =>
      expect(findByText('Treating your pet! Please wait...')).toBeInTheDocument(),
    );
    await waitFor(() => expect(findByText('100%')).toBeInTheDocument());
  });

  test('closes the progress screen', async () => {
    const { getByText, findByText, queryByText } = render(<HospitalAreaPopup />);
    fireEvent.click(getByText('Done'));
    await waitFor(() =>
      expect(findByText('Treating your pet! Please wait...')).toBeInTheDocument(),
    );
    fireEvent.click(getByText('Close'));
    await waitFor(() => expect(queryByText('Treating your pet! Please wait...')).toBeNull());
  });
});
