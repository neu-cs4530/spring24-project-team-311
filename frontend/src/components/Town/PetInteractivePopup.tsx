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
  const [progressValues, setProgressValues] = useState<number[]>([0.3, 0.5, 0.7]); // Initial progress values

  const handlePetSelection = (pet: string) => {
    setSelectedPet(pet);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPetName(event.target.value);
  };

  const handleProgressIncrement = (index: number) => {
    const updatedProgressValues = [...progressValues];
    updatedProgressValues[index] = Math.min(updatedProgressValues[index] + 0.1, 1); // Increase progress by 10%
    setProgressValues(updatedProgressValues);
  };

  const handleSubmit = () => {
    // Reset error message
    setErrorMessage('');

    // Call API or emit socket event...

    // On success
    props.onClose();
  };

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Interact with your pet [name] </ModalHeader>
          <ModalBody display={'flex'} flexDirection={'column'} gap={6}>
            <Flex justifyContent={'space-evenly'}>
              {progressValues.map((value, index) => (
                <progress key={index} value={value} style={{ margin: '0 10px' }} />
              ))}
            </Flex>
            <Flex justifyContent={'space-evenly'}>
              <Button
                onClick={() => {
                  handlePetSelection('cat');
                  handleProgressIncrement(0);
                }}
                variant={selectedPet === 'cat' ? 'solid' : 'outline'}
                colorScheme={selectedPet === 'cat' ? 'blue' : 'gray'}>
                Feed
              </Button>
              <Button
                onClick={() => {
                  handlePetSelection('dog');
                  handleProgressIncrement(1);
                }}
                variant={selectedPet === 'dog' ? 'solid' : 'outline'}
                colorScheme={selectedPet === 'dog' ? 'blue' : 'gray'}>
                Clean
              </Button>
              <Button
                onClick={() => {
                  handlePetSelection('duck');
                  handleProgressIncrement(2);
                }}
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
