import { PetCreateParams } from '../api/Model';
import { PetSettingsUpdate, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';
import PetDatabase from './PetDatabase';

export default class PetsController {
  protected _firebaseSchema;

  constructor(db: APetDatabase = new PetDatabase()) {
    this._firebaseSchema = db;
  }

  public async createNewPet(request: PetCreateParams) {
    await this._firebaseSchema.addPet(
      request.petName,
      request.petID,
      request.type,
      request.ownerID.id,
      request.location,
    );
  }

  public async updateStats(userID: string, petID: string, request: PetSettingsUpdate) {
    console.log('UPDATE CALLED');
    await this._firebaseSchema.changeHappiness(userID, petID, request.happiness);
    await this._firebaseSchema.changeHunger(userID, petID, request.hunger);
    await this._firebaseSchema.changeHealth(userID, petID, request.health);
    await this._firebaseSchema.updateHospitalStatus(userID, petID, request.hospital);
  }

  public async userLogOut(userID: string) {
    const time = new Date().getTime();
    await this._firebaseSchema.setUserLogOutTime(userID, time);
  }

  public async userLogIn(userID: string) {
    const time = new Date().getTime();
    await this._firebaseSchema.setUserLoginTime(userID, time);
  }

  public async updateLocation(userID: string, location: PlayerLocation) {
    await this._firebaseSchema.updateLocation(userID, location);
  }
}
