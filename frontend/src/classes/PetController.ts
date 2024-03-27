import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { MOVEMENT_SPEED } from './PlayerController';
import { Pet as PetModel, PlayerLocation } from '../types/CoveyTownSocket';

export type PetEvents = {
  movement: (newLocation: PlayerLocation) => void;
};

export type PetGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  locationManagedByGameScene: boolean;
};

export default class PetController extends (EventEmitter as new () => TypedEmitter<PetEvents>) {
  private _location: PlayerLocation;

  private readonly _playerID: string;

  private readonly _petName: string;

  private readonly _petID: string;

  private readonly _petType: string;

  private _petHealth: number;

  private _petHappiness: number;

  private _petHunger: number;

  private _isInHospital: boolean;

  private _timePlacedInHospital: Date | undefined;

  public gameObjects?: PetGameObjects;

  constructor(
    playerID: string,
    petID: string,
    petType: string,
    petName: string,
    location: PlayerLocation,
  ) {
    console.log('PetController constructor');
    super();
    console.log('PetController constructor super');
    this._playerID = playerID;
    this._petID = petID;
    this._petType = petType;
    this._petName = petName;
    this._location = location;
    this._petHealth = 100;
    this._petHappiness = 100;
    this._petHunger = 100;
    this._isInHospital = false;
    this._timePlacedInHospital = undefined;
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this._updateGameComponentLocation();
    this.emit('movement', newLocation);
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

  get petType(): string {
    return this._petType;
  }

  get petHealth(): number {
    return this._petHealth;
  }

  set petHealth(newHealth: number) {
    this._petHealth = newHealth;
  }

  get petHappiness(): number {
    return this._petHappiness;
  }

  set petHappiness(newHappiness: number) {
    this._petHappiness = newHappiness;
  }

  get petHunger(): number {
    return this._petHunger;
  }

  set petHunger(newHunger: number) {
    this._petHunger = newHunger;
  }

  get isInHospital(): boolean {
    return this._isInHospital;
  }

  set isInHospital(newIsInHospital: boolean) {
    this._isInHospital = newIsInHospital;
  }

  get timePlacedInHospital(): Date | undefined {
    return this._timePlacedInHospital;
  }

  set timePlacedInHospital(newTimePlacedInHospital: Date | undefined) {
    this._timePlacedInHospital = newTimePlacedInHospital;
  }

  toPetModel(): PetModel {
    return {
      playerID: this.playerID,
      petID: this.petID,
      location: this.location,
      petType: this.petType,
      petName: this.petName,
      petHealth: this.petHealth,
      petHappiness: this.petHappiness,
      petHunger: this.petHunger,
      isInHospital: this.isInHospital,
      timePlacedInHospital: this.timePlacedInHospital,
    };
  }

  fromPetModel(pet: PetModel): void {
    this.location = pet.location;
    this.petHealth = pet.petHealth;
    this.petHappiness = pet.petHappiness;
    this.petHunger = pet.petHunger;
    this.isInHospital = pet.isInHospital;
    this.timePlacedInHospital = pet.timePlacedInHospital;
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
