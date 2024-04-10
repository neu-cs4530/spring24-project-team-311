import { getDatabase, ref, set, get, update, remove } from 'firebase/database';
import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';
import APetDatabase from './APetDatabase';

/**
 * Database that connects to our external firebase database. Plays a large part in persistent.
 */
export default class PetDatabase extends APetDatabase {
  /**
   * firebase variable
   */
  private _db;

  constructor() {
    super();
    this._db = getDatabase();
  }

  /**
   * Add a user to the database
   * @param userID the unique id of the user
   * @param username the displayname of the user
   */
  async addUser(userID: string, username: string, location: PlayerLocation): Promise<void> {
    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    await set(ref(this._db, `users/${userID}`), {
      userID,
      username,
      logoutTimeLeft: 0,
      loginTime: 0,
      location: newLocation,
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
    const userRef = ref(this._db, `users/${ownerID}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return false;
    }

    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists() && snapshot.val().name) {
      return false;
    }

    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    await set(ref(this._db, `users/${ownerID}/pet`), {
      name: petName,
      type: petType,
      id: petID,
      owner: ownerID,
      health: 50,
      hunger: 50,
      happiness: 50,
      inHospital: false,
      currentPet: true,
      isSick: false,
      location: newLocation,
    });

    return true;
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
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      let existingPlayer: Player = {
        userName: user.userName,
        id: user.userID,
        location,
      };
      const pet: Pet | undefined = await this.getPet(userID);
      if (pet !== undefined) {
        existingPlayer = {
          userName: user.userName,
          id: user.userID,
          location,
          pet,
        };
      }
      return existingPlayer;
    }
    await this.addUser(userID, username, location);
    return undefined;
  }

  /**
   * Sets the login time for the user
   * @param userID id of the user
   * @param logInTime time that the user has logged in
   */
  async setUserLoginTime(userID: string, loginTime: number): Promise<void> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const updates: Record<string, number> = {};
      updates.loginTime = loginTime;
      update(userRef, updates);
    }
  }

  /**
   * Gets the login time for the user
   * @param userID id of the user
   * @returns time left in the current time period for the user
   */
  async getUserLogOutTime(userID: string): Promise<number> {
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
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
    const userRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      const updates: Record<string, number> = {};
      updates.logoutTimeLeft =
        (logoutTime - petData.loginTime - petData.logoutTimeLeft) % (15 * 60 * 1000);
      update(userRef, updates);
    }
  }

  /**
   * changes the position of the player on the board
   * @param userID userID
   * @param location new Location
   */
  async updateLocation(userID: string, location: PlayerLocation): Promise<void> {
    let newLocation = location;

    if (!location.interactableID) {
      newLocation = {
        x: location.x,
        y: location.y,
        rotation: location.rotation,
        moving: location.moving,
        interactableID: 'unknown',
      };
    }

    const uesrRef = ref(this._db, `users/${userID}`);
    const snapshot = await get(uesrRef);
    if (snapshot.exists()) {
      const updates: Record<string, PlayerLocation> = {};
      updates.location = newLocation;
      update(uesrRef, updates);
    }

    const userPetsRef = ref(this._db, `users/${userID}/pet`);
    if (snapshot.exists()) {
      const updates: Record<string, PlayerLocation> = {};
      updates.location = newLocation;
      update(userPetsRef, updates);
    }
  }

  /**
   * gets a pet if it is present in the town and belongs to the requestor
   * @param userID is of user
   * @returns Pet
   */
  async getPet(userID: string): Promise<Pet | undefined> {
    const userPetRef = ref(this._db, `users/${userID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return {
        userName: petData.name,
        type: petData.type,
        ownerID: petData.ownerID,
        health: petData.health,
        hunger: petData.hunger,
        happiness: petData.happiness,
        inHospital: petData.inHospital,
        isSick: petData.isSick,
        id: petData.id,
        location: petData.location,
      };
    }
    return undefined;
  }

  /**
   * udpate in the hospital status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet in the hospital
   * @returns status
   */
  async getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.inHospital;
    }
    return undefined;
  }

  /**
   * udpate in the sick status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet that is sick
   * @returns status
   */
  async getSickStatus(ownerID: string): Promise<boolean | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.isSick;
    }
    return undefined;
  }

  /**
   * udpate in the health status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHealth(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.health;
    }
    return undefined;
  }

  /**
   * udpate in the happiness status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHappiness(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.happiness;
    }
    return undefined;
  }

  /**
   * udpate in the hunger status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  async getHunger(ownerID: string, petID: string): Promise<number | undefined> {
    const userPetRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      return petData.hunger;
    }
    return undefined;
  }

  /**
   * updates the happiness of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new happiness Value
   */
  async changeHappiness(ownerID: string, petID: string, happinessVal: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const updates: Record<string, number> = {};
      updates.happiness = happinessVal;
      update(userPetsRef, updates);
    }
  }

  /**
   * updates the health of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new health Value
   */
  async changeHealth(ownerID: string, petID: string, healthVal: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const updates: Record<string, number> = {};
      updates.health = healthVal;
      update(userPetsRef, updates);
    }
  }

  /**
   * updates the hunger of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hunger Value
   */
  async changeHunger(ownerID: string, petID: string, hungerVal: number) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);

    if (snapshot.exists()) {
      const updates: Record<string, number> = {};
      updates.hunger = hungerVal;
      update(userPetsRef, updates);
    }
  }

  /**
   * updates the hospitalStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hospitalStatus Value
   */
  async updateHospitalStatus(ownerID: string, petID: string, status: boolean) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const updates: Record<string, boolean> = {};
      updates.inHospital = status;
      update(userPetsRef, updates);
    }
  }

  /**
   * updates the sickStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new sick Value
   */
  async updateSickStatus(ownerID: string, petID: string, status: boolean) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const updates: Record<string, boolean> = {};
      updates.isSick = status;
      update(userPetsRef, updates);
    }
  }

  /**
   * removes pet from db
   * @param ownerID id of the user
   * @param petID id of the pet
   */
  async deletePet(ownerID: string, petID: string) {
    const userPetsRef = ref(this._db, `users/${ownerID}/pet`);
    await remove(userPetsRef);
  }

  /**
   * Switches the current owner of the pet with a new owner
   * @param currentOwner current owner that has teh pet
   * @param newOwner new owner that wants the pet
   * @param petID is of pet
   */
  async changeOwner(currentOwner: string, newOwner: string, petID: string) {
    const userPetsRef = ref(this._db, `users/${currentOwner}/pet`);
    const snapshot = await get(userPetsRef);
    if (snapshot.exists()) {
      const petData = snapshot.val();
      this.addPet(petData.name, petID, petData.type, newOwner, petData.location);
      this.deletePet(currentOwner, petID);
    }
  }
}
