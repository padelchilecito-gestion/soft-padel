import { CartItem } from '../types';

export const createPreference = async (title: string, price: number, quantity: number = 1) => {
    try {
        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [
                    {
                        title: title,
                        unit_price: Number(price),
                        quantity: Number(quantity),
                    }
                ]
            }),
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        return data.init_point; // Retorna la URL de pago
    } catch (error) {
        console.error("Error generando QR:", error);
        return null;
    }
};

export const createCartPreference = async (items: CartItem[], surchargePercentage: number = 0) => {
    // Calculamos el total y aplicamos el recargo si existe
    // Para MP, lo más limpio es agregar el recargo como un "item" extra o ajustar precios.
    // Aquí ajustaremos los items.
    
    const mpItems = items.map(item => ({
        title: item.name,
        unit_price: Number(item.price), // Precio base
        quantity: Number(item.quantity)
    }));

    if (surchargePercentage > 0) {
        const totalBase = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        const surchargeAmount = totalBase * (surchargePercentage / 100);
        
        mpItems.push({
            title: "Recargo por Servicio (Comisión)",
            unit_price: Number(surchargeAmount.toFixed(2)),
            quantity: 1
        });
    }

    try {
        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: mpItems }),
        });

        if (!response.ok) throw new Error('Error servidor');
        const data = await response.json();
        return data.init_point;
    } catch (error) {
        console.error("Error POS QR:", error);
        return null;
    }
};
