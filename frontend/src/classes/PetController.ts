import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { Pet as PetModel, PlayerLocation } from '../types/CoveyTownSocket';
export const MOVEMENT_SPEED = 175;

export type PetEvents = {
  movement: (newLocation: PlayerLocation) => void;
};

export type PetGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean /* For the local player, the game scene will calculate the current location, and we should NOT apply updates when we receive events */;
};
export default class PetController extends (EventEmitter as new () => TypedEmitter<PetEvents>) {
  private _location: PlayerLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public gameObjects?: PetGameObjects;

  private readonly _ownerID: string;

  constructor(id: string, userName: string, location: PlayerLocation, owner: string) {
    super();
    this._id = id;
    this._userName = userName;
    this._location = location;
    this._ownerID = owner;
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this.emit('movement', newLocation);
  }

  get location(): PlayerLocation {
    return this._location;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  toPetModel(): PetModel {
    return {
      id: this.id,
      userName: this.userName,
      location: this.location,
      ownerID: this._ownerID,
    };
  }

  static fromPlayerModel(modelPet: PetModel): PetController {
    return new PetController(modelPet.id, modelPet.userName, modelPet.location, modelPet.ownerID);
  }
}
