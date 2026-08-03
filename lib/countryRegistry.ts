const countries: Readonly<Record<string, { name: string; alpha3: string }>> = {
  USA: { name: '米国', alpha3: 'USA' },
  China: { name: '中国', alpha3: 'CHN' },
  Japan: { name: '日本', alpha3: 'JPN' },
  Germany: { name: 'ドイツ', alpha3: 'DEU' },
  Norway: { name: 'ノルウェー', alpha3: 'NOR' },
  Canada: { name: 'カナダ', alpha3: 'CAN' },
  Spain: { name: 'スペイン', alpha3: 'ESP' },
  France: { name: 'フランス', alpha3: 'FRA' },
  Israel: { name: 'イスラエル', alpha3: 'ISR' },
  Hungary: { name: 'ハンガリー', alpha3: 'HUN' },
};

export function getCountryDisplay(country: string) {
  return countries[country] ?? {
    name: country,
    alpha3: country.slice(0, 3).toUpperCase(),
  };
}
