export interface Brand {
  id: string;
  name: string;
  logo?: string;
  categoryId?: string;
}

export const POPULAR_BRANDS: Brand[] = [
  { id: 'b01', name: 'Samsung' },
  { id: 'b02', name: 'Apple' },
  { id: 'b03', name: 'Xiaomi' },
  { id: 'b04', name: 'Honor' },
  { id: 'b05', name: 'Artel' },
  { id: 'b06', name: 'Shivaki' },
  { id: 'b07', name: 'Midea' },
  { id: 'b08', name: 'LG' },
  { id: 'b09', name: 'Tefal' },
  { id: 'b10', name: 'Philips' },
  { id: 'b11', name: 'Bosch', categoryId: 'cat23' },
  { id: 'b12', name: 'Makita', categoryId: 'cat23' },
  { id: 'b13', name: 'Nike', categoryId: 'cat22' },
  { id: 'b14', name: 'Adidas', categoryId: 'cat22' },
  { id: 'b15', name: 'Puma', categoryId: 'cat22' },
  { id: 'b16', name: 'LC Waikiki' },
  { id: 'b17', name: 'Defacto' },
  { id: 'b18', name: 'Nivea', categoryId: 'cat24' },
  { id: 'b19', name: "L'Oréal", categoryId: 'cat24' },
];
