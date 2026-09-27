export type CategoryIconKey =
  | "bag"
  | "gem"
  | "heart"
  | "paintbrush"
  | "pen"
  | "star"
  | "tablet"
  | "default";

export type CategoryNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  imageSrc: string | null;
  coverImageSrc: string | null;
  iconKey: CategoryIconKey;
  subcategories: CategoryNode[];
};
