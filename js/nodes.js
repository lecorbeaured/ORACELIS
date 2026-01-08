/**
 * ORACELIS North Node Calculator
 * Calculates North Node sign from birth date using transit tables (1940-2040)
 */

const nodeTransits = [
  ['1940-05-24', '1941-11-21', 'libra'],
  ['1941-11-22', '1943-05-11', 'virgo'],
  ['1943-05-12', '1944-12-03', 'leo'],
  ['1944-12-04', '1946-08-02', 'cancer'],
  ['1946-08-03', '1948-01-26', 'gemini'],
  ['1948-01-27', '1949-07-26', 'taurus'],
  ['1949-07-27', '1951-03-28', 'aries'],
  ['1951-03-29', '1952-10-09', 'pisces'],
  ['1952-10-10', '1954-04-02', 'aquarius'],
  ['1954-04-03', '1955-10-04', 'capricorn'],
  ['1955-10-05', '1957-06-16', 'sagittarius'],
  ['1957-06-17', '1958-12-15', 'scorpio'],
  ['1958-12-16', '1960-06-10', 'libra'],
  ['1960-06-11', '1961-12-23', 'virgo'],
  ['1961-12-24', '1963-08-25', 'leo'],
  ['1963-08-26', '1965-02-19', 'cancer'],
  ['1965-02-20', '1966-08-19', 'gemini'],
  ['1966-08-20', '1968-04-19', 'taurus'],
  ['1968-04-20', '1969-11-19', 'aries'],
  ['1969-11-20', '1971-04-06', 'pisces'],
  ['1971-04-07', '1972-10-27', 'aquarius'],
  ['1972-10-28', '1974-07-10', 'capricorn'],
  ['1974-07-11', '1975-01-07', 'sagittarius'],
  ['1975-01-08', '1976-07-09', 'scorpio'],
  ['1976-07-10', '1977-01-07', 'libra'],
  ['1977-01-08', '1978-07-05', 'virgo'],
  ['1978-07-06', '1980-01-12', 'leo'],
  ['1980-01-13', '1981-09-24', 'cancer'],
  ['1981-09-25', '1983-03-16', 'gemini'],
  ['1983-03-17', '1984-09-11', 'taurus'],
  ['1984-09-12', '1986-04-06', 'aries'],
  ['1986-04-07', '1987-12-02', 'pisces'],
  ['1987-12-03', '1989-05-22', 'aquarius'],
  ['1989-05-23', '1990-11-18', 'capricorn'],
  ['1990-11-19', '1992-08-01', 'sagittarius'],
  ['1992-08-02', '1994-02-01', 'scorpio'],
  ['1994-02-02', '1995-07-31', 'libra'],
  ['1995-08-01', '1997-01-25', 'virgo'],
  ['1997-01-26', '1998-10-20', 'leo'],
  ['1998-10-21', '2000-04-09', 'cancer'],
  ['2000-04-10', '2001-10-12', 'gemini'],
  ['2001-10-13', '2003-04-14', 'taurus'],
  ['2003-04-15', '2004-12-26', 'aries'],
  ['2004-12-27', '2006-06-22', 'pisces'],
  ['2006-06-23', '2007-12-18', 'aquarius'],
  ['2007-12-19', '2009-08-21', 'capricorn'],
  ['2009-08-22', '2011-03-03', 'sagittarius'],
  ['2011-03-04', '2012-08-29', 'scorpio'],
  ['2012-08-30', '2014-02-18', 'libra'],
  ['2014-02-19', '2015-11-11', 'virgo'],
  ['2015-11-12', '2017-05-09', 'leo'],
  ['2017-05-10', '2018-11-06', 'cancer'],
  ['2018-11-07', '2020-05-05', 'gemini'],
  ['2020-05-06', '2022-01-18', 'taurus'],
  ['2022-01-19', '2023-07-17', 'aries'],
  ['2023-07-18', '2025-01-11', 'pisces'],
  ['2025-01-12', '2026-07-26', 'aquarius'],
  ['2026-07-27', '2028-03-26', 'capricorn'],
  ['2028-03-27', '2029-09-23', 'sagittarius'],
  ['2029-09-24', '2031-03-20', 'scorpio'],
  ['2031-03-21', '2032-11-28', 'libra'],
  ['2032-11-29', '2034-05-29', 'virgo'],
  ['2034-05-30', '2035-11-19', 'leo'],
  ['2035-11-20', '2037-05-16', 'cancer'],
  ['2037-05-17', '2038-11-11', 'gemini'],
  ['2038-11-12', '2040-05-10', 'taurus']
];

const oppositeSign = {
  aries: 'libra', taurus: 'scorpio', gemini: 'sagittarius', cancer: 'capricorn',
  leo: 'aquarius', virgo: 'pisces', libra: 'aries', scorpio: 'taurus',
  sagittarius: 'gemini', capricorn: 'cancer', aquarius: 'leo', pisces: 'virgo'
};

const signNames = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces'
};

function calculateNodes(birthDate) {
  const birth = new Date(birthDate);
  for (const [start, end, sign] of nodeTransits) {
    if (birth >= new Date(start) && birth <= new Date(end)) {
      return {
        northNode: sign,
        southNode: oppositeSign[sign],
        northNodeDisplay: signNames[sign],
        southNodeDisplay: signNames[oppositeSign[sign]]
      };
    }
  }
  // Fallback
  const sign = 'aries';
  return { northNode: sign, southNode: oppositeSign[sign], northNodeDisplay: signNames[sign], southNodeDisplay: signNames[oppositeSign[sign]] };
}

function getRandomVersion() {
  return Math.floor(Math.random() * 3) + 1;
}
