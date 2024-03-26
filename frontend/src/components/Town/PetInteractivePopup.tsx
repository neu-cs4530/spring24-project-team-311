import {
  Button,
  Flex,
  Image,
  Progress,
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

interface PetInteractivePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PetInteractivePopup = (props: PetInteractivePopupProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progressValues, setProgressValues] = useState<number[]>([30, 50, 70]); // Initial progress values

  const handleProgressIncrement = (index: number, action: string) => {
    const updatedProgressValues = [...progressValues];
    if (updatedProgressValues[index] === 100) {
      setErrorMessage(`You've performed the ${action} interaction enough!`);
    } else {
      setErrorMessage('');
    }
    updatedProgressValues[index] = Math.min(updatedProgressValues[index] + 10, 100); // Increase progress by 10%
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
                  <Progress key={index} value={value * 100} />
                ))}
                console.log({progressValues});
                {/* {progressValues.map((value, index) => (
                  <Progress
                    key={index}
                    value={progressValues[value] * 100}
                    colorScheme='green'
                    style={{ margin: '10px 10px' }}
                  />
                ))} */}
              </Flex>
              <Flex direction='column' gap={4} style={{ margin: '10px 10px' }}>
                <Button
                  colorScheme='teal'
                  onClick={() => {
                    handleProgressIncrement(0, 'Feed');
                  }}>
                  Feed
                </Button>
                <Button
                  colorScheme='teal'
                  onClick={() => {
                    handleProgressIncrement(1, 'Clean');
                  }}>
                  Clean
                </Button>
                <Button
                  colorScheme='teal'
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
