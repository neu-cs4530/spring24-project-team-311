import assert from 'assert';
import Phaser from 'phaser';
import PlayerController, { MOVEMENT_SPEED } from '../../classes/PlayerController';
import TownController from '../../classes/TownController';
import { Direction, PetType, PlayerLocation } from '../../types/CoveyTownSocket';
import { Callback } from '../VideoCall/VideoFrontend/types';
import Interactable from './Interactable';
import ConversationArea from './interactables/ConversationArea';
import GameArea from './interactables/GameArea';
import Transporter from './interactables/Transporter';
import ViewingArea from './interactables/ViewingArea';
import HospitalArea from './interactables/HospitalArea';
import PetController, { PetGameObjects } from '../../classes/PetController';

export class NoPetError extends Error {
  constructor(msg = 'No pet found') {
    super(msg);
    this.name = 'NoPetError';
  }
}

const LABEL_OFFSET_Y = -20;
const PET_LABEL_OFFSET_Y = 10;
const PET_EMOTICON_OFFSET_Y = -20;
const STAT_DECAY_SECONDS = 2;

// Still not sure what the right type is here... "Interactable" doesn't do it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interactableTypeForObjectType(type: string): any {
  if (type === 'ConversationArea') {
    return ConversationArea;
  } else if (type === 'Transporter') {
    return Transporter;
  } else if (type === 'ViewingArea') {
    return ViewingArea;
  } else if (type === 'GameArea') {
    return GameArea;
  } else if (type === 'HospitalArea') {
    return HospitalArea;
  } else {
    throw new Error(`Unknown object type: ${type}`);
  }
}

// Original inspiration and code from:
// https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6
export default class TownGameScene extends Phaser.Scene {
  private _pendingOverlapExits = new Map<Interactable, () => void>();

  addOverlapExit(interactable: Interactable, callback: () => void) {
    this._pendingOverlapExits.set(interactable, callback);
  }

  private _players: PlayerController[] = [];

  private _pets: PetController[] = [];

  private _pet: PetController | undefined = undefined;

  private _interactables: Interactable[] = [];

  private _cursors: Phaser.Types.Input.Keyboard.CursorKeys[] = [];

  private _cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;

  /*
   * A "captured" key doesn't send events to the browser - they are trapped by Phaser
   * When pausing the game, we uncapture all keys, and when resuming, we re-capture them.
   * This is the list of keys that are currently captured by Phaser.
   */
  private _previouslyCapturedKeys: number[] = [];

  private _lastLocation?: PlayerLocation;

  private _ready = false;

  private _paused = false;

  public coveyTownController: TownController;

  private _onGameReadyListeners: Callback[] = [];

  /**
   * Layers that the player can collide with.
   */
  private _collidingLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  private _petSprite?: Phaser.GameObjects.Sprite;

  private _handlePetSpriteClicked: () => void;

  private _gameIsReady = new Promise<void>(resolve => {
    if (this._ready) {
      resolve();
    } else {
      this._onGameReadyListeners.push(resolve);
    }
  });

  public get gameIsReady() {
    return this._gameIsReady;
  }

  public get cursorKeys() {
    const ret = this._cursorKeys;
    if (!ret) {
      throw new Error('Unable to access cursors before game scene is loaded');
    }
    return ret;
  }

  private _resourcePathPrefix: string;

  private _petEmoticonTimer: number;

  private _petEmoticon?: Phaser.GameObjects.Sprite;

  constructor(
    coveyTownController: TownController,
    _handlePetSpriteClicked: () => void,
    resourcePathPrefix = '',
  ) {
    super('TownGameScene');
    this._resourcePathPrefix = resourcePathPrefix;
    this.coveyTownController = coveyTownController;
    this._players = this.coveyTownController.players;
    this._pets = this.coveyTownController.pets;
    this._handlePetSpriteClicked = _handlePetSpriteClicked;
    this._petEmoticonTimer = 0;
  }

