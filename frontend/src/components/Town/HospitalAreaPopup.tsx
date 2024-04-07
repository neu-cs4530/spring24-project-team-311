import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Progress,
  Flex,
  Text,
} from '@chakra-ui/react';
import { useInteractable } from '../../classes/TownController';
import useTownController from '../../hooks/useTownController';
import { Image } from '@chakra-ui/react';
import vet from './images/vet.png';

export default function HospitalAreaPopup(): JSX.Element {
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [showProgressScreen, setShowProgressScreen] = useState<boolean>(false);
  const [showAllDone, setShowAllDone] = useState<boolean>(false);
  const townController = useTownController();
  const hospital = useInteractable('hospitalArea');
  const isOpen = hospital !== undefined;
  const [progressValues, setProgressValues] = useState<number[]>([
    townController.ourPet ? townController.ourPet.petHunger : 20,
    townController.ourPet ? townController.ourPet.petHealth : 0,
    townController.ourPet ? townController.ourPet.petHappiness : 70,
  ]); // Initial progress values
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSelectTreatment = (treatment: string) => {
    setSelectedTreatment(treatment);
  };

  useEffect(() => {
    if (hospital) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, hospital]);

  useEffect(() => {
    townController.ourPet?.addListener('petStatsUpdated', newStats => {
      setProgressValues([newStats.petHunger, newStats.petHealth, newStats.petHappiness]);
    });
  }, [townController.ourPet]);

  const simulateLoading = () => {
    setLoadingProgress(0); // Reset progress to 0 when starting loading
    const interval = setInterval(() => {
      setLoadingProgress(prevProgress => {
        const newProgress = prevProgress + 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setShowProgressScreen(false);
      setShowAllDone(true);
      townController.unPause();
    }, 1000);
  };

  const handleSubmit = () => {
    if (selectedTreatment) {
      const selectedIndex = ['hunger', 'health', 'happiness'].indexOf(selectedTreatment);
      if (progressValues[selectedIndex] !== 0) {
        setErrorMessage("You can't give your pet that treatment!");
      } else {
        setErrorMessage('');
        setShowProgressScreen(true);
        simulateLoading();
        townController.setPetStats(townController.ourPet!.petID, {
          hunger: selectedIndex === 0 ? 100 : townController.ourPet!.petHunger,
          health: selectedIndex === 1 ? 100 : townController.ourPet!.petHealth,
          happiness: selectedIndex === 2 ? 100 : townController.ourPet!.petHappiness,
        });
      }
    }
  };

  const closeModal = useCallback(() => {
    if (hospital) {
      townController.interactEnd(hospital);
    }
  }, [townController, hospital]);

  const handleCloseAllDone = () => {
    setShowAllDone(false);
    closeModal();
  };

  return (
    <>
      {showAllDone && (
        <Modal isOpen={true} onClose={handleCloseAllDone}>
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader> </ModalHeader>
            <ModalBody>
              <Text textAlign='center' fontSize='xl'>
                Your pet has been successfully treated!
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme='blue' onClick={handleCloseAllDone}>
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {showProgressScreen && (
        <Modal isOpen={true} onClose={closeModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Treatment Progress</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex direction='column' alignItems='center'>
                <Image boxSize='300' src={vet.src} alt='Vet' />
                <Text mt={4} textAlign='center'>
                  Treating your pet! Please wait...
                </Text>
              </Flex>
              <Box mt={4}>
                <Progress value={loadingProgress} colorScheme='blue' />
              </Box>
              <Box mt={4} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {!showAllDone && !showProgressScreen && isOpen && (
        <Modal
          id='hospitalArea'
          isOpen={true}
          onClose={() => {
            closeModal();
            townController.unPause();
          }}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Welcome to the hospital!</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mt={4} textAlign='left' fontSize='lg'>
                Choose a treatment for {townController.ourPet?.petName}:
              </Text>
              <Box padding='5px' mt={2}>
                <Flex alignItems='center' mb='2'>
                  <Flex flex='1'>
                    <Button
                      onClick={() => handleSelectTreatment('hunger')}
                      variant={selectedTreatment === 'hunger' ? 'solid' : 'outline'}
                      colorScheme={selectedTreatment === 'hunger' ? 'blue' : 'gray'}
                      size='sm'
                      mb='2'
                      height='32px'
                      width='200px'>
                      Hunger Check-up
                    </Button>
                  </Flex>
                  <Box ml='2'>
                    <Progress
                      value={progressValues[0]}
                      borderRadius={'5px'}
                      colorScheme={
                        progressValues[0] <= 25
                          ? 'red'
                          : progressValues[0] >= 75
                          ? 'green'
                          : 'yellow'
                      }
                      width='150px'
                      height='15px'
                    />
                  </Box>
                </Flex>
                <Flex alignItems='center' mb='2'>
                  <Flex flex='1'>
                    <Button
                      onClick={() => handleSelectTreatment('health')}
                      variant={selectedTreatment === 'health' ? 'solid' : 'outline'}
                      colorScheme={selectedTreatment === 'health' ? 'blue' : 'gray'}
                      size='sm'
                      mb='2'
                      height='32px'
                      width='200px'>
                      Health Check-up
                    </Button>
                  </Flex>
                  <Box ml='2'>
                    <Progress
                      value={progressValues[1]}
                      borderRadius={'5px'}
                      colorScheme={
                        progressValues[1] <= 25
                          ? 'red'
                          : progressValues[1] >= 75
                          ? 'green'
                          : 'yellow'
                      }
                      width='150px'
                      height='15px'
                    />
                  </Box>
                </Flex>
                <Flex alignItems='center' mb='2'>
                  <Flex flex='1'>
                    <Button
                      onClick={() => handleSelectTreatment('happiness')}
                      variant={selectedTreatment === 'happiness' ? 'solid' : 'outline'}
                      colorScheme={selectedTreatment === 'happiness' ? 'blue' : 'gray'}
                      size='sm'
                      mb='2'
                      height='32px'
                      width='200px'>
                      Happiness Check-up
                    </Button>
                  </Flex>
                  <Box ml='2'>
                    <Progress
                      value={progressValues[2]}
                      borderRadius={'5px'}
                      colorScheme={
                        progressValues[2] <= 25
                          ? 'red'
                          : progressValues[2] >= 75
                          ? 'green'
                          : 'yellow'
                      }
                      width='150px'
                      height='15px'
                    />
                  </Box>
                </Flex>
              </Box>
              {errorMessage && (
                <Text color='red' textAlign='center' mt={4}>
                  {errorMessage}
                </Text>
              )}
              <ModalFooter>
                <Button colorScheme='blue' onClick={handleSubmit}>
                  Get Selected Treatment
                </Button>
              </ModalFooter>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
