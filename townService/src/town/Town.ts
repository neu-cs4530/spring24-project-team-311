import { ITiledMap, ITiledMapObjectLayer } from '@jonbell/tiled-map-type-guard';
import { nanoid } from 'nanoid';
import { BroadcastOperator } from 'socket.io';
import { response } from 'express';
import e from 'cors';
import InvalidParametersError from '../lib/InvalidParametersError';
import IVideoClient from '../lib/IVideoClient';
import Player from '../lib/Player';
import TwilioVideo from '../lib/TwilioVideo';
import { isViewingArea } from '../TestUtils';
import {
  ChatMessage,
  ConversationArea as ConversationAreaModel,
  CoveyTownSocket,
  Interactable,
  InteractableCommand,
  InteractableCommandBase,
  PlayerLocation,
  ServerToClientEvents,
  SocketData,
  ViewingArea as ViewingAreaModel,
  Pet as PetModel,
  PetType,
  PetSettingsUpdate,
} from '../types/CoveyTownSocket';
import { logError } from '../Utils';
import ConversationArea from './ConversationArea';
import GameAreaFactory from './games/GameAreaFactory';
import InteractableArea from './InteractableArea';
import ViewingArea from './ViewingArea';
import PetsController from './PetsController';
import MockPetDatabase from './MockPetDatabase';
import Pet from '../lib/Pet';

