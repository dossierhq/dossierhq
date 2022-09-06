import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { FieldType } from '@jonasb/datadata-core';

export const SCHEMA: AdminSchemaSpecificationUpdate = {
  entityTypes: [
    {
      name: 'Film',
      fields: [
        { name: 'title', type: FieldType.String, required: true, isName: true },
        { name: 'episodeId', type: FieldType.String, required: true },
        { name: 'director', type: FieldType.String, required: true },
        { name: 'producers', type: FieldType.String, list: true, required: true },
        { name: 'releaseDate', type: FieldType.String, required: true },
        { name: 'openingCrawl', type: FieldType.String, required: true, multiline: true },
        {
          name: 'characters',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Person'],
          required: true,
        },
        {
          name: 'starships',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Starship'],
          required: true,
        },
        {
          name: 'vehicles',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Vehicle'],
          required: true,
        },
        {
          name: 'planets',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Planet'],
          required: true,
        },
        {
          name: 'species',
          type: FieldType.EntityType,
          list: true,
          entityTypes: ['Species'],
          required: true,
        },
      ],
    },
    {
      name: 'Person',
      fields: [
        { name: 'name', type: FieldType.String, required: true, isName: true },
        { name: 'gender', type: FieldType.String, required: true },
        { name: 'skinColors', type: FieldType.String, list: true, required: true },
        { name: 'hairColors', type: FieldType.String, list: true, required: true },
        { name: 'eyeColors', type: FieldType.String, list: true, required: true },
        { name: 'height', type: FieldType.String, required: true },
        { name: 'mass', type: FieldType.String, required: true },
        { name: 'homeworld', type: FieldType.EntityType, entityTypes: ['Planet'], required: true },
        { name: 'birthYear', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Planet',
      fields: [
        { name: 'name', type: FieldType.String, required: true, isName: true },
        { name: 'climate', type: FieldType.String, list: true, required: true },
        { name: 'surfaceWater', type: FieldType.String, required: true },
        { name: 'diameter', type: FieldType.String, required: true },
        { name: 'terrain', type: FieldType.String, list: true, required: true },
        { name: 'gravity', type: FieldType.String, required: true },
        { name: 'rotationPeriod', type: FieldType.String, required: true },
        { name: 'orbitalPeriod', type: FieldType.String, required: true },
        { name: 'population', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Species',
      fields: [
        { name: 'name', type: FieldType.String, required: true, isName: true },
        { name: 'classification', type: FieldType.String, required: true },
        { name: 'designation', type: FieldType.String, required: true },
        { name: 'skinColors', type: FieldType.String, list: true, required: true },
        { name: 'hairColors', type: FieldType.String, list: true, required: true },
        { name: 'eyeColors', type: FieldType.String, list: true, required: true },
        { name: 'language', type: FieldType.String, required: true },
        { name: 'averageLifespan', type: FieldType.String, required: true },
        { name: 'averageHeight', type: FieldType.String, required: true },
        { name: 'people', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
        { name: 'homeworld', type: FieldType.EntityType, entityTypes: ['Planet'] },
      ],
    },
    {
      name: 'Starship',
      fields: [
        { name: 'starshipClass', type: FieldType.String, required: true, isName: true },
        { name: 'mglt', type: FieldType.String, required: true },
        { name: 'hyperdriveRating', type: FieldType.String, required: true },
        { name: 'pilots', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
      ],
    },
    {
      name: 'Transport',
      fields: [
        { name: 'name', type: FieldType.String, required: true, isName: true },
        { name: 'model', type: FieldType.String, required: true },
        { name: 'manufacturers', type: FieldType.String, list: true, required: true },
        { name: 'consumables', type: FieldType.String, required: true },
        { name: 'cargoCapacity', type: FieldType.String, required: true },
        { name: 'crew', type: FieldType.String, required: true },
        { name: 'passengers', type: FieldType.String, required: true },
        { name: 'maxAtmospheringSpeed', type: FieldType.String, required: true },
        { name: 'length', type: FieldType.String, required: true },
        { name: 'costInCredits', type: FieldType.String, required: true },
      ],
    },
    {
      name: 'Vehicle',
      fields: [
        { name: 'vehicleClass', type: FieldType.String, required: true, isName: true },
        { name: 'pilots', type: FieldType.EntityType, list: true, entityTypes: ['Person'] },
      ],
    },
  ],
};
