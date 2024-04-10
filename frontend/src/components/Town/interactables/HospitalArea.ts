import Interactable, { KnownInteractableTypes } from '../Interactable';

export default class HospitalArea extends Interactable {
  private _isInteracting = false;

  /**
   * Building the scene for hospital area
   */
  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0);
    this.setDepth(-1);
    this.scene.add.text(
      this.x - this.displayWidth / 1.35,
      this.y + this.displayHeight / 1.9,
      `Check up a pet in the back`,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
  }

  /**
   * End interaction
   *
   * If it is currently interacting, emits a 'endInteraction' event with this HospitalArea.
   * And also set _isInteracting to false
   */
  overlapExit(): void {
    if (this._isInteracting) {
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  /**
   * Interact with area
   */
  interact(): void {
    this._isInteracting = true;
  }

  /**
   * Returns the type of the interactable
   */
  getType(): KnownInteractableTypes {
    return 'hospitalArea';
  }
}
