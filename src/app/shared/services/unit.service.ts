import { Injectable } from '@angular/core';

export type WeightUnit = 'POUNDS' | 'KILOGRAMS';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private preferredUnit: WeightUnit = 'POUNDS';

  setPreferredUnit(unit: WeightUnit) {
    this.preferredUnit = unit;
  }

  getPreferredUnit(): WeightUnit {
    return this.preferredUnit;
  }

  convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
    if (from === to) return weight;
    return from === 'POUNDS' ? weight * 0.453592 : weight / 0.453592;
  }

  getSymbol(): string {
    return this.preferredUnit === 'POUNDS' ? 'lbs' : 'kg';
  }
}