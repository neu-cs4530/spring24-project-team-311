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
  HStack,
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
    ourPet ? ourPet.petHunger : 20,
    ourPet ? ourPet.petHealth : 0,
    ourPet ? ourPet.petHappiness : 70,
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

  const handleZeroProgressAction = (action: string) => {
    setErrorMessage(
      `You can't ${action} your pet right now :( It's been too long! \n Please take your pet to the hospital.`,
    );
  };

  const interactionImages = [feed.src, clean.src, play.src];

  const handleSubmit = () => {
    // Reset error message
    setErrorMessage('');

    // Call API or emit socket event...

    // On success
    props.onClose();
  };

  useEffect(() => {
    ourPet?.addListener('petStatsUpdated', newStats => {
      setProgressValues([newStats.petHunger, newStats.petHealth, newStats.petHappiness]);
    });
  }, [ourPet]);

  return (
    <Modal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose} size='xl'>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Interact with {props.townController.ourPet?.petName}! </ModalHeader>
          <ModalBody>
            <Flex flexDirection={'row'} gap={10}>
              <Flex justifyContent={'space-evenly'} direction={'column'} gap={10}>
                {progressValues.map((value, index) => (
                  <Flex key={index} style={{ display: 'inline' }} alignItems='center'>
                    <HStack>
                      <Image src={interactionImages[index]} boxSize='20px' />
                      <Text>
                        {index === 0 ? 'Hunger' : index === 1 ? 'Cleanliness' : 'Happiness'}
                      </Text>
                    </HStack>
                    <Progress
                      value={value}
                      borderRadius={'5px'}
                      colorScheme={value <= 25 ? 'red' : value >= 75 ? 'green' : 'yellow'}
                      style={{ margin: '20px' }}
                    />
                    {value === 0 && (
                      <Text color='grey' textAlign='center'>
                        You can&apos;t {index === 0 ? 'feed' : index === 1 ? 'clean' : 'play'} your
                        pet right now :( It&apos;s been too long! Please take them to the hospital.
                      </Text>
                    )}
                  </Flex>
                ))}
                _____________________________________________
              </Flex>
              <Flex direction='column' gap={24} style={{ margin: '10px 10px' }}>
                <Button
                  colorScheme='teal'
                  onClick={() => {
                    return progressValues[0] === 0
                      ? handleZeroProgressAction('feed')
                      : handleProgressIncrement(0, 'Feed');
                  }}
                  disabled={progressValues[0] === 0}>
                  Feed
                </Button>
                <Button
                  colorScheme='teal'
                  onClick={() => {
                    return progressValues[1] === 0
                      ? handleZeroProgressAction('clean')
                      : handleProgressIncrement(1, 'Clean');
                  }}
                  disabled={progressValues[1] === 0}>
                  Clean
                </Button>
                <Button
                  colorScheme='teal'
                  onClick={() => {
                    return progressValues[2] === 0
                      ? handleZeroProgressAction('play')
                      : handleProgressIncrement(2, 'Play');
                  }}
                  disabled={progressValues[2] === 0}>
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
