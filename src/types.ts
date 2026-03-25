// src/types.ts
export type ParentRef = number | "wild" | null;

export type Pal = {
  id:              number;
  name:            string;
  species:         string;
  element:         string[];
  level:           number;
  gender:          "male" | "female" | null;
  passiveSkills:   string[];
  activeSkills:    string[];
  parent1Id:       ParentRef;
  parent2Id:       ParentRef;
  notes:           string;
  workSuitability?: Record<string, number>;
  ivHP:            number;
  ivAttack:        number;
  ivDefense:       number;
  favorite:        boolean;
  favoriteOrder:   number | null;
};