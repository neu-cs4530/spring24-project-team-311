import { PetCreateParams } from '../api/Model';
import { PetSettingsUpdate, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';
import PetDatabase from './PetDatabase';

export default class PetsController {
  protected _firebaseSchema;

  constructor(db: APetDatabase = new PetDatabase()) {
    this._firebaseSchema = db;
  }

  public createNewPet(request: PetCreateParams) {
    this._firebaseSchema.addPet(
      request.petName,
      request.petID,
      request.type,
      request.ownerID.id,
      request.location,
    );
  }

  public updateStats(userID: string, petID: string, request: PetSettingsUpdate) {
    this._firebaseSchema.changeHappiness(userID, petID, request.happiness);
    this._firebaseSchema.changeHunger(userID, petID, request.hunger);
    this._firebaseSchema.changeHealth(userID, petID, request.health);
    this._firebaseSchema.updateHospitalStatus(userID, petID, request.hospital);
  }

  public userLogOut(userID: string) {
    const time = new Date().getTime();
    this._firebaseSchema.setUserLogOutTime(userID, time);
  }

  public userLogIn(userID: string) {
    const time = new Date().getTime();
    this._firebaseSchema.setUserLoginTime(userID, time);
  }

  public updateLocation(userID: string, location: PlayerLocation) {
    this._firebaseSchema.updateLocation(userID, location);
  }
}