/**
 * The Town class implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class Town {
  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
    this._broadcastEmitter.emit('townSettingsUpdated', { isPubliclyListed: value });
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get pets(): Pet[] {
    return this._pets;
  }

  get occupancy(): number {
    return this.players.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
    this._broadcastEmitter.emit('townSettingsUpdated', { friendlyName: value });
  }

  get townID(): string {
    return this._townID;
  }

  get interactables(): InteractableArea[] {
    return this._interactables;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of pets currently in the town * */
  private _pets: Pet[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  private _interactables: InteractableArea[] = [];

  private readonly _townID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  private _broadcastEmitter: BroadcastOperator<ServerToClientEvents, SocketData>;

  private _connectedSockets: Set<CoveyTownSocket> = new Set();

  private _chatMessages: ChatMessage[] = [];

  private _petsController: PetsController;

  constructor(
    friendlyName: string,
    isPubliclyListed: boolean,
    townID: string,
    broadcastEmitter: BroadcastOperator<ServerToClientEvents, SocketData>,
    petsController = new PetsController(new MockPetDatabase()),
  ) {
    this._townID = townID;
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
    this._broadcastEmitter = broadcastEmitter;
    this._petsController = petsController;
  }

  private async _getPet(petID: string): Promise<Pet | undefined> {
    const pet = this._pets.find(p => p.id === petID);
    return pet;
  }

  private async _addNewPet(user: Player, petName: string, petID: string, petType: PetType) {
    if (user !== undefined) {
      const playerObject = this._players.find(player => player.id === user.id);
      if (playerObject && !playerObject.pet) {
        const pet = new Pet(
          petName,
          petType,
          user.id,
          user.location,
          50,
          50,
          50,
          false,
          false,
          petID,
        );
        playerObject.pet = pet;
        this._pets.push(pet);
        this._broadcastEmitter.emit('petAdded', pet.toPetModel());
      }
    }
  }
  /*
   * if the given user Player has a pet, then that pet is added to the town
   */

  private async _addExistingPet(userID: string, pet: PetModel) {
    const playerObject = this._players.find(player => player.id === userID);
    if (playerObject && playerObject.pet === undefined) {
      const newPet = new Pet(
        pet.userName,
        pet.type,
        userID,
        pet.location,
        pet.health,
        pet.hunger,
        pet.happiness,
        pet.inHospital,
        pet.isSick,
        pet.id,
      );
      playerObject.pet = newPet;
      this._pets.push(newPet);
    }
  }

  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(
    userName: string,
    userID: string,
    socket: CoveyTownSocket,
    pet?: PetModel,
  ): Promise<Player> {
    const newPlayer = new Player(userName, userID, socket.to(this._townID));

    this._players.push(newPlayer);

    this._connectedSockets.add(socket);
    await this._petsController.userLogIn(newPlayer.id);

    if (pet) {
      this._addExistingPet(newPlayer.id, pet);
    }

    // Create a video token for this user to join this town
    newPlayer.videoToken = await this._videoClient.getTokenForTown(this._townID, newPlayer.id);

    // Notify other players that this player has joined
    this._broadcastEmitter.emit('playerJoined', newPlayer.toPlayerModel());

    // Register an event listener for the client socket: if the client disconnects,
    // clean up our listener adapter, and then let the CoveyTownController know that the
    // player's session is disconnected
    socket.on('disconnect', async () => {
      this._removePlayer(newPlayer);
      await this._petsController.userLogOut(newPlayer.id);
      this._connectedSockets.delete(socket);
    });

    // Set up a listener to forward all chat messages to all clients in the town
    socket.on('chatMessage', (message: ChatMessage) => {
      this._broadcastEmitter.emit('chatMessage', message);
      this._chatMessages.push(message);
      if (this._chatMessages.length > 200) {
        this._chatMessages.shift();
      }
    });

    // Register an event listener for the client socket: if the client updates their
    // location, inform the CoveyTownController
    socket.on('playerMovement', async (movementData: PlayerLocation) => {
      try {
        await this._updatePlayerLocation(newPlayer, movementData);
      } catch (err) {
        logError(err);
      }
    });

    socket.on('addNewPet', async (petName: string, petID: string, petType: PetType) => {
      try {
        this._addNewPet(newPlayer, petName, petID, petType);
        await this._petsController.createNewPet({
          petName,
          petID,
          ownerID: newPlayer.toPlayerModel(),
          type: petType,
          location: newPlayer.location,
        });
      } catch (err) {
        logError(err);
      }
    });

    socket.on('decreaseStats', (delta: number) => {
      try {
        this._pets.forEach(async p => {
          p.decreseStats(delta);
          const updates = {
            health: p.health,
            hunger: p.hunger,
            happiness: p.happiness,
            hospital: p.hospitalStatus,
          };
          await this._petsController.updateStats(p.owner, p.id, updates);
        });
      } catch (err) {
        logError(err);
      }
    });

    socket.on('updatePetStats', async (uid: string, petID: string, updates: PetSettingsUpdate) => {
      try {
        const updatedPet = await this._getPet(petID);
        const player = this._players.find(p => p.id === uid);
        if (updatedPet && player && uid === updatedPet.owner) {
          console.log('CALLED');
          updatedPet.cleanPet(updates.health);
          updatedPet.feedPet(updates.hunger);
          updatedPet.playWithPet(updates.happiness);
          await this._petsController.updateStats(uid, petID, updates);
        }
      } catch (err) {
        logError(err);
      }
    });

    // Set up a listener to process updates to interactables.
    // Currently only knows how to process updates for ViewingArea's, and
    // ignores any other updates for any other kind of interactable.
    // For ViewingArea's: dispatches an updateModel call to the viewingArea that
    // corresponds to the interactable being updated. Does not throw an error if
    // the specified viewing area does not exist.
    socket.on('interactableUpdate', (update: Interactable) => {
      if (isViewingArea(update)) {
        newPlayer.townEmitter.emit('interactableUpdate', update);
        const viewingArea = this._interactables.find(
          eachInteractable => eachInteractable.id === update.id,
        );
        if (viewingArea) {
          (viewingArea as ViewingArea).updateModel(update);
        }
      }
    });

    // Set up a listener to process commands to interactables.
    // Dispatches commands to the appropriate interactable and sends the response back to the client
    socket.on('interactableCommand', (command: InteractableCommand & InteractableCommandBase) => {
      const interactable = this._interactables.find(
        eachInteractable => eachInteractable.id === command.interactableID,
      );
      if (interactable) {
        try {
          const payload = interactable.handleCommand(command, newPlayer);
          socket.emit('commandResponse', {
            commandID: command.commandID,
            interactableID: command.interactableID,
            isOK: true,
            payload,
          });
        } catch (err) {
          if (err instanceof InvalidParametersError) {
            socket.emit('commandResponse', {
              commandID: command.commandID,
              interactableID: command.interactableID,
              isOK: false,
              error: err.message,
            });
          } else {
            logError(err);
            socket.emit('commandResponse', {
              commandID: command.commandID,
              interactableID: command.interactableID,
              isOK: false,
              error: 'Unknown error',
            });
          }
        }
      } else {
        socket.emit('commandResponse', {
          commandID: command.commandID,
          interactableID: command.interactableID,
          isOK: false,
          error: `No such interactable ${command.interactableID}`,
        });
      }
    });
    return newPlayer;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  private _removePlayer(player: Player): void {
    if (player.location.interactableID) {
      this._removePlayerFromInteractable(player);
    }
    this._players = this._players.filter(p => p.id !== player.id);
    this._pets = this._pets.filter(p => p.owner !== player.id);
    this._broadcastEmitter.emit('playerDisconnect', player.toPlayerModel());
  }

  /**
   * Updates the location of a player within the town
   *
   * If the player has changed conversation areas, this method also updates the
   * corresponding ConversationArea objects tracked by the town controller, and dispatches
   * any onConversationUpdated events as appropriate
   *
   * @param player Player to update location for
   * @param location New location for this player
   */
  private async _updatePlayerLocation(player: Player, location: PlayerLocation): Promise<void> {
    const prevInteractable = this._interactables.find(
      conv => conv.id === player.location.interactableID,
    );

    if (!prevInteractable?.contains(location)) {
      if (prevInteractable) {
        // Remove from old area
        prevInteractable.remove(player);
      }
      const newInteractable = this._interactables.find(
        eachArea => eachArea.isActive && eachArea.contains(location),
      );
      if (newInteractable) {
        newInteractable.add(player);
      }
      location.interactableID = newInteractable?.id;
    } else {
      location.interactableID = prevInteractable.id;
    }

    player.location = location;
    if (player.pet !== undefined) {
      player.pet.location = location;
    }

    await this._petsController.updateLocation(player.id, location);
    this._broadcastEmitter.emit('playerMoved', player.toPlayerModel());
  }

  /**
   * Removes a player from a conversation area, updating the conversation area's occupants list,
   * and emitting the appropriate message (area updated or area destroyed)
   *
   * @param player Player to remove from their current conversation area
   */
  private _removePlayerFromInteractable(player: Player): void {
    const area = this._interactables.find(
      eachArea => eachArea.id === player.location.interactableID,
    );
    if (area) {
      area.remove(player);
    }
  }

  /**
   * Creates a new conversation area in this town if there is not currently an active
   * conversation with the same ID. The conversation area ID must match the name of a
   * conversation area that exists in this town's map, and the conversation area must not
   * already have a topic set.
   *
   * If successful creating the conversation area, this method:
   *  Adds any players who are in the region defined by the conversation area to it.
   *  Notifies all players in the town that the conversation area has been updated
   *
   * @param conversationArea Information describing the conversation area to create. Ignores any
   *  occupantsById that are set on the conversation area that is passed to this method.
   *
   * @returns true if the conversation is successfully created, or false if there is no known
   * conversation area with the specified ID or if there is already an active conversation area
   * with the specified ID
   */
  public addConversationArea(conversationArea: ConversationAreaModel): boolean {
    const area = this._interactables.find(
      eachArea => eachArea.id === conversationArea.id,
    ) as ConversationArea;
    if (!area || !conversationArea.topic || area.topic) {
      return false;
    }
    area.topic = conversationArea.topic;
    area.addPlayersWithinBounds(this._players);
    this._broadcastEmitter.emit('interactableUpdate', area.toModel());
    return true;
  }

  /**
   * Creates a new viewing area in this town if there is not currently an active
   * viewing area with the same ID. The viewing area ID must match the name of a
   * viewing area that exists in this town's map, and the viewing area must not
   * already have a video set.
   *
   * If successful creating the viewing area, this method:
   *    Adds any players who are in the region defined by the viewing area to it
   *    Notifies all players in the town that the viewing area has been updated by
   *      emitting an interactableUpdate event
   *
   * @param viewingArea Information describing the viewing area to create.
   *
   * @returns True if the viewing area was created or false if there is no known
   * viewing area with the specified ID or if there is already an active viewing area
   * with the specified ID or if there is no video URL specified
   */
  public addViewingArea(viewingArea: ViewingAreaModel): boolean {
    const area = this._interactables.find(
      eachArea => eachArea.id === viewingArea.id,
    ) as ViewingArea;
    if (!area || !viewingArea.video || area.video) {
      return false;
    }
    area.updateModel(viewingArea);
    area.addPlayersWithinBounds(this._players);
    this._broadcastEmitter.emit('interactableUpdate', area.toModel());
    return true;
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  public getPlayerBySessionToken(token: string): Player | undefined {
    return this.players.find(eachPlayer => eachPlayer.sessionToken === token);
  }

  /**
   * Find an interactable by its ID
   *
   * @param id
   * @returns the interactable
   * @throws Error if no such interactable exists
   */
  public getInteractable(id: string): InteractableArea {
    const ret = this._interactables.find(eachInteractable => eachInteractable.id === id);
    if (!ret) {
      throw new Error(`No such interactable ${id}`);
    }
    return ret;
  }

  /**
   * Retrieves all chat messages, optionally filtered by interactableID
   * @param interactableID optional interactableID to filter by
   */
  public getChatMessages(interactableID: string | undefined) {
    return this._chatMessages.filter(eachMessage => eachMessage.interactableID === interactableID);
  }

  /**
   * Informs all players' clients that they are about to be disconnected, and then
   * disconnects all players.
   */
  public disconnectAllPlayers(): void {
    this._broadcastEmitter.emit('townClosing');
    this._connectedSockets.forEach(eachSocket => eachSocket.disconnect(true));
  }

  /**
   * Initializes the town's state from a JSON map, setting the "interactables" property of this town
   * to instances of InteractableArea that match each interactable in the map.
   *
   * Each tilemap may contain "objects", and those objects may have properties. Towns
   * support two kinds of interactable objects: "ViewingArea" and "ConversationArea."
   * Initializing the town state from the map, then, means instantiating the corresponding objects.
   *
   * This method will throw an Error if the objects are not valid:
   * In the map file, each object is identified with a name. Names must be unique. Each object also has
   * some kind of geometry that establishes where the object is on the map. Objects must not overlap.
   *
   * @param mapFile the map file to read in, defaults to the "indoors" map in the frontend
   * @throws Error if there is no layer named "Objects" in the map, if the objects overlap or if object
   *  names are not unique
   */
  public initializeFromMap(map: ITiledMap) {
    const objectLayer = map.layers.find(
      eachLayer => eachLayer.name === 'Objects',
    ) as ITiledMapObjectLayer;
    if (!objectLayer) {
      throw new Error(`Unable to find objects layer in map`);
    }
    const viewingAreas = objectLayer.objects
      .filter(eachObject => eachObject.type === 'ViewingArea')
      .map(eachViewingAreaObject =>
        ViewingArea.fromMapObject(eachViewingAreaObject, this._broadcastEmitter),
      );

    const conversationAreas = objectLayer.objects
      .filter(eachObject => eachObject.type === 'ConversationArea')
      .map(eachConvAreaObj =>
        ConversationArea.fromMapObject(eachConvAreaObj, this._broadcastEmitter),
      );

    const gameAreas = objectLayer.objects
      .filter(eachObject => eachObject.type === 'GameArea')
      .map(eachGameAreaObj => GameAreaFactory(eachGameAreaObj, this._broadcastEmitter));

    this._interactables = this._interactables
      .concat(viewingAreas)
      .concat(conversationAreas)
      .concat(gameAreas);
    this._validateInteractables();
  }

  private _validateInteractables() {
    // Make sure that the IDs are unique
    const interactableIDs = this._interactables.map(eachInteractable => eachInteractable.id);
    if (
      interactableIDs.some(
        item => interactableIDs.indexOf(item) !== interactableIDs.lastIndexOf(item),
      )
    ) {
      throw new Error(
        `Expected all interactable IDs to be unique, but found duplicate interactable ID in ${interactableIDs}`,
      );
    }
    // Make sure that there are no overlapping objects
    for (const interactable of this._interactables) {
      for (const otherInteractable of this._interactables) {
        if (interactable !== otherInteractable && interactable.overlaps(otherInteractable)) {
          throw new Error(
            `Expected interactables not to overlap, but found overlap between ${interactable.id} and ${otherInteractable.id}`,
          );
        }
      }
    }
  }
}