  preload() {
    this.load.image(
      'Room_Builder_32x32',
      this._resourcePathPrefix + '/assets/tilesets/Room_Builder_32x32.png',
    );
    this.load.image(
      '22_Museum_32x32',
      this._resourcePathPrefix + '/assets/tilesets/22_Museum_32x32.png',
    );
    this.load.image(
      '5_Classroom_and_library_32x32',
      this._resourcePathPrefix + '/assets/tilesets/5_Classroom_and_library_32x32.png',
    );
    this.load.image(
      '12_Kitchen_32x32',
      this._resourcePathPrefix + '/assets/tilesets/12_Kitchen_32x32.png',
    );
    this.load.image(
      '1_Generic_32x32',
      this._resourcePathPrefix + '/assets/tilesets/1_Generic_32x32.png',
    );
    this.load.image(
      '13_Conference_Hall_32x32',
      this._resourcePathPrefix + '/assets/tilesets/13_Conference_Hall_32x32.png',
    );
    this.load.image(
      '14_Basement_32x32',
      this._resourcePathPrefix + '/assets/tilesets/14_Basement_32x32.png',
    );
    this.load.image(
      '16_Grocery_store_32x32',
      this._resourcePathPrefix + '/assets/tilesets/16_Grocery_store_32x32.png',
    );
    this.load.tilemapTiledJSON('map', this._resourcePathPrefix + '/assets/tilemaps/indoors.json');
    this.load.atlas(
      'atlas',
      this._resourcePathPrefix + '/assets/atlas/atlas.png',
      this._resourcePathPrefix + '/assets/atlas/atlas.json',
    );

    // Load atlas for dog sprite
    this.load.atlas(
      'dog-sprites',
      this._resourcePathPrefix + '/assets/atlas/dog-sprites.png',
      this._resourcePathPrefix + '/assets/atlas/dog-sprites.json',
    );

    // Load atlas for cat sprite
    this.load.atlas(
      'cat-sprites',
      this._resourcePathPrefix + '/assets/atlas/cat-sprites.png',
      this._resourcePathPrefix + '/assets/atlas/cat-sprites.json',
    );

    // Load atlas for duck sprite
    this.load.atlas(
      'duck-sprites',
      this._resourcePathPrefix + '/assets/atlas/duck-sprites.png',
      this._resourcePathPrefix + '/assets/atlas/duck-sprites.json',
    );

    // Load atlas for pet emoticons
    this.load.atlas(
      'emoticons',
      this._resourcePathPrefix + '/assets/atlas/emoticons.png',
      this._resourcePathPrefix + '/assets/atlas/emoticons.json',
    );
  }

  updatePlayers(players: PlayerController[]) {
    //Make sure that each player has sprites
    players.map(eachPlayer => this.createPlayerSprites(eachPlayer));

    // Remove disconnected players from board
    const disconnectedPlayers = this._players.filter(
      player => !players.find(p => p.id === player.id),
    );

    disconnectedPlayers.forEach(disconnectedPlayer => {
      if (disconnectedPlayer.gameObjects) {
        const { sprite, label } = disconnectedPlayer.gameObjects;
        if (sprite && label) {
          sprite.destroy();
          label.destroy();
        }
      }
    });
    // Remove disconnected players from list
    this._players = players;
  }

  updatePets(pets: PetController[], spawnPoint?: Phaser.GameObjects.Components.Transform) {
    //Make sure that each pet has sprites
    pets.map(eachPet => this.createPetSprites(eachPet, spawnPoint));

    // Remove disconnected pets from board
    const disconnectedPets = this._pets.filter(pet => !pets.find(p => p.petID === pet.petID));

    disconnectedPets.forEach(disconnectedPet => {
      if (disconnectedPet.gameObjects) {
        const { sprite, label } = disconnectedPet.gameObjects;
        if (sprite && label) {
          sprite.destroy();
          label.destroy();
        }
      }
    });
    // Remove disconnected pets from list
    this._pets = pets;
  }

  getNewMovementDirection() {
    if (this._cursors.find(keySet => keySet.left?.isDown)) {
      return 'left';
    }
    if (this._cursors.find(keySet => keySet.right?.isDown)) {
      return 'right';
    }
    if (this._cursors.find(keySet => keySet.down?.isDown)) {
      return 'front';
    }
    if (this._cursors.find(keySet => keySet.up?.isDown)) {
      return 'back';
    }
    return undefined;
  }

  moveOurPlayerTo(destination: Partial<PlayerLocation>) {
    const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
    if (!gameObjects) {
      throw new Error('Unable to move player without game objects created first');
    }
    if (!this._lastLocation) {
      this._lastLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
    }
    if (destination.x !== undefined) {
      gameObjects.sprite.x = destination.x;
      this._lastLocation.x = destination.x;
    }
    if (destination.y !== undefined) {
      gameObjects.sprite.y = destination.y;
      this._lastLocation.y = destination.y;
    }
    if (destination.moving !== undefined) {
      this._lastLocation.moving = destination.moving;
    }
    if (destination.rotation !== undefined) {
      this._lastLocation.rotation = destination.rotation;
    }
    this.coveyTownController.emitMovement(this._lastLocation);

    try {
      this.moveOurPetTo(destination);
    } catch (e) {
      if (e instanceof NoPetError) {
        console.log('No pet found');
      } else {
        throw e;
      }
    }
  }

  public moveOurPetTo(destination: Partial<PlayerLocation>) {
    const petObjects = this.coveyTownController.ourPet?.gameObjects;
    if (!petObjects || !this.coveyTownController.ourPet) {
      throw new NoPetError('Unable to move pet without game objects created first');
    }
    if (destination.x !== undefined) {
      petObjects.sprite.x = destination.x;
    }
    if (destination.y !== undefined) {
      petObjects.sprite.y = destination.y;
    }
    if (destination.moving !== undefined) {
      this.coveyTownController.ourPet.location.moving = destination.moving;
    }
    if (destination.rotation !== undefined) {
      this.coveyTownController.ourPet.location.rotation = destination.rotation;
    }
  }

