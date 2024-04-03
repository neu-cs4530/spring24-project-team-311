import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';

export default abstract class APetDatabase {
  abstract addUser(
    userID: string,
    username: string,
    email: string,
    loginTime: number,
  ): Promise<void>;

  abstract addPet(
    petName: string,
    petID: string,
    petType: PetType,
    ownerID: string,
  ): Promise<boolean>;

  abstract getOrAddPlayer(
    userID: string,
    username: string,
    email: string,
    location: PlayerLocation,
    loginTime: number,
  ): Promise<Player | undefined>;

  abstract getUserLogOutTime(userID: string): Promise<number>;

  abstract setUserLogOutTime(userID: string, logoutTime: number): Promise<void>;

  abstract getPet(userID: string): Promise<Pet | undefined>;

  abstract getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined>;

  abstract getHealth(ownerID: string, petID: string): Promise<number | undefined>;

  abstract getHappiness(ownerID: string, petID: string): Promise<number | undefined>;

  abstract getHunger(ownerID: string, petID: string): Promise<number | undefined>;

  abstract changeHappiness(ownerID: string, petID: string, delta: number): Promise<void>;

  abstract changeHealth(ownerID: string, petID: string, delta: number): Promise<void>;

  abstract changeHunger(ownerID: string, petID: string, delta: number): Promise<void>;

  abstract updateHospitalStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  abstract updateSickStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  abstract deletePet(ownerID: string, petID: string): Promise<void>;

  abstract changeOwner(currentOwner: string, newOwner: string, petID: string): Promise<void>;
}
