import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import React from 'react';
import dog from './images/dog-front.png';
import cat from './images/cat-front.png';
import duck from './images/duck-front.png';
import PetController, { PetType } from '../../classes/PetController';
import { nanoid } from 'nanoid';
import TownController from '../../classes/TownController';

interface PetSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  townController: TownController;
}

const PetSelectionPopup = (props: PetSelectionPopupProps) => {
  const [selectedPetType, setSelectedPetType] = useState<PetType>('' as PetType);
  const [petName, setPetName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPetName(event.target.value);
  };

  const handlePetSelection = (pet: PetType) => {
    setSelectedPetType(pet);
  };

  const handleSubmit = () => {
    if (!selectedPetType) {
      setErrorMessage('Please select a pet');
    } else if (!petName) {
      // Show error message when user clicks "Done" without entering a name
      setErrorMessage('Please enter a name for your pet');
    } else {
      // Reset error message
      setErrorMessage('');

      // Call API or emit socket event...

      const petID = nanoid();

      const newPet = new PetController(
        props.townController.ourPlayer.id,
        petID,
        selectedPetType,
        petName,
        {
          ...props.townController.ourPlayer.location,
        },
      );
      props.townController.addPet(newPet);
      console.log('new pet added');

      // On success
      props.onClose();
    }
  };

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Select your pet and name them:</ModalHeader>
          <ModalBody display={'flex'} flexDirection={'column'} gap={6}>
            <Flex justifyContent={'space-evenly'}>
              <Image boxSize='100px' src={cat.src} alt={'Cat'} />
              <Image boxSize='100px' src={dog.src} alt={'Dog'} />
              <Image boxSize='100px' src={duck.src} alt={'Duck'} />
            </Flex>
            <Flex justifyContent={'space-evenly'}>
              <Button
                onClick={() => handlePetSelection('cat')}
                variant={selectedPetType === 'cat' ? 'solid' : 'outline'}
                colorScheme={selectedPetType === 'cat' ? 'blue' : 'gray'}>
                Cat
              </Button>
              <Button
                onClick={() => handlePetSelection('dog')}
                variant={selectedPetType === 'dog' ? 'solid' : 'outline'}
                colorScheme={selectedPetType === 'dog' ? 'blue' : 'gray'}>
                Dog
              </Button>
              <Button
                onClick={() => handlePetSelection('duck')}
                variant={selectedPetType === 'duck' ? 'solid' : 'outline'}
                colorScheme={selectedPetType === 'duck' ? 'blue' : 'gray'}>
                Duck
              </Button>
            </Flex>
            <input
              type={'text'}
              placeholder={"Enter your pet's name"}
              value={petName}
              onChange={handleNameChange}
            />
            {errorMessage && (
              <Text justifyContent={'center'} flex={1} color={'red'}>
                {errorMessage}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSubmit}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default PetSelectionPopup;
