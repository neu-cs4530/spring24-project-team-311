import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

/**
 * Mocked Player for the fake database
 */
type MockDatabasePlayer = {
  player: Player;
  loginTime: number;
  logoutTimeLeft: number;
  location: PlayerLocation;
};

/**
 * A mock Database for testing purposed. Confirmation from the TA that this does not
 * need to be tested and that actual database was fine for manual testing
 */
export default class MockPetDatabase extends APetDatabase {
  /**
   * list of players
   */
  public _players: MockDatabasePlayer[] = [];

  /**
   * list of pets that belong to the players
   */
  public _pets: Pet[] = [];

  /**
   * Add a user to the database
   * @param userID the unique id of the user
   * @param username the displayname of the user
   */
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

  /**
   * Adds a Pet if a player doesn't already have a pet
   * @param petName name of the pet
   * @param petID unique ID of the pet
   * @param petType type of the pet: Cat, Dog or Duck
   * @param ownerID id of the player who owns the pet
   * @param location location of the pet. for the purposed of testing, same as player
   * @returns success
   */
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
        health: 50,
        hunger: 50,
        happiness: 50,
        inHospital: false,
        isSick: false,
        location,
      };
      this._pets.push(newPet);
      return true;
    }
    return false;
  }

  /**
   * Checks if a Player exists and retrieves their info. Otherwise, creates a new player and returns undefined
   * @param userID id of player
   * @param username name of player
   * @param location where the player is on teh gamescene
   * @returns player if exists or undefined if a new one has to be created
   */
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

  /**
   * Sets the login time for the user
   * @param userID id of the user
   * @param logInTime time that the user has logged in
   */
  async setUserLoginTime(userID: string, logInTime: number): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.loginTime = logInTime;
    }
  }

  /**
   * Gets the login time for the user
   * @param userID id of the user
   * @returns time left in the current time period for the user
   */
  async getUserLogOutTime(userID: string): Promise<number> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      return user.logoutTimeLeft;
    }
    return 0;
  }

  /**
   * sets the logout time to the time remaining in the current update period at logout
   * @param userID id of the user
   * @param logoutTime current time
   */
  async setUserLogOutTime(userID: string, logoutTime: number): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.logoutTimeLeft = (logoutTime - user.loginTime - user.logoutTimeLeft) % (15 * 60 * 1000);
    }
  }

  /**
   * gets a pet if it is present in the town adn belongs to the requestor
   * @param userID is of user
   * @returns Pet
   */
  async getPet(userID: string): Promise<Pet | undefined> {
    const pet = this._pets.find(p => p.ownerID === userID);
    return pet;
  }

  /**
   * changes the position of the player on the board
   * @param userID userID
   * @param location new Location
   */
  async updateLocation(userID: string, location: PlayerLocation): Promise<void> {
    const user = this._players.find(p => p.player.id === userID);
    if (user !== undefined) {
      user.location = location;
    }
  }

  /**
   * udpate in the hospital status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet in the hospital
   * @returns status
   */
  async getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.inHospital;
  }

  /**
   * udpate in the health status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHealth(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.health;
  }

  /**
   * udpate in the happiness status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHappiness(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.happiness;
  }

  /**
   * udpate in the hunger status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHunger(ownerID: string, petID: string): Promise<number | undefined> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    return pet?.hunger;
  }

  /**
   * updates the happiness of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new happiness Value
   */
  async changeHappiness(ownerID: string, petID: string, val: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.happiness = val;
    }
  }

  /**
   * updates the hunger of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hunger Value
   */
  async changeHunger(ownerID: string, petID: string, val: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.hunger = val;
    }
  }

  /**
   * updates the health of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new health Value
   */
  async changeHealth(ownerID: string, petID: string, val: number): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet) {
      pet.health = val;
    }
  }

  /**
   * updates the hospitalStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hospitalStatus Value
   */
  async updateHospitalStatus(ownerID: string, petID: string, status: boolean): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.inHospital = status;
    }
  }

  /**
   * updates the sickStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new sick Value
   */
  async updateSickStatus(ownerID: string, petID: string, status: boolean): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      pet.isSick = status;
    }
  }

  /**
   * removes pet from db
   * @param ownerID id of the user
   * @param petID id of the pet
   */
  async deletePet(ownerID: string, petID: string): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === ownerID && p.id === petID);
    if (pet !== undefined) {
      this._pets.filter(p => p.id !== pet.id);
    }
  }

  /**
   * Switches the current owner of the pet with a new owner
   * @param currentOwner current owner that has teh pet
   * @param newOwner new owner that wants the pet
   * @param petID is of pet
   */
  async changeOwner(currentOwner: string, newOwner: string, petID: string): Promise<void> {
    const pet = this._pets.find(p => p.ownerID === currentOwner && p.id === petID);
    if (pet !== undefined) {
      this.addPet(pet.userName, petID, pet.type, newOwner, pet.location);
      this.deletePet(currentOwner, petID);
    }
  }
}
