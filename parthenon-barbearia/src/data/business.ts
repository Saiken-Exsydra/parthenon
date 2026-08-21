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
  priceValue: number | null;
  description: string;
  bookingMode: 'calendar' | 'whatsapp';
  calLink: string | null;
  exclusiveGroup?: string;
};

export const calendarBooking = {
  eventTitle: 'Atendimento Parthenon',
  durationMinutes: 50,
  genericCalLink: 'marco-ams/atendimento-parthenon',
  selectedServicesQuestionId: 'servicos',
} satisfies {
  eventTitle: string;
  durationMinutes: 50;
  genericCalLink: string | null;
  selectedServicesQuestionId: string | null;
};

// Calendar services keep their known-working individual Cal.com links for
// rollback/reference, while the new flow uses calendarBooking.genericCalLink.
export const bookingServices: BookingService[] = [
  { id: 'sobrancelha', name: 'Sobrancelha', price: 'R$ 20', priceValue: 20, description: 'Design de sobrancelha. Não fazemos rena.', bookingMode: 'calendar', calLink: 'marco-ams/sobrancelha' },
  { id: 'pezinho', name: 'Pezinho', price: 'R$ 20', priceValue: 20, description: 'Acabamento rápido para manter visual alinhado.', bookingMode: 'calendar', calLink: 'marco-ams/pezinho' },
  { id: 'barba-simples', name: 'Barba simples', price: 'R$ 30', priceValue: 30, description: 'Barba bem cuidada e alinhada.', bookingMode: 'calendar', calLink: 'marco-ams/barba-simples', exclusiveGroup: 'barba' },
  { id: 'barba-pigmentacao', name: 'Barba + pigmentação', price: 'R$ 50', priceValue: 50, description: 'Barba com acabamento e pigmentação.', bookingMode: 'calendar', calLink: 'marco-ams/barba-pigmentacao', exclusiveGroup: 'barba' },
  { id: 'corte-simples', name: 'Corte simples', price: 'R$ 30', priceValue: 30, description: 'Corte clássico, com acabamento preciso.', bookingMode: 'calendar', calLink: 'marco-ams/corte-simples', exclusiveGroup: 'corte' },
  { id: 'corte-degrade-simples', name: 'Corte degradê simples', price: 'R$ 40', priceValue: 40, description: 'Degradê leve e bem definido.', bookingMode: 'calendar', calLink: 'marco-ams/corte-degrade-simples', exclusiveGroup: 'corte' },
  { id: 'corte-degrade-navalhado', name: 'Corte degradê navalhado', price: 'R$ 50', priceValue: 50, description: 'Degradê navalhado, com acabamento detalhado.', bookingMode: 'calendar', calLink: 'marco-ams/corte-degrade-navalhado', exclusiveGroup: 'corte' },
  { id: 'selagem', name: 'Selagem', price: 'A partir de R$ 70', priceValue: null, description: 'Tratamento sujeito à avaliação.', bookingMode: 'whatsapp', calLink: null },
  { id: 'botox-capilar', name: 'Botox capilar', price: 'A partir de R$ 70', priceValue: null, description: 'Tratamento sujeito à avaliação.', bookingMode: 'whatsapp', calLink: null },
  { id: 'descoloracao-capilar', name: 'Descoloração capilar', price: 'R$ 120', priceValue: 120, description: 'Tratamento capilar.', bookingMode: 'whatsapp', calLink: null },
  { id: 'luzes-capilar', name: 'Luzes capilar', price: 'R$ 120', priceValue: 120, description: 'Tratamento capilar.', bookingMode: 'whatsapp', calLink: null },
];

export const serviceGroups = [
  { name: 'Sobrancelha', range: 'R$ 20', serviceIds: ['sobrancelha'] },
  { name: 'Pezinho', range: 'R$ 20', serviceIds: ['pezinho'] },
  { name: 'Barba', range: 'R$ 30-50', serviceIds: ['barba-simples', 'barba-pigmentacao'] },
  { name: 'Cortes', range: 'R$ 30-50', serviceIds: ['corte-simples', 'corte-degrade-simples', 'corte-degrade-navalhado'] },
  { name: 'Tratamentos capilares', range: 'A partir de R$ 70', serviceIds: ['selagem', 'botox-capilar', 'descoloracao-capilar', 'luzes-capilar'] },
] as const;

export const whatsappUrl = `https://wa.me/${business.whatsappNumber}`;
