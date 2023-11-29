import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = 'fdf4e979-6f82-4d61-ab14-26c318cb6731';

function id(name: string) {
  return uuidv5(name, UUID_NAMESPACE);
}

export const CatalogEntities = {
  Booleans: {
    minimal: id('booleans-minimal'),
    filled: id('booleans-filled'),
    publishedMinimal: id('booleans-published-minimal'),
    publishedInvalid: id('booleans-published-invalid'),
  },
  Components: {
    minimal: id('components-minimal'),
    filled: id('components-filled'),
    publishedMinimal: id('components-published-minimal'),
    invalid: id('components-invalid'),
    publishedInvalid: id('components-published-invalid'),
  },
  Entities: {
    minimal: id('entities-minimal'),
    filled: id('entities-filled'),
    publishedMinimal: id('entities-published-minimal'),
    invalid: id('entities-invalid'),
    publishedInvalid: id('entities-published-invalid'),
  },
  Locations: {
    minimal: id('locations-minimal'),
    filled: id('locations-filled'),
    publishedMinimal: id('locations-published-minimal'),
    publishedInvalid: id('locations-published-invalid'),
  },
  Numbers: {
    minimal: id('numbers-minimal'),
    filled: id('numbers-filled'),
    publishedMinimal: id('numbers-published-minimal'),
    invalid: id('numbers-invalid'),
    publishedInvalid: id('numbers-published-invalid'),
  },
  RichTexts: {
    minimal: id('rich-texts-minimal'),
    filled: id('rich-texts-filled'),
    invalid: id('rich-texts-invalid'),
    publishedMinimal: id('rich-texts-published-minimal'),
    publishedInvalid: id('rich-texts-published-invalid'),
    validationOfComponents: id('rich-texts-validation-of-components'),
  },
  Strings: {
    minimal: id('strings-minimal'),
    filled: id('strings-filled'),
    publishedMinimal: id('strings-published-minimal'),
    invalid: id('strings-invalid'),
    publishedInvalid: id('strings-published-invalid'),
  },
};
