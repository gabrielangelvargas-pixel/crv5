import type { IconType } from "react-icons";
import {
  FaBagShopping,
  FaGem,
  FaHeart,
  FaPaintbrush,
  FaPen,
  FaStar,
  FaTabletScreenButton,
} from "react-icons/fa6";

export type MockChildCategory = {
  name: string;
};

export type MockSubcategory = {
  name: string;
  coverImageSrc: string | null;
  children?: MockChildCategory[];
};

export type MockCategory = {
  icon: IconType;
  name: string;
  description: string | null;
  imageSrc: string | null;
  coverImageSrc: string | null;
  subcategories: MockSubcategory[];
};

export const mockCategories: MockCategory[] = [
  {
    icon: FaGem,
    name: "Bijouterie",
    description: null,
    imageSrc: null,
    coverImageSrc: null,
    subcategories: [
      { name: "Aros", coverImageSrc: null },
      { name: "Pulseras", coverImageSrc: null },
      { name: "Collares", coverImageSrc: null },
      { name: "Anillos", coverImageSrc: null },
    ],
  },
  {
    icon: FaStar,
    name: "Piercing",
    description: null,
    imageSrc: null,
    coverImageSrc: null,
    subcategories: [
      { name: "Acero quirurgico", coverImageSrc: null },
      { name: "Nariz", coverImageSrc: null },
      { name: "Ombligo", coverImageSrc: null },
      { name: "Labret", coverImageSrc: null },
    ],
  },
  {
    icon: FaBagShopping,
    name: "Marroquineria",
    description: null,
    imageSrc: null,
    coverImageSrc: "/portada-marroquineria.png",
    subcategories: [
      {
        name: "Billeteras",
        coverImageSrc: null,
        children: [{ name: "Dama" }, { name: "Hombre" }, { name: "Juveniles" }],
      },
      { name: "Carteras", coverImageSrc: null },
      { name: "Mochilas", coverImageSrc: null },
      { name: "Neceseres", coverImageSrc: null },
    ],
  },
  {
    icon: FaHeart,
    name: "Accesorios",
    description: null,
    imageSrc: null,
    coverImageSrc: null,
    subcategories: [
      { name: "Belleza", coverImageSrc: null },
      { name: "Cabello", coverImageSrc: null },
      { name: "Regaleria", coverImageSrc: null },
      { name: "Varios", coverImageSrc: null },
    ],
  },
  {
    icon: FaPaintbrush,
    name: "Belleza",
    description: null,
    imageSrc: null,
    coverImageSrc: null,
    subcategories: [
      { name: "Maquillaje", coverImageSrc: null },
      { name: "Organizadores", coverImageSrc: null },
    ],
  },
  {
    icon: FaPen,
    name: "Libreria",
    description: null,
    imageSrc: null,
    coverImageSrc: "/portada-libreria.png",
    subcategories: [
      { name: "Cuadernos", coverImageSrc: null },
      { name: "Cartucheras", coverImageSrc: null },
      { name: "Lapiceras", coverImageSrc: null },
    ],
  },
  {
    icon: FaTabletScreenButton,
    name: "Tecnologia",
    description: null,
    imageSrc: null,
    coverImageSrc: "/portada-tecnologia.png",
    subcategories: [
      { name: "Cables", coverImageSrc: null },
      { name: "Soportes", coverImageSrc: null },
    ],
  },
  {
    icon: FaHeart,
    name: "Regaleria",
    description: null,
    imageSrc: null,
    coverImageSrc: "/portada-regaleria.png",
    subcategories: [
      { name: "Tazas", coverImageSrc: null },
      { name: "Sets", coverImageSrc: null },
    ],
  },
];
