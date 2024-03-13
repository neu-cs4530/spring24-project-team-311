import { render, fireEvent, screen } from '@testing-library/react';

import PetSelectionPopup from './PetSelectionPopup';

import React from 'react'; // Import React

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mockedId'), // Mocked nanoid function always returns 'mockedId'
}));

jest.mock('./images/dog.png', () => 'dog-image-placeholder');

describe('PetSelectionPopup', () => {
  it('should display error message when user clicks "Done" without selecting a pet', () => {
    const onClose = jest.fn();
    render(<PetSelectionPopup isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please select a pet')).toBeInTheDocument();
  });

  it('should display error message when user clicks "Done" without entering a name for the pet', () => {
    const onClose = jest.fn();
    render(<PetSelectionPopup isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cat'));
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please enter a name for your pet')).toBeInTheDocument();
  });
});
