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
  const [progressValues, setProgressValues] = useState<number[]>([0.3, 0.5, 0.7]); // Initial progress values

  const handleProgressIncrement = (index: number, action: string) => {
    const updatedProgressValues = [...progressValues];
    if (updatedProgressValues[index] === 1) {
      setErrorMessage(`You've performed the ${action} interaction enough!`);
    } else {
      setErrorMessage('');
    }
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
          <ModalBody>
            <Flex display={'flex'} flexDirection={'row'} gap={6}>
              <Flex justifyContent={'space-evenly'} direction={'column'}>
                {progressValues.map((value, index) => (
                  <progress key={index} value={value} style={{ margin: '10px 10px' }} />
                ))}
              </Flex>
              <Flex direction='column' gap={4} style={{ margin: '10px 10px' }}>
                <Button
                  onClick={() => {
                    handleProgressIncrement(0, 'Feed');
                  }}>
                  Feed
                </Button>
                <Button
                  onClick={() => {
                    handleProgressIncrement(1, 'Clean');
                  }}>
                  Clean
                </Button>
                <Button
                  onClick={() => {
                    handleProgressIncrement(2, 'Play');
                  }}>
                  Play
                </Button>
              </Flex>
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