  update(time: number, delta: number) {
    const spawnPoint = this.map.findObject(
      'Objects',
      obj => obj.name === 'Spawn Point',
    ) as unknown as Phaser.GameObjects.Components.Transform;
    if (this._paused) {
      return;
    }
    const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
    if (gameObjects && this._cursors) {
      const prevVelocity = gameObjects.sprite.body.velocity.clone();
      const body = gameObjects.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      const primaryDirection = this.getNewMovementDirection();
      switch (primaryDirection) {
        case 'left':
          body.setVelocityX(-MOVEMENT_SPEED);
          gameObjects.sprite.anims.play('misa-left-walk', true);
          break;
        case 'right':
          body.setVelocityX(MOVEMENT_SPEED);
          gameObjects.sprite.anims.play('misa-right-walk', true);
          break;
        case 'front':
          body.setVelocityY(MOVEMENT_SPEED);
          gameObjects.sprite.anims.play('misa-front-walk', true);
          break;
        case 'back':
          body.setVelocityY(-MOVEMENT_SPEED);
          gameObjects.sprite.anims.play('misa-back-walk', true);
          break;
        default:
          // Not moving
          gameObjects.sprite.anims.stop();
          // If we were moving, pick and idle frame to use
          if (prevVelocity.x < 0) {
            gameObjects.sprite.setTexture('atlas', 'misa-left');
          } else if (prevVelocity.x > 0) {
            gameObjects.sprite.setTexture('atlas', 'misa-right');
          } else if (prevVelocity.y < 0) {
            gameObjects.sprite.setTexture('atlas', 'misa-back');
          } else if (prevVelocity.y > 0) gameObjects.sprite.setTexture('atlas', 'misa-front');
          break;
      }

      // Normalize and scale the velocity so that player can't move faster along a diagonal
      gameObjects.sprite.body.velocity.normalize().scale(MOVEMENT_SPEED);

      const isMoving = primaryDirection !== undefined;
      gameObjects.label.setX(body.x);
      gameObjects.label.setY(body.y + LABEL_OFFSET_Y);
      const x = gameObjects.sprite.getBounds().centerX;
      const y = gameObjects.sprite.getBounds().centerY;
      //Move the sprite
      if (
        !this._lastLocation ||
        (isMoving && this._lastLocation.rotation !== primaryDirection) ||
        this._lastLocation.moving !== isMoving
      ) {
        if (!this._lastLocation) {
          this._lastLocation = {
            x,
            y,
            rotation: primaryDirection || 'front',
            moving: isMoving,
          };
        }
        this._lastLocation.x = x;
        this._lastLocation.y = y;
        this._lastLocation.rotation = primaryDirection || this._lastLocation.rotation || 'front';
        this._lastLocation.moving = isMoving;
        this._pendingOverlapExits.forEach((cb, interactable) => {
          if (
            !Phaser.Geom.Rectangle.Overlaps(
              interactable.getBounds(),
              gameObjects.sprite.getBounds(),
            )
          ) {
            this._pendingOverlapExits.delete(interactable);
            cb();
          }
        });
        this.coveyTownController.emitMovement(this._lastLocation);
      }

      //Update the location for the labels of all of the other players
      for (const player of this._players) {
        if (player.gameObjects?.label && player.gameObjects?.sprite.body) {
          player.gameObjects.label.setX(player.gameObjects.sprite.body.x);
          player.gameObjects.label.setY(player.gameObjects.sprite.body.y + LABEL_OFFSET_Y);
        }
      }
    }

    if (this.coveyTownController.ourPet && this._pet != this.coveyTownController.ourPet) {
      this._pet = this.coveyTownController.ourPet;
      const petSprite = this._addInitialPetSprite(
        this.coveyTownController.ourPet.petType,
        spawnPoint,
      );
      const petLabel = this._addInitialPetLabel(spawnPoint);
      this._petEmoticon = this._addInitialPetEmoticon(spawnPoint);
      this.coveyTownController.ourPet.gameObjects = {
        sprite: petSprite,
        label: petLabel,
        locationManagedByGameScene: true,
      };
      this.coveyTownController.ourPet.gameObjects.sprite.setInteractive().on('pointerdown', () => {
        this.game.events.emit('petSpriteClicked');
      });
      const canvas = this.sys.game.canvas;
      this.coveyTownController.ourPet.gameObjects.sprite.on('pointerover', () => {
        canvas.style.cursor = 'pointer';
      });
      this.coveyTownController.ourPet.gameObjects.sprite.on('pointerout', () => {
        canvas.style.cursor = 'default';
      });
    }

    // Update the position of the follower sprite to follow the player sprite
    const petObjects = this.coveyTownController.ourPet?.gameObjects;
    if (gameObjects && petObjects && this.coveyTownController.ourPet) {
      const prevVelocity = petObjects.sprite.body.velocity.clone();
      const body = petObjects.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      // get direction to move pet
      const petLocation = this.coveyTownController.ourPet.location;

      // get location behind the player
      const playerBounds = gameObjects.sprite.getBounds();
      let offsetX = 0;
      let offsetY = 0;
      switch (this.coveyTownController.ourPlayer.location.rotation) {
        case 'left':
          offsetX = 32;
          offsetY = 16;
          break;
        case 'right':
          offsetX = -32;
          offsetY = 16;
          break;
        case 'front':
          offsetY = -32;
          break;
        case 'back':
          offsetY = 32;
          break;
      }
      const targetLocation = {
        x: playerBounds.centerX + offsetX,
        y: playerBounds.centerY + offsetY,
      };

      const deltaX = targetLocation.x - petLocation.x;
      const deltaY = targetLocation.y - petLocation.y;

      let primaryDirection: Direction | undefined;

      if (this._lastLocation?.moving) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          primaryDirection = deltaX > 0 ? 'right' : 'left';
        } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
          primaryDirection = deltaY > 0 ? 'front' : 'back';
        } else {
          primaryDirection = undefined;
        }
      }

      const ourPetType = this.coveyTownController.ourPet.petType;
      switch (ourPetType) {
        case 'Dog':
          this._setDogSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        case 'Cat':
          this._setCatSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        case 'Duck':
          this._setDuckSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        default:
          console.error(`Invalid pet type ${ourPetType}`);
          this._setDogSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
      }
      // Normalize and scale the velocity so that pet can't move faster along a diagonal
      petObjects.sprite.body.velocity.normalize().scale(MOVEMENT_SPEED);
      petObjects.label.setX(body.x);
      petObjects.label.setY(body.y + PET_LABEL_OFFSET_Y);

      this.coveyTownController.ourPet.location = {
        x: petObjects.sprite.getBounds().centerX,
        y: petObjects.sprite.getBounds().centerY,
        rotation: primaryDirection || 'front',
        moving: primaryDirection !== undefined,
      };

      this._catchPetUp(this.coveyTownController.ourPet);

      // update other pet labels
      for (const pet of this.coveyTownController.pets) {
        if (pet.gameObjects?.label && pet.gameObjects?.sprite.body) {
          pet.gameObjects.label.setX(pet.gameObjects.sprite.body.x);
          pet.gameObjects.label.setY(pet.gameObjects.sprite.body.y + PET_LABEL_OFFSET_Y);
        }
      }

      this._petEmoticonTimer += delta;
      if (this._petEmoticonTimer > 10000 && this._petEmoticon) {
        this._petEmoticon.visible = true;
        this._petEmoticon.setX(petObjects.sprite.x);
        this._petEmoticon.setY(petObjects.sprite.y + PET_EMOTICON_OFFSET_Y);
        let numHighStats = 0;
        let numLowStats = 0;
        if (this.coveyTownController.ourPet.petHappiness > 70) {
          numHighStats++;
        }
        if (this.coveyTownController.ourPet.petHealth > 70) {
          numHighStats++;
        }
        if (this.coveyTownController.ourPet.petHunger > 70) {
          numHighStats++;
        }
        if (this.coveyTownController.ourPet.petHappiness <= 30) {
          numLowStats++;
        }
        if (this.coveyTownController.ourPet.petHealth <= 30) {
          numLowStats++;
        }
        if (this.coveyTownController.ourPet.petHunger <= 30) {
          numLowStats++;
        }

        if (numLowStats === 3) {
          this._petEmoticon.anims.play('emoticon-angry', true);
        } else if (numLowStats === 2) {
          this._petEmoticon.anims.play('emoticon-grumpy', true);
        } else if (numLowStats === 1) {
          this._petEmoticon.anims.play('emoticon-alert', true);
        } else if (numHighStats === 3) {
          this._petEmoticon.anims.play('emoticon-love', true);
        } else if (numHighStats === 2) {
          this._petEmoticon.anims.play('emoticon-joyous', true);
        } else if (numHighStats === 1) {
          this._petEmoticon.anims.play('emoticon-happy', true);
        } else {
          this._petEmoticon.anims.play('emoticon-neutral', true);
        }
      }
      if (this._petEmoticonTimer > 12000 && this._petEmoticon) {
        this._petEmoticon.visible = false;
        this._petEmoticonTimer = 0;
      }

      // If pet is in hospital, set invisible
      petObjects.sprite.visible = !this.coveyTownController.ourPet.isInHospital;
      petObjects.label.visible = !this.coveyTownController.ourPet.isInHospital;
    }

    for (const pet of this._pets) {
      if (pet.petID !== this.coveyTownController.ourPet?.petID) {
        this.createPetSprites(pet);
        this._catchPetUp(pet);
        this._animatePet(pet);
      }
    }
  }

  private _catchPetUp(pet: PetController) {
    const petOwnerLocation = this.coveyTownController.players.filter(
      player => player.id === pet.playerID,
    )[0].location;
    const deltaX = petOwnerLocation.x - pet.location.x;
    const deltaY = petOwnerLocation.y - pet.location.y;
    if (Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) > 100 && !petOwnerLocation.moving) {
      if (petOwnerLocation.rotation === 'left') {
        pet.location.x = petOwnerLocation.x + 32;
        pet.location.y = petOwnerLocation.y + 16;
        pet.gameObjects?.sprite.setX(petOwnerLocation.x + 32);
        pet.gameObjects?.sprite.setY(petOwnerLocation.y + 16);
      } else if (petOwnerLocation.rotation === 'right') {
        pet.location.x = petOwnerLocation.x - 32;
        pet.location.y = petOwnerLocation.y + 16;
        pet.gameObjects?.sprite.setX(petOwnerLocation.x - 32);
        pet.gameObjects?.sprite.setY(petOwnerLocation.y + 16);
      } else if (petOwnerLocation.rotation === 'front') {
        pet.location.x = petOwnerLocation.x;
        pet.location.y = petOwnerLocation.y - 32;
        pet.gameObjects?.sprite.setX(petOwnerLocation.x);
        pet.gameObjects?.sprite.setY(petOwnerLocation.y - 32);
      } else if (petOwnerLocation.rotation === 'back') {
        pet.location.x = petOwnerLocation.x;
        pet.location.y = petOwnerLocation.y + 32;
        pet.gameObjects?.sprite.setX(petOwnerLocation.x);
        pet.gameObjects?.sprite.setY(petOwnerLocation.y + 32);
      }
    }
  }

  private _animatePet(petToAnimate: PetController) {
    const petOwner = this.coveyTownController.players.filter(
      player => player.id === petToAnimate.playerID,
    )[0];
    const playerObjects = petOwner.gameObjects;
    const petObjects = petToAnimate.gameObjects;
    if (playerObjects && petObjects) {
      const prevVelocity = petObjects.sprite.body.velocity.clone();
      const body = petObjects.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      // get direction to move pet
      const petLocation = petToAnimate.location;

      // get location behind the player
      const playerBounds = playerObjects.sprite.getBounds();
      let offsetX = 0;
      let offsetY = 0;
      switch (petOwner.location.rotation) {
        case 'left':
          offsetX = 32;
          offsetY = 16;
          break;
        case 'right':
          offsetX = -32;
          offsetY = 16;
          break;
        case 'front':
          offsetY = -32;
          break;
        case 'back':
          offsetY = 32;
          break;
      }
      const targetLocation = {
        x: playerBounds.centerX + offsetX,
        y: playerBounds.centerY + offsetY,
      };

      const deltaX = targetLocation.x - petLocation.x;
      const deltaY = targetLocation.y - petLocation.y;

      let primaryDirection: Direction | undefined;

      if (petOwner.location.moving) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          primaryDirection = deltaX > 0 ? 'right' : 'left';
        } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
          primaryDirection = deltaY > 0 ? 'front' : 'back';
        } else {
          primaryDirection = undefined;
        }
      }

      const petType = petToAnimate.petType;
      switch (petType) {
        case 'Dog':
          this._setDogSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        case 'Cat':
          this._setCatSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        case 'Duck':
          this._setDuckSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
        default:
          console.error(`Invalid pet type ${petType}`);
          this._setDogSprite(petObjects, primaryDirection, prevVelocity, body);
          break;
      }
      // Normalize and scale the velocity so that pet can't move faster along a diagonal
      petObjects.sprite.body.velocity.normalize().scale(MOVEMENT_SPEED);
      petObjects.label.setX(body.x);
      petObjects.label.setY(body.y + PET_LABEL_OFFSET_Y);

      // replace with emit later
      petToAnimate.location = {
        x: petObjects.sprite.getBounds().centerX,
        y: petObjects.sprite.getBounds().centerY,
        rotation: primaryDirection || 'front',
        moving: primaryDirection !== undefined,
      };

      // update other pet labels
      for (const pet of this.coveyTownController.pets) {
        if (pet.gameObjects?.label && pet.gameObjects?.sprite.body) {
          pet.gameObjects.label.setX(pet.gameObjects.sprite.body.x);
          pet.gameObjects.label.setY(pet.gameObjects.sprite.body.y + PET_LABEL_OFFSET_Y);
        }
      }

      petObjects.sprite.visible = !petToAnimate.isInHospital;
      petObjects.label.visible = !petToAnimate.isInHospital;
    }
  }

  private _setDogSprite(
    petObjects: PetGameObjects,
    primaryDirection: Direction | undefined,
    prevVelocity: Phaser.Math.Vector2,
    body: Phaser.Physics.Arcade.Body,
  ) {
    switch (primaryDirection) {
      case 'left':
        body.setVelocityX(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('dog-left-walk', true);
        break;
      case 'right':
        body.setVelocityX(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('dog-right-walk', true);
        break;
      case 'front':
        body.setVelocityY(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('dog-front-walk', true);
        break;
      case 'back':
        body.setVelocityY(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('dog-back-walk', true);
        break;
      default:
        // Not moving
        petObjects.sprite.anims.stop();
        // If we were moving, pick and idle frame to use
        if (prevVelocity.x < 0) {
          petObjects.sprite.setTexture('dog-sprites', 'dog-left');
        } else if (prevVelocity.x > 0) {
          petObjects.sprite.setTexture('dog-sprites', 'dog-right');
        } else if (prevVelocity.y < 0) {
          petObjects.sprite.setTexture('dog-sprites', 'dog-back');
        } else if (prevVelocity.y > 0) petObjects.sprite.setTexture('dog-sprites', 'dog-front');
        break;
    }
  }

  private _setCatSprite(
    petObjects: PetGameObjects,
    primaryDirection: Direction | undefined,
    prevVelocity: Phaser.Math.Vector2,
    body: Phaser.Physics.Arcade.Body,
  ) {
    switch (primaryDirection) {
      case 'left':
        body.setVelocityX(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('cat-left-walk', true);
        break;
      case 'right':
        body.setVelocityX(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('cat-right-walk', true);
        break;
      case 'front':
        body.setVelocityY(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('cat-front-walk', true);
        break;
      case 'back':
        body.setVelocityY(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('cat-back-walk', true);
        break;
      default:
        // Not moving
        petObjects.sprite.anims.stop();
        // If we were moving, pick and idle frame to use
        if (prevVelocity.x < 0) {
          petObjects.sprite.setTexture('cat-sprites', 'cat-left');
        } else if (prevVelocity.x > 0) {
          petObjects.sprite.setTexture('cat-sprites', 'cat-right');
        } else if (prevVelocity.y < 0) {
          petObjects.sprite.setTexture('cat-sprites', 'cat-back');
        } else if (prevVelocity.y > 0) petObjects.sprite.setTexture('cat-sprites', 'cat-front');
        break;
    }
  }

  private _setDuckSprite(
    petObjects: PetGameObjects,
    primaryDirection: Direction | undefined,
    prevVelocity: Phaser.Math.Vector2,
    body: Phaser.Physics.Arcade.Body,
  ) {
    switch (primaryDirection) {
      case 'left':
        body.setVelocityX(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('duck-left-walk', true);
        break;
      case 'right':
        body.setVelocityX(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('duck-right-walk', true);
        break;
      case 'front':
        body.setVelocityY(MOVEMENT_SPEED);
        petObjects.sprite.anims.play('duck-front-walk', true);
        break;
      case 'back':
        body.setVelocityY(-MOVEMENT_SPEED);
        petObjects.sprite.anims.play('duck-back-walk', true);
        break;
      default:
        // Not moving
        petObjects.sprite.anims.stop();
        // If we were moving, pick and idle frame to use
        if (prevVelocity.x < 0) {
          petObjects.sprite.setTexture('duck-sprites', 'duck-left');
        } else if (prevVelocity.x > 0) {
          petObjects.sprite.setTexture('duck-sprites', 'duck-right');
        } else if (prevVelocity.y < 0) {
          petObjects.sprite.setTexture('duck-sprites', 'duck-back');
        } else if (prevVelocity.y > 0) petObjects.sprite.setTexture('duck-sprites', 'duck-front');
        break;
    }
  }

  private _map?: Phaser.Tilemaps.Tilemap;

  public get map(): Phaser.Tilemaps.Tilemap {
    const map = this._map;
    if (!map) {
      throw new Error('Cannot access map before it is initialized');
    }
    return map;
  }

  getInteractables(): Interactable[] {
    const typedObjects = this.map.filterObjects('Objects', obj => obj.type !== '');
    assert(typedObjects);
    const gameObjects = this.map.createFromObjects(
      'Objects',
      typedObjects.map(obj => ({
        id: obj.id,
        classType: interactableTypeForObjectType(obj.type),
      })),
    );

    return gameObjects as Interactable[];
  }

  create() {
    this._map = this.make.tilemap({ key: 'map' });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the
         tileset image in Phaser's cache (i.e. the name you used in preload)
         */
    const tileset = [
      'Room_Builder_32x32',
      '22_Museum_32x32',
      '5_Classroom_and_library_32x32',
      '12_Kitchen_32x32',
      '1_Generic_32x32',
      '13_Conference_Hall_32x32',
      '14_Basement_32x32',
      '16_Grocery_store_32x32',
    ].map(v => {
      const ret = this.map.addTilesetImage(v);
      assert(ret);
      return ret;
    });

    this._collidingLayers = [];
    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = this.map.createLayer('Below Player', tileset, 0, 0);
    assert(belowLayer);
    belowLayer.setDepth(-10);
    const wallsLayer = this.map.createLayer('Walls', tileset, 0, 0);
    const onTheWallsLayer = this.map.createLayer('On The Walls', tileset, 0, 0);
    assert(wallsLayer);
    assert(onTheWallsLayer);
    wallsLayer.setCollisionByProperty({ collides: true });
    onTheWallsLayer.setCollisionByProperty({ collides: true });

    const worldLayer = this.map.createLayer('World', tileset, 0, 0);
    assert(worldLayer);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = this.map.createLayer('Above Player', tileset, 0, 0);
    assert(aboveLayer);
    aboveLayer.setCollisionByProperty({ collides: true });

    const veryAboveLayer = this.map.createLayer('Very Above Player', tileset, 0, 0);
    assert(veryAboveLayer);
    /* By default, everything gets depth sorted on the screen in the order we created things.
         Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
         it a depth. Higher depths will sit on top of lower depth objects.
         */
    worldLayer.setDepth(5);
    aboveLayer.setDepth(10);
    veryAboveLayer.setDepth(15);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = this.map.findObject(
      'Objects',
      obj => obj.name === 'Spawn Point',
    ) as unknown as Phaser.GameObjects.Components.Transform;

    const labels = this.map.filterObjects('Objects', obj => obj.name === 'label');
    labels?.forEach(label => {
      if (label.x && label.y) {
        this.add.text(label.x, label.y, label.text.text, {
          color: '#FFFFFF',
          backgroundColor: '#000000',
        });
      }
    });
    assert(this.input.keyboard);
    this._cursorKeys = this.input.keyboard.createCursorKeys();
    this._cursors.push(this._cursorKeys);
    this._cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );
    this._cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.H,
          down: Phaser.Input.Keyboard.KeyCodes.J,
          left: Phaser.Input.Keyboard.KeyCodes.K,
          right: Phaser.Input.Keyboard.KeyCodes.L,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );

    // Create a sprite with physics enabled via the physics system. The image used for the sprite
    // has a bit of whitespace, so I'm using setSize & setOffset to control the size of the
    // player's body.
    const sprite = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front')
      .setSize(30, 40)
      .setOffset(0, 24)
      .setDepth(6);
    const label = this.add
      .text(spawnPoint.x, spawnPoint.y + LABEL_OFFSET_Y, '(You)', {
        font: '18px monospace',
        color: '#000000',
        // padding: {x: 20, y: 10},
        backgroundColor: '#ffffff',
      })
      .setDepth(6);
    this.coveyTownController.ourPlayer.gameObjects = {
      sprite,
      label,
      locationManagedByGameScene: true,
    };

    this._interactables = this.getInteractables();

    this.moveOurPlayerTo({ rotation: 'front', moving: false, x: spawnPoint.x, y: spawnPoint.y });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this._collidingLayers.push(worldLayer);
    this._collidingLayers.push(wallsLayer);
    this._collidingLayers.push(aboveLayer);
    this._collidingLayers.push(onTheWallsLayer);
    this._collidingLayers.forEach(layer => this.physics.add.collider(sprite, layer));

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const { anims } = this;
    anims.create({
      key: 'misa-left-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-right-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-front-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-back-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Add dog animations
    anims.create({
      key: 'dog-left-walk',
      frames: anims.generateFrameNames('dog-sprites', {
        prefix: 'dog-left-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'dog-right-walk',
      frames: anims.generateFrameNames('dog-sprites', {
        prefix: 'dog-right-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'dog-front-walk',
      frames: anims.generateFrameNames('dog-sprites', {
        prefix: 'dog-front-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'dog-back-walk',
      frames: anims.generateFrameNames('dog-sprites', {
        prefix: 'dog-back-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });

    // Add cat animations
    anims.create({
      key: 'cat-left-walk',
      frames: anims.generateFrameNames('cat-sprites', {
        prefix: 'cat-left-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 7,
      repeat: -1,
    });
    anims.create({
      key: 'cat-right-walk',
      frames: anims.generateFrameNames('cat-sprites', {
        prefix: 'cat-right-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 7,
      repeat: -1,
    });
    anims.create({
      key: 'cat-front-walk',
      frames: anims.generateFrameNames('cat-sprites', {
        prefix: 'cat-front-walk',
        start: 1,
        end: 4,
      }),
      frameRate: 7,
      repeat: -1,
    });
    anims.create({
      key: 'cat-back-walk',
      frames: anims.generateFrameNames('cat-sprites', {
        prefix: 'cat-back-walk',
        start: 1,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Add duck animations
    anims.create({
      key: 'duck-left-walk',
      frames: anims.generateFrameNames('duck-sprites', {
        prefix: 'duck-left-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'duck-right-walk',
      frames: anims.generateFrameNames('duck-sprites', {
        prefix: 'duck-right-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'duck-front-walk',
      frames: anims.generateFrameNames('duck-sprites', {
        prefix: 'duck-front-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });
    anims.create({
      key: 'duck-back-walk',
      frames: anims.generateFrameNames('duck-sprites', {
        prefix: 'duck-back-walk',
        start: 1,
        end: 2,
      }),
      frameRate: 5,
      repeat: -1,
    });

    // add emoticons
    anims.create({
      key: 'emoticon-love',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'love',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-happy',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'happy',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-alert',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'alert',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-angry',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'angry',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-grumpy',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'grumpy',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-joyous',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'joyous',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: 'emoticon-neutral',
      frames: anims.generateFrameNames('emoticons', {
        prefix: 'neutral',
        start: 1,
        end: 2,
      }),
      frameRate: 2,
      repeat: -1,
    });

    const camera = this.cameras.main;
    camera.startFollow(this.coveyTownController.ourPlayer.gameObjects.sprite);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Arrow keys to move`, {
        font: '18px monospace',
        color: '#000000',
        padding: {
          x: 20,
          y: 10,
        },
        backgroundColor: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(30);

    this._ready = true;
    this.updatePlayers(this.coveyTownController.players);
    // Call any listeners that are waiting for the game to be initialized
    this._onGameReadyListeners.forEach(listener => listener());
    this._onGameReadyListeners = [];
    this.coveyTownController.addListener('playersChanged', players => this.updatePlayers(players));
    this.coveyTownController.addListener('petsChanged', pets => this.updatePets(pets, spawnPoint));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const decayEvent = this.time.addEvent({
      delay: STAT_DECAY_SECONDS * 1000,
      loop: true,
      callback: () => {
        this._decayPetStats();
      },
      callbackScope: this,
    });
  }

  private _decayPetStats() {
    this.coveyTownController.decreasePetStats(1);
  }

  private _addInitialPetSprite(
    petType: PetType,
    spawnPoint: Phaser.GameObjects.Components.Transform | PlayerLocation,
  ) {
    switch (petType) {
      case 'Dog':
        return this.physics.add
          .sprite(spawnPoint.x + 32, spawnPoint.y + 16, 'dog-sprites', 'dog-front')
          .setSize(30, 40)
          .setOffset(0, 24)
          .setDepth(5);
      case 'Cat':
        return this.physics.add
          .sprite(spawnPoint.x + 32, spawnPoint.y + 16, 'cat-sprites', 'cat-front')
          .setSize(30, 40)
          .setOffset(0, 24)
          .setDepth(5);
      case 'Duck':
        return this.physics.add
          .sprite(spawnPoint.x + 32, spawnPoint.y + 16, 'duck-sprites', 'duck-front')
          .setSize(30, 40)
          .setOffset(0, 24)
          .setDepth(5);
      default:
        console.error(`Invalid pet type ${petType}`);
        return this.physics.add
          .sprite(spawnPoint.x + 32, spawnPoint.y, 'dog-sprites', 'dog-front')
          .setSize(30, 40)
          .setOffset(0, 24)
          .setDepth(5);
    }
  }

  private _addInitialPetLabel(
    spawnPoint: Phaser.GameObjects.Components.Transform | PlayerLocation,
    pet?: PetController,
  ) {
    // add label
    return this.add
      .text(
        spawnPoint.x + 32,
        spawnPoint.y + PET_LABEL_OFFSET_Y,
        pet ? pet.petName : this.coveyTownController.ourPet?.petName || 'Pet',
        {
          font: '12px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        },
      )
      .setDepth(6);
  }

  private _addInitialPetEmoticon(spawnPoint: Phaser.GameObjects.Components.Transform) {
    return this.physics.add
      .sprite(spawnPoint.x + 32, spawnPoint.y + PET_EMOTICON_OFFSET_Y, 'emoticons', 'love1')
      .setScale(0.1)
      .setOffset(0, 24)
      .setDepth(5)
      .setVisible(false);
  }

  createPlayerSprites(player: PlayerController) {
    if (!player.gameObjects) {
      const sprite = this.physics.add
        .sprite(player.location.x, player.location.y, 'atlas', 'misa-front')
        .setSize(30, 40)
        .setOffset(0, 24);
      const label = this.add.text(
        player.location.x,
        player.location.y + LABEL_OFFSET_Y,
        player === this.coveyTownController.ourPlayer ? '(You)' : player.userName,
        {
          font: '18px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        },
      );
      player.gameObjects = {
        sprite,
        label,
        locationManagedByGameScene: false,
      };
      this._collidingLayers.forEach(layer => this.physics.add.collider(sprite, layer));
    }
  }

  createPetSprites(pet: PetController, spawnPoint?: Phaser.GameObjects.Components.Transform) {
    if (!pet.gameObjects) {
      const sprite = this._addInitialPetSprite(pet.petType, spawnPoint || pet.location);
      const label = this._addInitialPetLabel(pet.location, pet);
      pet.gameObjects = {
        sprite,
        label,
        locationManagedByGameScene: true,
      };
      this._collidingLayers.forEach(layer => this.physics.add.collider(sprite, layer));
    }
  }

  pause() {
    if (!this._paused) {
      this._paused = true;
      const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
      if (gameObjects) {
        gameObjects.sprite.anims.stop();
        const body = gameObjects.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
      }
      assert(this.input.keyboard);
      this._previouslyCapturedKeys = this.input.keyboard.getCaptures();
      this.input.keyboard.clearCaptures();
    }
  }

  resume() {
    if (this._paused) {
      this._paused = false;
      if (this.input && this.input.keyboard) {
        this.input.keyboard.addCapture(this._previouslyCapturedKeys);
      }
      this._previouslyCapturedKeys = [];
    }
  }
}
