import { render, fireEvent, screen } from '@testing-library/react';
import { mockTownController } from '../../TestUtils';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import PetSelectionPopup from './PetSelectionPopup';

import React from 'react'; // Import React
import { nanoid } from 'nanoid';
import TownController from '../../classes/TownController';
import * as useTownController from '../../hooks/useTownController';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mockedId'), // Mocked nanoid function always returns 'mockedId'
}));

jest.mock('./images/dog-front.png', () => 'dog');
jest.mock('./images/cat-front.png', () => 'cat');
jest.mock('./images/duck-front.png', () => 'duck');

describe('PetSelectionPopup', () => {
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  let useTownControllerSpy: jest.SpyInstance<TownController, []>;
  let townID: string;
  let townFriendlyName: string;
  let mockedTownController: TownController;

  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
    useTownControllerSpy = jest.spyOn(useTownController, 'default');
  });

  beforeEach(() => {
    townID = nanoid();
    townFriendlyName = nanoid();
    mockedTownController = mockTownController({ friendlyName: townFriendlyName, townID });
    useTownControllerSpy.mockReturnValue(mockedTownController);
  });

  it('should display error message when user clicks "Done" without selecting a pet', () => {
    const onClose = jest.fn();
    render(
      <PetSelectionPopup isOpen={true} onClose={onClose} townController={mockedTownController} />,
    );
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please select a pet')).toBeInTheDocument();
  });

  it('should display error message when user clicks "Done" without entering a name for the pet', () => {
    const onClose = jest.fn();
    render(
      <PetSelectionPopup isOpen={true} onClose={onClose} townController={mockedTownController} />,
    );
    fireEvent.click(screen.getByText('Cat'));
    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByText('Please enter a name for your pet')).toBeInTheDocument();
  });

  it('should create a pet when user selects a pet and enters a name and clicks "Done"', () => {
    const onClose = jest.fn();
    render(
      <PetSelectionPopup isOpen={true} onClose={onClose} townController={mockedTownController} />,
    );
    fireEvent.click(screen.getByText('Dog'));
    fireEvent.change(screen.getByPlaceholderText("Enter your pet's name"), {
      target: { value: 'FakeName' },
    });
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockedTownController.addPet).toHaveBeenCalledTimes(1);
    expect(mockedTownController.ourPet).toBeDefined();
  });
});
