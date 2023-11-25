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
  
    type ClothingDesignPayload = Record<{
    name: string;
    description: string;
    image: string;
  }>;

const clothingDesignStorage = new StableBTreeMap<string, ClothingDesign>(0, 44, 1024);


  $update;
  export function createClothingDesign(payload: ClothingDesignPayload): Result<ClothingDesign, string> {
    const clothingDesign: ClothingDesign = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      designer: ic.caller(),
      sharedWith: [],
      ...payload,
    };
  
    clothingDesignStorage.insert(clothingDesign.id, clothingDesign);
    return Result.Ok<ClothingDesign, string>(clothingDesign);
  }
  

  $query;
  export function getClothingDesign(id: string): Result<ClothingDesign, string> {
    return match(clothingDesignStorage.get(id), {
      Some: (design) => Result.Ok<ClothingDesign, string>(design),
      None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
    });
  }
  
$query;
export function getAllClothingDesigns(): Result<Vec<ClothingDesign>, string> {
  return Result.Ok(clothingDesignStorage.values());
}

$update;
export function updateClothingDesign(id: string, payload: ClothingDesignPayload): Result<ClothingDesign, string> {
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

$update;
export function deleteClothingDesign(id: string): Result<ClothingDesign, string> {
  return match(clothingDesignStorage.get(id), {
    Some: (existingDesign) => {
      clothingDesignStorage.remove(id);
      return Result.Ok<ClothingDesign, string>(existingDesign);
    },
    None: () => Result.Err<ClothingDesign, string>(`Clothing Design with ID=${id} not found.`),
  });
}


  $update;
  export function shareClothingDesign(id: string, user: Principal): Result<ClothingDesign, string> {
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
  
  $update;
  export function unshareClothingDesign(id: string, user: Principal): Result<ClothingDesign, string> {
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
  


