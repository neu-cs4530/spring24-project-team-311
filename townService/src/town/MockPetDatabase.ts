import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

type MockDatabasePlayer = {
  player: Player;
  loginTime: number;
  logoutTimeLeft: number;
  location: PlayerLocation;
};

export default class MockPetDatabase extends APetDatabase {
  setUserLoginTime(userID: string, logoutTime: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private _players: MockDatabasePlayer[] = [];

  private _pets: Pet[] = [];

  async addUser(userID: string, username: string): Promise<void> {
    const player: Player = {
      id: userID,
      userName: username,
      location: {
        x: 0,
        y: 0,
        moving: false,
        rotation: 'front',
      },
    };
    this._players.push({
      player,
      loginTime: 0,
      logoutTimeLeft: 0,
      location: {
        x: 0,
        y: 0,
        moving: false,
        rotation: 'front',
      },
    });
  }

  async addPet(
    petName: string,
    petID: string,
    petType: PetType,
    ownerID: string,
    location: PlayerLocation,
  ): Promise<boolean> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet === undefined) {
      const newPet: Pet = {
        id: petID,
        userName: petName,
        ownerID,
        type: petType,
        health: 100,
        hunger: 100,
        happiness: 100,
        inHospital: false,
        isSick: false,
        location,
      };
      this._pets.push(newPet);
      return true;
    }
    return false;
  }

  async getOrAddPlayer(
    userID: string,
    username: string,
    location: PlayerLocation,
  ): Promise<Player | undefined> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      let existingPlayer: Player = {
        userName: username,
        id: userID,
        location,
      };
      const pet: Pet | undefined = await this.getPet(userID);
      if (pet !== undefined) {
        existingPlayer = {
          userName: username,
          id: userID,
          location,
          pet,
        };
      }
      return existingPlayer;
    }
    await this.addUser(userID, username);
    return undefined;
  }

  async updateUserLogInTime(userID: string, logInTime: number): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.loginTime = logInTime;
    }
  }

  async getUserLogOutTime(userID: string): Promise<number> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      return user.logoutTimeLeft;
    }
    return 0;
  }

  async setUserLogOutTime(userID: string, logoutTime: number): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.logoutTimeLeft = (logoutTime - user.loginTime - user.logoutTimeLeft) % (15 * 60 * 1000);
    }
  }

  async getPet(userID: string): Promise<Pet | undefined> {
    const pet = this._pets.find(p => p.ownerID === userID);
    return pet;
  }

  async updateLocation(userID: string, location: PlayerLocation): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.location = location;
    }
  }

  async getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.inHospital;
  }

  async getHealth(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.health;
  }

  async getHappiness(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.happiness;
  }

  async getHunger(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.hunger;
  }

  async changeHappiness(ownerID: string, petID: string, delta: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      if (delta > 0) {
        pet.happiness = Math.max(pet.happiness + delta, 100);
      } else {
        pet.happiness = Math.min(pet.happiness + delta, 0);
      }
    }
  }

  async changeHunger(ownerID: string, petID: string, delta: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      if (delta > 0) {
        pet.hunger = Math.max(pet.hunger + delta, 100);
      } else {
        pet.hunger = Math.min(pet.hunger + delta, 0);
      }
    }
  }

  async changeHealth(ownerID: string, petID: string, delta: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      if (delta > 0) {
        pet.health = Math.max(pet.health + delta, 100);
      } else {
        pet.health = Math.min(pet.health + delta, 0);
      }
    }
  }

  async updateHospitalStatus(ownerID: string, petID: string, status: boolean): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.inHospital = status;
    }
  }

  async updateSickStatus(ownerID: string, petID: string, status: boolean): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.isSick = status;
    }
  }

  async deletePet(ownerID: string, petID: string): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      this._pets.filter(p => p.id !== pet.id);
    }
  }

  async changeOwner(currentOwner: string, newOwner: string, petID: string): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === currentOwner && p.id === petID);
    if (pet !== undefined) {
      this.addPet(pet.userName, petID, pet.type, newOwner, pet.location);
      this.deletePet(currentOwner, petID);
    }
  }
}
