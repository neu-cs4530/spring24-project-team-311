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
import { useEffect, useState } from 'react';
import React from 'react';
import feed from './images/feed.png';
import clean from './images/clean.png';
import play from './images/play.png';
import TownController from '../../classes/TownController';

interface PetInteractivePopupProps {
  isOpen: boolean;
  onClose: () => void;
  townController: TownController;
}

const PetInteractivePopup = (props: PetInteractivePopupProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const ourPet = props.townController.ourPet;
  const [progressValues, setProgressValues] = useState<number[]>([
    ourPet ? ourPet.petHunger : 50,
    ourPet ? ourPet.petHealth : 50,
    ourPet ? ourPet.petHappiness : 50,
  ]); // Initial progress values

  const handleProgressIncrement = (index: number, action: string) => {
    const updatedProgressValues = [...progressValues];
    if (updatedProgressValues[index] === 100) {
      setErrorMessage(`You've performed the ${action} interaction enough!`);
    } else {
      setErrorMessage('');
    }
    updatedProgressValues[index] = Math.min(updatedProgressValues[index] + 10, 100); // Increase progress by 10%
    props.townController.setPetStats(ourPet!.petID, {
      hunger: updatedProgressValues[0],
      health: updatedProgressValues[1],
      happiness: updatedProgressValues[2],
    });
    setProgressValues([
      ourPet?.petHunger || updatedProgressValues[0],
      ourPet?.petHealth || updatedProgressValues[1],
      ourPet?.petHappiness || updatedProgressValues[2],
    ]);
  };

  const interactionImages = [feed.src, clean.src, play.src];

  const handleSubmit = () => {
    setErrorMessage('');
    props.onClose();
  };

  useEffect(() => {
    ourPet?.addListener('petStatsUpdated', newStats => {
      setProgressValues([newStats.hunger, newStats.health, newStats.happiness]);
    });
  }, [ourPet]);

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose} size='xl'>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Interact with {props.townController.ourPet?.petName}! </ModalHeader>
          <ModalBody>
            <Flex flexDirection='column' gap={8}>
              {progressValues.map((value, index) => (
                <Flex
                  key={index}
                  alignItems='flex-start'
                  justifyContent='space-between'
                  width='100%'
                  padding={4}
                  borderWidth={1}
                  borderRadius={8}
                  flexDirection='column'>
                  <Flex alignItems='center' gap={4}>
                    <Image src={interactionImages[index]} boxSize='40px' />
                    <Text fontSize='lg'>
                      {index === 0 ? 'Hunger' : index === 1 ? 'Cleanliness' : 'Happiness'}
                    </Text>
                  </Flex>
                  <Flex alignItems='center' gap={8}>
                    <Progress
                      value={value}
                      borderRadius={'8px'}
                      colorScheme={value <= 25 ? 'red' : value >= 75 ? 'green' : 'yellow'}
                      width='375px'
                      height='24px'
                    />
                    <Button
                      colorScheme='blue'
                      onClick={() => {
                        return handleProgressIncrement(
                          index,
                          index === 0 ? 'Feed' : index === 1 ? 'Clean' : 'Play',
                        );
                      }}
                      disabled={value === 0}>
                      {index === 0 ? 'Feed' : index === 1 ? 'Clean' : 'Play'}
                    </Button>
                  </Flex>
                  {value === 0 && (
                    <Text color='grey' textAlign='left' marginTop={2}>
                      You can&apos;t {index === 0 ? 'feed' : index === 1 ? 'clean' : 'play'} your
                      pet right now :( It&apos;s been too long! Please take them to the hospital.
                    </Text>
                  )}
                </Flex>
              ))}
            </Flex>
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
