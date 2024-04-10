import { PetType, Pet, Player, PlayerLocation } from '../types/CoveyTownSocket';

/**
 * Abstract Database class that has all of the database methods. Meant to keep consistency
 * between Mock and Real database.
 */
export default abstract class APetDatabase {
  /**
   * Add a user to the database
   * @param userID the unique id of the user
   * @param username the displayname of the user
   */
  abstract addUser(userID: string, username: string, location: PlayerLocation): Promise<void>;

  /**
   * Adds a Pet if a player doesn't already have a pet
   * @param petName name of the pet
   * @param petID unique ID of the pet
   * @param petType type of the pet: Cat, Dog or Duck
   * @param ownerID id of the player who owns the pet
   * @param location location of the pet. for the purposed of testing, same as player
   * @returns success
   */
  abstract addPet(
    petName: string,
    petID: string,
    petType: PetType,
    ownerID: string,
    location: PlayerLocation,
  ): Promise<boolean>;

  /**
   * Checks if a Player exists and retrieves their info. Otherwise, creates a new player and returns undefined
   * @param userID id of player
   * @param username name of player
   * @param location where the player is on teh gamescene
   * @returns player if exists or undefined if a new one has to be created
   */
  abstract getOrAddPlayer(
    userID: string,
    username: string,
    location: PlayerLocation,
  ): Promise<Player | undefined>;

  /**
   * Gets the login time for the user
   * @param userID id of the user
   * @returns time left in the current time period for the user
   */
  abstract getUserLogOutTime(userID: string): Promise<number>;

  /**
   * sets the logout time to the time remaining in the current update period at logout
   * @param userID id of the user
   * @param logoutTime current time
   */
  abstract setUserLogOutTime(userID: string, logoutTime: number): Promise<void>;

  /**
   * Sets the login time for the user
   * @param userID id of the user
   * @param logInTime time that the user has logged in
   */
  abstract setUserLoginTime(userID: string, logoutTime: number): Promise<void>;

  /**
   * gets a pet if it is present in the town adn belongs to the requestor
   * @param userID is of user
   * @returns Pet
   */
  abstract getPet(userID: string): Promise<Pet | undefined>;

  /**
   * udpate in the hospital status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet in the hospital
   * @returns status
   */
  abstract getHospitalStatus(ownerID: string, petID: string): Promise<boolean | undefined>;

  /**
   * udpate in the health status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  abstract getHealth(ownerID: string, petID: string): Promise<number | undefined>;

  /**
   * udpate in the happiness status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  abstract getHappiness(ownerID: string, petID: string): Promise<number | undefined>;

  /**
   * udpate in the hunger status.
   * @param ownerID id of the player who own's the pet
   * @param petID id of pet
   * @returns status
   */
  abstract getHunger(ownerID: string, petID: string): Promise<number | undefined>;

  /**
   * updates the happiness of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new happiness Value
   */
  abstract changeHappiness(ownerID: string, petID: string, delta: number): Promise<void>;

  /**
   * updates the health of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new health Value
   */
  abstract changeHealth(ownerID: string, petID: string, delta: number): Promise<void>;

  /**
   * updates the hunger of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hunger Value
   */
  abstract changeHunger(ownerID: string, petID: string, delta: number): Promise<void>;

  /**
   * updates the hospitalStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new hospitalStatus Value
   */
  abstract updateHospitalStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  /**
   * updates the sickStatus of the pet
   * @param ownerID id of the user
   * @param petID id of the pet
   * @param val new sick Value
   */
  abstract updateSickStatus(ownerID: string, petID: string, status: boolean): Promise<void>;

  /**
   * removes pet from db
   * @param ownerID id of the user
   * @param petID id of the pet
   */
  abstract deletePet(ownerID: string, petID: string): Promise<void>;

  /**
   * Switches the current owner of the pet with a new owner
   * @param currentOwner current owner that has teh pet
   * @param newOwner new owner that wants the pet
   * @param petID is of pet
   */
  abstract changeOwner(currentOwner: string, newOwner: string, petID: string): Promise<void>;

  /**
   * changes the position of the player on the board
   * @param userID userID
   * @param location new Location
   */
  abstract updateLocation(userID: string, location: PlayerLocation): Promise<void>;
}
