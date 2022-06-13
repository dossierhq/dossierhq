import type { AdminEntity, EntityReference } from '@jonasb/datadata-core';

export interface AdminFilmFields {
  title: string | null;
  episodeId: string | null;
  director: string | null;
  producers: Array<string> | null;
  releaseDate: string | null;
  openingCrawl: string | null;
  characters: Array<EntityReference> | null;
  starships: Array<EntityReference> | null;
  vehicles: Array<EntityReference> | null;
  planets: Array<EntityReference> | null;
  species: Array<EntityReference> | null;
}

export type AdminFilm = AdminEntity<'Film', AdminFilmFields>;

export interface AdminPersonFields {
  name: string | null;
  gender: string | null;
  skinColors: Array<string> | null;
  hairColors: Array<string> | null;
  eyeColors: Array<string> | null;
  height: string | null;
  mass: string | null;
  homeworld: EntityReference | null;
  birthYear: string | null;
}

export type AdminPerson = AdminEntity<'Person', AdminPersonFields>;

export interface AdminPlanetFields {
  name: string | null;
  climate: Array<string> | null;
  surfaceWater: string | null;
  diameter: string | null;
  terrain: Array<string> | null;
  gravity: string | null;
  rotationPeriod: string | null;
  orbitalPeriod: string | null;
  population: string | null;
}

export type AdminPlanet = AdminEntity<'Planet', AdminPlanetFields>;

export interface AdminSpeciesFields {
  name: string | null;
  classification: string | null;
  designation: string | null;
  skinColors: Array<string> | null;
  hairColors: Array<string> | null;
  eyeColors: Array<string> | null;
  language: string | null;
  averageLifespan: string | null;
  averageHeight: string | null;
  people: Array<EntityReference> | null;
  homeworld: EntityReference | null;
}

export type AdminSpecies = AdminEntity<'Species', AdminSpeciesFields>;

export interface AdminStarshipFields {
  starshipClass: string | null;
  mglt: string | null;
  hyperdriveRating: string | null;
  pilots: Array<EntityReference> | null;
}

export type AdminStarship = AdminEntity<'Starship', AdminStarshipFields>;

export interface AdminTransportFields {
  name: string | null;
  model: string | null;
  manufacturers: Array<string> | null;
  consumables: string | null;
  cargoCapacity: string | null;
  crew: string | null;
  passengers: string | null;
  maxAtmospheringSpeed: string | null;
  length: string | null;
  costInCredits: string | null;
}

export type AdminTransport = AdminEntity<'Transport', AdminTransportFields>;

export interface AdminVehicleFields {
  vehicleClass: string | null;
  pilots: Array<EntityReference> | null;
}

export type AdminVehicle = AdminEntity<'Vehicle', AdminVehicleFields>;
