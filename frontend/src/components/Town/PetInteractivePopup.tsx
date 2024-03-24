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
import dog from './images/dog.png';

interface PetInteractivePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PetInteractivePopup = (props: PetInteractivePopupProps) => {
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [petName, setPetName] = useState<string>('');

  const handlePetSelection = (pet: string) => {
    setSelectedPet(pet);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPetName(event.target.value);
  };

  const handleSubmit = () => {
    if (!selectedPet) {
      setErrorMessage('Please select a pet');
    } else if (!petName) {
      // Show error message when user clicks "Done" without entering a name
      setErrorMessage('Please enter a name for your pet');
    } else {
      // Reset error message
      setErrorMessage('');

      // Call API or emit socket event...

      // On success
      props.onClose();
    }
  };

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Interact with your pet:</ModalHeader>
          <ModalBody display={'flex'} flexDirection={'column'} gap={6}>
            <Flex justifyContent={'space-evenly'}>
              <progress value={0.5} />

              <Image boxSize='100px' src={dog.src} alt={'Image1'} />
              <progress value={0.5} />

              <Image boxSize='100px' src={dog.src} alt={'Image2'} />
              <progress value={0.5} />

              <Image boxSize='100px' src={dog.src} alt={'Image3'} />
            </Flex>
            <Flex justifyContent={'space-evenly'}>
              <Button
                onClick={() => handlePetSelection('cat')}
                variant={selectedPet === 'cat' ? 'solid' : 'outline'}
                colorScheme={selectedPet === 'cat' ? 'blue' : 'gray'}>
                Feed
              </Button>
              <Button
                onClick={() => handlePetSelection('dog')}
                variant={selectedPet === 'dog' ? 'solid' : 'outline'}
                colorScheme={selectedPet === 'dog' ? 'blue' : 'gray'}>
                Clean
              </Button>
              <Button
                onClick={() => handlePetSelection('duck')}
                variant={selectedPet === 'duck' ? 'solid' : 'outline'}
                colorScheme={selectedPet === 'duck' ? 'blue' : 'gray'}>
                Play
              </Button>
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

export default PetInteractivePopup;
