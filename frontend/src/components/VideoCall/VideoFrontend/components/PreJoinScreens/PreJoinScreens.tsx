import React, { useState, useEffect, FormEvent } from 'react';
import DeviceSelectionScreen from './DeviceSelectionScreen/DeviceSelectionScreen';
import IntroContainer from '../IntroContainer/IntroContainer';
import MediaErrorSnackbar from './MediaErrorSnackbar/MediaErrorSnackbar';
import RoomNameScreen from './RoomNameScreen/RoomNameScreen';
import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import { Box, Button, Heading, Text } from '@chakra-ui/react';
import TownSelection from '../../../../Login/TownSelection';
import { TownJoinResponse } from '../../../../../types/CoveyTownSocket';
// eslint-disable-next-line import/no-extraneous-dependencies
import { signOut } from 'firebase/auth';
import SignInOrUp from '../../../../Login/SignInOrUp';
import { auth } from '../../../../../firebase';

export enum Steps {
  roomNameStep,
  deviceSelectionStep,
}

export default function PreJoinScreens() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [newSignUp, setNewSignUp] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userID, setUserID] = useState<string>('');
  // const { user } = useAppState();
  const { getAudioAndVideoTracks } = useVideoContext();

  const [mediaError, setMediaError] = useState<Error>();


  useEffect(() => {
    if (!mediaError) {
      getAudioAndVideoTracks().catch(error => {
        console.log('Error acquiring local media:');
        console.dir(error);
        setMediaError(error);
      });
    }
  }, [getAudioAndVideoTracks, mediaError]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        if (!newSignUp) {
          setLoggedIn(true);
          setUserName(user.displayName || 'DUMMY_USERNAME');
          setUserID(user.uid || 'DUMMY_UID');
        }
        
      } else {
        setLoggedIn(false);
      }
    });
    return () => unsubscribe();
  });

  const firebaseSignOut = async () => {
    await signOut(auth);
  };

  const updateUserName = (newUserName: string) => {
    setUserName(newUserName);
  }

  const updateNewSignUp = (newSignUp: boolean) => {
    setNewSignUp(newSignUp);
  }

  if (!loggedIn) {
    return (
      <IntroContainer>
        <SignInOrUp updateUserName={updateUserName} newSignUp={updateNewSignUp}/>
      </IntroContainer>
    );
  }

  return (
    <IntroContainer>
      <MediaErrorSnackbar error={mediaError} />
      <Heading as="h2" size="xl">Welcome to Covey.Town!</Heading>
      <Text p="4">
        Covey.Town is a social platform that integrates a 2D game-like metaphor with video chat.
        To get started, setup your camera and microphone, choose a username, and then create a new town
        to hang out in, or join an existing one.
      </Text>
        <DeviceSelectionScreen />
        <Box borderWidth='1px' borderRadius='lg'>
          <Box p='4' flex='1'>
            Current User: {userName}{' '}
            <Button onClick={firebaseSignOut} size='xs' colorScheme='red'>
              Sign Out
            </Button>
          </Box>
        </Box>
        <TownSelection username={userName} userId ={userID}/>
    </IntroContainer>
  );
}
