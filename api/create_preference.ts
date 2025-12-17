import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde tu app
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en Vercel' });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: accessToken });
    const preference = new Preference(client);

    const body = {
      items: req.body.items,
      back_urls: {
        success: "https://www.google.com", // Puedes cambiar esto a una URL de "Gracias"
        failure: "https://www.google.com",
        pending: "https://www.google.com"
      },
      auto_return: "approved",
    };

    const result = await preference.create({ body });
    
    // Devolvemos el link de pago (init_point)
    res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la preferencia de MP' });
  }
}
