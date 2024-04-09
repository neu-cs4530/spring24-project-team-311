import { nanoid } from 'nanoid';
import { Pet as PetModel, PetType, PlayerLocation } from '../types/CoveyTownSocket';
// get all of the players in the town and assign
/**
 * Each pet following a user is connected to a userID
 */

export default class Pet {
  /** The unique identifier for this player * */
  /** TO DO: make persistent */
  private readonly _id: string;

  /**
   * The ID of the pet's user
   */
  private readonly _user: string;

  /** The pet's username, which is not guaranteed to be unique within the town * */
  /** */
  private _petName: string;

  /** The secret token that allows this client to access our Covey.Town service for this town * */
  private readonly _sessionToken: string;

  private readonly _type: PetType;

  private _health: number;

  private _hunger: number;

  private _happiness: number;

  private _inHospital: boolean;

  private _isSick: boolean;

  private _location: PlayerLocation;

  /**
   * This is a representation of a new pet that always stands some set distance behind its user
   * @param petName the name that the user wants to give the pet
   * @param user the user that is considered to be the owner of the pet
   */

  // how to set the player location --> this must be updates whenever the player moves
  constructor(
    petName: string,
    type: PetType,
    user: string,
    location: PlayerLocation,
    health = 50,
    hunger = 50,
    happiness = 50,
    inHospital = false,
    isSick = false,
    id: string = nanoid(),
  ) {
    this._petName = petName;
    this._id = id;
    this._sessionToken = nanoid();
    this._user = user;
    this._type = type;
    this._health = health;
    this._hunger = hunger;
    this._happiness = happiness;
    this._inHospital = inHospital;
    this._isSick = isSick;
    this._location = location;
  }

  get location(): PlayerLocation {
    return this._location;
  }

  set location(location: PlayerLocation) {
    this._location = location;
  }

  get petName(): string {
    return this._petName;
  }

  set petName(name: string) {
    this._petName = name;
  }

  get id(): string {
    return this._id;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }

  get owner(): string {
    return this._user;
  }

  get petType(): PetType {
    return this._type;
  }

  get happiness(): number {
    return this._happiness;
  }

  get hunger(): number {
    return this._hunger;
  }

  get health(): number {
    return this._health;
  }

  get sick(): boolean {
    return this._isSick;
  }

  get hospitalStatus(): boolean {
    return this._inHospital;
  }

  private async _checkHealth() {
    if (this._hunger > 0 && this._health > 0 && this._happiness > 0 && this._isSick) {
      await this._updateSickStatus(false);
    }
  }

  private async _updateHunger(hunger: number) {
    this._hunger = hunger;
  }

  private async _updateHealth(health: number) {
    this._health = health;
  }

  private async _updateHappiness(happiness: number) {
    this._happiness = happiness;
  }

  private async _updateSickStatus(isSick: boolean) {
    this._isSick = isSick;
  }

  private async _updateHospitalStatus(isSick: boolean) {
    this._inHospital = isSick;
  }

  decreseStats(delta: number) {
    const promises: Promise<void>[] = [];
    promises.push(this._updateHunger(this._hunger - delta));
    promises.push(this._updateHealth(this._health - delta));
    promises.push(this._updateHappiness(this._happiness - delta));
    Promise.all(promises);
  }

  // returns whether or not it was a success
  feedPet(delta: number): boolean {
    if (this._hunger > 0) {
      this._updateHunger(this._hunger + delta);
      return true;
    }
    return false;
  }

  playWithPet(delta: number): boolean {
    if (this._happiness > 0) {
      this._updateHappiness(this._happiness + delta);
      return true;
    }
    return false;
  }

  cleanPet(delta: number): boolean {
    if (this._health > 0) {
      this._updateHealth(this._health + delta);
      return true;
    }
    return false;
  }

  hospitalizePet(): boolean {
    if (this._isSick && !this._inHospital) {
      this._updateHospitalStatus(true);
      return true;
    }
    return false;
  }

  dischargePet(): boolean {
    if (this._inHospital && this._isSick) {
      this._updateHospitalStatus(false);
      if (this._hunger === 0) this._hunger = 100;
      if (this._health === 0) this._health = 100;
      if (this._happiness === 0) this._happiness = 100;
      return true;
    }
    return false;
  }

  toPetModel(): PetModel {
    return {
      id: this._id,
      userName: this._petName,
      ownerID: this._user,
      type: this._type,
      health: this._health,
      hunger: this._hunger,
      happiness: this._happiness,
      inHospital: this._inHospital,
      isSick: this._isSick,
      location: this._location,
    };
  }
}
