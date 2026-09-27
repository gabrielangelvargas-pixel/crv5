import type { IconType } from "react-icons";
import {
  FaBagShopping,
  FaGem,
  FaHeart,
  FaLayerGroup,
  FaPaintbrush,
  FaPen,
  FaStar,
  FaTabletScreenButton,
} from "react-icons/fa6";
import type { CategoryIconKey } from "@/data/categories";

const icons: Record<CategoryIconKey, IconType> = {
  bag: FaBagShopping,
  gem: FaGem,
  heart: FaHeart,
  paintbrush: FaPaintbrush,
  pen: FaPen,
  star: FaStar,
  tablet: FaTabletScreenButton,
  default: FaLayerGroup,
};

export function getCategoryIcon(iconKey: CategoryIconKey) {
  return icons[iconKey];
}
