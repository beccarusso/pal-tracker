export type ParentRef = number | "wild" | null;

export type Pal = {
  id: number;
  name: string;
  species: string;
  element: string[];
  level: number;
  passiveSkills: string[];
  activeSkills: string[];
  parent1Id: ParentRef;
  parent2Id: ParentRef;
  notes: string;
  favorite: boolean;
  favoriteOrder: number | null;
};