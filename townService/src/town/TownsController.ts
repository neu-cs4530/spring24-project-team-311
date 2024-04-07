import assert from 'assert';
import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Query,
  Response,
  Route,
  Tags,
} from 'tsoa';

import { PetCreateParams, Town, TownCreateParams, TownCreateResponse } from '../api/Model';
import InvalidParametersError from '../lib/InvalidParametersError';
import CoveyTownsStore from '../lib/TownsStore';
import {
  ChatMessage,
  ConversationArea,
  CoveyTownSocket,
  InitialUserCreationResponse,
  Player,
  Pet as PetModel,
  TownSettingsUpdate,
  ViewingArea,
  PlayerLocation,
} from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';
import PetDatabase from './PetDatabase';

/**
 * This is the town route
 */
@Route('towns')
@Tags('towns')
// TSOA (which we use to generate the REST API from this file) does not support default exports, so the controller can't be a default export.
// eslint-disable-next-line import/prefer-default-export
export class TownsController extends Controller {
  protected _firebaseSchema;

  protected _townsStore: CoveyTownsStore = CoveyTownsStore.getInstance();

  constructor(db: APetDatabase = new PetDatabase()) {
    super();
    this._firebaseSchema = db;
  }

  /**
   * List all towns that are set to be publicly available
   *
   * @returns list of towns
   */
  @Get()
  public async listTowns(): Promise<Town[]> {
    return this._townsStore.getTowns();
  }

  /**
   * Create a new town
   *
   * @param request The public-facing information for the new town
   * @example request {"friendlyName": "My testing town public name", "isPubliclyListed": true}
   * @returns The ID of the newly created town, and a secret password that will be needed to update or delete this town.
   */
  @Example<TownCreateResponse>({ townID: 'stringID', townUpdatePassword: 'secretPassword' })
  @Post()
  public async createTown(@Body() request: TownCreateParams): Promise<TownCreateResponse> {
    const { townID, townUpdatePassword } = await this._townsStore.createTown(
      request.friendlyName,
      request.isPubliclyListed,
      request.mapFile,
    );
    return {
      townID,
      townUpdatePassword,
    };
  }

  /**
   * Updates an existing town's settings by ID
   *
   * @param townID  town to update
   * @param townUpdatePassword  town update password, must match the password returned by createTown
   * @param requestBody The updated settings
   */
  @Patch('{townID}')
  @Response<InvalidParametersError>(400, 'Invalid password or update values specified')
  public async updateTown(
    @Path() townID: string,
    @Header('X-CoveyTown-Password') townUpdatePassword: string,
    @Body() requestBody: TownSettingsUpdate,
  ): Promise<void> {
    const success = this._townsStore.updateTown(
      townID,
      townUpdatePassword,
      requestBody.friendlyName,
      requestBody.isPubliclyListed,
    );
    if (!success) {
      throw new InvalidParametersError('Invalid password or update values specified');
    }
  }

  /**
   * Deletes a town
   * @param townID ID of the town to delete
   * @param townUpdatePassword town update password, must match the password returned by createTown
   */
  @Delete('{townID}')
  @Response<InvalidParametersError>(400, 'Invalid password or update values specified')
  public async deleteTown(
    @Path() townID: string,
    @Header('X-CoveyTown-Password') townUpdatePassword: string,
  ): Promise<void> {
    const success = this._townsStore.deleteTown(townID, townUpdatePassword);
    if (!success) {
      throw new InvalidParametersError('Invalid password or update values specified');
    }
  }

  /**
   * Creates a conversation area in a given town
   * @param townID ID of the town in which to create the new conversation area
   * @param sessionToken session token of the player making the request, must match the session token returned when the player joined the town
   * @param requestBody The new conversation area to create
   */
  @Post('{townID}/conversationArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createConversationArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: Omit<ConversationArea, 'type'>,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    if (!town?.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const success = town.addConversationArea({ ...requestBody, type: 'ConversationArea' });
    if (!success) {
      throw new InvalidParametersError('Invalid values specified');
    }
  }

  /**
   * Creates a viewing area in a given town
   *
   * @param townID ID of the town in which to create the new viewing area
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   * @param requestBody The new viewing area to create
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          viewing area could not be created
   */
  @Post('{townID}/viewingArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createViewingArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: Omit<ViewingArea, 'type'>,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      throw new InvalidParametersError('Invalid values specified');
    }
    if (!town?.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const success = town.addViewingArea({ ...requestBody, type: 'ViewingArea' });
    if (!success) {
      throw new InvalidParametersError('Invalid values specified');
    }
  }

  /**
   * Retrieves up to the first 200 chat messages for a given town, optionally filtered by interactableID
   * @param townID town to retrieve messages for
   * @param sessionToken a valid session token for a player in the town
   * @param interactableID optional interactableID to filter messages by
   * @returns list of chat messages
   */
  @Get('{townID}/chatMessages')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async getChatMessages(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Query() interactableID?: string,
  ): Promise<ChatMessage[]> {
    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const player = town.getPlayerBySessionToken(sessionToken);
    if (!player) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const messages = town.getChatMessages(interactableID);
    return messages;
  }

  /**
   * Connects a client's socket to the requested town, or disconnects the socket if no such town exists
   *
   * @param socket A new socket connection, with the userName and townID parameters of the socket's
   * auth object configured with the desired townID to join and username to use
   *
   */
  public async joinTown(socket: CoveyTownSocket) {
    // Parse the client's requested username from the connection
    const { userName, userID, townID, loginTime } = socket.handshake.auth as {
      userName: string;
      userID: string;
      townID: string;
      loginTime: string;
    };

    console.log(`LOGINTIME: ${loginTime}`);

    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      socket.disconnect(true);
      return;
    }
    // Connect the client to the socket.io broadcast room for this town
    socket.join(town.townID);
    const player = await this._createUser(userID, userName, Number(loginTime));

    // console.log(`Player${player?.userName} ${player?.id} ${player?.location}`);

    const response: InitialUserCreationResponse = {
      pet: player?.pet,
      logoutTime: await this._firebaseSchema.getUserLogOutTime(userID),
    };

    const newPlayer = await town.addPlayer(userName, userID, socket);

    if (player !== undefined) {
      await town.addExistingPet(player);
    }

    assert(newPlayer.videoToken);
    socket.emit('initialize', {
      userID: newPlayer.id,
      sessionToken: newPlayer.sessionToken,
      providerVideoToken: newPlayer.videoToken,
      currentPlayers: town.players.map(eachPlayer => eachPlayer.toPlayerModel()),
      friendlyName: town.friendlyName,
      isPubliclyListed: town.isPubliclyListed,
      interactables: town.interactables.map(eachInteractable => eachInteractable.toModel()),
      currentPets: town.pets.map(eachPet => eachPet.toPetModel()),
      createdResponse: response,
    });
  }

  private async _createUser(
    userID: string,
    username: string,
    loginTime: number,
  ): Promise<Player | undefined> {
    console.log(`USERID: ${userID}`);
    console.log(`USERNAME: ${username}`);
    console.log(`LOGINTIME: ${loginTime}`);
    const playerInDB = await this._firebaseSchema.getOrAddPlayer(
      userID,
      username,
      {
        x: 0,
        y: 0,
        moving: false,
        rotation: 'front',
      },
      0,
    );
    return playerInDB;
  }

  // public async createNewPet(request: PetCreateParams): Promise<void> {
  //   await this._firebaseSchema.addPet(
  //     request.petName,
  //     request.petID,
  //     request.type,
  //     request.ownerID.id,
  //     request.location,
  //   );
  // }
}
