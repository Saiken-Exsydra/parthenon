export const business = {
  owner: 'Marco Antônio',
  whatsappNumber: '5534999992321',
  whatsappDisplay: '(34) 9 9999-2321',
  email: 'marco_ams@hotmail.com',
  instagramUrl: 'https://instagram.com/parthenonbarbearia',
} as const;

export type BookingService = {
  id: string;
  name: string;
  price: string;
  description: string;
  bookingMode: 'calendar' | 'whatsapp';
  calLink: string | null;
};

// Calendar services have a real Cal.com event. Consultation services intentionally
// open WhatsApp, so Marco can confirm the right treatment before scheduling.
export const bookingServices: BookingService[] = [
  { id: 'sobrancelha', name: 'Sobrancelha', price: 'R$ 20', description: 'Design de sobrancelha. Não fazemos rena.', bookingMode: 'calendar', calLink: 'marco-ams/sobrancelha' },
  { id: 'pezinho', name: 'Pezinho', price: 'R$ 20', description: 'Acabamento rápido para manter visual alinhado.', bookingMode: 'calendar', calLink: 'marco-ams/pezinho' },
  { id: 'barba-simples', name: 'Barba simples', price: 'R$ 30', description: 'Barba bem cuidada e alinhada.', bookingMode: 'calendar', calLink: 'marco-ams/barba-simples' },
  { id: 'barba-pigmentacao', name: 'Barba + pigmentação', price: 'R$ 50', description: 'Barba com acabamento e pigmentação.', bookingMode: 'calendar', calLink: 'marco-ams/barba-pigmentacao' },
  { id: 'corte-simples', name: 'Corte simples', price: 'R$ 30', description: 'Corte clássico, com acabamento preciso.', bookingMode: 'calendar', calLink: 'marco-ams/corte-simples' },
  { id: 'corte-degrade-simples', name: 'Corte degradê simples', price: 'R$ 40', description: 'Degradê leve e bem definido.', bookingMode: 'calendar', calLink: 'marco-ams/corte-degrade-simples' },
  { id: 'corte-degrade-navalhado', name: 'Corte degradê navalhado', price: 'R$ 50', description: 'Degradê navalhado, com acabamento detalhado.', bookingMode: 'calendar', calLink: 'marco-ams/corte-degrade-navalhado' },
  { id: 'selagem', name: 'Selagem', price: 'A partir de R$ 70', description: 'Tratamento sujeito à avaliação.', bookingMode: 'whatsapp', calLink: null },
  { id: 'botox-capilar', name: 'Botox capilar', price: 'A partir de R$ 70', description: 'Tratamento sujeito à avaliação.', bookingMode: 'whatsapp', calLink: null },
  { id: 'descoloracao-capilar', name: 'Descoloração capilar', price: 'R$ 120', description: 'Tratamento capilar.', bookingMode: 'whatsapp', calLink: null },
  { id: 'luzes-capilar', name: 'Luzes capilar', price: 'R$ 120', description: 'Tratamento capilar.', bookingMode: 'whatsapp', calLink: null },
];

export const serviceGroups = [
  { name: 'Sobrancelha', range: 'R$ 20', serviceIds: ['sobrancelha'] },
  { name: 'Pezinho', range: 'R$ 20', serviceIds: ['pezinho'] },
  { name: 'Barba', range: 'R$ 30-50', serviceIds: ['barba-simples', 'barba-pigmentacao'] },
  { name: 'Cortes', range: 'R$ 30-50', serviceIds: ['corte-simples', 'corte-degrade-simples', 'corte-degrade-navalhado'] },
  { name: 'Tratamentos capilares', range: 'A partir de R$ 70', serviceIds: ['selagem', 'botox-capilar', 'descoloracao-capilar', 'luzes-capilar'] },
] as const;

export const whatsappUrl = `https://wa.me/${business.whatsappNumber}`;
