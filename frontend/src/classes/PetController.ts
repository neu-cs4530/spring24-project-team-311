import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { MOVEMENT_SPEED } from './PlayerController';
import { Pet, Pet as PetModel, PlayerLocation, PetType } from '../types/CoveyTownSocket';

export type PetEvents = {
  movement: (newLocation: PlayerLocation) => void;
  petStatsUpdated: (newStats: Pet) => void;
};

export type PetGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean;
};

export default class PetController extends (EventEmitter as new () => TypedEmitter<PetEvents>) {
  private _location: PlayerLocation;

  private readonly _playerID: string;

  private readonly _petName: string;

  private readonly _petID: string;

  private readonly _petType: PetType;

  private _petHealth: number;

  private _petHappiness: number;

  private _petHunger: number;

  private _isInHospital: boolean;

  public gameObjects?: PetGameObjects;

  private _isSick: boolean;

  constructor(
    playerID: string,
    petID: string,
    petType: PetType,
    petName: string,
    location: PlayerLocation,
  ) {
    super();
    this._playerID = playerID;
    this._petID = petID;
    this._petType = petType;
    this._petName = petName;
    this._location = location;
    this._petHealth = 50;
    this._petHappiness = 50;
    this._petHunger = 50;
    this._isInHospital = false;
    this._isSick = false;
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this._updateGameComponentLocation();
  }

  get location(): PlayerLocation {
    return this._location;
  }

  get playerID(): string {
    return this._playerID;
  }

  get petID(): string {
    return this._petID;
  }

  get petName(): string {
    return this._petName;
  }

  get petType(): PetType {
    return this._petType;
  }

  get petHealth(): number {
    return this._petHealth;
  }

  set petHealth(newHealth: number) {
    this._petHealth = newHealth;
    this.emit('petStatsUpdated', this.toPetModel());
  }

  get petHappiness(): number {
    return this._petHappiness;
  }

  set petHappiness(newHappiness: number) {
    this._petHappiness = newHappiness;
    this.emit('petStatsUpdated', this.toPetModel());
  }

  get petHunger(): number {
    return this._petHunger;
  }

  set petHunger(newHunger: number) {
    this._petHunger = newHunger;
    this.emit('petStatsUpdated', this.toPetModel());
  }

  get isInHospital(): boolean {
    return this._isInHospital;
  }

  set isInHospital(newIsInHospital: boolean) {
    this._isInHospital = newIsInHospital;
  }

  set isSick(sick: boolean) {
    this._isSick = sick;
  }

  get isSick(): boolean {
    return this._isSick;
  }

  set timePlacedInHospital(sickStatus: boolean) {
    this._isSick = sickStatus;
  }

  toPetModel(): PetModel {
    return {
      ownerID: this.playerID,
      id: this.petID,
      type: this.petType,
      userName: this.petName,
      health: this.petHealth,
      happiness: this.petHappiness,
      hunger: this.petHunger,
      inHospital: this.isInHospital,
      isSick: this._isSick,
      location: this._location,
    };
  }

  fromPetModel(pet: PetModel): PetController {
    this.petHealth = pet.health;
    this.petHappiness = pet.happiness;
    this.petHunger = pet.hunger;
    this.isInHospital = pet.inHospital;
    this._isSick = pet.isSick;
    this._location = pet.location;
    return this;
  }

  private _updateGameComponentLocation() {
    if (this.gameObjects && !this.gameObjects.locationManagedByGameScene) {
      const { sprite } = this.gameObjects;
      if (!sprite.anims) return;
      sprite.setX(this.location.x);
      sprite.setY(this.location.y);
      if (this.location.moving) {
        sprite.anims.play(`misa-${this.location.rotation}-walk`, true);
        switch (this.location.rotation) {
          case 'front':
            sprite.body.setVelocity(0, MOVEMENT_SPEED);
            break;
          case 'right':
            sprite.body.setVelocity(MOVEMENT_SPEED, 0);
            break;
          case 'back':
            sprite.body.setVelocity(0, -MOVEMENT_SPEED);
            break;
          case 'left':
            sprite.body.setVelocity(-MOVEMENT_SPEED, 0);
            break;
        }
      }
    }
  }
}
