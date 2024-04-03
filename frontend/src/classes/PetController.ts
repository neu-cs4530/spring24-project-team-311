import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { Pet as PetModel, PetType, PlayerLocation } from '../types/CoveyTownSocket';
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
  private readonly _id: string;

  private readonly _userName: string;

  public gameObjects?: PetGameObjects;

  private readonly _ownerID: string;

  private readonly _type: PetType;

  private _health: number;

  private _hunger: number;

  private _happiness: number;

  private _inHospital: boolean;

  private _isSick: boolean;

  constructor(
    id: string,
    userName: string,
    owner: string,
    type: PetType,
    health = 100,
    hunger = 100,
    happiness = 100,
    inHospital = false,
    isSick = false,
  ) {
    super();
    this._id = id;
    this._userName = userName;
    this._ownerID = owner;
    this._type = type;
    this._happiness = happiness;
    this._health = health;
    this._hunger = hunger;
    this._inHospital = inHospital;
    this._isSick = isSick;
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
      ownerID: this._ownerID,
      type: this._type,
      health: this._health,
      hunger: this._hunger,
      happiness: this._happiness,
      inHospital: this._inHospital,
      isSick: this._isSick,
    };
  }

  static fromPlayerModel(modelPet: PetModel): PetController {
    return new PetController(
      modelPet.id,
      modelPet.userName,
      modelPet.ownerID,
      modelPet.type,
      modelPet.health,
      modelPet.hunger,
      modelPet.happiness,
      modelPet.inHospital,
      modelPet.isSick,
    );
  }
}
