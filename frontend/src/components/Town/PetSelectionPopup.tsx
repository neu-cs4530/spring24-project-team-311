import {
  Button,
  Flex,
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

interface PetSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PetSelectionPopup = (props: PetSelectionPopupProps) => {
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handlePetSelection = (pet: string) => {
    setSelectedPet(pet);
  };

  const handleSubmit = () => {
    if (selectedPet) {
      // Call API or emit socket event...

      // On success
      props.onClose();
    } else {
      // Show error message
      setErrorMessage('Please select a pet');
    }
  };

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Select your pet:</ModalHeader>
          <ModalBody display={'flex'} flexDirection={'column'} gap={6}>
            <Flex justifyContent={'space-evenly'}>
              <Button onClick={() => handlePetSelection('cat')}>Cat</Button>
              <Button onClick={() => handlePetSelection('dog')}>Dog</Button>
              <Button onClick={() => handlePetSelection('duck')}>Duck</Button>
            </Flex>
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
