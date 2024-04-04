import { Body, Example, Get, Patch, Path, Post, Response, Route, Tags } from 'tsoa';
import { PetCreateParams, PetCreateResponse } from '../api/Model';
import InvalidParametersError from '../lib/InvalidParametersError';
import { PetSettingsUpdate, PetSettingsResponse } from '../types/CoveyTownSocket';
import { TownsController } from './TownsController';

/**
 * This is the town route
 */
@Route('towns')
@Tags('towns')
// eslint-disable-next-line import/prefer-default-export
export class PetsController extends TownsController {
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
  ): Promise<void> {
    await this._firebaseSchema.addPet(request.petName, petID, request.type, request.ownerID.id);
  }

  @Post('{townID}/{userID}/{petID}/stats')
  public async updateStats(
    @Body() request: PetSettingsUpdate,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      this._firebaseSchema.changeHappiness(userID, petID, request.happinessDelta);
      this._firebaseSchema.changeHunger(userID, petID, request.hungerDelta);
      this._firebaseSchema.changeHunger(userID, petID, request.healthDelta);
    }
  }

  @Patch('{townID}/{userID}/{petID}/stats')
  public async decreasePetStats(
    @Body() request: number,
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    town?.pets.forEach(async pet => {
      if (pet !== undefined) {
        await this._firebaseSchema.changeHappiness(userID, petID, request);
        await this._firebaseSchema.changeHunger(userID, petID, request);
        await this._firebaseSchema.changeHealth(userID, petID, request);
        await this._firebaseSchema.updateSickStatus(userID, petID, pet.sick);
      }
    });
  }

  @Get('{townID}/{userID}/{petID}/stats')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async getAllPetStats(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<PetSettingsResponse> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    let update: PetSettingsResponse;
    if (pet !== undefined) {
      update = {
        happiness: pet.happiness,
        hunger: pet.hunger,
        health: pet.health,
        sick: pet.sick,
        hospital: pet.hospitalStatus,
      };
      return update;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }

  @Post('{townID}/{userID}/{petID}/hospital')
  @Response<InvalidParametersError>(400, 'Invalid petID or update values specified')
  public async hospitalizePet(
    @Path() townID: string,
    @Path() userID: string,
    @Path() petID: string,
  ): Promise<boolean> {
    const town = this._townsStore.getTownByID(townID);
    const pet = await town?.getPet(petID);
    if (pet !== undefined) {
      const hospital = pet.sick;
      if (hospital) {
        await this._firebaseSchema.updateHospitalStatus(userID, petID, true);
      }
      return hospital;
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
      if (pet.sick && pet.hospitalStatus) {
        await this._firebaseSchema.updateHospitalStatus(userID, petID, false);
        await this._firebaseSchema.updateSickStatus(userID, petID, false);
        if (pet.happiness === 0) await this._firebaseSchema.changeHappiness(userID, petID, 100);
        if (pet.hunger === 0) await this._firebaseSchema.changeHunger(userID, petID, 100);
        if (pet.health === 0) await this._firebaseSchema.changeHealth(userID, petID, 100);
      }
      return pet.sick && pet.hospitalStatus;
    }
    throw new InvalidParametersError('Invalid petID or update values specified');
  }
}
