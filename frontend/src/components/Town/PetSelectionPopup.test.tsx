import { render, fireEvent, screen } from '@testing-library/react';

import PetSelectionPopup from './PetSelectionPopup';

import React from 'react'; // Import React

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mockedId'), // Mocked nanoid function always returns 'mockedId'
}));

jest.mock('./images/dog.png', () => 'dog-image-placeholder');

describe('PetSelectionPopup', () => {
  beforeEach(() => {
    const onClose = jest.fn();
    render(<PetSelectionPopup isOpen={true} onClose={onClose} />);
  });
  it('should display error message when user clicks "Done" without selecting a pet', () => {
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please select a pet')).toBeInTheDocument();
  });

  it('should display error message when user clicks "Done" without entering a name for the pet', () => {
    fireEvent.click(screen.getByText('Cat'));
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please enter a name for your pet')).toBeInTheDocument();
  });

  it('should call onClose when user selects a pet and enters a name and clicks "Done"', () => {
    const onClose = jest.fn();
    render(<PetSelectionPopup isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cat'));
    fireEvent.change(screen.getByPlaceholderText("Enter your pet's name"), {
      target: { value: 'FakeName' },
    });
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });
});
