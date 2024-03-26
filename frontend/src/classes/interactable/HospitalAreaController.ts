import { HospitalArea as HospitalAreaModel } from '../../types/CoveyTownSocket';
import {
  InteractableID,
} from '../../types/CoveyTownSocket';
import TownController from '../TownController';
import InteractableAreaController, {
  BaseInteractableEventMap,
  HOSPITAL_AREA_TYPE,
} from './InteractableAreaController';

export default class HospitalAreaController extends InteractableAreaController<
  BaseInteractableEventMap,
  HospitalAreaModel
> {
  protected _townController: TownController;

  private _model: HospitalAreaModel;

  constructor(id: InteractableID, model: HospitalAreaModel, townController: TownController) {
    super(id);
    this._model = model;
    this._townController = townController;
  }

  public get friendlyName(): string {
    return this.id;
  }

  public get type(): string {
    return HOSPITAL_AREA_TYPE;
  }

  isActive(): boolean {
    return this.occupants.length > 0;
  }

  protected _updateFrom(updatedModel: HospitalAreaModel): void {
    // TODO: Implement this
  }

  toInteractableAreaModel(): HospitalAreaModel {
    return this._model;
  }
}