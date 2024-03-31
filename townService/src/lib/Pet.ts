import { nanoid } from 'nanoid';
import { Pet as PetModel, TownEmitter } from '../types/CoveyTownSocket';
// get all of the players in the town and assign
/**
 * Each pet following a user is connected to a userID
 */

export type PetType = 'Cat' | 'Dog' | 'Other';

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

  /**
   * should this pet be visible
   */
  private _visibility: boolean;

  private readonly _type: PetType;

  private _health: number;

  private _hunger: number;

  private _happiness: number;

  private _inHospital: boolean;

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
    health = 100,
    hunger = 100,
    happiness = 100,
    inHospital = false,
    currentPet = true,
    id: string = nanoid(),
  ) {
    this._petName = petName;
    this._id = id;
    this._sessionToken = nanoid();
    this._user = user;
    this._type = type;
    this._visibility = currentPet;
    this._health = health;
    this._hunger = hunger;
    this._happiness = happiness;
    this._inHospital = inHospital;
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

  set visibility(visibility: boolean) {
    this._visibility = visibility;
  }

  get visibiliyt(): boolean {
    return this._visibility;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }

  get user(): string {
    return this._user;
  }

  get petType(): PetType {
    return this._type;
  }
}
