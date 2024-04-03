import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

export default class MockPetDatabase extends APetDatabase {
  addUser(userID: string, username: string, email: string, loginTime: number): Promise<void>;

  addPet(petName: string, petID: string, petType: PetType, ownerID: string): Promise<boolean>;

  getOrAddPlayer(
    userID: string,
    username: string,
    email: string,
    location: PlayerLocation,
    loginTime: number,
  ): Promise<Player | undefined>;

  getUserLogOutTime(userID: string): Promise<number>;

  setUserLogOutTime(userID: string, logoutTime: number): Promise<void>;

  getPet(userID: string): Promise<Pet | undefined>;

  getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined>;

  getHealth(ownerID: string, petID: string): Promise<number | undefined>;

  getHappiness(ownerID: string, petID: string): Promise<number | undefined>;

  getHunger(ownerID: string, petID: string): Promise<number | undefined>;

  changeHappiness(ownerID: string, petID: string, delta: number): Promise<void>;

  changeHealth(ownerID: string, petID: string, delta: number): Promise<void>;

  changeHunger(ownerID: string, petID: string, delta: number): Promise<void>;

  updateHospitalStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  updateSickStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  deletePet(ownerID: string, petID: string): Promise<void>;

  changeOwner(currentOwner: string, newOwner: string, petID: string): Promise<void>;
}
