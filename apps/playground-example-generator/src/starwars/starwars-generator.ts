import { v5 as uuidv5 } from 'uuid';
import { fetchJsonCached } from '../utils/fetchUtils.js';
import { createAdapterAndServer, createNewDatabase } from '../utils/shared-generator.js';
import type {
  AdminFilm,
  AdminPerson,
  AdminPlanet,
  AdminSpecies,
  AdminStarship,
  AdminTransport,
  AdminVehicle,
  AppAdminClient,
} from './schema-types.js';
import { SCHEMA } from './schema.js';

const UUID_NAMESPACE = 'b0a4c16c-8feb-4a68-9d43-98f96719eee5';

async function downloadFile(filename: string) {
  return await fetchJsonCached(
    `https://raw.githubusercontent.com/Juriy/swapi/master/resources/fixtures/${filename}`,
    `cache/starwars/${filename}`
  );
}

type IdType = 'film' | 'planet' | 'person' | 'species' | 'starship' | 'transport' | 'vehicle';

function uuidForEntity(type: IdType, pk: number) {
  if (typeof pk !== 'number') throw new Error(`pk is not a number (${pk})`);
  return uuidv5(`${type}:${pk}`, UUID_NAMESPACE);
}

function uuidReferences(type: IdType, ids: number[]) {
  return ids.map((id) => ({ id: uuidForEntity(type, id) }));
}

function splitCsv(value: string) {
  return value.trim().split(/\s*,\s*/);
}

async function createFilms(adminClient: AppAdminClient) {
  const filmsData = await downloadFile('films.json');
  for (const film of filmsData) {
    (
      await adminClient.createEntity<AdminFilm>(
        {
          id: uuidForEntity('film', film.pk),
          info: { type: 'Film', authKey: 'none', name: film.fields.title },
          fields: {
            title: film.fields.title,
            episodeId: film.fields.episode_id,
            director: film.fields.director,
            producers: splitCsv(film.fields.producer),
            releaseDate: film.fields.release_date,
            openingCrawl: film.fields.opening_crawl.replace(/\r\n/g, '\n'),
            characters: uuidReferences('person', film.fields.characters),
            starships: uuidReferences('starship', film.fields.starships),
            vehicles: uuidReferences('vehicle', film.fields.vehicles),
            planets: uuidReferences('planet', film.fields.planets),
            species: uuidReferences('species', film.fields.species),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createPeople(adminClient: AppAdminClient) {
  const peopleData = await downloadFile('people.json');
  for (const person of peopleData) {
    (
      await adminClient.createEntity<AdminPerson>(
        {
          id: uuidForEntity('person', person.pk),
          info: { type: 'Person', authKey: 'none', name: person.fields.name },
          fields: {
            name: person.fields.name,
            gender: person.fields.gender,
            skinColors: splitCsv(person.fields.skin_color),
            hairColors: splitCsv(person.fields.hair_color),
            eyeColors: splitCsv(person.fields.eye_color),
            height: person.fields.height,
            mass: person.fields.mass,
            homeworld: { id: uuidForEntity('planet', person.fields.homeworld) },
            birthYear: person.fields.birth_year,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createPlanets(adminClient: AppAdminClient) {
  const planetsData = await downloadFile('planets.json');
  for (const planet of planetsData) {
    (
      await adminClient.createEntity<AdminPlanet>(
        {
          id: uuidForEntity('planet', planet.pk),
          info: { type: 'Planet', authKey: 'none', name: planet.fields.name },
          fields: {
            name: planet.fields.name,
            climate: splitCsv(planet.fields.climate),
            surfaceWater: planet.fields.surface_water,
            diameter: planet.fields.diameter,
            terrain: splitCsv(planet.fields.terrain),
            gravity: planet.fields.gravity,
            rotationPeriod: planet.fields.rotation_period,
            orbitalPeriod: planet.fields.orbital_period,
            population: planet.fields.population,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createSpecies(adminClient: AppAdminClient) {
  const speciesData = await downloadFile('species.json');
  for (const species of speciesData) {
    (
      await adminClient.createEntity<AdminSpecies>(
        {
          id: uuidForEntity('species', species.pk),
          info: { type: 'Species', authKey: 'none', name: species.fields.name },
          fields: {
            name: species.fields.name,
            classification: species.fields.classification,
            designation: species.fields.designation,
            skinColors: splitCsv(species.fields.skin_colors),
            hairColors: splitCsv(species.fields.hair_colors),
            eyeColors: splitCsv(species.fields.eye_colors),
            language: species.fields.language,
            averageLifespan: species.fields.average_lifespan,
            averageHeight: species.fields.average_height,
            people: uuidReferences('person', species.fields.people),
            homeworld: species.fields.homeworld
              ? { id: uuidForEntity('planet', species.fields.homeworld) }
              : null,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createStarships(adminClient: AppAdminClient) {
  const starshipsData = await downloadFile('starships.json');
  for (const starship of starshipsData) {
    (
      await adminClient.createEntity<AdminStarship>(
        {
          id: uuidForEntity('starship', starship.pk),
          info: { type: 'Starship', authKey: 'none', name: starship.fields.starship_class },
          fields: {
            starshipClass: starship.fields.starship_class,
            mglt: starship.fields.MGLT,
            hyperdriveRating: starship.fields.hyperdrive_rating,
            pilots: uuidReferences('person', starship.fields.pilots),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createTransports(adminClient: AppAdminClient) {
  const transportsData = await downloadFile('transport.json');
  for (const transport of transportsData) {
    (
      await adminClient.createEntity<AdminTransport>(
        {
          id: uuidForEntity('transport', transport.pk),
          info: { type: 'Transport', authKey: 'none', name: transport.fields.name },
          fields: {
            name: transport.fields.name,
            model: transport.fields.model,
            manufacturers: splitCsv(transport.fields.manufacturer),
            consumables: transport.fields.consumables,
            cargoCapacity: transport.fields.cargo_capacity,
            crew: transport.fields.crew,
            passengers: transport.fields.passengers,
            maxAtmospheringSpeed: transport.fields.max_atmosphering_speed,
            length: transport.fields.length,
            costInCredits: transport.fields.cost_in_credits,
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function createVehicles(adminClient: AppAdminClient) {
  const vehiclesData = await downloadFile('vehicles.json');
  for (const vehicle of vehiclesData) {
    (
      await adminClient.createEntity<AdminVehicle>(
        {
          id: uuidForEntity('vehicle', vehicle.pk),
          info: { type: 'Vehicle', authKey: 'none', name: vehicle.fields.vehicle_class },
          fields: {
            vehicleClass: vehicle.fields.vehicle_class,
            pilots: uuidReferences('person', vehicle.fields.pilots),
          },
        },
        { publish: true }
      )
    ).throwIfError();
  }
}

async function main() {
  const database = await createNewDatabase('dist/starwars.sqlite');
  const { adminClient, server } = await createAdapterAndServer<AppAdminClient>(database, SCHEMA);

  // order is due to references between entities
  await createPlanets(adminClient);
  await createPeople(adminClient);
  await createSpecies(adminClient);
  await createTransports(adminClient);
  await createStarships(adminClient);
  await createVehicles(adminClient);
  await createFilms(adminClient);

  await server.shutdown();
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
