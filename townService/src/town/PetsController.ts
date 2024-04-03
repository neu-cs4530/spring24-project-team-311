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

import {
  PetCreateParams,
  PetCreateResponse,
  UserCreateParams,
  UserCreateResponse,
} from '../api/Model';
import InvalidParametersError from '../lib/InvalidParametersError';
import { CoveyTownSocket, PetSettingsUpdate } from '../types/CoveyTownSocket';
import { TownsController } from './TownsController';
import UserPetSchema from './PetDatabase';
import APetDatabase from './APetDatabase';

/**
 * This is the town route
 */
@Route('towns')
@Tags('towns')
// eslint-disable-next-line import/prefer-default-export
export class PetsController extends TownsController {
  private _firebaseSchema;

  constructor(db: APetDatabase) {
    super();
    this._firebaseSchema = db;
  }

  @Example<UserCreateResponse>({
    pet: {
      userName: 'petName',
      type: 'Cat',
      id: 'petID',
      ownerID: 'ownerID',
      health: 100,
      hunger: 100,
      happiness: 100,
      inHospital: false,
      isSick: false,
    },
    logoutTime: 0,
  })
  @Post('{townID}/{userID}')
  public async createUser(
    @Body() request: UserCreateParams,
    @Path() townID: string,
    @Path() userID: string,
  ): Promise<UserCreateResponse> {
    const town = this._townsStore.getTownByID(townID);
    const playerInDB = await this._firebaseSchema.getOrAddPlayer(
      request.userID,
      request.username,
      request.email,
      {
        x: 0,
        y: 0,
        moving: false,
        rotation: 'front',
      },
      request.loginTime,
    );
    const pet = await town?.addExistingPet(playerInDB);
    return {
      pet: pet?.toPetModel(),
      logoutTime: await this._firebaseSchema.getUserLogOutTime(request.userID),
    };
  }

  @Patch('{townID}/{userID}')
  public async userSignOut(
    @Body() request: number,
    @Path() townID: string,
    @Path() userID: string,
  ): Promise<void> {
    await this._firebaseSchema.setUserLogOutTime(userID, request);
  }

  /**
   * Creates a pet
   * @param request the creation parameters of the pet
   * @param townID the id of the town that the player belongs to
   * @param userID the user's id that is connected to the user
   * @param petID the pet's id which is used to identify the pet that is connected to the user
   * @returns a PetCreateResponse which has a pet value that can either be a Pet or undefind if
   * the pet was not a part of the town.
   */
  @Example<PetCreateResponse>({ petID: 'stringID' })
  @Post('{townID}/{userID}/{petID}}')
  public async createPet(
    @Body() request: PetCreateParams,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<PetCreateResponse> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.addNewPet(request.ownerID, request.petName, petID, request.type);
    if (pet !== undefined) {
      await this._firebaseSchema.addPet(request.petName, petID, request.type, request.ownerID.id);
    }
    return { petID: pet?.id };
  }

  @Patch('{townID}/{userID}/{petID}/hunger')
  public async feedPet(
    @Body() request: PetSettingsUpdate,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let success = false;
    if (pet !== undefined) {
      success = pet.feedPet(request.hunger);
      if (success) this._firebaseSchema.changeHunger(userID, petID, 30);
    }
    return success;
  }

  @Patch('{townID}/{userID}/{petID}/health')
  public async cleanPet(
    @Body() request: PetSettingsUpdate,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let success = false;
    if (pet !== undefined) {
      success = pet.cleanPet(request.health);
      if (success) this._firebaseSchema.changeHealth(userID, petID, 30);
    }
    return success;
  }

  @Patch('{townID}/{userID}/{petID}/happiness')
  public async playPet(
    @Body() request: PetSettingsUpdate,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let success = false;
    if (pet !== undefined) {
      success = pet.playWithPet(request.happiness);
      if (success) this._firebaseSchema.changeHappiness(userID, petID, 30);
    }
    return success;
  }

  @Get('{townID}/{userID}/{petID}/happiness')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getPetHappiness(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<number> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      return pet.happiness;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Post('{townID}/{userID}/{petID}/stats')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async decreasePetStats(
    @Body() request: number,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<PetSettingsUpdate> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let update: PetSettingsUpdate;
    if (pet !== undefined) {
      await this._firebaseSchema.changeHappiness(userID, petID, request);
      await this._firebaseSchema.changeHunger(userID, petID, request);
      await this._firebaseSchema.changeHealth(userID, petID, request);
      pet.decreseStats(request);
      update = {
        happiness: pet.happiness,
        hunger: pet.hunger,
        health: pet.health,
      };
      return update;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Get('{townID}/{userID}/{petID}/stats')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getAllPetStats(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<PetSettingsUpdate> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let update: PetSettingsUpdate;
    if (pet !== undefined) {
      update = {
        happiness: pet.happiness,
        hunger: pet.hunger,
        health: pet.health,
      };
      return update;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Get('{townID}/{userID}/{petID}/hunger')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getPetHunger(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<number> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      return pet.hunger;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Get('{townID}/{userID}/{petID}/health')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getPetHealth(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<number> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      return pet.health;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Get('{townID}/{userID}/{petID}/sick')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getPetSickness(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      await this._firebaseSchema.updateSickStatus(userID, petID, pet.sick);
      return pet.sick;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Post('{townID}/{userID}/{petID}/hospital')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async hospitalizePet(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean | undefined> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      const isSick = pet.sick;
      if (isSick) {
        pet.hospitalizePet();
        await this._firebaseSchema.updateHospitalStatus(userID, petID, true);
      }
      return isSick;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Get('{townID}/{userID}/{petID}/hospital')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async dischargePet(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      const isSick = pet.sick;
      if (isSick) {
        pet.dischargePet();
        await this._firebaseSchema.updateHospitalStatus(userID, petID, false);
        await this._firebaseSchema.updateSickStatus(userID, petID, false);
        await this._firebaseSchema.changeHappiness(userID, petID, 100);
        await this._firebaseSchema.changeHunger(userID, petID, 100);
        await this._firebaseSchema.changeHealth(userID, petID, 100);
      }
      return isSick;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }
}
