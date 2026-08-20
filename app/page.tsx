// 1. Copia los paquetes con sus enlaces directos a tu WhatsApp
const packages = [
  {
    name: "Paquete Inicial",
    price: "S/ 20",
    description: "Ideal para probar el servicio",
    whatsappLink: `https://wa.me/51921543755?text=${encodeURIComponent("Hola, quiero recargar el Paquete Inicial")}`,
  },
  {
    name: "Paquete Pro",
    price: "S/ 50",
    description: "La opción más popular",
    whatsappLink: `https://wa.me/51921543755?text=${encodeURIComponent("Hola, quiero recargar el Paquete Pro")}`,
  },
  {
    name: "Paquete Premium",
    price: "S/ 100",
    description: "Para uso intensivo",
    whatsappLink: `https://wa.me/51921543755?text=${encodeURIComponent("Hola, quiero recargar el Paquete Premium")}`,
  },
];

// 2. En el diseño (JSX) del botón de cada tarjeta, asegúrate de que use el enlace de WhatsApp así:
<a
  href={pkg.whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full inline-block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
>
  Recargar por WhatsApp
</a>