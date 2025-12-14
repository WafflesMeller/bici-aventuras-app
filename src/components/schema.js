export  = [
  Form<{
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
  }>,
  Form<{
    cantidad: number;
    tiempo: "8" | "10";
  }>,
  Return<{
    nombre: string;
    apellido: string;
    cedula: string;
    telefono: string;
    cantidad: number;
    tiempo: "8" | "10";
  }>
];
