import { nanoid } from 'nanoid';
import { Player as PlayerModel, PlayerLocation } from '../types/CoveyTownSocket';
// get all of the players in the town and assign
/**
 * Each pet following a user is connected to a userID
 */

export type PetType = 'Cat' | 'Dog' | 'Other';

export default class Pet {
  /** The current location of this user in the world map * */
  public petlocation: PlayerLocation;

  /** The unique identifier for this player * */
  /** TO DO: make persistent */
  private readonly _id: string;

  /**
   * The ID of the pet's user
   */
  private readonly _user: PlayerModel;

  /** The pet's username, which is not guaranteed to be unique within the town * */
  /** */
  private readonly _petName: string;

  /** The secret token that allows this client to access our Covey.Town service for this town * */
  private readonly _sessionToken: string;

  /**
   * should this pet be visible
   */
  private _visibility: boolean;

  private readonly _type: PetType;

  /**
   * This is a representation of a new pet that always stands some set distance behind its user
   * @param petName the name that the user wants to give the pet
   * @param user the user that is considered to be the owner of the pet
   */

  // how to set the player location --> this must be updates whenever the player moves
  constructor(petName: string, user: PlayerModel, type: PetType) {
    let xMultiplier = 0;
    let yMultiplier = 0;
    const distFromUser = 5;
    if (user.location.rotation === 'front' || user.location.rotation === 'back') {
      xMultiplier = user.location.rotation === 'front' ? -1 : 1;
    } else if (user.location.rotation === 'right' || user.location.rotation === 'left') {
      yMultiplier = user.location.rotation === 'right' ? -1 : 1;
    }
    this.petlocation = {
      x: user.location.x + xMultiplier * distFromUser,
      y: user.location.y + yMultiplier * distFromUser,
      moving: user.location.moving,
      rotation: user.location.rotation,
    };

    this._petName = petName;
    // we should try to input the id here
    // TO DO make persistent
    this._id = nanoid();
    this._sessionToken = nanoid();
    this._user = user;
    this._type = type;
    this._visibility = true;
  }

  get petName(): string {
    return this._petName;
  }

  get id(): string {
    return this._id;
  }

  set visibility(visibility: boolean) {
    this._visibility = visibility;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }
}
