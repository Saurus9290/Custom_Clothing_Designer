import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the Custom Clothing Design type
type ClothingDesign = Record<{
  id: string;
  name: string;
  description: string;
  designer: Principal;
  image: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
  sharedWith: Vec<Principal>;
}>;

// Define the Payload type for creating or updating clothing designs
type ClothingDesignPayload = Record<{
  name: string;
  description: string;
  image: string;
}>;

// Create a StableBTreeMap to store custom clothing designs
const clothingDesignStorage = new StableBTreeMap<string, ClothingDesign>(0, 44, 1024);

// Create a new custom clothing design
$update;
export function createClothingDesign(payload: ClothingDesignPayload): Result<ClothingDesign, string> {
  // Payload Validation: Ensure that name, description, and image are present in the payload
  if (!payload.name || !payload.description || !payload.image) {
    return Result.Err("Missing required fields in the payload.");
  }

  // Create a new clothing design record
  const clothingDesign: ClothingDesign = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    name: payload.name, // Explicit Property Setting
    description: payload.description, // Explicit Property Setting
    image: payload.image, // Explicit Property Setting
    designer: ic.caller(),
    sharedWith: [],
  };

  try {
    clothingDesignStorage.insert(clothingDesign.id, clothingDesign); // Error Handling: Handle any errors during insertion
  } catch (error) {
    return Result.Err(`Failed to create the clothing design: ${error}`);
  }

  return Result.Ok<ClothingDesign, string>(clothingDesign);
}

// Get a custom clothing design by ID
$query;
export function getClothingDesignById(id: string): Result<ClothingDesign, string> {
  // Validate Id Parameter
  if (!id) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }
  try {
    return match(clothingDesignStorage.get(id), {
      Some: (design) => Result.Ok<ClothingDesign, string>(design),
      None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
    });
  } catch (err) {
    return Result.Err<ClothingDesign, string>(`Error fetching Clothing Design with ID=${id}: ${err}`);
  }
}

// Get all custom clothing designs
$query;
export function getAllClothingDesigns(): Result<Vec<ClothingDesign>, string> {
  try {
    return Result.Ok(clothingDesignStorage.values());
  } catch (err) {
    return Result.Err<Vec<ClothingDesign>, string>(`Error fetching all Clothing Designs: ${err}`);
  }
}

// Update a custom clothing design
$update;
export function updateClothingDesign(id: string, payload: ClothingDesignPayload): Result<ClothingDesign, string> {
  // Validate Id Parameter
  if (!id) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  return match(clothingDesignStorage.get(id), {
    Some: (existingDesign) => {
      const updatedDesign: ClothingDesign = {
        ...existingDesign,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      clothingDesignStorage.insert(updatedDesign.id, updatedDesign);
      return Result.Ok<ClothingDesign, string>(updatedDesign);
    },
    None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
  });
}

// Delete a custom clothing design by ID
$update;
export function deleteClothingDesign(id: string): Result<ClothingDesign, string> {
  // Validate Id Parameter
  if (!id) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  return match(clothingDesignStorage.get(id), {
    Some: (existingDesign) => {
      clothingDesignStorage.remove(id);
      return Result.Ok<ClothingDesign, string>(existingDesign);
    },
    None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
  });
}

// Share a custom clothing design with a user
$update;
export function shareClothingDesign(id: string, user: Principal): Result<ClothingDesign, string> {
  // Validate Id Parameter
  if (!id) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  if (!user) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  return match(clothingDesignStorage.get(id), {
    Some: (design) => {
      if (!design.sharedWith.includes(user)) {
        design.sharedWith.push(user);
        clothingDesignStorage.insert(id, design);
        return Result.Ok<ClothingDesign, string>(design);
      }
      return Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} is already shared with the user.`);
    },
    None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
  });
}

// Remove sharing of a custom clothing design from a user
$update;
export function unshareClothingDesign(id: string, user: Principal): Result<ClothingDesign, string> {
  // Validate Id Parameter
  if (!id) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  if (!user) {
    return Result.Err<ClothingDesign, string>('Invalid ID format');
  }

  return match(clothingDesignStorage.get(id), {
    Some: (design) => {
      if (design.sharedWith.includes(user)) {
        design.sharedWith = design.sharedWith.filter((sharedUser) => sharedUser !== user);
        clothingDesignStorage.insert(id, design);
        return Result.Ok<ClothingDesign, string>(design);
      }
      return Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} is not shared with the user.`);
    },
    None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
  });
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

