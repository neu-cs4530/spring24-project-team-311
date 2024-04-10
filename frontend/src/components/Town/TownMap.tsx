import React, { useState } from 'react';
import Phaser from 'phaser';
import { useEffect } from 'react';
import useTownController from '../../hooks/useTownController';
import SocialSidebar from '../SocialSidebar/SocialSidebar';
import NewConversationModal from './interactables/NewCoversationModal';
import TownGameScene from './TownGameScene';
import GameAreaWrapper from './interactables/GamesArea';
import useChatContext from '../VideoCall/VideoFrontend/hooks/useChatContext/useChatContext';
import ChatWindow from '../VideoCall/VideoFrontend/components/ChatWindow/ChatWindow';
import clsx from 'clsx';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import PetSelectionPopup from './PetSelectionPopup';
import PetInteractivePopup from './PetInteractivePopup';
import HospitalAreaPopup from './HospitalAreaPopup';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    chatWindowContainer: {
      'pointerEvents': 'auto',
      'background': '#FFFFFF',
      'zIndex': 1000,
      'display': 'flex',
      'flexDirection': 'column',
      'borderLeft': '1px solid #E4E7E9',
      [theme.breakpoints.down('sm')]: {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 100,
      },
      'position': 'fixed',
      'bottom': 0,
      'left': 0,
      'top': 0,
      'max-width': '250px',
    },
    hide: {
      display: 'none',
    },
  }),
);

export default function TownMap(): JSX.Element {
  const coveyTownController = useTownController();
  const { isChatWindowOpen } = useChatContext();
  const classes = useStyles();
  const [isPetSelectionOpen, setIsPetSelectionOpen] = useState<boolean>(
    coveyTownController.ourPet === undefined,
  );
  const [isPetInteractivePopupOpen, setIsPetInteractivePopupOpen] = useState(false);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: 'map-container',
      render: { pixelArt: true, powerPreference: 'high-performance' },
      scale: {
        expandParent: false,
        mode: Phaser.Scale.ScaleModes.WIDTH_CONTROLS_HEIGHT,
        autoRound: true,
      },
      width: 800,
      height: 600,
      fps: { target: 30 },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
      input: {
        activePointers: 1,
      },
    };
    const handlePetSpriteClicked = () => {
      setIsPetInteractivePopupOpen(true);
    };
    const game = new Phaser.Game(config);
    const newGameScene = new TownGameScene(coveyTownController, handlePetSpriteClicked);
    game.scene.add('coveyBoard', newGameScene, true);
    const pauseListener = newGameScene.pause.bind(newGameScene);
    const unPauseListener = newGameScene.resume.bind(newGameScene);
    coveyTownController.addListener('pause', pauseListener);
    coveyTownController.addListener('unPause', unPauseListener);

    game.events.on('petSpriteClicked', handlePetSpriteClicked);

    return () => {
      game.events.off('petSpriteClicked', handlePetSpriteClicked);
      coveyTownController.removeListener('pause', pauseListener);
      coveyTownController.removeListener('unPause', unPauseListener);
      game.destroy(true);
    };
  }, [coveyTownController]);

  return (
    <div id='app-container'>
      <NewConversationModal />
      <GameAreaWrapper />
      <HospitalAreaPopup />
      <aside className={clsx(classes.chatWindowContainer, { [classes.hide]: !isChatWindowOpen })}>
        <ChatWindow />
      </aside>

      <div id='map-container' />
      <div id='social-container'>
        <SocialSidebar />
      </div>
      {isPetSelectionOpen && (
        <PetSelectionPopup
          isOpen={isPetSelectionOpen}
          onClose={() => setIsPetSelectionOpen(false)}
          townController={coveyTownController}
        />
      )}
      {isPetInteractivePopupOpen && (
        <PetInteractivePopup
          isOpen={isPetInteractivePopupOpen}
          onClose={() => setIsPetInteractivePopupOpen(false)}
          townController={coveyTownController}
        />
      )}
    </div>
  );
}
