import { nanoid } from 'nanoid';
import { Player as PlayerModel, PlayerLocation, TownEmitter } from '../types/CoveyTownSocket';
import Pet from './Pet';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
  /** The current location of this user in the world map * */
  public location: PlayerLocation;

  /** The unique identifier for this player * */
  /** TO DO: make persistent */
  private readonly _id: string;

  /** The player's username, which is not guaranteed to be unique within the town * */
  /** */
  private readonly _userName: string;

  /** The secret token that allows this client to access our Covey.Town service for this town * */
  private readonly _sessionToken: string;

  /** The secret token that allows this client to access our video resources for this town * */
  private _videoToken?: string;

  /** A special town emitter that will emit events to the entire town BUT NOT to this player */
  public readonly townEmitter: TownEmitter;

  public readonly _email: string;

  private _pet?: Pet;

  constructor(userName: string, userID: string, userEmail: string, townEmitter: TownEmitter) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    };
    this._userName = userName;
    this._id = userID;
    this._sessionToken = nanoid();
    this.townEmitter = townEmitter;
    this._email = userEmail;
    this._pet = undefined;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  set videoToken(value: string | undefined) {
    this._videoToken = value;
  }

  get videoToken(): string | undefined {
    return this._videoToken;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }

  addPet(pet: Pet) {
    this._pet = pet;
  }

  toPlayerModel(): PlayerModel {
    return {
      id: this._id,
      location: this.location,
      userName: this._userName,
      email: this._email,
      pet: this._pet?.toPetModel(),
    };
  }
}
